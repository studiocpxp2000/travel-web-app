const express = require('express');
const router = express.Router();
const {
    getPublicPageContent,
    getAllPublicContent
} = require('../controllers/pageContentController');

/**
 * @swagger
 * /public/{orgSlug}/content:
 *   get:
 *     summary: Get all published content for an organization
 *     tags: [Public Content]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *     responses:
 *       200:
 *         description: All published page content
 */
router.get('/:orgSlug/content', getAllPublicContent);

/**
 * @swagger
 * /public/{orgSlug}/content/{pageType}:
 *   get:
 *     summary: Get published content for a specific page
 *     tags: [Public Content]
 *     parameters:
 *       - in: path
 *         name: orgSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, agenda, venue, faq, funzone, helpdesk]
 *     responses:
 *       200:
 *         description: Published page content
 *       404:
 *         description: Organization not found
 */
router.get('/:orgSlug/content/:pageType', getPublicPageContent);

module.exports = router;
