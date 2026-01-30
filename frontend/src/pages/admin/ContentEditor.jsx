import { useState } from 'react';
import { FileText, Save, Eye, Plus, Trash2, Phone, Mail, Link, Gamepad2, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Input, { Textarea } from '../../components/forms/Input';
import { useAuth } from '../../context/AuthContext';
import { createMarkup, generateId } from '../../utils/helpers';

// Page options - removed gallery, leaderboard, notifications (separate pages)
const pageOptions = [
    { id: 'home', name: 'Home Page', type: 'html' },
    { id: 'agenda', name: 'Agenda', type: 'html' },
    { id: 'venue', name: 'Venue', type: 'html' },
    { id: 'faq', name: 'FAQs', type: 'structured' },
    { id: 'funzone', name: 'Fun Zone', type: 'structured' },
    { id: 'helpdesk', name: 'Helpdesk', type: 'structured' },
];

// Mock content storage
const initialContent = {
    home: '<h2>Welcome to Our Event</h2><p>This is the dynamic content for the home page.</p>',
    agenda: '<h2>Event Schedule</h2><p>Check out our exciting lineup of sessions.</p>',
    venue: '<h2>Venue Information</h2><p>Find us at the Grand Convention Center.</p>',
    faq: {
        items: [
            { id: 'faq-1', question: 'How do I register for the event?', answer: 'You can register by clicking the "Register" button on our website.' },
            { id: 'faq-2', question: 'What should I bring?', answer: 'Please bring your QR code (printed or on your phone) and a valid ID.' },
        ]
    },
    funzone: {
        description: 'Enjoy some activities',
        activities: [
            { id: 'act-1', title: 'Travel Trivia', description: 'Test your knowledge of world destinations.', icon: '🌍', type: 'online', link: 'https://example.com/trivia', duration: '5 min', players: '1-4' },
            { id: 'act-2', title: 'Photo Hunt', description: 'Find hidden objects in travel photos.', icon: '📸', type: 'physical', link: '', duration: '10 min', players: '1-2' },
        ]
    },
    helpdesk: {
        phone: '+1 (555) 123-4567',
        email: 'support@example.com'
    }
};

const emojiOptions = ['🌍', '🗺️', '🧳', '✈️', '📸', '💱', '🎮', '🏆', '🎯', '🎲', '🃏', '🎪'];

export default function ContentEditor() {
    const { organization } = useAuth();
    const [selectedPage, setSelectedPage] = useState('home');
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    const currentPageConfig = pageOptions.find(p => p.id === selectedPage);

    const handleSave = () => {
        console.log('Saving content for', selectedPage, content[selectedPage]);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // FAQ handlers
    const addFaqItem = () => {
        const newItem = { id: generateId('faq'), question: '', answer: '' };
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: [...content.faq.items, newItem]
            }
        });
        setExpandedFaq(newItem.id);
    };

    const updateFaqItem = (id, field, value) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.map(item =>
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        });
    };

    const removeFaqItem = (id) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.filter(item => item.id !== id)
            }
        });
    };

    // Activity handlers
    const addActivity = () => {
        const newActivity = {
            id: generateId('act'),
            title: '',
            description: '',
            icon: '🎮',
            type: 'online',
            link: '',
            duration: '5 min',
            players: '1'
        };
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: [newActivity, ...content.funzone.activities]
            }
        });
    };

    const updateActivity = (id, field, value) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.map(act =>
                    act.id === id ? { ...act, [field]: value } : act
                )
            }
        });
    };

    const removeActivity = (id) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.filter(act => act.id !== id)
            }
        });
    };

    // Helpdesk handlers
    const updateHelpdesk = (field, value) => {
        setContent({
            ...content,
            helpdesk: {
                ...content.helpdesk,
                [field]: value
            }
        });
    };

    const renderEditor = () => {
        switch (selectedPage) {
            case 'faq':
                return renderFaqEditor();
            case 'funzone':
                return renderFunzoneEditor();
            case 'helpdesk':
                return renderHelpdeskEditor();
            default:
                return renderHtmlEditor();
        }
    };

    const renderHtmlEditor = () => (
        <>
            <Textarea
                rows={15}
                value={content[selectedPage] || ''}
                onChange={(e) => setContent({
                    ...content,
                    [selectedPage]: e.target.value
                })}
                placeholder="Enter HTML content for this page..."
                className="font-mono text-sm"
            />
            <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
                <p className="font-medium mb-1">HTML Supported:</p>
                <p>You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.</p>
            </div>
        </>
    );

    const renderFaqEditor = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Add questions and answers for the FAQ page
                </p>
                <button onClick={addFaqItem} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                </button>
            </div>

            {content.faq.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No FAQ items. Click "Add Question" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {content.faq.items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden">
                            <div
                                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-6">#{index + 1}</span>
                                    <span className="font-medium text-gray-800">
                                        {item.question || 'New Question'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFaqItem(item.id); }}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {expandedFaq === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </div>
                            {expandedFaq === item.id && (
                                <div className="p-4 space-y-3 border-t">
                                    <Input
                                        label="Question"
                                        value={item.question}
                                        onChange={(e) => updateFaqItem(item.id, 'question', e.target.value)}
                                        placeholder="Enter the question..."
                                    />
                                    <Textarea
                                        label="Answer"
                                        value={item.answer}
                                        onChange={(e) => updateFaqItem(item.id, 'answer', e.target.value)}
                                        placeholder="Enter the answer..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderFunzoneEditor = () => (
        <div className="space-y-6">
            {/* Activities */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="font-medium text-gray-700">Activities</p>
                        <p className="text-sm text-gray-500">Add activity cards for the Fun Zone page</p>
                    </div>
                    <button onClick={addActivity} className="btn-secondary btn-sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Activity
                    </button>
                </div>

                {content.funzone.activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No activities yet. Click "Add Activity" to get started.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {content.funzone.activities.map((activity) => (
                            <div key={activity.id} className="border rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Icon Selector */}
                                    <div>
                                        <label className="form-label">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {emojiOptions.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => updateActivity(activity.id, 'icon', emoji)}
                                                    className={`w-10 h-10 text-xl rounded-lg border-2 ${activity.icon === emoji
                                                        ? 'border-primary-500 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Input
                                        label="Title"
                                        value={activity.title}
                                        onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                                        placeholder="Activity name"
                                    />

                                    {/* Description */}
                                    <div className="col-span-2">
                                        <Input
                                            label="Description"
                                            value={activity.description}
                                            onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                                            placeholder="Brief description of the activity"
                                        />
                                    </div>

                                    {/* Type Selector */}
                                    <div>
                                        <label className="form-label">Activity Type</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateActivity(activity.id, 'type', 'online')}
                                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${activity.type === 'online'
                                                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                <Link className="w-4 h-4 inline mr-1" />
                                                Online
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateActivity(activity.id, 'type', 'physical')}
                                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${activity.type === 'physical'
                                                    ? 'bg-green-100 border-green-300 text-green-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                🏃 Physical
                                            </button>
                                        </div>
                                    </div>

                                    {/* Link (for online only) */}
                                    {activity.type === 'online' && (
                                        <Input
                                            label="Game Link"
                                            value={activity.link}
                                            onChange={(e) => updateActivity(activity.id, 'link', e.target.value)}
                                            placeholder="https://example.com/game"
                                        />
                                    )}

                                    {/* Duration & Players */}
                                    <Input
                                        label="Duration"
                                        value={activity.duration}
                                        onChange={(e) => updateActivity(activity.id, 'duration', e.target.value)}
                                        placeholder="5 min"
                                    />
                                    <Input
                                        label="Players"
                                        value={activity.players}
                                        onChange={(e) => updateActivity(activity.id, 'players', e.target.value)}
                                        placeholder="1-4"
                                    />
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => removeActivity(activity.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4 inline mr-1" />
                                        Remove Activity
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderHelpdeskEditor = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                    Set up contact information for your helpdesk page. Users will see these details to reach support.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        Phone Number
                    </label>
                    <Input
                        value={content.helpdesk.phone}
                        onChange={(e) => updateHelpdesk('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div>
                    <label className="form-label flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Email Address
                    </label>
                    <Input
                        type="email"
                        value={content.helpdesk.email}
                        onChange={(e) => updateHelpdesk('email', e.target.value)}
                        placeholder="support@example.com"
                    />
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-8">
                <p className="form-label mb-3">Preview</p>
                <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-4">Contact Support</h3>
                    <div className="space-y-3">
                        {content.helpdesk.phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{content.helpdesk.phone}</p>
                                </div>
                            </div>
                        )}
                        {content.helpdesk.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{content.helpdesk.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Content Editor</h1>
                    <p className="text-text-light">Edit dynamic content for public pages</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Page Selector */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Pages
                        </h3>
                        <div className="space-y-1">
                            {pageOptions.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => { setSelectedPage(page.id); setShowPreview(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedPage === page.id
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'text-text-light hover:bg-gray-100'
                                        }`}
                                >
                                    {page.name}
                                    {page.type === 'structured' && (
                                        <span className="ml-2 text-xs text-gray-400">(Structured)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-dark-900">
                                Editing: {currentPageConfig?.name}
                            </h3>
                            <div className="flex gap-2">
                                {currentPageConfig?.type === 'html' && (
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`btn-secondary btn-sm ${showPreview ? 'bg-primary-100' : ''}`}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        {showPreview ? 'Edit' : 'Preview'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className="btn-primary btn-sm"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    {saved ? 'Saved!' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {currentPageConfig?.type === 'html' && showPreview ? (
                            <div className="border rounded-lg p-6 min-h-[400px] bg-gray-50">
                                <div
                                    className="prose max-w-none"
                                    dangerouslySetInnerHTML={createMarkup(content[selectedPage])}
                                />
                                {!content[selectedPage]?.trim() && (
                                    <p className="text-text-muted italic">No content to preview</p>
                                )}
                            </div>
                        ) : (
                            renderEditor()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
