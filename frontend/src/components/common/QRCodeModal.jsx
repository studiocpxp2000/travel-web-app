import { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodeModal({ isOpen, onClose, data, userName }) {
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && data) {
            setLoading(true);
            QRCode.toDataURL(data, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF',
                },
            })
                .then(url => {
                    setQrImageUrl(url);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error generating QR code:', err);
                    setLoading(false);
                });
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    const handleDownload = () => {
        if (!qrImageUrl) return;

        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `qr-${userName?.replace(/\s+/g, '-').toLowerCase() || 'user'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    {loading ? (
                        <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : qrImageUrl ? (
                        <img
                            src={qrImageUrl}
                            alt={`QR Code for ${userName}`}
                            className="w-[300px] h-[300px] rounded-lg border"
                        />
                    ) : (
                        <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                            Failed to generate QR code
                        </div>
                    )}

                    {/* User Info */}
                    {userName && (
                        <p className="mt-4 text-center font-medium text-dark-900">{userName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 text-center break-all">{data}</p>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={!qrImageUrl || loading}
                    className="w-full mt-6 btn-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Download QR Code
                </button>
            </div>
        </div>
    );
}
