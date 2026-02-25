import { useState, useRef } from 'react';
import {
    LayoutTemplate, ArrowLeft, Copy, Download, Eye, EyeOff,
    CheckCircle, Type, Image as ImageIcon, Palette, Code2
} from 'lucide-react';

// ─── Built-in Templates ─────────────────────────────────────────────────────

const TEMPLATES = [
    {
        id: 'modern-event',
        name: 'Modern Event',
        description: 'Clean, modern layout with hero image and CTA button',
        thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        defaults: {
            headerBg: '#667eea',
            headerText: 'You\'re Invited!',
            heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop',
            bodyTitle: 'Join Us for an Amazing Event',
            bodyText: 'We\'re excited to invite you to our upcoming event. Join us for an unforgettable experience filled with learning, networking, and fun.',
            ctaText: 'Register Now',
            ctaUrl: '#',
            ctaColor: '#667eea',
            footerText: '© 2026 Your Organization. All rights reserved.',
        },
        render: (d) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f7}
.container{max-width:600px;margin:0 auto;background:#fff}
.header{background:${d.headerBg};padding:32px 24px;text-align:center}
.header h1{color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px}
.hero-img{width:100%;height:auto;display:block}
.body-content{padding:32px 24px}
.body-content h2{color:#1a1a2e;font-size:22px;margin:0 0 16px}
.body-content p{color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 24px}
.cta-btn{display:inline-block;background:${d.ctaColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px}
.footer{background:#f8f9fa;padding:20px 24px;text-align:center;color:#999;font-size:12px}</style></head>
<body><div class="container">
<div class="header"><h1>${d.headerText}</h1></div>
${d.heroImage ? `<img src="${d.heroImage}" alt="Event" class="hero-img">` : ''}
<div class="body-content">
<h2>${d.bodyTitle}</h2>
<p>${d.bodyText}</p>
<div style="text-align:center"><a href="${d.ctaUrl}" class="cta-btn">${d.ctaText}</a></div>
</div>
<div class="footer">${d.footerText}</div>
</div></body></html>`
    },
    {
        id: 'photo-showcase',
        name: 'Photo Showcase',
        description: 'Image-heavy template for galleries and recaps',
        thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        defaults: {
            headerBg: '#2d2d3f',
            headerText: 'Event Highlights',
            headerSubtext: 'Check out the best moments',
            image1: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=580&h=280&fit=crop',
            image2: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=280&h=280&fit=crop',
            image3: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=280&h=280&fit=crop',
            bodyText: 'Thank you for being part of our amazing event! Here are some highlights we captured. We hope you enjoyed it as much as we did.',
            ctaText: 'View Full Gallery',
            ctaUrl: '#',
            footerText: '© 2026 Your Organization. All rights reserved.',
        },
        render: (d) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f7}
.container{max-width:600px;margin:0 auto;background:#fff}
.header{background:${d.headerBg};padding:40px 24px;text-align:center}
.header h1{color:#fff;margin:0 0 8px;font-size:28px;font-weight:700}
.header p{color:rgba(255,255,255,0.7);margin:0;font-size:14px}
.gallery{padding:4px}
.gallery img{display:block;width:100%}
.gallery-row{display:flex;gap:4px;margin-top:4px}
.gallery-row img{width:50%;height:180px;object-fit:cover}
.body-content{padding:28px 24px;text-align:center}
.body-content p{color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 24px}
.cta-btn{display:inline-block;background:${d.headerBg};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px}
.footer{background:#f8f9fa;padding:20px 24px;text-align:center;color:#999;font-size:12px}</style></head>
<body><div class="container">
<div class="header"><h1>${d.headerText}</h1><p>${d.headerSubtext}</p></div>
<div class="gallery">
${d.image1 ? `<img src="${d.image1}" alt="Gallery 1">` : ''}
<div class="gallery-row">
${d.image2 ? `<img src="${d.image2}" alt="Gallery 2">` : ''}
${d.image3 ? `<img src="${d.image3}" alt="Gallery 3">` : ''}
</div>
</div>
<div class="body-content">
<p>${d.bodyText}</p>
<a href="${d.ctaUrl}" class="cta-btn">${d.ctaText}</a>
</div>
<div class="footer">${d.footerText}</div>
</div></body></html>`
    },
    {
        id: 'corporate-newsletter',
        name: 'Corporate Newsletter',
        description: 'Professional multi-section newsletter layout',
        thumbnail: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
        defaults: {
            brandColor: '#0c3483',
            logoText: 'NEWSLETTER',
            issueLabel: 'Monthly Update · February 2026',
            section1Title: 'What\'s New',
            section1Text: 'We\'ve been working hard to bring you the best experience. Here\'s a roundup of the latest developments and upcoming events you won\'t want to miss.',
            section1Image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=540&h=250&fit=crop',
            section2Title: 'Upcoming Events',
            section2Text: 'Mark your calendars! We have several exciting events lined up for the coming weeks. From workshops to networking sessions, there\'s something for everyone.',
            ctaText: 'Learn More',
            ctaUrl: '#',
            footerText: 'You received this email because you are subscribed to our newsletter.\n© 2026 Your Organization',
        },
        render: (d) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f7}
.container{max-width:600px;margin:0 auto;background:#fff}
.header{background:${d.brandColor};padding:24px 32px;display:flex;align-items:center;justify-content:space-between}
.header .logo{color:#fff;font-size:14px;font-weight:800;letter-spacing:3px}
.header .issue{color:rgba(255,255,255,0.7);font-size:11px}
.section{padding:28px 32px;border-bottom:1px solid #f0f0f5}
.section h2{color:#1a1a2e;font-size:20px;margin:0 0 12px;font-weight:700}
.section p{color:#4a4a68;font-size:14px;line-height:1.8;margin:0 0 16px}
.section img{width:100%;border-radius:8px;margin-bottom:16px}
.cta-btn{display:inline-block;background:${d.brandColor};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px}
.footer{padding:24px 32px;text-align:center;color:#aaa;font-size:11px;line-height:1.6;white-space:pre-line}</style></head>
<body><div class="container">
<div class="header"><span class="logo">${d.logoText}</span><span class="issue">${d.issueLabel}</span></div>
<div class="section">
<h2>${d.section1Title}</h2>
${d.section1Image ? `<img src="${d.section1Image}" alt="Section image">` : ''}
<p>${d.section1Text}</p>
</div>
<div class="section">
<h2>${d.section2Title}</h2>
<p>${d.section2Text}</p>
<a href="${d.ctaUrl}" class="cta-btn">${d.ctaText}</a>
</div>
<div class="footer">${d.footerText.replace(/\n/g, '<br>')}</div>
</div></body></html>`
    },
    {
        id: 'post-event-feedback',
        name: 'Post-Event Feedback',
        description: 'Request feedback after an event with rating and survey link',
        thumbnail: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        defaults: {
            accentColor: '#11998e',
            logoText: 'YOUR ORG',
            heading: 'Thank You for Attending!',
            bodyText: 'We hope you had an amazing time at our event. Your feedback means the world to us and helps us make future events even better.',
            highlightsTitle: 'Event Highlights',
            highlight1: '🎤 12 amazing speakers',
            highlight2: '🤝 500+ attendees connected',
            highlight3: '🏆 10 awards presented',
            feedbackMessage: 'We\'d love to hear your thoughts! Please take 2 minutes to share your experience with us.',
            ctaText: 'Share Your Feedback',
            ctaUrl: '#',
            closingText: 'Thank you for being part of our community!\nWarm regards,\nThe Team',
            footerText: '© 2026 Your Organization. All rights reserved.',
        },
        render: (d) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f7}
.container{max-width:600px;margin:0 auto;background:#fff}
.top-bar{height:4px;background:linear-gradient(90deg,${d.accentColor},#38ef7d)}
.header{padding:28px 32px;border-bottom:1px solid #eee}
.header .logo{font-size:14px;font-weight:800;color:${d.accentColor};letter-spacing:2px;text-transform:uppercase}
.body-content{padding:32px}
.body-content h1{color:#1a1a2e;font-size:24px;margin:0 0 16px;font-weight:700}
.body-content p{color:#4a4a68;font-size:15px;line-height:1.8;margin:0 0 16px}
.highlights{background:#f8faf9;border-radius:12px;padding:20px 24px;margin:20px 0}
.highlights h3{color:#1a1a2e;font-size:16px;margin:0 0 12px;font-weight:700}
.highlights .item{padding:6px 0;font-size:15px;color:#333}
.feedback-box{background:linear-gradient(135deg,${d.accentColor}10,${d.accentColor}05);border:1px solid ${d.accentColor}30;border-radius:12px;padding:24px;margin:24px 0;text-align:center}
.feedback-box p{color:#4a4a68;font-size:14px;margin:0 0 16px}
.cta-btn{display:inline-block;background:${d.accentColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px}
.closing{color:#4a4a68;font-size:14px;line-height:1.8;white-space:pre-line;margin-top:24px}
.footer{padding:20px 32px;text-align:center;color:#aaa;font-size:12px;border-top:1px solid #eee}</style></head>
<body><div class="container">
<div class="top-bar"></div>
<div class="header"><div class="logo">${d.logoText}</div></div>
<div class="body-content">
<h1>${d.heading}</h1>
<p>${d.bodyText}</p>
<div class="highlights">
<h3>${d.highlightsTitle}</h3>
<div class="item">${d.highlight1}</div>
<div class="item">${d.highlight2}</div>
<div class="item">${d.highlight3}</div>
</div>
<div class="feedback-box">
<p>${d.feedbackMessage}</p>
<a href="${d.ctaUrl}" class="cta-btn">${d.ctaText}</a>
</div>
<p class="closing">${d.closingText.replace(/\n/g, '<br>')}</p>
</div>
<div class="footer">${d.footerText}</div>
</div></body></html>`
    }
];

// Field type helpers
const FIELD_ICONS = {
    text: Type,
    color: Palette,
    image: ImageIcon,
    textarea: Type,
};

function getFieldType(key, value) {
    if (key.toLowerCase().includes('color') || key.toLowerCase().includes('bg')) return 'color';
    if (key.toLowerCase().includes('image') || key.toLowerCase().includes('img')) return 'image';
    if (value && value.length > 80) return 'textarea';
    return 'text';
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EmailTemplates() {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editData, setEditData] = useState({});
    const [showPreview, setShowPreview] = useState(true);
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef(null);

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setEditData({ ...template.defaults });
        setShowCode(false);
        setCopied(false);
    };

    const handleBack = () => {
        setSelectedTemplate(null);
        setEditData({});
        setShowCode(false);
        setCopied(false);
    };

    const handleFieldChange = (key, value) => {
        setEditData(prev => ({ ...prev, [key]: value }));
    };

    const getRenderedHtml = () => {
        if (!selectedTemplate) return '';
        return selectedTemplate.render(editData);
    };

    const handleCopyHtml = async () => {
        try {
            await navigator.clipboard.writeText(getRenderedHtml());
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = getRenderedHtml();
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleDownloadHtml = () => {
        const html = getRenderedHtml();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedTemplate.id}-template.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ─── Template Selection Grid ────────────────────────────────────────────
    if (!selectedTemplate) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                            <LayoutTemplate className="w-6 h-6" />
                        </div>
                        Email Templates
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Choose a template, customize content, then copy or download the HTML for your emails.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {TEMPLATES.map(tpl => {
                        const previewHtml = tpl.render(tpl.defaults);
                        return (
                            <button
                                key={tpl.id}
                                onClick={() => handleSelectTemplate(tpl)}
                                className="group text-left bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col"
                            >
                                <div
                                    className="relative w-full overflow-hidden bg-gray-50"
                                    style={{ height: 300 }}
                                >
                                    <div
                                        style={{
                                            width: '200%',
                                            height: '200%',
                                            transform: 'scale(0.5)',
                                            transformOrigin: 'top left',
                                        }}
                                    >
                                        <iframe
                                            srcDoc={previewHtml}
                                            title={`${tpl.name} preview`}
                                            className="w-full border-0 pointer-events-none"
                                            style={{ width: '100%', height: '800px' }}
                                            sandbox=""
                                            tabIndex={-1}
                                        />
                                    </div>
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/10 transition-colors duration-200 flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-primary-600 font-semibold text-sm px-4 py-2 rounded-lg shadow-md">
                                            Use Template
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                                    <h3 className="font-semibold text-gray-900 text-sm">{tpl.name}</h3>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ─── Template Editor ────────────────────────────────────────────────────
    const renderedHtml = getRenderedHtml();

    return (
        <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h1>
                        <p className="text-sm text-gray-500">Customize and export</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showCode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Code2 className="w-4 h-4" />
                        {showCode ? 'Hide Code' : 'View Code'}
                    </button>
                    <button
                        onClick={handleCopyHtml}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy HTML'}
                    </button>
                    <button
                        onClick={handleDownloadHtml}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            {/* Editor + Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Editor Panel */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Edit Content</h2>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {Object.entries(editData).map(([key, value]) => {
                            const fieldType = getFieldType(key, value);
                            const Icon = FIELD_ICONS[fieldType] || Type;
                            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

                            return (
                                <div key={key}>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                                        {label}
                                    </label>
                                    {fieldType === 'color' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={value}
                                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                                            />
                                        </div>
                                    ) : fieldType === 'textarea' ? (
                                        <textarea
                                            value={value}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-vertical"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Preview / Code Panel */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
                            {showCode ? 'HTML Code' : 'Live Preview'}
                        </h2>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title={showPreview ? 'Collapse' : 'Expand'}
                        >
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {showPreview && (
                        showCode ? (
                            <pre className="p-4 text-xs font-mono text-gray-700 bg-gray-50 overflow-auto max-h-[70vh] whitespace-pre-wrap break-all">
                                {renderedHtml}
                            </pre>
                        ) : (
                            <div className="bg-gray-100 p-4 flex-1 overflow-auto max-h-[70vh]">
                                <div className="mx-auto shadow-lg rounded-lg overflow-hidden" style={{ maxWidth: 620 }}>
                                    <iframe
                                        ref={iframeRef}
                                        srcDoc={renderedHtml}
                                        title="Email Preview"
                                        className="w-full border-0 bg-white"
                                        style={{ minHeight: 500 }}
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
