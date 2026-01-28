import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Optional column definitions with {key, header} format
 */
export function exportToExcel(data, filename, columns = null) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    let exportData;

    if (columns) {
        // Use specified columns
        exportData = data.map(row => {
            const newRow = {};
            columns.forEach(col => {
                const value = row[col.key];
                // Format boolean values
                if (typeof value === 'boolean') {
                    newRow[col.header] = value ? 'Yes' : 'No';
                } else if (value === null || value === undefined) {
                    newRow[col.header] = '';
                } else {
                    newRow[col.header] = value;
                }
            });
            return newRow;
        });
    } else {
        // Use all keys from first object as columns
        exportData = data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                const value = row[key];
                if (typeof value === 'boolean') {
                    newRow[key] = value ? 'Yes' : 'No';
                } else if (value === null || value === undefined) {
                    newRow[key] = '';
                } else {
                    newRow[key] = value;
                }
            });
            return newRow;
        });
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(exportData[0] || {});
    headers.forEach((header, idx) => {
        let maxWidth = header.length;
        exportData.forEach(row => {
            const cellValue = String(row[header] || '');
            maxWidth = Math.max(maxWidth, cellValue.length);
        });
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    });
    worksheet['!cols'] = colWidths;

    // Generate file and trigger download
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}

/**
 * User export columns configuration
 */
export const USER_EXPORT_COLUMNS = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'gender', header: 'Gender' },
    { key: 'location', header: 'Location' },
    { key: 'passport', header: 'Passport' },
    { key: 'govt_id_number', header: 'Govt ID Number' },
    { key: 'food_preference', header: 'Food Preference' },
    { key: 'food_remarks', header: 'Food Remarks' },
    { key: 'is_arrived_on_airport', header: 'Arrived Airport' },
    { key: 'is_arrived_on_bus', header: 'Arrived Bus' },
    { key: 'is_arrived_at_hotel', header: 'Arrived Hotel' },
    { key: 'session_1', header: 'Session 1' },
    { key: 'session_2', header: 'Session 2' },
    { key: 'session_3', header: 'Session 3' },
    { key: 'session_4', header: 'Session 4' },
    { key: 'session_5', header: 'Session 5' },
    { key: 'session_6', header: 'Session 6' },
    { key: 'session_7', header: 'Session 7' },
    { key: 'session_8', header: 'Session 8' },
    { key: 'session_9', header: 'Session 9' },
];

/**
 * Promoter export columns configuration
 */
export const PROMOTER_EXPORT_COLUMNS = [
    { key: 'id', header: 'ID' },
    { key: 'username', header: 'Username' },
    { key: 'password', header: 'Password' },
    { key: 'assigned_scanner_type', header: 'Scanner Type' },
];

/**
 * Organization export columns configuration
 */
export const ORGANIZATION_EXPORT_COLUMNS = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'header_color', header: 'Header Color' },
    { key: 'footer_color', header: 'Footer Color' },
    { key: 'button_color', header: 'Button Color' },
];
