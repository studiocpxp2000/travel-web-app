import React, { memo } from 'react';
import { Plus, Trash2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Input, { Textarea } from '../../../components/forms/Input';

const FaqEditor = memo(({
    content,
    addFaqItem,
    updateFaqItem,
    removeFaqItem,
    expandedFaq,
    setExpandedFaq
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
                    </h4>
                    <p className="text-xs text-gray-500">Add questions and answers for the FAQ page</p>
                </div>
                <button onClick={addFaqItem} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                </button>
            </div>

            {content.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    No FAQs added. Click "Add Question" to get started.
                </div>
            ) : (
                <div className="space-y-4">
                    {content.items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg bg-white overflow-hidden">
                            <div
                                className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                            >
                                <span className="font-medium text-gray-700 truncate pr-4">
                                    {item.question || <span className="text-gray-400 italic">New Question</span>}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFaqItem(item.id); }}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {expandedFaq === item.id ? (
                                        <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </div>

                            {expandedFaq === item.id && (
                                <div className="p-4 border-t space-y-4">
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
});

export default FaqEditor;
