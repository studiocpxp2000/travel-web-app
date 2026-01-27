export default function Input({
    label,
    error,
    type = 'text',
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label className="form-label">{label}</label>
            )}
            <input
                type={type}
                className={`form-input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}

export function Select({ label, error, options, className = '', placeholder, ...props }) {
    return (
        <div className={className}>
            {label && (
                <label className="form-label">{label}</label>
            )}
            <select
                className={`form-input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, className = '', rows = 4, ...props }) {
    return (
        <div className={className}>
            {label && (
                <label className="form-label">{label}</label>
            )}
            <textarea
                rows={rows}
                className={`form-input resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...props}
            />
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
