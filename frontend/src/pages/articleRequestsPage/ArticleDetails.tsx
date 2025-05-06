import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import './ArticleDetails.css';
import '../../App.css';

const keyMapping: { [key: string]: string } = {
    _id: 'Request ID',
    tipo: 'Request Type',
    estado: 'Status',
    fecha: 'Date',
    motivo_rechazo: 'Rejection Reason',
};

const ArticleRequestDetails = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
    const navigate = useNavigate();

    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }

        fetchRequestDetails();
    }, [requestId, userId, navigate]);

    const fetchRequestDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/requests/articles/${requestId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Verify the request belongs to the current user
            if (response.data.autor_id !== userId) {
                setError('You are not authorized to view this request');
                setLoading(false);
                return;
            }

            setRequest(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load article request details');
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this article request?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // First, cancel the article request
            await axios.put(
                `${API_URL}/api/requests/articles/${requestId}/cancel/`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Then, convert the pending article to draft
            if (request?.id_articulo_nuevo) {
                await axios.put(
                    `${API_URL}/api/pending_articles/${request.id_articulo_nuevo}/to_draft/`,
                    {},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                console.log('Pending article converted to draft successfully');
            }

            setAlert({ type: "success", message: "Article request cancelled successfully!" });
            setTimeout(() => navigate('/requests/articles'), 2000);
        } catch (err) {
            console.error("Error cancelling request:", err);
            setAlert({ type: "error", message: "Error cancelling article request." });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pendiente': return 'status-pending';
            case 'aprobado': return 'status-approved';
            case 'denegado': return 'status-rejected';
            default: return '';
        }
    };

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'nuevo': return 'New Article';
            case 'update': return 'Article Update';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="request-details-page">
                <div className="spinner-wrapper">
                    <Spinner size="large" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="request-details-page">
                <h1>Article Request Details</h1>
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={() => navigate('/requests/articles')} className="back-button">
                        Back to My Article Requests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="request-details-page">
            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            <h1>Article Request Details</h1>

            <div className="request-card">
                <div className="request-header">
                    <h2>
                        {getRequestTypeLabel(request.tipo)}
                    </h2>
                    <span className={`status-badge ${getStatusBadgeClass(request.estado)}`}>
                        {request.estado}
                    </span>
                </div>

                <div className="request-info">
                    {Object.entries(request).map(([key, value]) => {
                        // Skip displaying certain fields
                        if (
                            !keyMapping[key] ||
                            key === 'autor_id' ||
                            key === 'articulo_nuevo' ||
                            key === 'articulo_original'
                        ) return null;

                        if (key === 'motivo_rechazo' && !value) return null;

                        return (
                            <div key={key} className="info-item">
                                <span className="info-label">{keyMapping[key]}:</span>
                                <span className="info-value">
                                    {key === 'fecha' ? formatDate(value as string) :
                                        key === 'tipo' ? getRequestTypeLabel(value as string) :
                                            String(value)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <hr/>
                {/* For pending or rejected requests, show the pending article button */}
                {request?.id_articulo_nuevo && (request?.estado === 'pendiente' || request?.estado === 'denegado') && (
                    <button
                        className="view-pending-article-button"
                        onClick={() => navigate(`/pending-article/${request.id_articulo_nuevo}`, {
                            state: { validAccess: true }
                        })}
                    >
                        View Pending Article
                    </button>
                )}

                {/* For approved requests, show the approved article button */}
                {request?.id_articulo_nuevo && request?.estado === 'aprobado' && (
                    <button
                        className="view-article-button"
                        onClick={() => navigate(`/articles/${request.id_articulo_nuevo}`)}
                    >
                        View Approved Article
                    </button>
                )}

                {/* For update requests, show the original article button */}
                {request?.tipo === 'update' && request?.id_articulo_original && (
                    <button
                        className="view-original-article-button"
                        onClick={() => navigate(`/articles/${request.id_articulo_original}`)}
                    >
                        View Original Article
                    </button>
                )}

                {request.estado === 'pendiente' && (
                    <div className="action-buttons">
                        <button
                            className="cancel-button"
                            onClick={handleCancel}
                        >
                            Cancel Request
                        </button>
                    </div>
                )}
            </div>

            <div className="navigation-buttons">
                <button
                    className="back-button"
                    onClick={() => navigate('/requests/articles')}
                >
                    Back to My Requests
                </button>
            </div>
        </div>
    );
};

export default ArticleRequestDetails;