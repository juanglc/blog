import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import { CustomAlert } from '../../../../components/alerts/Alerts.tsx';
import './UserRequestsDetails.css';
import '../../../../App.css';

const keyMapping: { [key: string]: string } = {
    _id: 'Request ID',
    id_usuario: 'User ID',
    usuario: 'User',
    rol_actual: 'Current Role',
    rol_deseado: 'Requested Role',
    estado: 'Status',
    fecha: 'Date',
};

const UserRequestDetails = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);// To this:
    const [alert, setAlert] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequestDetails();
    }, [requestId]);

    const fetchRequestDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/requests/users/${requestId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequest(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load request details');
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/requests/users/${requestId}/approve/`,
                {
                    autor_id: request.id_usuario,
                    rol_deseado: request.rol_deseado,
                },
                { headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` } }
            );
            setAlert({ type: "success", message: "Request approved successfully!" });
            setTimeout(() => navigate('/admin/user-requests'), 1500);
        } catch (err) {
            setAlert({ type: "error", message: "Error approving request." });
        }
    };

    const handleReject = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/requests/users/${requestId}/reject/`,
                {},
                { headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` } }
            );
            setAlert({ type: "success", message: "Request rejected successfully!" });
            setTimeout(() => navigate('/admin/user-requests'), 1500);
        } catch (err) {
            setAlert({ type: "error", message: "Error rejecting request." });
        }
    };

    if (loading) return <div className="loading">Loading request details...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user-request-details">
            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}
            <h1>User Request Details</h1>
            <div className="request-details">
                {Object.entries(request).map(([key, value]) => (
                    <div key={key} className="request-detail">
                        <strong>{keyMapping[key] || key}:</strong> {String(value)}
                    </div>
                ))}
            </div>
            <div className="action-buttons">
                <button
                    onClick={handleApprove}
                    disabled={request?.estado !== 'pendiente'}
                >
                    Approve
                </button>
                <button
                    className="reject-button"
                    onClick={handleReject}
                    disabled={request?.estado !== 'pendiente'}
                >
                    Reject
                </button>
            </div>
            <hr/>
            <button
                className="back-button"
                onClick={() => navigate('/admin/user-requests')}
            >
                Back to User Requests
            </button>
        </div>
    );
};

export default UserRequestDetails;