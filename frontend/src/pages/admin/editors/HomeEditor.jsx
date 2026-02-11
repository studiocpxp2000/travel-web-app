import React, { memo } from 'react';
import { Home, Plus, Trash2, Calendar, Shirt, Building, Mail, Clock } from 'lucide-react';
import Input, { Textarea } from '../../../components/forms/Input';

// Icon options for home cards
const homeIconOptions = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'dress', label: 'Dress Code', icon: Shirt },
    { id: 'hotel', label: 'Hotel', icon: Building },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'clock', label: 'Clock', icon: Clock },
];

const HomeEditor = memo(({ content, updateHome, addHomeCard, updateHomeCard, removeHomeCard }) => {
    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Home className="w-4 h-4" /> Hero Section
                </h4>
                <div className="space-y-4">
                    <Textarea
                        label="Hero Text"
                        value={content.heroText}
                        onChange={(e) => updateHome('heroText', e.target.value)}
                        placeholder="Text displayed on the video hero section"
                        rows={3}
                    />
                    <Input
                        label="Countdown End Date & Time"
                        type="datetime-local"
                        value={content.countdownDate.slice(0, 16)}
                        onChange={(e) => updateHome('countdownDate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        After this date/time passes, "The Event Has Started" message will be shown instead of the countdown.
                    </p>
                </div>
            </div>

            {/* About Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">About Section</h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label="Title"
                        value={content.aboutTitle}
                        onChange={(e) => updateHome('aboutTitle', e.target.value)}
                        placeholder="About The Event"
                    />
                    <Input
                        label="Description"
                        value={content.aboutDescription}
                        onChange={(e) => updateHome('aboutDescription', e.target.value)}
                        placeholder="Event details description"
                    />
                </div>
            </div>

            {/* Event Detail Cards */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Event Detail Cards</h4>
                        <p className="text-xs text-gray-500">Add cards to display event information</p>
                    </div>
                    <button onClick={addHomeCard} className="btn-secondary btn-sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Card
                    </button>
                </div>

                {content.cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No cards added. Click "Add Card" to get started.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {content.cards.map((card, index) => (
                            <div key={card.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs text-gray-400">Card #{index + 1}</span>
                                    <button
                                        onClick={() => removeHomeCard(card.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {/* Icon Selector */}
                                    <div>
                                        <label className="form-label">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {homeIconOptions.map(opt => {
                                                const IconComp = opt.icon;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => updateHomeCard(card.id, 'icon', opt.id)}
                                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${card.icon === opt.id
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }`}
                                                        title={opt.label}
                                                    >
                                                        <IconComp className="w-5 h-5 text-gray-700" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Input
                                        label="Title"
                                        value={card.title}
                                        onChange={(e) => updateHomeCard(card.id, 'title', e.target.value)}
                                        placeholder="Card title"
                                    />

                                    {/* Description */}
                                    <Input
                                        label="Description"
                                        value={card.description}
                                        onChange={(e) => updateHomeCard(card.id, 'description', e.target.value)}
                                        placeholder="Mobile: +1 234..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export default HomeEditor;
