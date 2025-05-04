import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import './UserRequests.css';
import '../../../../App.css';

interface UserRequest {
    _id: string;
    id_usuario: string;
    usuario: string;
    rol_actual: string;
    rol_deseado: string;
    estado: string;
    fecha: string;
}

const UserRequests = () => {
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'rejected' | 'approved'>('active');
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint =
                filter === 'active'
                    ? `${API_URL}/api/requests/users/active/`
                    : filter === 'rejected'
                        ? `${API_URL}/api/requests/users/denied/`
                        : `${API_URL}/api/requests/users/approved/`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to load user requests');
            setLoading(false);
        }
    };

    const handleRequestClick = (requestId: string) => {
        navigate(`/admin/user-requests/${requestId}`);
    };

    if (loading) return <div className="loading">Loading user requests...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user-requests">
            <h1>User Requests</h1>
            <div className="filter-buttons">
                <button
                    className={filter === 'active' ? 'active' : ''}
                    onClick={() => setFilter('active')}
                >
                    Active
                </button>
                <button
                    className={filter === 'rejected' ? 'active' : ''}
                    onClick={() => setFilter('rejected')}
                >
                    Rejected
                </button>
                <button
                    className={filter === 'approved' ? 'active' : ''}
                    onClick={() => setFilter('approved')}
                >
                    Approved
                </button>
            </div>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>User ID</th>
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
                        <td>{request._id}</td>
                        <td>{request.id_usuario}</td>
                        <td>{request.usuario}</td>
                        <td>{request.rol_actual}</td>
                        <td>{request.rol_deseado}</td>
                        <td>{request.estado}</td>
                        <td>{request.fecha}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserRequests;