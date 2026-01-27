import { useState } from 'react';
import { FileText, Save, Eye } from 'lucide-react';
import { Textarea } from '../../components/forms/Input';
import { useAuth } from '../../context/AuthContext';
import { createMarkup } from '../../utils/helpers';

const pageOptions = [
    { id: 'home', name: 'Home Page' },
    { id: 'agenda', name: 'Agenda' },
    { id: 'venue', name: 'Venue' },
    { id: 'faq', name: 'FAQs' },
    { id: 'funzone', name: 'Fun Zone' },
    { id: 'leaderboard', name: 'Leaderboard' },
    { id: 'gallery', name: 'Gallery' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'helpdesk', name: 'Helpdesk' },
];

// Mock content storage
const mockContent = {
    home: '<h2>Welcome to Our Event</h2><p>This is the dynamic content for the home page.</p>',
    agenda: '<h2>Event Schedule</h2><p>Check out our exciting lineup of sessions.</p>',
    venue: '<h2>Venue Information</h2><p>Find us at the Grand Convention Center.</p>',
    faq: '<h2>FAQs</h2><p>Common questions answered here.</p>',
    funzone: '<h2>Fun Activities</h2><p>Games and entertainment await!</p>',
    leaderboard: '',
    gallery: '',
    notifications: '',
    helpdesk: '',
};

export default function ContentEditor() {
    const { organization } = useAuth();
    const [selectedPage, setSelectedPage] = useState('home');
    const [content, setContent] = useState(mockContent);
    const [showPreview, setShowPreview] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // In a real app, this would save to backend
        console.log('Saving content for', selectedPage, content[selectedPage]);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

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
                                    onClick={() => setSelectedPage(page.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedPage === page.id
                                            ? 'bg-primary-100 text-primary-700 font-medium'
                                            : 'text-text-light hover:bg-gray-100'
                                        }`}
                                >
                                    {page.name}
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
                                Editing: {pageOptions.find(p => p.id === selectedPage)?.name}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`btn-secondary btn-sm ${showPreview ? 'bg-primary-100' : ''}`}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    {showPreview ? 'Edit' : 'Preview'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary btn-sm"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    {saved ? 'Saved!' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {showPreview ? (
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
                            <>
                                <Textarea
                                    rows={15}
                                    value={content[selectedPage]}
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
