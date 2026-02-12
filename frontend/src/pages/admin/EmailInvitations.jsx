import { useState, useContext } from 'react';
import { Mail, Download, Eye, Calendar, Clock, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import { useGetSentEmailsQuery, useLazyGetSentEmailDetailsQuery } from '../../redux/slices/apiSlice';
import { exportToCSV } from '../../utils/helpers';

export default function EmailInvitations() {
    const { user, organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);

    // For admin_org: authOrg is null, so fall back to user.org_id
    // For super_admin: use OrgContext's currentOrg
    const orgId = orgContext?.currentOrg?._id || authOrg?._id || user?.org_id;

    // Fetch sent emails from API with org_id for both admin and super admin
    const { data: emailsData, isLoading } = useGetSentEmailsQuery({ org_id: orgId }, {
        skip: !orgId
    });
    const sentEmails = emailsData?.data || [];

    const [triggerGetDetails] = useLazyGetSentEmailDetailsQuery();

    const [selectedEmail, setSelectedEmail] = useState(null);
    const [emailDetails, setEmailDetails] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [recipientTab, setRecipientTab] = useState('all');
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [showContent, setShowContent] = useState(true);


    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const handleViewDetails = async (email) => {
        setSelectedEmail(email);
        setEmailDetails(null);
        setIsLoadingDetails(true);
        setRecipientTab('all');
        setIsDetailOpen(true);
        try {
            const result = await triggerGetDetails(email._id).unwrap();
            setEmailDetails(result.data);
        } catch (err) {
            console.error("Failed to fetch details", err);
            showStatus('error', 'Error', 'Failed to fetch email details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadReport = async () => {
        if (sentEmails.length === 0) {
            showStatus('info', 'No Data', 'No emails to export.');
            return;
        }

        setIsExporting(true);
        try {
            // Fetch full data with export=true for all fields
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
            const response = await fetch(`${baseUrl}/admin/emails?export=true&org_id=${orgId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
                }
            });
            const result = await response.json();

            if (!result.success || !result.data) {
                showStatus('error', 'Error', 'Failed to fetch export data.');
                return;
            }

            const data = result.data.map(email => ({
                'Subject': email.subject || '',
                'HTML Content': email.html_content || '',
                'Total Recipients': email.total_recipients || 0,
                'Successful': email.successful_sends || 0,
                'Failed': email.failed_sends || 0,
                'Recipient Emails': email.recipients?.map(r => r.email).join(', ') || '',
                'CC': email.cc?.length > 0 ? email.cc.join(', ') : 'N/A',
                'BCC': email.bcc?.length > 0 ? email.bcc.join(', ') : 'N/A',
                'Sent By': email.sent_by?.name || email.sent_by?.email || '',
                'Status': email.status || '',
                'Sent At': new Date(email.createdAt).toLocaleString(),
            }));

            exportToCSV(data, `email_invitations_report_${new Date().toISOString().split('T')[0]}`);
            showStatus('success', 'Downloaded', 'Report downloaded successfully.');
        } catch (err) {
            console.error('Export error:', err);
            showStatus('error', 'Error', 'Failed to download report.');
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            completed: 'bg-green-100 text-green-700',
            sent: 'bg-green-100 text-green-700', // For recipient status
            sending: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700',
            bounced: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
            draft: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status] || statusStyles.draft}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    const columns = [
        {
            header: 'Subject',
            accessor: 'subject',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium truncate max-w-[200px]" title={row.subject}>{row.subject}</span>
                </div>
            ),
        },
        {
            header: 'Recipients',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{row.total_recipients}</span>
                </div>
            ),
        },
        {
            header: 'Success / Failed',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {row.successful_sends}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        {row.failed_sends}
                    </span>
                </div>
            ),
        },
        {
            header: 'Status',
            render: (row) => getStatusBadge(row.status),
        },
        {
            header: 'Sent At',
            render: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(row.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatTime(row.createdAt)}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Actions',
            width: '80px',
            render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(row); }}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Filter recipients for display in modal
    const getFilteredRecipients = () => {
        if (!emailDetails?.recipients) return [];
        if (recipientTab === 'success') return emailDetails.recipients.filter(r => r.status === 'sent' || r.status === 'completed');
        if (recipientTab === 'failed') return emailDetails.recipients.filter(r => r.status === 'failed' || r.status === 'bounced');
        return emailDetails.recipients;
    };

    const filteredRecipients = getFilteredRecipients();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Email Invitations</h1>
                    <p className="text-text-light">View all sent invitation emails</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadReport}
                        className="btn-secondary"
                        disabled={sentEmails.length === 0 || isExporting}
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Download Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={sentEmails}
                searchPlaceholder="Search by subject..."
                pageSize={10}
            />

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Email Campaign Details"
                size="2xl" // Wider modal for details
            >
                {emailDetails ? (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Header Info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div>
                                <h3 className="text-lg font-bold text-dark-900 break-words">{emailDetails.subject}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Sent by <span className="font-medium">{emailDetails.sent_by?.name || 'Admin'}</span> on {formatDate(emailDetails.createdAt)} at {formatTime(emailDetails.createdAt)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200">
                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                    {getStatusBadge(emailDetails.status)}
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CC</p>
                                    <p className="text-sm text-dark-900 font-medium">
                                        {emailDetails.cc && emailDetails.cc.length > 0 ? emailDetails.cc.join(', ') : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">BCC</p>
                                    <p className="text-sm text-dark-900 font-medium">
                                        {emailDetails.bcc && emailDetails.bcc.length > 0 ? emailDetails.bcc.join(', ') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email Content Preview */}
                        <div>
                            <button
                                onClick={() => setShowContent(!showContent)}
                                className="flex items-center justify-between w-full py-2 text-left font-semibold text-dark-900 border-b border-gray-200 mb-2"
                            >
                                <span>Email Content</span>
                                {showContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showContent && emailDetails.html_content && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto max-h-60 mt-2">
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: emailDetails.html_content }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Recipients List */}
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                <h4 className="font-semibold text-dark-900">Recipients List ({emailDetails.total_recipients})</h4>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    {['all', 'success', 'failed'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setRecipientTab(tab)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${recipientTab === tab
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {filteredRecipients.length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-2">Email</th>
                                                <th className="px-4 py-2">Status</th>
                                                <th className="px-4 py-2">Sent Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredRecipients.map((recipient, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-medium text-dark-900">{recipient.email}</td>
                                                    <td className="px-4 py-2">{getStatusBadge(recipient.status)}</td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {recipient.sent_at ? formatTime(recipient.sent_at) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No recipients found for this filter.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-2 text-primary-600">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-current border-t-transparent"></div>
                            <span className="text-sm font-medium">Loading details...</span>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
}
