import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import './UserRequests.css';
import '../../../../App.css';
import { Spinner } from '../../../../components/Spinner.tsx';

interface UserRequest {
    _id: string;
    id_usuario: string;
    usuario: string;
    rol_actual: string;
    rol_deseado: string;
    estado: string;
    fecha: string;
}

interface PaginationData {
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

const UserRequests = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'rejected' | 'approved'>('active');
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        per_page: 9,
        pages: 0
    });
    const navigate = useNavigate();

    // Get current page from URL params or default to 1
    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        fetchRequests();
    }, [filter, currentPage]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint =
                filter === 'active'
                    ? `${API_URL}/api/requests/users/active/?page=${currentPage}&per_page=9`
                    : filter === 'rejected'
                        ? `${API_URL}/api/requests/users/denied/?page=${currentPage}&per_page=9`
                        : `${API_URL}/api/requests/users/approved/?page=${currentPage}&per_page=9`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
            setPagination(response.data.pagination);
            setLoading(false);
        } catch (err) {
            setError('Failed to load user requests');
            setLoading(false);
        }
    };

    const handleRequestClick = (requestId: string) => {
        navigate(`/admin/user-requests/${requestId}`);
    };

    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
    };

    const handleFilterChange = (newFilter: 'active' | 'rejected' | 'approved') => {
        setFilter(newFilter);
        setSearchParams({ page: '1' });
    };

    // Format date to dd-mm-yyyy hh:mm
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const { page, pages } = pagination;

        pageNumbers.push(1);

        let startPage = Math.max(2, page - 1);
        let endPage = Math.min(pages - 1, page + 1);

        if (startPage > 2) {
            pageNumbers.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < pages - 1) {
            pageNumbers.push('...');
        }

        if (pages > 1) {
            pageNumbers.push(pages);
        }

        return pageNumbers;
    };

    if (loading) {
        return (
            <div className="user-requests">
                <h1 className="skeleton-line title-line"></h1>

                <div className="filter-buttons">
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                </div>

                <div className="spinner-wrapper" style={{ marginBottom: "20px", display: "flex", justifyContent: "center", padding: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>

                <table>
                    <thead>
                    <tr>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {[1, 2, 3, 4, 5].map((item) => (
                        <tr key={item}>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user-requests">
            <h1>User Requests</h1>
            <div className="filter-buttons">
                <button
                    className={filter === 'active' ? 'active' : ''}
                    onClick={() => handleFilterChange('active')}
                >
                    Active
                </button>
                <button
                    className={filter === 'rejected' ? 'active' : ''}
                    onClick={() => handleFilterChange('rejected')}
                >
                    Rejected
                </button>
                <button
                    className={filter === 'approved' ? 'active' : ''}
                    onClick={() => handleFilterChange('approved')}
                >
                    Approved
                </button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Current Role</th>
                        <th>Requested Role</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {requests.map((request) => (
                        <tr key={request._id} onClick={() => handleRequestClick(request._id)}>
                            <td data-label="ID">{request._id}</td>
                            <td data-label="User">{request.id_usuario}</td>
                            <td data-label="Current Role">{request.rol_actual}</td>
                            <td data-label="Requested Role">{request.rol_deseado}</td>
                            <td data-label="Status">{request.estado}</td>
                            <td data-label="Date">{formatDate(request.fecha)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="pagination-button"
                    >
                        &laquo; Previous
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                            <button
                                key={`page-${pageNum}`}
                                onClick={() => handlePageChange(Number(pageNum))}
                                className={`pagination-button ${pagination.page === pageNum ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        )
                    ))}

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="pagination-button"
                    >
                        Next &raquo;
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserRequests;