import { useState, useContext } from 'react';
import { Mail, Upload, FileText, Users, Send, Eye, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import Input, { Select } from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import { parseExcelForEmails, parseEmailsFromText, isValidEmail, prepareEmailPayload } from '../../utils/emailUtils';
import { generateId } from '../../utils/helpers';

export default function SendEmail() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Email content state
    const [contentMode, setContentMode] = useState('textarea'); // 'textarea' or 'file'
    const [htmlContent, setHtmlContent] = useState('');
    const [htmlFileName, setHtmlFileName] = useState('');
    const [subject, setSubject] = useState('');

    // Recipients state
    const [recipientMode, setRecipientMode] = useState('manual'); // 'manual', 'excel', or 'unregistered'
    const [manualEmails, setManualEmails] = useState('');
    const [excelFileName, setExcelFileName] = useState('');
    const [parsedEmails, setParsedEmails] = useState([]);

    // CC/BCC state
    const [ccEmails, setCcEmails] = useState('');
    const [bccEmails, setBccEmails] = useState('');

    // UI state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isEmailListOpen, setIsEmailListOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Email invitations mock state (for saving)
    const [emailInvitations, setEmailInvitations] = useState(mockEmailInvitations);

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    // Handle HTML file upload
    const handleHtmlUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHtmlFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                setHtmlContent(event.target.result);
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    // Handle Excel file upload
    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setExcelFileName(file.name);
            try {
                const emails = await parseExcelForEmails(file);
                setParsedEmails(emails);
                setIsEmailListOpen(true);
            } catch (err) {
                showStatus('error', 'Error', err.message || 'Failed to parse Excel file');
            }
        }
        e.target.value = '';
    };

    // Load unregistered users
    const loadUnregisteredUsers = () => {
        const orgUsers = organization
            ? mockUsers.filter(u => u.org_id === organization.id)
            : mockUsers;

        const unregisteredEmails = orgUsers
            .filter(u => !u.isRegistered && u.email)
            .map(u => u.email);

        setParsedEmails(unregisteredEmails);
        setRecipientMode('unregistered');
        if (unregisteredEmails.length > 0) {
            setIsEmailListOpen(true);
        } else {
            showStatus('info', 'No Users Found', 'All users in this organization are already registered.');
        }
    };

    // Get final email list
    const getRecipientList = () => {
        if (recipientMode === 'manual') {
            return parseEmailsFromText(manualEmails);
        }
        return parsedEmails;
    };
    const [targetGroup, setTargetGroup] = useState('manual'); // manual, all_users, unregistered, upload

    const handleSend = async () => {
        if (!subject || !htmlContent) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Subject and content are required.'
            });
            return;
        }

        let finalRecipients = [];

        if (targetGroup === 'manual') {
            finalRecipients = recipients;
        } else if (targetGroup === 'all_users') {
            finalRecipients = users.map(u => u.email).filter(Boolean);
        } else if (targetGroup === 'unregistered') {
            finalRecipients = users.filter(u => !u.isRegistered).map(u => u.email).filter(Boolean);
        } else if (targetGroup === 'upload') {
            finalRecipients = recipients;
        }

        if (finalRecipients.length === 0) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'No Recipients',
                message: 'Please select or add at least one recipient.'
            });
            return;
        }

        try {
            await sendEmail({
                to: finalRecipients,
                subject,
                htmlContent
            }).unwrap();

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Email Sent',
                message: `Successfully sent to ${finalRecipients.length} recipients.`
            });

            // Reset form
            setSubject('');
            setHtmlContent('');
            setRecipients([]);
            setManualEmail('');
        } catch (err) {
        }

        // setIsSending(false);
    };

    const primaryColor = organization?.button_color || '#3B82F6';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Send Email</h1>
                    <p className="text-text-light">Compose and send emails to users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Email Content */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Email Content
                    </h2>

                    {/* Subject */}
                    <div className="mb-4">
                        <Input
                            label="Subject"
                            placeholder="Enter email subject..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Content Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setContentMode('textarea')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${contentMode === 'textarea'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Write HTML
                        </button>
                        <button
                            type="button"
                            onClick={() => setContentMode('file')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${contentMode === 'file'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Upload HTML File
                        </button>
                    </div>

                    {/* Content Input */}
                    {contentMode === 'textarea' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                HTML Content
                            </label>
                            <textarea
                                className="w-full h-64 px-4 py-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="<html>&#10;  <head>...</head>&#10;  <body>&#10;    Your email content here...&#10;  </body>&#10;</html>"
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".html,.htm"
                                onChange={handleHtmlUpload}
                                className="hidden"
                                id="html-upload"
                            />
                            <label htmlFor="html-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-1">
                                    {htmlFileName || 'Click to upload HTML file'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Supports .html and .htm files
                                </p>
                            </label>
                            {htmlFileName && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">{htmlFileName}</span>
                                    <button
                                        type="button"
                                        onClick={() => { setHtmlFileName(''); setHtmlContent(''); }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Button */}
                    {htmlContent && (
                        <button
                            type="button"
                            onClick={() => setIsPreviewOpen(true)}
                            className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                            <Eye className="w-4 h-4" />
                            Preview Email
                        </button>
                    )}
                </div>

                {/* Right Column - Recipients */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Recipients
                    </h2>

                    {/* Recipient Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => { setRecipientMode('manual'); setParsedEmails([]); }}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${recipientMode === 'manual'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Manual
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecipientMode('excel')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${recipientMode === 'excel'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Excel
                        </button>
                        <button
                            type="button"
                            onClick={loadUnregisteredUsers}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${recipientMode === 'unregistered'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Unregistered
                        </button>
                    </div>

                    {/* Recipient Input */}
                    {recipientMode === 'manual' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Addresses
                            </label>
                            <textarea
                                className="w-full h-32 px-4 py-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter emails (comma or newline separated)&#10;example@email.com&#10;another@email.com"
                                value={manualEmails}
                                onChange={(e) => setManualEmails(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {parseEmailsFromText(manualEmails).length} valid email(s) detected
                            </p>
                        </div>
                    )}

                    {recipientMode === 'excel' && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleExcelUpload}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label htmlFor="excel-upload" className="cursor-pointer">
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    {excelFileName || 'Click to upload Excel file'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Emails should be in Column A
                                </p>
                            </label>
                            {parsedEmails.length > 0 && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEmailListOpen(true)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View {parsedEmails.length} parsed emails
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {recipientMode === 'unregistered' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-800">
                                        <strong>{parsedEmails.length}</strong> unregistered user(s) found in {organization?.name || 'all organizations'}.
                                    </p>
                                    {parsedEmails.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEmailListOpen(true)}
                                            className="text-sm text-yellow-700 hover:underline mt-1"
                                        >
                                            View email list
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CC/BCC Section */}
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">CC / BCC (Optional)</h3>
                        <div className="space-y-3">
                            <Input
                                label="CC"
                                placeholder="cc@example.com, cc2@example.com"
                                value={ccEmails}
                                onChange={(e) => setCcEmails(e.target.value)}
                            />
                            <Input
                                label="BCC"
                                placeholder="bcc@example.com, bcc2@example.com"
                                value={bccEmails}
                                onChange={(e) => setBccEmails(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="btn-dark flex items-center gap-2 px-6 py-3"
                    style={{ backgroundColor: primaryColor }}
                >
                    {isSending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Send Emails ({getRecipientList().length})
                        </>
                    )}
                </button>
            </div>

            {/* Email Preview Modal */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Email Preview"
                size="xl"
            >
                <div className="bg-gray-100 rounded-lg p-4 max-h-[60vh] overflow-auto">
                    <div
                        className="bg-white rounded shadow p-4"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </Modal>

            {/* Email List Preview Modal */}
            <Modal
                isOpen={isEmailListOpen}
                onClose={() => setIsEmailListOpen(false)}
                title={`Email Recipients (${parsedEmails.length})`}
                size="md"
            >
                <div className="max-h-[50vh] overflow-auto">
                    {parsedEmails.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No emails found</p>
                    ) : (
                        <div className="space-y-1">
                            {parsedEmails.map((email, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded"
                                >
                                    <span className="text-sm">{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => setParsedEmails(parsedEmails.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => setIsEmailListOpen(false)}
                        className="btn-dark"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Confirm ({parsedEmails.length} emails)
                    </button>
                </div>
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
