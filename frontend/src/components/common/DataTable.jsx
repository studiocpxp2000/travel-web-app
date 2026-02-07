import { useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronsLeft, ChevronsRight } from 'lucide-react';

function DataTable({
    columns,
    data,
    onRowClick,
    searchable = true,
    searchPlaceholder = 'Search...',
    pageSize = 10,
    emptyMessage = 'No data available',
    // Server-side pagination props
    serverPagination = false,
    totalItems = 0,
    currentPage: externalCurrentPage = 1,
    onPageChange,
    onSearch,
    loading = false,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);

    // Use external or internal page state
    const currentPage = serverPagination ? externalCurrentPage : internalCurrentPage;
    const setCurrentPage = serverPagination ? onPageChange : setInternalCurrentPage;

    // Client-side filtering (only when not using server pagination)
    const filteredData = serverPagination ? data : data.filter(row => {
        if (!searchTerm) return true;
        return columns.some(col => {
            const value = col.accessor ? row[col.accessor] : '';
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
    });

    // Pagination calculations
    const totalRecords = serverPagination ? totalItems : filteredData.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = serverPagination ? data : filteredData.slice(startIndex, startIndex + pageSize);

    const handlePageChange = (page) => {
        const newPage = Math.min(Math.max(1, page), totalPages);
        setCurrentPage(newPage);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (serverPagination && onSearch) {
            onSearch(value);
        }
        setCurrentPage(1);
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) pages.push(i);
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        }

        return pages;
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            {searchable && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="form-input pl-10"
                    />
                </div>
            )}

            {/* Table */}
            <div className="table-container relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
                    </div>
                )}
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} style={{ width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIdx) => (
                                <tr
                                    key={row.id || rowIdx}
                                    onClick={() => onRowClick?.(row)}
                                    className={onRowClick ? 'cursor-pointer' : ''}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx}>
                                            {col.render
                                                ? col.render(row)
                                                : col.accessor
                                                    ? row[col.accessor]
                                                    : null
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-600">
                        Showing {totalRecords === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} entries
                    </p>
                    {serverPagination && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Page {currentPage} of {totalPages}
                        </span>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="First Page"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        {/* Previous page */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Previous Page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* Page numbers */}
                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? 'bg-primary-500 text-white'
                                    : 'border hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        {/* Next page */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Next Page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        {/* Last page */}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Last Page"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(DataTable);
