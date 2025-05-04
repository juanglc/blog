import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import './UserRequestPage.css';
import '../../App.css';
import UserProfileBadge from '../../components/userInfo/UserProfileBadge';
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

const UserRequestsPage = () => {
    const [requests, setRequests] = useState<UserRequest[]>([]);
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
            setAlert({ message: "You must be logged in to view your requests", type: "warning" });
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
                endpoint = `${API_URL}/api/requests/users/active/${userId}/`;
            } else if (filter === 'rejected') {
                endpoint = `${API_URL}/api/requests/users/denied/${userId}/`;
            } else { // approved
                endpoint = `${API_URL}/api/requests/users/approved/${userId}/`;
            }

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
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

    if (loading) {
        return (
            <div className="requests-page">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
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
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
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
            <div className={"user-wrapper"}>
                <UserProfileBadge />
            </div>
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