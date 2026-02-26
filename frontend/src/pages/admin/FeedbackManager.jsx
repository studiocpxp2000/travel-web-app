import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    MessageSquareText, Settings, ListPlus, Plus, Trash2, GripVertical, Save, Download, RefreshCcw, Edit2, Eye
} from 'lucide-react';
import {
    useGetFeedbackSettingsQuery,
    useUpdateFeedbackSettingsMutation,
    useGetFeedbackResponsesQuery,
    useUpdateFeedbackResponseMutation,
    useDeleteFeedbackResponseMutation,
} from '../../redux/slices/apiSlice';
import { useAuth, ROLES } from '../../hooks/useAuthHooks';
import Loading from '../../components/common/Loading';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import Modal from '../../components/common/Modal';
import { exportToExcel } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export default function FeedbackManager() {
    const { orgSlug } = useParams();
    const { role, token } = useAuth();

    // Tab persistence
    const initialTab = localStorage.getItem(`feedbackTab_${orgSlug}`) || 'settings';
    const [activeTab, setActiveTab] = useState(initialTab);
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem(`feedbackTab_${orgSlug}`, tab);
    };

    const [page, setPage] = useState(1);
    const limit = 10;

    // Fetch settings
    const {
        data: settingsRes,
        isLoading: isSettingsLoading,
        refetch: refetchSettings
    } = useGetFeedbackSettingsQuery(orgSlug, {
        refetchOnMountOrArgChange: true
    });

    const [updateSettings, { isLoading: isUpdating }] = useUpdateFeedbackSettingsMutation();
    const [updateFeedbackResponse] = useUpdateFeedbackResponseMutation();
    const [deleteFeedbackResponse] = useDeleteFeedbackResponseMutation();

    // Fetch responses
    const {
        data: responsesRes,
        isLoading: isResponsesLoading,
        isFetching: isResponsesFetching,
        refetch: refetchResponses
    } = useGetFeedbackResponsesQuery({ orgSlug, page, limit }, {
        skip: activeTab !== 'responses'
    });

    const settings = settingsRes?.data;
    const responses = responsesRes?.data || [];
    const pagination = responsesRes?.pagination;

    // Local state for editing form
    const [isEnabled, setIsEnabled] = useState(false);
    const [questions, setQuestions] = useState([]);

    // Local state for actions on responses
    const [editingResponse, setEditingResponse] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedResponseId, setSelectedResponseId] = useState(null);

    // Use an effect to sync state whenever settings load/refetch
    useEffect(() => {
        if (settings) {
            setIsEnabled(settings.is_enabled);
            setQuestions([...settings.questions].sort((a, b) => a.order - b.order));
        }
    }, [settings]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `new-${Date.now()}`, // temporary id
                text: '',
                type: 'text',
                order: questions.length
            }
        ]);
    };

    const handleRemoveQuestion = (index) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        // Reorder
        newQ.forEach((q, i) => q.order = i);
        setQuestions(newQ);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQ = [...questions];
        newQ[index] = { ...newQ[index], [field]: value };
        setQuestions(newQ);
    };

    // Move question up/down
    const moveQuestion = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === questions.length - 1) return;

        const newQ = [...questions];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap arrays
        const temp = newQ[index];
        newQ[index] = newQ[swapIndex];
        newQ[swapIndex] = temp;

        // Reorder
        newQ.forEach((q, i) => q.order = i);
        setQuestions(newQ);
    };

    const handleSaveSettings = async () => {
        try {
            // Validate
            if (questions.some(q => !q.text.trim())) {
                return toast.error("All questions must have text");
            }

            // Clean up temporary IDs
            const cleanQuestions = questions.map(q => {
                const { id: _id, ...rest } = q;
                return q.id.startsWith('new-') ? rest : q;
            });

            await updateSettings({
                orgSlug,
                is_enabled: isEnabled,
                questions: cleanQuestions
            }).unwrap();

            toast.success("Feedback settings updated successfully");
            refetchSettings();
        } catch (err) {
            toast.error(err?.data?.message || err.error || "Failed to update settings");
        }
    };

    const handleDownloadExcel = () => {
        if (!responses || responses.length === 0) {
            return toast.error("No responses available to download.");
        }

        try {
            // Transform responses into flat objects for Excel
            const exportData = responses.map(fb => {
                const row = {
                    'Submission Date': new Date(fb.createdAt).toLocaleDateString('en-IN'),
                    'Submission Time': new Date(fb.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    'Name': fb.user_name || 'Anonymous',
                    'Email': fb.user_email || 'N/A',
                };

                // Add each question as a column
                if (settings?.questions) {
                    settings.questions.forEach((q, index) => {
                        const res = fb.responses?.find(r => r.question_id === q.id || r.question_text === q.text);
                        row[`Q${index + 1}: ${q.text}`] = res ? (res.type === 'rating' ? `${res.answer} / 5` : res.answer) : '';
                    });
                }
                return row;
            });

            const fileName = `Feedback_Report_${new Date().toISOString().split('T')[0]}`;
            exportToExcel(exportData, fileName);
            toast.success("Report downloaded successfully!");
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Failed to generate report.");
        }
    };

    const handleEditResponseSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateFeedbackResponse({
                id: editingResponse._id,
                orgSlug,
                data: { responses: editingResponse.responses }
            }).unwrap();
            toast.success("Feedback response updated!");
            setEditingResponse(null);
            refetchResponses();
        } catch (err) {
            toast.error("Failed to update feedback");
        }
    };

    const handleDeleteResponse = async () => {
        try {
            await deleteFeedbackResponse({ id: selectedResponseId, orgSlug }).unwrap();
            toast.success("Feedback response deleted");
            setDeleteConfirmOpen(false);
            setSelectedResponseId(null);
            refetchResponses();
        } catch (err) {
            toast.error("Failed to delete feedback");
            setDeleteConfirmOpen(false);
        }
    };

    const columns = useMemo(() => {
        const baseColumns = [
            {
                header: 'User',
                render: (row) => (
                    <div>
                        <div className="font-medium text-gray-900">{row.user_name || 'Anonymous'}</div>
                        {row.user_email && <div className="text-sm text-gray-500">{row.user_email}</div>}
                    </div>
                )
            }
        ];

        // Dynamically append question columns based on current settings
        const questionColumns = (settings?.questions || []).map(q => ({
            header: q.text,
            render: (row) => {
                const res = row.responses?.find(r => r.question_id === q.id || r.question_text === q.text);
                if (!res) return <span className="text-gray-300">-</span>;

                if (res.type === 'rating') {
                    return (
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-900">{res.answer}</span>
                            <span className="text-gray-400">/ 5</span>
                            <span className="text-yellow-400 font-bold">★</span>
                        </div>
                    );
                }
                return <p className="line-clamp-3 text-sm text-gray-700" title={res.answer}>{res.answer}</p>;
            }
        }));

        // Finally, append Date Time and Actions to the end
        const finalColumns = [
            ...baseColumns,
            ...questionColumns,
            {
                header: 'Date & Time',
                width: '180px',
                render: (row) => {
                    const d = new Date(row.createdAt);
                    return (
                        <div>
                            <span className="block text-sm text-gray-900">{d.toLocaleDateString('en-IN')}</span>
                            <span className="block text-xs text-gray-500">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    );
                }
            },
            {
                header: 'Actions',
                width: '120px',
                render: (row) => (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingResponse(JSON.parse(JSON.stringify(row))); }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Edit Response"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResponseId(row._id);
                                setDeleteConfirmOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Response"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )
            }
        ];

        return finalColumns;
    }, [settings]);

    if (isSettingsLoading && !settings) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquareText className="w-6 h-6 text-primary-600" />
                        Feedback Management
                    </h1>
                    <p className="text-gray-500 mt-1">Configure feedback forms and view user responses.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white px-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => handleTabChange('settings')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Form Settings
                        </div>
                    </button>
                    <button
                        onClick={() => handleTabChange('responses')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'responses'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } `}
                    >
                        <div className="flex items-center gap-2">
                            <ListPlus className="w-4 h-4" />
                            Responses
                            {pagination?.totalActive > 0 && (
                                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                    {pagination.totalActive}
                                </span>
                            )}
                        </div>
                    </button>
                </nav>
            </div>

            {/* Form Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Form Configuration</h2>
                            <p className="text-sm text-gray-500">Enable feedback and configure the questions users will see.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <span className="text-sm font-medium text-gray-700">Accepting Responses</span>
                            <button
                                type="button"
                                onClick={() => setIsEnabled(!isEnabled)}
                                className={`
                                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                                    ${isEnabled ? 'bg-green-500' : 'bg-gray-200'}
                                `}
                            >
                                <span className={`
                                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                                    transition duration-200 ease-in-out
                                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                `} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div key={q.id} className="group relative flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors">
                                    <div className="flex flex-col items-center gap-1 text-gray-300 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => moveQuestion(index, 'up')}
                                            disabled={index === 0}
                                            className="hover:text-primary-600 disabled:opacity-30 p-1"
                                            title="Move Up"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <GripVertical className="w-4 h-4" />
                                        <button
                                            type="button"
                                            onClick={() => moveQuestion(index, 'down')}
                                            disabled={index === questions.length - 1}
                                            className="hover:text-primary-600 disabled:opacity-30 p-1"
                                            title="Move Down"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Question {index + 1}</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-sm rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                                placeholder="e.g. How would you rate the venue?"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Type</label>
                                            <select
                                                value={q.type}
                                                onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-sm rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="rating">5-Star Rating</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(index)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2 mt-5"
                                        title="Remove Question"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            {questions.length === 0 && (
                                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <MessageSquareText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No questions configured yet.</p>
                                    <p className="text-gray-400 text-sm mt-1">Add your first question to start collecting feedback.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveSettings}
                                disabled={isUpdating}
                                className="flex items-center justify-center bg-gray-900 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors w-full sm:w-auto shadow-md disabled:opacity-70"
                            >
                                {isUpdating ? (
                                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {isUpdating ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Responses Tab */}
            {activeTab === 'responses' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between pt-2 mb-4 gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={refetchResponses}
                                className="flex items-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <RefreshCcw className={`w-4 h-4 mr-2 ${isResponsesFetching ? 'animate-spin' : ''}`} />
                                Refresh Form Data
                            </button>
                        </div>
                        <button
                            onClick={handleDownloadExcel}
                            className="flex items-center text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-5 py-2.5 rounded-lg transition-colors border border-green-200 shadow-sm"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Report (.xlsx)
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={responses}
                        serverPagination={true}
                        totalItems={pagination?.totalActive || 0}
                        currentPage={page}
                        pageSize={limit}
                        onPageChange={setPage}
                        onSearch={() => { }} // Search not implemented on backend, optionally add later
                        loading={isResponsesFetching || isResponsesLoading}
                        searchPlaceholder="Search disabled..."
                    />
                </div>
            )}

            {/* Edit Response Modal */}
            <Modal
                isOpen={!!editingResponse}
                onClose={() => setEditingResponse(null)}
                title="Edit Feedback Response"
                size="md"
            >
                {editingResponse && (
                    <form onSubmit={handleEditResponseSubmit} className="space-y-6">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-3">
                            <div className="pb-2 border-b border-gray-100">
                                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Response From</p>
                                <p className="font-semibold text-gray-900">{editingResponse.user_name || 'Anonymous'}</p>
                            </div>
                            {editingResponse.responses.map((res, i) => (
                                <div key={i} className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">{res.question_text}</label>
                                    {res.type === 'rating' ? (
                                        <select
                                            value={res.answer}
                                            onChange={(e) => {
                                                const newRes = [...editingResponse.responses];
                                                newRes[i].answer = e.target.value;
                                                setEditingResponse({ ...editingResponse, responses: newRes });
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                                        </select>
                                    ) : (
                                        <textarea
                                            value={res.answer}
                                            onChange={(e) => {
                                                const newRes = [...editingResponse.responses];
                                                newRes[i].answer = e.target.value;
                                                setEditingResponse({ ...editingResponse, responses: newRes });
                                            }}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setEditingResponse(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteResponse}
                title="Delete Feedback"
                message="Are you sure you want to delete this response? This action cannot be undone."
                confirmText="Delete Response"
                type="danger"
            />
        </div>
    );
}
