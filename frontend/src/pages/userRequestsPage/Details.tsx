import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';
import UserProfileBadge from '../../components/userInfo/UserProfileBadge.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import './Details.css';
import '../../App.css';

const keyMapping: { [key: string]: string } = {
    _id: 'Request ID',
    usuario: 'Username',
    rol_actual: 'Current Role',
    rol_deseado: 'Requested Role',
    estado: 'Status',
    fecha: 'Date',
    motivo: 'Reason',
};

const RequestDetails = () => {
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
            const response = await axios.get(`${API_URL}/api/requests/users/${requestId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Verify the request belongs to the current user
            if (response.data.id_usuario !== userId) {
                setError('You are not authorized to view this request');
                setLoading(false);
                return;
            }

            setRequest(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load request details');
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/requests/users/${requestId}/cancel/`,
                {},
                { headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }}
            );
            setAlert({ type: "success", message: "Request cancelled successfully!" });
            setTimeout(() => navigate('/requests/user'), 4000);
        } catch (err) {
            setAlert({ type: "error", message: "Error cancelling request." });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pendiente': return 'status-pending';
            case 'aprobada': return 'status-approved';
            case 'rechazada': return 'status-rejected';
            case 'cancelada': return 'status-cancelled';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="request-details-page">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
                <div className="spinner-wrapper">
                    <Spinner size="large" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="request-details-page">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
                <h1>Request Details</h1>
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={() => navigate('/requests')} className="back-button">
                        Back to My Requests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="request-details-page">
            <div className={"user-wrapper"}>
                <UserProfileBadge />
            </div>
            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            <h1>Request Details</h1>

            <div className="request-card">
                <div className="request-header">
                    <h2>Role Change Request</h2>
                    <span className={`status-badge ${getStatusBadgeClass(request.estado)}`}>
                        {request.estado}
                    </span>
                </div>

                <div className="request-info">
                    {Object.entries(request).map(([key, value]) => {
                        // Skip displaying internal fields
                        if (!keyMapping[key] || key === 'id_usuario') return null;

                        return (
                            <div key={key} className="info-item">
                                <span className="info-label">{keyMapping[key]}:</span>
                                <span className="info-value">
                                    {key === 'fecha' ? formatDate(value as string) : String(value)}
                                </span>
                            </div>
                        );
                    })}
                </div>

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
                    onClick={() => navigate(-1)}
                >
                    Volver
                </button>
            </div>
        </div>
    );
};

export default RequestDetails;