import { useState, useEffect, useCallback } from 'react';
import { QrCode, Camera, CheckCircle, XCircle, LogOut, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePromoterAuth } from '../../context/PromoterAuthContext';
import { getScannerTypeName, getStatusFieldFromScannerType, applyOrgTheme } from '../../utils/helpers';
import { mockUsers } from '../../utils/mockData';

export default function Scanner() {
    const navigate = useNavigate();
    const { user, organization, logout } = usePromoterAuth();
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [stats, setStats] = useState({ scanned: 0, total: 0 });

    const scannerType = user?.scanner_type;
    const statusField = getStatusFieldFromScannerType(scannerType);

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        }

        // Calculate stats
        const orgUsers = mockUsers.filter(u => u.org_id === organization?.id);
        const scannedCount = orgUsers.filter(u => u[statusField]).length;
        setStats({ scanned: scannedCount, total: orgUsers.length });
    }, [organization, statusField]);

    // Auto-dismiss scan result after 2 seconds
    useEffect(() => {
        if (scanResult) {
            const timer = setTimeout(() => {
                setScanResult(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [scanResult]);

    const handleScan = useCallback(() => {
        setScanning(true);
        setScanResult(null);

        // Simulate QR scan (in real app, use html5-qrcode library)
        setTimeout(() => {
            // Simulate finding a random user
            const orgUsers = mockUsers.filter(u => u.org_id === organization?.id);
            const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];

            if (randomUser) {
                const wasAlreadyScanned = randomUser[statusField];

                // Toggle status
                randomUser[statusField] = true;

                setScanResult({
                    success: true,
                    user: randomUser,
                    alreadyScanned: wasAlreadyScanned,
                    statusField: statusField,
                });
                setLastScan(new Date());

                // Update stats
                const scannedCount = orgUsers.filter(u => u[statusField]).length;
                setStats({ scanned: scannedCount, total: orgUsers.length });
            } else {
                setScanResult({
                    success: false,
                    error: 'User not found',
                });
            }

            setScanning(false);
        }, 1500);
    }, [organization, statusField]);

    const handleLogout = () => {
        logout();
        navigate('/promoter/login');
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: organization?.header_color || '#1A1A1A' }}
        >
            {/* Header */}
            <header className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {organization?.logo ? (
                        <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                                src={organization.logo}
                                alt={`${organization.name} logo`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <div>
                        <p className="text-white font-bold text-lg leading-tight">{organization?.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
                {/* Scanner Type Heading */}
                <div className="text-center mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-wider mb-3">
                        ACTIVE SCANNER
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                        {getScannerTypeName(scannerType)}
                    </h1>
                </div>

                {/* Scan Button */}
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative"
                    style={{
                        backgroundColor: organization?.button_color || '#3B82F6',
                        boxShadow: `0 0 60px ${organization?.button_color || '#3B82F6'}50`
                    }}
                >
                    {scanning ? (
                        <>
                            <RefreshCw className="w-20 h-20 text-white animate-spin" />
                            <span className="text-white text-lg mt-4">Scanning...</span>
                        </>
                    ) : (
                        <>
                            <Camera className="w-20 h-20 text-white" />
                            <span className="text-white text-xl font-semibold mt-4">TAP TO SCAN</span>
                        </>
                    )}
                </button>

                {/* Scan Result Overlay - Backdrop */}
                {scanResult && !scanning && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200"
                        onClick={() => setScanResult(null)}
                    >
                        <div
                            className={`relative p-6 rounded-2xl w-[90%] max-w-sm text-center shadow-2xl animate-in zoom-in duration-200 ${scanResult.success ? 'bg-green-500/95' : 'bg-red-500/95'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setScanResult(null)}
                                className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {scanResult.success ? (
                                <>
                                    <CheckCircle className="w-12 h-12 text-white mx-auto mb-3" />
                                    <p className="text-white font-bold text-lg">{scanResult.user.name}</p>
                                    <p className="text-white/80 text-sm">{scanResult.user.email}</p>
                                    {scanResult.alreadyScanned ? (
                                        <p className="text-yellow-200 text-sm mt-2">⚠️ Already scanned</p>
                                    ) : (
                                        <p className="text-white/80 text-sm mt-2">✓ Status updated</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-12 h-12 text-white mx-auto mb-3" />
                                    <p className="text-white font-bold text-lg">{scanResult.error}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Stats Footer - Simplified */}
            <footer className="p-6">
                <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <div className="text-white/60 text-xs uppercase tracking-wider font-medium mb-1">
                            Total Scanned
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {stats.scanned}
                        </div>
                    </div>

                    {lastScan && (
                        <div className="text-right">
                            <div className="text-white/60 text-xs uppercase tracking-wider font-medium mb-1">
                                Last Scan
                            </div>
                            <div className="text-white font-medium">
                                {lastScan.toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}
