// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config';
import './AdminDashboard.css';
import UserProfileBadge from '../../components/userInfo/UserProfileBadge';

interface User {
    _id: string;
    nombre: string;
    correo: string;
    telefono: string;
    rol: string;
    username: string;
    is_2fa_enabled?: boolean;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateStatus, setUpdateStatus] = useState<{userId: string, message: string, isError: boolean} | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is admin
        const checkAdminAccess = () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.rol !== 'admin') {
                navigate('/');
            }
        };

        checkAdminAccess();
        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load users');
            setLoading(false);
            console.error('Error fetching users:', err);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            setUpdateStatus(null);
            const token = localStorage.getItem('token');

            await axios.put(
                `${API_URL}/api/users/${userId}/`,
                { rol: newRole },
                { headers: { Authorization: `Bearer ${token}` }}
            );

            // Update local state
            setUsers(users.map(user => {
                if (user._id === userId) {
                    return { ...user, rol: newRole };
                }
                return user;
            }));

            setUpdateStatus({
                userId,
                message: `User role updated to ${newRole}`,
                isError: false
            });

            setTimeout(() => {
                setUpdateStatus(null);
            }, 3000);

        } catch (err) {
            console.error('Error updating user role:', err);
            setUpdateStatus({
                userId,
                message: 'Failed to update user role',
                isError: true
            });
        }
    };

    if (loading) return <div className="admin-loading">Loading users...</div>;
    if (error) return <div className="admin-error">{error}</div>;

    return (
        <div className="admin-dashboard">
            <UserProfileBadge />
            <h1>Admin Dashboard</h1>
            <div className="user-management-section">
                <h2>User Management</h2>
                <div className="user-list">
                    <table>
                        <thead>
                        <tr>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Current Role</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.username}</td>
                                <td>{user.nombre}</td>
                                <td>{user.correo}</td>
                                <td>{user.telefono}</td>
                                <td>{user.rol}</td>
                                <td className="role-actions">
                                    {updateStatus && updateStatus.userId === user._id && (
                                        <div className={`status-message ${updateStatus.isError ? 'error' : 'success'}`}>
                                            {updateStatus.message}
                                        </div>
                                    )}
                                    <button
                                        className={`role-button ${user.rol === 'lector' ? 'active' : ''}`}
                                        onClick={() => updateUserRole(user._id, 'lector')}
                                        disabled={user.rol === 'lector'}
                                    >
                                        Reader
                                    </button>
                                    <button
                                        className={`role-button ${user.rol === 'escritor' ? 'active' : ''}`}
                                        onClick={() => updateUserRole(user._id, 'escritor')}
                                        disabled={user.rol === 'escritor'}
                                    >
                                        Writer
                                    </button>
                                    <button
                                        className={`role-button ${user.rol === 'admin' ? 'active' : ''}`}
                                        onClick={() => updateUserRole(user._id, 'admin')}
                                        disabled={user.rol === 'admin'}
                                    >
                                        Admin
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;