import React, { memo } from 'react';
import { Plus, Trash2, Link } from 'lucide-react';
import Input from '../../../components/forms/Input';

const emojiOptions = ['🌍', '🗺️', '🧳', '✈️', '📸', '💱', '🎮', '🏆', '🎯', '🎲', '🃏', '🎪'];

const FunzoneEditor = memo(({ content, addActivity, updateActivity, removeActivity }) => {
    return (
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

                {content.activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No activities yet. Click "Add Activity" to get started.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {content.activities.map((activity) => (
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
});

export default FunzoneEditor;
