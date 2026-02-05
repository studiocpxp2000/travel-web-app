import { useState, useContext } from 'react';
import { Mail, Download, Eye, Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import { useGetSentEmailsQuery } from '../../redux/slices/apiSlice';
import { exportToCSV } from '../../utils/helpers';

export default function EmailInvitations() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Fetch sent emails from API
    const { data: emailsData, isLoading } = useGetSentEmailsQuery();
    const sentEmails = emailsData?.data || [];

    const [selectedEmail, setSelectedEmail] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const handleViewDetails = (email) => {
        setSelectedEmail(email);
        setIsDetailOpen(true);
    };

    const handleDownloadReport = () => {
        if (sentEmails.length === 0) {
            showStatus('info', 'No Data', 'No emails to export.');
            return;
        }

        const data = sentEmails.map(email => ({
            'Subject': email.subject,
            'Total Recipients': email.total_recipients,
            'Successful': email.successful_sends,
            'Failed': email.failed_sends,
            'Status': email.status,
            'Sent At': new Date(email.createdAt).toLocaleString(),
        }));

        exportToCSV(data, `email_invitations_report_${new Date().toISOString().split('T')[0]}`);
        showStatus('success', 'Downloaded', 'Report downloaded successfully.');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            completed: 'bg-green-100 text-green-700',
            sending: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700',
            draft: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.draft}`}>
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
                    <span className="font-medium truncate max-w-[200px]">{row.subject}</span>
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

    // Calculate stats
    const totalSent = sentEmails.reduce((sum, e) => sum + e.total_recipients, 0);
    const totalSuccess = sentEmails.reduce((sum, e) => sum + e.successful_sends, 0);
    const todayEmails = sentEmails.filter(e => {
        const sentDate = new Date(e.createdAt);
        const today = new Date();
        return sentDate.toDateString() === today.toDateString();
    }).length;

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
                        disabled={sentEmails.length === 0}
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">{sentEmails.length}</p>
                            <p className="text-sm text-text-light">Email Campaigns</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">{totalSent}</p>
                            <p className="text-sm text-text-light">Total Recipients</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-100">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">{totalSuccess}</p>
                            <p className="text-sm text-text-light">Successful Sends</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-orange-100">
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">{todayEmails}</p>
                            <p className="text-sm text-text-light">Sent Today</p>
                        </div>
                    </div>
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
                size="lg"
            >
                {selectedEmail && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg">{selectedEmail.subject}</p>
                                <p className="text-sm text-gray-500">
                                    Sent on {formatDate(selectedEmail.createdAt)} at {formatTime(selectedEmail.createdAt)}
                                </p>
                            </div>
                            {getStatusBadge(selectedEmail.status)}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{selectedEmail.total_recipients}</p>
                                <p className="text-sm text-gray-600">Total Recipients</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{selectedEmail.successful_sends}</p>
                                <p className="text-sm text-gray-600">Successful</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{selectedEmail.failed_sends}</p>
                                <p className="text-sm text-gray-600">Failed</p>
                            </div>
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
