'use strict';

const Poll = require('../models/Poll');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Score = require('../models/Score');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getIO } = require('../config/socket');
const cache = require('../utils/cache');

// ─── Debounced Vote Emit Buffer ──────────────────────────────────────────────
// Batches poll_vote_update emissions: at most one emit per poll every 500ms.
// Under light load (~1 vote/s) the update fires immediately.
// Under heavy load (50+ votes/s) clients receive a batched update every 500ms.

const DEBOUNCE_MS = 500;
const pendingVoteEmits = new Map(); // pollId -> { orgSlug, data, timer }

function scheduleVoteEmit(pollId, orgSlug, data) {
    const existing = pendingVoteEmits.get(pollId);

    if (existing) {
        // Update the payload (latest state wins) — timer already running
        existing.data = data;
        existing.orgSlug = orgSlug;
        return;
    }

    // First vote for this poll — emit immediately, then start cooldown
    try {
        const io = getIO();
        io.to(orgSlug).emit('poll_vote_update', data);
    } catch (err) {
        console.error('Socket emit error (poll_vote_update):', err.message);
    }

    // Cooldown window: any votes arriving within DEBOUNCE_MS get batched
    const timer = setTimeout(() => {
        const entry = pendingVoteEmits.get(pollId);
        pendingVoteEmits.delete(pollId);
        if (!entry) return;

        // If the data changed since the immediate emit, flush the latest state
        if (entry.data._id !== data._id ||
            entry.data.totalVotes !== data.totalVotes) {
            try {
                const io = getIO();
                io.to(entry.orgSlug).emit('poll_vote_update', entry.data);
            } catch (err) {
                console.error('Socket emit error (poll_vote_update debounced):', err.message);
            }
        }
    }, DEBOUNCE_MS);

    pendingVoteEmits.set(pollId, { orgSlug, data, timer });
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const deleteFromS3 = async (key) => {
    try {
        if (!key) return;
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }));
    } catch (err) {
        console.error('Poll S3 delete error:', err.message);
    }
};

/**
 * Resolve org from request.
 */
const resolveOrg = async (req) => {
    if (req.user.role === 'super_admin') {
        const slug = req.query.slug || req.query.org_slug || req.body?.org_slug;
        if (slug) return await Organization.findOne({ slug });
        if (req.body?.org_id) return await Organization.findById(req.body.org_id);
        return null;
    }
    return await Organization.findById(req.user.org_id);
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all polls for an org
 * @route   GET /api/polls?slug=:orgSlug
 * @access  Protected (user, admin_org, super_admin)
 */
exports.getPolls = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        const cacheKey = `polls_raw_${org._id}`;
        let allPolls = cache.get(cacheKey);

        if (!allPolls) {
            allPolls = await Poll.find({ org_id: org._id })
                .sort({ createdAt: -1 })
                .lean();
            cache.set(cacheKey, allPolls);
        }

        // Admin/superadmin see all polls; regular users only see non-archived
        const isAdmin = ['admin_org', 'super_admin'].includes(req.user.role);
        const polls = isAdmin ? allPolls : allPolls.filter(p => !p.isArchived);

        // For users: add hasVoted + myVote fields, strip voter list
        const userId = req.user.id;
        const enriched = polls.map(poll => {
            const voterEntry = poll.voters?.find(v => String(v.user_id) === String(userId));
            return {
                ...poll,
                hasVoted: !!voterEntry,
                myVote: voterEntry ? voterEntry.optionIndex : null,
                voters: undefined // don't send full voters list to client
            };
        });

        return res.status(200).json({
            success: true,
            data: enriched,
            live_engagement_enabled: org.settings?.features?.live_engagement_enabled ?? false,
            quizzes: org.settings?.quizzes || []
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Create a poll
 * @route   POST /api/polls
 * @access  Protected (admin_org, super_admin)
 */
exports.createPoll = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        const { question, options } = req.body;

        if (!question || !options) {
            return res.status(400).json({ success: false, message: 'Question and options are required' });
        }

        // Parse options — frontend sends JSON string or array
        let parsedOptions;
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options);
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid options format' });
            }
        } else {
            parsedOptions = options;
        }

        if (!Array.isArray(parsedOptions) || parsedOptions.length < 2 || parsedOptions.length > 6) {
            return res.status(400).json({ success: false, message: 'Provide between 2 and 6 options' });
        }

        const pollData = {
            org_id: org._id,
            question: question.trim(),
            options: parsedOptions.map(opt => ({
                text: typeof opt === 'string' ? opt.trim() : opt.text?.trim(),
                votes: 0
            }))
        };

        // Handle optional multi-image upload (up to 5)
        if (req.files && req.files.length > 0) {
            // Parse optional titles (sent as JSON array string)
            let titles = [];
            if (req.body.imageTitles) {
                try {
                    titles = typeof req.body.imageTitles === 'string'
                        ? JSON.parse(req.body.imageTitles)
                        : req.body.imageTitles;
                } catch { titles = []; }
            }

            pollData.images = req.files.slice(0, 5).map((file, i) => ({
                url: file.location,
                s3_key: file.key,
                title: titles[i]?.trim() || ''
            }));
        }

        const poll = await Poll.create(pollData);

        cache.del(`polls_raw_${org._id}`);

        // Auto-create notification with redirect URL
        const redirectUrl = `/${org.slug}/live`;
        try {
            const notification = await Notification.create({
                org_id: org._id,
                title: '📊 New Poll Available!',
                message: question.trim().length > 80 ? question.trim().substring(0, 80) + '…' : question.trim(),
                level: 'info',
                redirectUrl
            });

            // Broadcast notification to all users in org room
            const io = getIO();
            io.to(org.slug).emit('notification', notification);
        } catch (notifErr) {
            console.error('Failed to create poll notification:', notifErr.message);
        }

        // Emit poll_created event
        try {
            const io = getIO();
            io.to(org.slug).emit('poll_created', poll);
        } catch (socketErr) {
            console.error('Socket emit error (poll_created):', socketErr.message);
        }

        return res.status(201).json({ success: true, data: poll });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Vote on a poll
 * @route   POST /api/polls/:id/vote
 * @access  Protected (user)
 */
exports.votePoll = async (req, res, next) => {
    try {
        const { optionIndex } = req.body;

        if (optionIndex === undefined || optionIndex === null) {
            return res.status(400).json({ success: false, message: 'optionIndex is required' });
        }

        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        if (poll.status !== 'active') {
            return res.status(400).json({ success: false, message: 'This poll is no longer active' });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ success: false, message: 'Invalid option index' });
        }

        // Check if user already voted
        const alreadyVoted = poll.voters.some(v => String(v.user_id) === String(req.user.id));
        if (alreadyVoted) {
            return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
        }

        // Atomic update: increment vote count + totalVotes + push voter
        const updatedPoll = await Poll.findByIdAndUpdate(
            req.params.id,
            {
                $inc: {
                    [`options.${optionIndex}.votes`]: 1,
                    totalVotes: 1
                },
                $push: {
                    voters: { user_id: req.user.id, optionIndex }
                }
            },
            { new: true }
        ).lean();

        cache.del(`polls_raw_${updatedPoll.org_id}`);

        // Debounced real-time vote update (without voters array to save bandwidth)
        try {
            const org = await Organization.findById(poll.org_id).select('slug').lean();
            if (org) {
                scheduleVoteEmit(String(updatedPoll._id), org.slug, {
                    _id: updatedPoll._id,
                    options: updatedPoll.options,
                    totalVotes: updatedPoll.totalVotes
                });
            }
        } catch (socketErr) {
            console.error('Vote emit scheduling error:', socketErr.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                ...updatedPoll,
                hasVoted: true,
                myVote: optionIndex,
                voters: undefined
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Toggle individual poll status (active/disabled)
 * @route   PUT /api/polls/:id/status
 * @access  Protected (admin_org, super_admin)
 */
exports.togglePollStatus = async (req, res, next) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        // Org scope check for admin
        if (req.user.role === 'admin_org' && String(poll.org_id) !== String(req.user.org_id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        poll.status = poll.status === 'active' ? 'disabled' : 'active';
        await poll.save();

        cache.del(`polls_raw_${poll.org_id}`);

        // Emit real-time status update
        try {
            const io = getIO();
            const org = await Organization.findById(poll.org_id).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('poll_status_update', {
                    _id: poll._id,
                    status: poll.status
                });
            }
        } catch (socketErr) {
            console.error('Socket emit error (poll_status_update):', socketErr.message);
        }

        return res.status(200).json({ success: true, data: poll });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Toggle live engagement feature for org (enable/disable globally)
 * @route   PUT /api/polls/feature
 * @access  Protected (admin_org, super_admin)
 */
exports.toggleLiveEngagementFeature = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        const current = org.settings?.features?.live_engagement_enabled ?? false;
        org.settings.features.live_engagement_enabled = !current;
        await org.save();

        // Emit real-time update
        try {
            const io = getIO();
            io.to(org.slug).emit('live_engagement_config_updated', {
                live_engagement_enabled: org.settings.features.live_engagement_enabled,
                quizzes: org.settings.quizzes
            });
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }

        return res.status(200).json({
            success: true,
            live_engagement_enabled: org.settings.features.live_engagement_enabled
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Delete a poll
 * @route   DELETE /api/polls/:id
 * @access  Protected (admin_org, super_admin)
 */
exports.deletePoll = async (req, res, next) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        // Org scope check for admin
        if (req.user.role === 'admin_org' && String(poll.org_id) !== String(req.user.org_id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Clean up S3 images if any
        if (poll.images && poll.images.length > 0) {
            await Promise.all(poll.images.map(img => deleteFromS3(img.s3_key)));
        }

        await poll.deleteOne();

        cache.del(`polls_raw_${poll.org_id}`);

        // Emit deletion event
        try {
            const io = getIO();
            const org = await Organization.findById(poll.org_id).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('poll_deleted', { _id: poll._id });
            }
        } catch (socketErr) {
            console.error('Socket emit error (poll_deleted):', socketErr.message);
        }

        return res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// ─── Archive Poll ─────────────────────────────────────────────────────────────

/**
 * @desc    Archive a poll (hides from users, also disables)
 * @route   PUT /api/polls/:id/archive
 * @access  Protected (admin_org, super_admin)
 */
exports.archivePoll = async (req, res, next) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        if (req.user.role === 'admin_org' && String(poll.org_id) !== String(req.user.org_id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        poll.isArchived = true;
        poll.status = 'disabled';
        await poll.save();

        cache.del(`polls_raw_${poll.org_id}`);

        // Emit real-time update (poll disappears for public users)
        try {
            const io = getIO();
            const org = await Organization.findById(poll.org_id).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('poll_archived', { _id: poll._id });
            }
        } catch (socketErr) {
            console.error('Socket emit error (poll_archived):', socketErr.message);
        }

        return res.status(200).json({ success: true, data: poll });
    } catch (err) {
        next(err);
    }
};

// ─── Quiz CRUD ────────────────────────────────────────────────────────────────

/**
 * @desc    Add a quiz to org
 * @route   POST /api/polls/quizzes
 * @access  Protected (admin_org, super_admin)
 */
exports.addQuiz = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) return res.status(400).json({ success: false, message: 'Organization not found' });

        const { title, url } = req.body;
        if (!title || !url) {
            return res.status(400).json({ success: false, message: 'Title and URL are required' });
        }

        org.settings.quizzes.push({ title: title.trim(), url: url.trim(), isActive: true });
        await org.save();

        try {
            const io = getIO();
            io.to(org.slug).emit('live_engagement_config_updated', {
                live_engagement_enabled: org.settings.features.live_engagement_enabled,
                quizzes: org.settings.quizzes
            });
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }

        return res.status(201).json({ success: true, quizzes: org.settings.quizzes });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Update a quiz
 * @route   PUT /api/polls/quizzes/:quizId
 * @access  Protected (admin_org, super_admin)
 */
exports.updateQuiz = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) return res.status(400).json({ success: false, message: 'Organization not found' });

        const quiz = org.settings.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        if (req.body.title !== undefined) quiz.title = req.body.title.trim();
        if (req.body.url !== undefined) quiz.url = req.body.url.trim();
        if (req.body.isActive !== undefined) quiz.isActive = req.body.isActive;
        await org.save();

        try {
            const io = getIO();
            io.to(org.slug).emit('live_engagement_config_updated', {
                live_engagement_enabled: org.settings.features.live_engagement_enabled,
                quizzes: org.settings.quizzes
            });
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }

        return res.status(200).json({ success: true, quizzes: org.settings.quizzes });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Delete a quiz
 * @route   DELETE /api/polls/quizzes/:quizId
 * @access  Protected (admin_org, super_admin)
 */
exports.deleteQuiz = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) return res.status(400).json({ success: false, message: 'Organization not found' });

        const quiz = org.settings.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        quiz.deleteOne();
        await org.save();

        try {
            const io = getIO();
            io.to(org.slug).emit('live_engagement_config_updated', {
                live_engagement_enabled: org.settings.features.live_engagement_enabled,
                quizzes: org.settings.quizzes
            });
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }

        return res.status(200).json({ success: true, quizzes: org.settings.quizzes });
    } catch (err) {
        next(err);
    }
};

// ─── Quiz Score Callback (Webhook — unauthenticated) ──────────────────────────

/**
 * @desc    Receive quiz score from external PHP quiz
 * @route   POST /api/polls/quiz-callback?slug=:orgSlug
 * @access  Public (called by external PHP quiz)
 */
exports.quizCallback = async (req, res, next) => {
    try {
        const { email, score, quiz_title } = req.body;
        const slug = req.query.slug;

        if (!slug || !email || score === undefined) {
            return res.status(400).json({ success: false, message: 'slug, email, and score are required' });
        }

        const numericScore = Number(score);
        if (isNaN(numericScore) || numericScore < 0) {
            return res.status(400).json({ success: false, message: 'Score must be a non-negative number' });
        }

        // Find org by slug
        const org = await Organization.findOne({ slug }).select('_id').lean();
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        // Find user by email + org
        const user = await User.findOne({ email: email.toLowerCase(), org_id: org._id }).lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found for this email' });

        // Upsert score document
        await Score.findOneAndUpdate(
            { user_id: user._id, org_id: org._id },
            {
                $inc: { current_score: numericScore },
                $push: {
                    history: {
                        source: 'QUIZ',
                        description: quiz_title || 'Quiz Completion',
                        points: numericScore
                    }
                },
                $setOnInsert: {
                    user_name_snapshot: user.name,
                    user_email_snapshot: user.email,
                    user_avatar_url: user.qr_code_url || null
                }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({ success: true, message: 'Score updated successfully' });
    } catch (err) {
        next(err);
    }
};
