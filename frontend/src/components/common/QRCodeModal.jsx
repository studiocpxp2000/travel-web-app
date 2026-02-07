import { X, Download, Loader2, QrCode } from 'lucide-react';

/**
 * QRCodeModal - Displays QR code from S3 URL or generates fallback
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {string} qrUrl - S3 URL of the QR code image
 * @param {string} email - User email (for fallback and display)
 * @param {string} userName - User name for display
 */
export default function QRCodeModal({ isOpen, onClose, qrUrl, email, userName, userId }) {
    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!qrUrl) return;

        try {
            let response;

            // If userId is available, use the backend proxy to bypass CORS
            if (userId) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
                const token = localStorage.getItem('token');

                response = await fetch(`${baseUrl}/users/${userId}/qr/download`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } else {
                // Fallback to direct S3 fetch (might depend on CORS)
                // Try with CORS mode first
                response = await fetch(qrUrl, { mode: 'cors' });
            }

            if (!response.ok) throw new Error('Failed to fetch');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-${userName?.replace(/\s+/g, '-').toLowerCase() || 'user'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(qrUrl, '_blank');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-dark-900">QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                    {qrUrl ? (
                        <img
                            src={qrUrl}
                            alt={`QR Code for ${userName}`}
                            className="w-[300px] h-[300px] rounded-lg border object-contain bg-white"
                        />
                    ) : (
                        <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                            <QrCode className="w-16 h-16 mb-3 text-gray-300" />
                            <p className="text-sm">QR Code not available</p>
                            <p className="text-xs mt-1">Generate from Users page</p>
                        </div>
                    )}

                    {/* User Info */}
                    {userName && (
                        <p className="mt-4 text-center font-medium text-dark-900">{userName}</p>
                    )}
                    {email && (
                        <p className="text-xs text-gray-500 mt-1 text-center break-all">{email}</p>
                    )}
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={!qrUrl}
                    className="w-full mt-6 btn-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Download QR Code
                </button>
            </div>
        </div>
    );
}
