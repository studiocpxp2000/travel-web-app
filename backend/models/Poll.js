const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    question: {
        type: String,
        required: [true, 'Poll question is required'],
        trim: true,
        maxlength: [500, 'Question cannot exceed 500 characters']
    },
    images: {
        type: [{
            url: { type: String, required: true },      // S3 URL
            s3_key: { type: String, required: true },    // S3 key for cleanup
            title: { type: String, trim: true, default: '' } // Optional caption
        }],
        validate: {
            validator: function (arr) { return arr.length <= 5; },
            message: 'A poll can have at most 5 images'
        },
        default: []
    },
    options: {
        type: [{
            text: {
                type: String,
                required: true,
                trim: true
            },
            votes: {
                type: Number,
                default: 0
            }
        }],
        validate: {
            validator: function (arr) {
                return arr.length >= 2 && arr.length <= 6;
            },
            message: 'A poll must have between 2 and 6 options'
        }
    },
    voters: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        optionIndex: {
            type: Number,
            required: true
        }
    }],
    totalVotes: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Poll', pollSchema);
