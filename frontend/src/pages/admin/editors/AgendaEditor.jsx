import React, { memo } from 'react';
import { Plus, Trash2, Calendar, Image, ChevronDown, ChevronUp } from 'lucide-react';
import Input, { Textarea } from '../../../components/forms/Input';

const AgendaEditor = memo(({
    content,
    updateAgendaHeroText,
    addAgendaDay,
    updateAgendaDay,
    removeAgendaDay,
    addAgendaEvent,
    updateAgendaEvent,
    removeAgendaEvent,
    handleAgendaImageUpload,
    updateAgendaEventImage
}) => {
    return (
        <div className="space-y-8">
            <Textarea
                label="Hero Text"
                value={content.heroText}
                onChange={(e) => updateAgendaHeroText(e.target.value)}
                placeholder="Text displayed on the agenda hero section"
                rows={2}
            />

            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Days & Events</h4>
                <button onClick={addAgendaDay} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Day
                </button>
            </div>

            <div className="space-y-6">
                {content.days.map((day, dayIdx) => (
                    <div key={day.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                        <div className="bg-gray-50 p-4 border-b flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-4 flex-1">
                                <Input
                                    value={day.title}
                                    onChange={(e) => updateAgendaDay(day.id, 'title', e.target.value)}
                                    placeholder="Day Title (e.g., Day 1)"
                                    className="w-32"
                                />
                                <FormattedDateInput
                                    value={day.date}
                                    onChange={(e) => updateAgendaDay(day.id, 'date', e.target.value)}
                                    placeholder="Date"
                                    className="w-48"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => addAgendaEvent(day.id)}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Event
                                </button>
                                <button
                                    onClick={() => removeAgendaDay(day.id)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                    title="Remove Day"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {day.events.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-4 italic">No events for this day.</p>
                            ) : (
                                day.events.map((evt) => (
                                    <div key={evt.id} className="border border-gray-100 rounded p-4 relative hover:border-gray-200 transition-colors">
                                        <button
                                            onClick={() => removeAgendaEvent(day.id, evt.id)}
                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                            title="Remove Event"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <Input
                                                label="Time"
                                                value={evt.time}
                                                onChange={(e) => updateAgendaEvent(day.id, evt.id, 'time', e.target.value)}
                                                placeholder="e.g., 9:00 AM"
                                            />
                                            <Input
                                                label="Event Title"
                                                value={evt.title}
                                                onChange={(e) => updateAgendaEvent(day.id, evt.id, 'title', e.target.value)}
                                                placeholder="Event Name"
                                            />
                                            <Input
                                                label="Location"
                                                value={evt.location}
                                                onChange={(e) => updateAgendaEvent(day.id, evt.id, 'location', e.target.value)}
                                                placeholder="Room/Hall Name"
                                            />
                                            <Input
                                                label="Dress Code"
                                                value={evt.dressCode}
                                                onChange={(e) => updateAgendaEvent(day.id, evt.id, 'dressCode', e.target.value)}
                                                placeholder="e.g., Casual"
                                            />
                                        </div>
                                        <Textarea
                                            label="Description"
                                            value={evt.description}
                                            onChange={(e) => updateAgendaEvent(day.id, evt.id, 'description', e.target.value)}
                                            rows={2}
                                            placeholder="Event details..."
                                        />

                                        {/* Event Images */}
                                        <div className="mt-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                                <Image className="w-3 h-3" /> Event Images
                                            </label>
                                            <div className="flex gap-4 overflow-x-auto pb-2">
                                                {/* Allow up to 3 images per event */}
                                                {[0, 1, 2].map(imgIdx => {
                                                    const imgUrl = evt.images?.[imgIdx] || '';
                                                    return (
                                                        <div key={imgIdx} className="flex-shrink-0 w-32">
                                                            <div className="w-32 h-20 bg-gray-100 rounded border flex items-center justify-center relative overflow-hidden group">
                                                                {imgUrl ? (
                                                                    <>
                                                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                updateAgendaEventImage(day.id, evt.id, imgIdx, '');
                                                                            }}
                                                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
                                                                        >
                                                                            <Trash2 className="w-5 h-5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-xs text-gray-400">Add Image</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                                            onChange={(e) => handleAgendaImageUpload(day.id, evt.id, imgIdx, e)}
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Helper component for date formatting
const FormattedDateInput = ({ value, onChange, placeholder, className }) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const formatDateToIso = (dateStr) => {
        if (!dateStr) return '';
        // If it's already YYYY-MM-DD, return it
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        // Try to parse "March 15, 2026"
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
    };

    const formatDateToDisplay = (isoStr) => {
        if (!isoStr) return '';
        // Parse YYYY-MM-DD
        const [y, m, d] = isoStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleChange = (e) => {
        const val = e.target.value;
        if (!val) {
            onChange({ target: { value: '' } });
            return;
        }

        // When type="date", val is always YYYY-MM-DD or empty
        // We convert it to "March 15, 2026" for storage
        const formatted = formatDateToDisplay(val);
        onChange({ target: { value: formatted } });
    };

    // When focused, show ISO (for date picker). When blurred, show formatted text.
    // Note: If value is already ISO (legacy data), formatDateToIso returns it as is, which is fine for date picker.
    // If value is Text (March...), formatDateToIso converts it for date picker.
    // For text display, we just show the raw value (assuming it is formatted correctly in storage).
    const displayValue = isFocused ? formatDateToIso(value) : value;

    return (
        <Input
            type={isFocused ? 'date' : 'text'}
            value={displayValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={className}
        />
    );
};

// Helper X Icon since it wasn't imported in original snippet context easily
const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export default AgendaEditor;
