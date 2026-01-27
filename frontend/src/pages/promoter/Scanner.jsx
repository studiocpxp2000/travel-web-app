import { useState, useEffect, useCallback } from 'react';
import { QrCode, Camera, CheckCircle, XCircle, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getScannerTypeName, getStatusFieldFromScannerType, applyOrgTheme } from '../../utils/helpers';
import { mockUsers } from '../../utils/mockData';

export default function Scanner() {
    const navigate = useNavigate();
    const { user, organization, logout } = useAuth();
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
        navigate('/login');
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: organization?.header_color || '#1A1A1A' }}
        >
            {/* Header */}
            <header className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold">{organization?.name}</p>
                        <p className="text-white/60 text-sm">{getScannerTypeName(scannerType)}</p>
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
            <main className="flex-1 flex flex-col items-center justify-center p-6">
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

                {/* Scan Result */}
                {scanResult && !scanning && (
                    <div className={`mt-8 p-6 rounded-2xl w-full max-w-sm text-center animate-slide-up ${scanResult.success ? 'bg-green-500' : 'bg-red-500'
                        }`}>
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
                )}
            </main>

            {/* Stats Footer */}
            <footer className="p-6">
                <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-white/60 text-sm">Today's Progress</span>
                        <span className="text-white font-bold">{stats.scanned}/{stats.total}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${stats.total > 0 ? (stats.scanned / stats.total) * 100 : 0}%`,
                                backgroundColor: organization?.button_color || '#3B82F6'
                            }}
                        />
                    </div>
                    {lastScan && (
                        <p className="text-white/40 text-xs mt-2">
                            Last scan: {lastScan.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </footer>
        </div>
    );
}
