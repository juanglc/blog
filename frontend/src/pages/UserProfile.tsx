import { useEffect, useState } from "react";
import { API_URL } from '../api/config.ts';
import '../App.css';
import './UserProfile.css';
import { CustomAlert } from '../components/alerts/Alerts.tsx';
import { useNavigate } from "react-router-dom";

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
    const [message, setMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [hasActiveRequest, setHasActiveRequest] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
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
                    if (res.status === 400) {
                        setHasActiveRequest(true);
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
        setMessage("");
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
                setShowAlert(true);
                setHasActiveRequest(true);
                setMessage(""); // Clear error message
            } else {
                setMessage(data.error || "Error sending request");
            }
        } catch {
            setMessage("Error sending request");
        }
    };

    const handleViewRequest = () => {
        alert("Redirect to request details page (not implemented yet).");
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>User not found</div>;

    const availableRoles = ROLES.filter(r => r !== user.rol);

    return (
        <div className="user-profile">
            {showAlert && (
                <CustomAlert
                    type="success"
                    message="Request sent successfully!"
                    show={showAlert}
                    onClose={() => setShowAlert(false)}
                />
            )}
            <h1>User Profile</h1>
            <ul>
                <li><strong>Name:</strong> {user.nombre}</li>
                <li><strong>Email:</strong> {user.correo}</li>
                <li><strong>Phone:</strong> {user.telefono || "N/A"}</li>
                <li><strong>Role:</strong> {user.rol}</li>
                <li><strong>Username:</strong> {user.username}</li>
            </ul>

            {hasActiveRequest ? (
                <div>
                    <p>You already have an active request.</p>
                    <button onClick={handleViewRequest}>
                        View My Request
                    </button>
                </div>
            ) : (
                <div>
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
                        <button type="submit" disabled={!desiredRole}>Send Request</button>
                    </form>
                </div>
            )}
            {message && <div className="message">{message}</div>}
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