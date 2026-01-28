// Email Utilities for Send Email feature

/**
 * Parse an Excel file and extract emails from Column A
 * Requires 'xlsx' library: npm install xlsx
 * @param {File} file - The Excel file to parse
 * @returns {Promise<string[]>} - Array of email addresses
 */
export const parseExcelForEmails = async (file) => {
    // Dynamic import of xlsx library
    try {
        const XLSX = await import('xlsx');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // Extract emails from column A (first column)
                    const emails = jsonData
                        .map(row => row[0])
                        .filter(cell => {
                            if (!cell) return false;
                            const email = String(cell).trim();
                            // Basic email validation
                            return email.includes('@') && email.includes('.');
                        })
                        .map(email => String(email).trim().toLowerCase());

                    resolve([...new Set(emails)]); // Remove duplicates
                } catch (err) {
                    reject(new Error('Failed to parse Excel file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    } catch (err) {
        console.error('xlsx library not installed. Please run: npm install xlsx');
        throw new Error('Excel parsing library not available. Please install xlsx: npm install xlsx');
    }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Parse comma or newline separated emails
 * @param {string} text - Raw text containing emails
 * @returns {string[]} - Array of valid email addresses
 */
export const parseEmailsFromText = (text) => {
    if (!text) return [];

    const emails = text
        .split(/[,\n\r]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => isValidEmail(email));

    return [...new Set(emails)]; // Remove duplicates
};

/**
 * Prepare email payload for backend API
 * @param {Object} params - Email parameters
 * @returns {Object} - Formatted payload for API
 */
export const prepareEmailPayload = ({ to, cc, bcc, subject, htmlContent }) => {
    return {
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : parseEmailsFromText(cc)) : [],
        bcc: bcc ? (Array.isArray(bcc) ? bcc : parseEmailsFromText(bcc)) : [],
        subject: subject || '(No Subject)',
        htmlContent: htmlContent || '',
        sentAt: new Date().toISOString(),
    };
};
