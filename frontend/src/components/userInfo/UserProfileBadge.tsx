import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfileBadge.css';
import '../../App.css';

interface User {
    _id?: string;
    nombre?: string;
    username?: string;
}

const UserProfileBadge = () => {
    const [user, setUser] = useState<User | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) return null;

    const getInitials = () => {
        if (!user.nombre) return 'U';

        const nameParts = user.nombre.split(' ');
        if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleProfile = () => {
        setShowDropdown(false);
        navigate('/profile');
    };

    return (
        <div className="dropdown dropdown-bottom dropdown-end user-profile-badge" ref={dropdownRef}>
            <div
                tabIndex={0}
                role="button"
                className="user-profile-button"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <div className="avatar-circle">
                    <span className="initials">{getInitials()}</span>
                </div>
                <div className="user-info">
                    <span className="user-name">{user.nombre || 'Usuario'}</span>
                    <span className="user-username">@{user.username || 'username'}</span>
                </div>
            </div>
            {showDropdown && (
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                    <li>
                        <button className="profile-button" onClick={handleProfile}>
                            Profile
                        </button>
                    </li>
                    <li>
                        <button className="logout-button" onClick={handleLogout}>
                            Cerrar Sesión
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default UserProfileBadge;