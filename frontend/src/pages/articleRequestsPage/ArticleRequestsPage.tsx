import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import '../../App.css';
import './ArticleRequestsPage.css';
import UserProfileBadge from '../../components/userInfo/UserProfileBadge';
import { Spinner } from '../../components/Spinner.tsx';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';

interface ArticleRequest {
    _id: string;
    autor_id: string;
    tipo: string;
    id_articulo_nuevo: string;
    id_articulo_original?: string;
    estado: string;
    fecha: string;
    articulo_nuevo?: {
        titulo: string;
        descripcion: string;
    };
    articulo_original?: {
        titulo: string;
    };
}

const ArticleRequestsPage = () => {
    const [requests, setRequests] = useState<ArticleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'rejected' | 'approved'>('active');
    const [alert, setAlert] = useState<{ message: string, type: "success" | "error" | "info" | "warning" } | null>(null);
    const navigate = useNavigate();

    // Get userId from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    useEffect(() => {
        if (!userId) {
            setAlert({ message: "You must be logged in to view your article requests", type: "warning" });
            navigate('/login');
            return;
        }

        fetchRequests();
    }, [filter, userId, navigate]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build endpoint based on filter and include userId
            let endpoint;
            if (filter === 'active') {
                endpoint = `${API_URL}/api/requests/articles/active/${userId}/`;
            } else if (filter === 'rejected') {
                endpoint = `${API_URL}/api/requests/articles/rejected/${userId}/`;
            } else { // approved
                endpoint = `${API_URL}/api/requests/articles/approved/${userId}/`;
            }

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching article requests:", err);
            setError('Failed to load your article requests');
            setLoading(false);
        }
    };

    const handleRequestClick = (requestId: string) => {
        navigate(`/requests/articles/${requestId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'nuevo':
                return 'New Article';
            case 'update':
                return 'Update';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="requests-page">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
                <h1>My Article Requests</h1>
                <div className="spinner-wrapper">
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="requests-page">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
                <h1>My Article Requests</h1>
                <div className="error-container">
                    <p>{error}</p>
                    <button className="back-button" onClick={() => navigate('/')}>Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="requests-page">
            <div className={"user-wrapper"}>
                <UserProfileBadge />
            </div>
            <h1>My Article Requests</h1>

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
                    onClick={() => setFilter('active')}
                >
                    Pending
                </button>
                <button
                    className={filter === 'approved' ? 'filter-button active' : 'filter-button'}
                    onClick={() => setFilter('approved')}
                >
                    Approved
                </button>
                <button
                    className={filter === 'rejected' ? 'filter-button active' : 'filter-button'}
                    onClick={() => setFilter('rejected')}
                >
                    Rejected
                </button>
            </div>

            {requests.length === 0 ? (
                <div className="no-requests">
                    <p>You don't have any {filter} article requests.</p>
                </div>
            ) : (
                <div className="requests-table-container">
                    <table className="requests-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            {filter === 'approved' && <th>Action</th>}
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {requests.map((request) => (
                            <tr key={request._id} onClick={() => handleRequestClick(request._id)} className="clickable-row">
                                <td>
                                    {request._id}
                                </td>
                                <td>{getRequestTypeLabel(request.tipo)}</td>
                                {filter === 'approved' && request?.tipo === 'nuevo' && (
                                    <td>
                                        <button
                                            className="view-article-button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                navigate(`/articles/${request.id_articulo_nuevo}`);
                                            }}
                                        >
                                            View Article
                                        </button>
                                    </td>
                                )}
                                {filter === 'approved' && request?.tipo === 'update' && (
                                    <td>
                                        <button
                                            className="view-article-button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                navigate(`/articles/${request.id_articulo_original}`);
                                            }}
                                        >
                                            View Article
                                        </button>
                                    </td>
                                )}
                                <td>
            <span className={`status-badge ${request.estado}`}>
                {request.estado === 'pendiente' ? 'pending' :
                    request.estado === 'aprobado' ? 'approved' :
                        request.estado === 'denegado' ? 'rejected' : request.estado}
            </span>
                                </td>
                                <td>{formatDate(request.fecha)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <hr />
            <div className="action-buttons">
                <button
                    onClick={() => navigate(-1)}
                    className="back-button"
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default ArticleRequestsPage;