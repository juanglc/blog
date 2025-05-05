import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import './UserRequestPage.css';
import '../../App.css';
import { Spinner } from '../../components/Spinner.tsx';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';

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

const UserRequestsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'rejected' | 'approved'>('active');
    const [alert, setAlert] = useState<{ message: string, type: "success" | "error" | "info" | "warning" } | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        per_page: 9,
        pages: 0
    });
    const navigate = useNavigate();

    // Get userId from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    // Get current page from URL params or default to 1
    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        if (!userId) {
            setAlert({ message: "You must be logged in to view your requests", type: "warning" });
            navigate('/login');
            return;
        }

        fetchRequests();
    }, [filter, userId, navigate, currentPage]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build endpoint based on filter and include userId and pagination
            let endpoint;
            if (filter === 'active') {
                endpoint = `${API_URL}/api/requests/users/active/${userId}/?page=${currentPage}&per_page=9`;
            } else if (filter === 'rejected') {
                endpoint = `${API_URL}/api/requests/users/denied/${userId}/?page=${currentPage}&per_page=9`;
            } else { // approved
                endpoint = `${API_URL}/api/requests/users/approved/${userId}/?page=${currentPage}&per_page=9`;
            }

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
            setPagination(response.data.pagination);
            setLoading(false);
        } catch (err) {
            setError('Failed to load your requests');
            setLoading(false);
        }
    };

    const handleRequestClick = (requestId: string) => {
        navigate(`/requests/user/${requestId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
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
            <div className="requests-page">
                <h1>My Role Requests</h1>
                <div className="spinner-wrapper">
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="requests-page">
                <h1>My Role Requests</h1>
                <div className="error-container">
                    <p>{error}</p>
                    <button className="back-button" onClick={() => navigate('/')}>Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="requests-page">
            <h1>My Role Requests</h1>

            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="filter-buttons">
                <button
                    className={filter === 'active' ? 'filter-button active' : 'filter-button'}
                    onClick={() => {
                        setFilter('active');
                        setSearchParams({ page: '1' });
                    }}
                >
                    Pending
                </button>
                <button
                    className={filter === 'approved' ? 'filter-button active' : 'filter-button'}
                    onClick={() => {
                        setFilter('approved');
                        setSearchParams({ page: '1' });
                    }}
                >
                    Approved
                </button>
                <button
                    className={filter === 'rejected' ? 'filter-button active' : 'filter-button'}
                    onClick={() => {
                        setFilter('rejected');
                        setSearchParams({ page: '1' });
                    }}
                >
                    Rejected
                </button>
            </div>

            {requests.length === 0 ? (
                <div className="no-requests">
                    <p>You don't have any {filter} role requests.</p>
                </div>
            ) : (
                <div className="requests-table-container">
                    <table className="requests-table">
                        <thead>
                        <tr>
                            <th>Current Role</th>
                            <th>Requested Role</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {requests.map((request) => (
                            <tr key={request._id} onClick={() => handleRequestClick(request._id)} className="clickable-row">
                                <td>{request.rol_actual}</td>
                                <td>{request.rol_deseado}</td>
                                <td>
                                    <span className={`status-badge ${request.estado}`}>
                                        {request.estado}
                                    </span>
                                </td>
                                <td>{formatDate(request.fecha)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

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

            <hr />
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="back-button"
                >
                    Volver
                </button>
            </div>
        </div>
    );
};

export default UserRequestsPage;