export default function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div
            className={`${hover ? 'card-hover' : 'card'} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', onClick }) {
    const colorClasses = {
        primary: 'bg-primary-100 text-primary-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div
            className={`card ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-text-light">{title}</p>
                    <p className="text-3xl font-bold text-dark-900 mt-1">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend === 'up' ? '↑' : '↓'} {trendValue}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
            {onClick && (
                <p className="text-xs text-primary-500 mt-3">Click to view →</p>
            )}
        </div>
    );
}
