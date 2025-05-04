import { useEffect, useState } from "react";
import { API_URL } from '../api/config.ts';
import '../App.css';
import './UserProfile.css';
import '../components/alerts/Alerts.css';
import { CustomAlert } from '../components/alerts/Alerts.tsx';
import { useNavigate } from "react-router-dom";
import { Spinner } from '../components/Spinner.tsx';

const ROLES = ["lector", "escritor", "admin"];

interface User {
    _id: string;
    nombre: string;
    correo: string;
    telefono: string | null;
    rol: string;
    username: string;
}

export default function UserProfile() {
    const [user, setUser] = useState<User | null>(null);
    const [desiredRole, setDesiredRole] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [hasActiveRequest, setHasActiveRequest] = useState<boolean>(false);
    const [requestId, setRequestId] = useState<string>("");
    const [alert, setAlert] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetch(`${API_URL}/api/requests/users/check/${parsedUser._id}/`)
                .then(res => {
                    const status = res.status;
                    return res.json().then(data => ({ status, data }));
                })
                .then(({ status, data }) => {
                    if (status === 400) {
                        setHasActiveRequest(true);
                        setRequestId(data.request_id);
                    } else {
                        setHasActiveRequest(false);
                    }
                })
                .finally(() => setLoading(false));
        } catch {
            setUser(null);
            setLoading(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        const payload = {
            rol_actual: user.rol,
            rol_deseado: desiredRole,
        };
        try {
            const res = await fetch(`${API_URL}/api/requests/users/create/${user._id}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setAlert({ type: "success", message: "Request sent successfully!" });
                setHasActiveRequest(true);
            } else {
                setAlert({ type: "error", message: data.error || "Error sending request" });
            }
        } catch {
            setAlert({ type: "error", message: "Error sending request" });
        }
    };

    const handleViewRequest = () => {
        navigate(`/requests/user/${requestId}`);
    };

    if (loading) {
        return (
            <div className="user-profile">
                <h1 className="skeleton-line title-line"></h1>

                <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>

                <div className="profile-details">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line" style={{ width: '75%' }}></div>
                </div>

                <div className="role-request-section">
                    <div className="skeleton-line" style={{ width: '50%', marginBottom: '15px' }}></div>
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="user-profile error-container">User not found</div>;

    const availableRoles = ROLES.filter(r => r !== user.rol);

    return (
        <div className="user-profile">
            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}
            <h1>User Profile</h1>
            <ul className="profile-details">
                <li><strong>Name:</strong> {user.nombre}</li>
                <li><strong>Email:</strong> {user.correo}</li>
                <li><strong>Phone:</strong> {user.telefono || "N/A"}</li>
                <li><strong>Role:</strong> {user.rol}</li>
                <li><strong>Username:</strong> {user.username}</li>
            </ul>

            <div className="role-request-section">
                {hasActiveRequest ? (
                    <div className="active-request">
                        <p>You already have an active request.</p>
                        <button
                            onClick={handleViewRequest}
                            className="view-request-button"
                        >
                            View My Request
                        </button>
                    </div>
                ) : (
                    <div className="role-form">
                        <h3>Request Role Change</h3>
                        <form onSubmit={handleSubmit}>
                            <label>
                                Desired Role:
                                <select
                                    value={desiredRole}
                                    onChange={e => setDesiredRole(e.target.value)}
                                    required
                                >
                                    <option value="">Select a role</option>
                                    {availableRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="submit"
                                disabled={!desiredRole}
                                className="submit-button"
                            >
                                Send Request
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <hr/>
            <div className="action-buttons">
                <button className="back-button" onClick={() => navigate(-1)}>
                    Volver
                </button>
                <button
                    className="logout-button"
                    onClick={() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        navigate('/login');
                    }}
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}