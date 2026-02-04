import { useState, useContext } from 'react';
import { Mail, Search, Download, Trash2, Eye, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';
import { exportToCSV } from '../../utils/helpers';

export default function EmailInvitations() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Ideally fetch from backend logs
    const [invitations, setInvitations] = useState([]);
    const [selectedInvitation, setSelectedInvitation] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', itemId: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const handleViewDetails = (invitation) => {
        setSelectedInvitation(invitation);
        setIsDetailOpen(true);
    };

    const handleDelete = (id) => {
        const invitation = invitations.find(i => i.id === id);
        setConfirmModal({
            isOpen: true,
            title: 'Delete Invitation Record?',
            message: `Are you sure you want to delete the invitation record for "${invitation?.email}"?`,
            itemId: id,
        });
    };

    const handleConfirmDelete = () => {
        setInvitations(invitations.filter(i => i.id !== confirmModal.itemId));
        setConfirmModal({ ...confirmModal, isOpen: false });
        showStatus('success', 'Deleted', 'Invitation record deleted successfully.');
    };

    const handleDownloadReport = () => {
        const data = invitations.map(inv => ({
            Email: inv.email,
            Subject: inv.subject || 'N/A',
            'Sent At': new Date(inv.sentAt).toLocaleString(),
        }));
        exportToCSV(data, 'email_invitations_report');
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

    const columns = [
        {
            header: 'Email',
            accessor: 'email',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{row.email}</span>
                </div>
            ),
        },
        {
            header: 'Subject',
            accessor: 'subject',
            render: (row) => (
                <span className="text-gray-600">{row.subject || '(No Subject)'}</span>
            ),
        },
        {
            header: 'Sent At',
            render: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(row.sentAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatTime(row.sentAt)}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Actions',
            width: '100px',
            render: (row) => (
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(row); }}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const primaryColor = organization?.button_color || '#3B82F6';

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
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">{invitations.length}</p>
                            <p className="text-sm text-text-light">Total Invitations Sent</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-100">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">
                                {invitations.filter(i => {
                                    const sentDate = new Date(i.sentAt);
                                    const today = new Date();
                                    return sentDate.toDateString() === today.toDateString();
                                }).length}
                            </p>
                            <p className="text-sm text-text-light">Sent Today</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-900">
                                {invitations.length > 0
                                    ? formatDate(invitations[invitations.length - 1].sentAt)
                                    : 'N/A'}
                            </p>
                            <p className="text-sm text-text-light">Last Sent</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={invitations}
                searchPlaceholder="Search by email..."
                pageSize={10}
            />

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Invitation Details"
                size="md"
            >
                {selectedInvitation && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{selectedInvitation.email}</p>
                                <p className="text-sm text-gray-500">Invitation Recipient</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Subject</p>
                                <p className="font-medium">{selectedInvitation.subject || '(No Subject)'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Sent At</p>
                                <p className="font-medium">
                                    {formatDate(selectedInvitation.sentAt)} at {formatTime(selectedInvitation.sentAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={confirmModal.title}
                message={confirmModal.message}
                type="delete"
            />

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
