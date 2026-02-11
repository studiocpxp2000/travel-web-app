import { Loader2 } from 'lucide-react';

export default function Loading({ fullScreen = true, className = "" }) {
    if (fullScreen) {
        return (
            <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
    );
}
