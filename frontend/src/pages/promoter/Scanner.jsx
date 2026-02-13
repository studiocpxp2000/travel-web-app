import { useState, useEffect, useRef } from 'react';
import { QrCode, LogOut, X, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { usePromoterAuth } from '../../hooks/useAuthHooks';
import { getScannerTypeName, applyOrgTheme } from '../../utils/helpers';
import { useScanUserMutation, useGetPromoterStatsQuery } from '../../redux/slices/apiSlice';

export default function Scanner() {
    const navigate = useNavigate();
    const { user, organization, logout } = usePromoterAuth();

    // API Hooks
    const [scanUser] = useScanUserMutation();
    const { data: statsData, refetch: refetchStats } = useGetPromoterStatsQuery(undefined, {
        pollingInterval: 30000,
    });

    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);
    const [isScannerReady, setIsScannerReady] = useState(false);

    const stats = statsData?.data || { scanned: 0, total: 0 };
    const scannerType = user?.scanner_type;

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        }
    }, [organization]);

    // Auto-dismiss scan result and resume scanning
    useEffect(() => {
        let timer;
        if (scanResult) {
            timer = setTimeout(() => {
                setScanResult(null);
                // If we want to resume scanning automatically, we might need to re-enable the QR callback
                // But Html5QrcodeScanner usually continues scanning unless paused/cleared.
                // However, avoiding rapid-fire duplicate scans is key.
                // The library has 'disableFlip' etc but not a 'pause'.
                // Ideally we handle the cooldown in the callback itself.
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [scanResult]);

    // Initialize Scanner
    useEffect(() => {
        // Delay initialization slightly to ensure DOM is ready
        const timer = setTimeout(() => {
            setIsScannerReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const [isScannerOpen, setIsScannerOpen] = useState(false);



    useEffect(() => {
        if (!isScannerReady || !isScannerOpen) return;

        const onScanSuccess = async (decodedText, decodedResult) => {
            // Prevent multiple scans while processing or showing result
            if (scannerRef.current?.isPaused) return;

            // Simple debounce/lock check
            if (window.isScanningProcessing) return;
            window.isScanningProcessing = true;

            try {
                // Pause scanner to give feedback
                if (scannerRef.current) {
                    try { scannerRef.current.pause(); } catch (e) { }
                }

                // Call API - apiSlice wraps the string in { qr_data: text }
                const result = await scanUser(decodedText).unwrap();

                setScanResult({
                    success: true,
                    user: result.data.user,
                    alreadyScanned: result.data.alreadyScanned,
                });
                refetchStats();

            } catch (err) {
                setScanResult({
                    success: false,
                    error: err?.data?.message || 'Scan failed',
                });
            } finally {
                // Wait for the modal timeout (2s) before resuming
                setTimeout(() => {
                    window.isScanningProcessing = false;
                    if (scannerRef.current) {
                        try { scannerRef.current.resume(); } catch (e) { }
                    }
                }, 2000);
            }
        };

        const onScanFailure = (error) => {
            // console.warn(`Code scan error = ${error}`);
        };

        // Initialize
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(error => {
                        console.error("Failed to clear html5-qrcode scanner. ", error);
                    });
                } catch (e) { console.error(e); }
                scannerRef.current = null;
            }
            window.isScanningProcessing = false;
        };
    }, [isScannerReady, isScannerOpen, scanUser, refetchStats]);

    const handleLogout = () => {
        if (scannerRef.current) {
            try { scannerRef.current.clear(); } catch (e) { }
        }
        logout();
        navigate('/promoter/login');
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: organization?.header_color || '#1A1A1A' }}
        >
            {/* ... (Header remains same) ... */}
            <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    {organization?.logo ? (
                        <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm">
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
                        <p className="text-white/60 text-xs font-medium">{getScannerTypeName(scannerType)}</p>
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
            <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-md mx-auto relative">

                {!isScannerOpen ? (
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
                    >
                        <QrCode className="w-6 h-6" />
                        Start Scanning
                    </button>
                ) : (
                    <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsScannerOpen(false)}
                            className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/80 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {!isScannerReady && (
                            <div className="h-80 flex items-center justify-center text-white/50">
                                Initializing Camera...
                            </div>
                        )}
                        <div id="reader" className="w-full h-full min-h-[300px]"></div>
                    </div>
                )}


                {isScannerOpen && (
                    <p className="text-white/50 text-sm mt-6 text-center px-4">
                        Point camera at a User QR Code to scan.
                        <br />
                        Updated automatically.
                    </p>
                )}

                {/* Scan Result Overlay */}
                {scanResult && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => setScanResult(null)}
                    >
                        <div
                            className={`relative p-8 rounded-3xl w-[85%] max-w-sm text-center shadow-2xl animate-in zoom-in duration-300 ${scanResult.success ? 'bg-green-500' : 'bg-red-500'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Result Content ... */}
                            {scanResult.success ? (
                                <>
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                        <CheckCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <h2 className="text-white font-bold text-2xl mb-1">{scanResult.user.name}</h2>
                                    <p className="text-white/90 text-sm mb-4 font-medium">{scanResult.user.email}</p>

                                    {scanResult.alreadyScanned ? (
                                        <div className="bg-yellow-400/20 py-2 px-4 rounded-lg inline-block">
                                            <p className="text-yellow-100 font-bold text-sm">⚠️ Already Scanned</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white/20 py-2 px-4 rounded-lg inline-block">
                                            <p className="text-white font-bold text-sm">✓ Check-in Complete</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                        <XCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <h2 className="text-white font-bold text-2xl mb-2">Scan Failed</h2>
                                    <p className="text-white/90 text-sm">{scanResult.error}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Stats Footer */}
            <footer className="p-4 pb-8 w-full max-w-md mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between border border-white/5">
                    <div>
                        <div className="text-white/60 text-xs uppercase tracking-wider font-bold mb-1">
                            Scanned
                        </div>
                        <div className="text-4xl font-black text-white leading-none">
                            {stats.scanned}
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stats.scanned > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                        <CheckCircle className="w-8 h-8" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
