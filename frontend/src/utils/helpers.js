// Generate a unique ID
export const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format date to readable string
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Format date with time
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Truncate text with ellipsis
export const truncate = (text, length = 50) => {
    if (!text) return '';
    return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Capitalize first letter
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Get scanner type display name
export const getScannerTypeName = (type) => {
    if (type === 'ARRIVAL_SCANNER') return 'Arrival Scanner';
    if (type.startsWith('SESSION_')) {
        const num = type.replace('SESSION_', '');
        return `Session ${num}`;
    }
    return type;
};

// Get status field name from scanner type
export const getStatusFieldFromScannerType = (scannerType) => {
    if (scannerType === 'ARRIVAL_SCANNER') return 'arrival_status';
    if (scannerType.startsWith('SESSION_')) {
        const num = scannerType.replace('SESSION_', '');
        return `session_${num}_status`;
    }
    return null;
};

// Apply organization theme to CSS variables
export const applyOrgTheme = (org) => {
    if (!org) return;

    const root = document.documentElement;
    root.style.setProperty('--header-bg', org.header_color || '#1A1A1A');
    root.style.setProperty('--footer-bg', org.footer_color || '#1A1A1A');
    root.style.setProperty('--button-color', org.button_color || '#3B82F6');
};

// Reset theme to defaults
export const resetTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--header-bg', '#1A1A1A');
    root.style.setProperty('--footer-bg', '#1A1A1A');
    root.style.setProperty('--button-color', '#3B82F6');
};

// Validate email format
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
};

// Safely render HTML content
export const createMarkup = (html) => {
    return { __html: html };
};

// Export data to CSV file and trigger download
export const exportToCSV = (data, filename = 'export') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header] ?? '';
                // Escape quotes and wrap in quotes if contains comma or newline
                const escaped = String(value).replace(/"/g, '""');
                return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
