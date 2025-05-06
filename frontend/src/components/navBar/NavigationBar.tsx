import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavigationBar.css';
import '../../App.css';
import logo from '../../../logo/logo.png';

const NavigationBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const navbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.rol || '');

        // Close dropdown when navigating
        setActiveDropdown(null);
        setIsMenuOpen(false);
    }, [location.pathname]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // Close any open dropdown when toggling mobile menu
        setActiveDropdown(null);
    };

    const toggleDropdown = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="navbar" ref={navbarRef}>
            <div className="navbar-container">
                {/* Logo - Always visible */}
                <Link to="/articles" className="navbar-logo">
                    <img src={logo} className="navbar-logo-img" alt="GameBlog Logo" />
                    <span className="navbar-title">GameBlog</span>
                </Link>

                {/* Mobile menu button - Only visible on mobile */}
                <button
                    onClick={toggleMenu}
                    type="button"
                    className="mobile-menu-button"
                    aria-label="Toggle menu"
                >
                    <svg className="menu-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                    </svg>
                </button>

                {/* Navigation menu */}
                <div className={`navbar-menu ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav">
                        {userRole === 'admin' && (
                            <li className="nav-item">
                                <div className="dropdown">
                                    <button
                                        onClick={(e) => toggleDropdown(e, 'admin')}
                                        className={`nav-link dropdown-toggle ${activeDropdown === 'admin' ? 'active' : ''}`}
                                    >
                                        Admin
                                        <svg className={`dropdown-arrow ${activeDropdown === 'admin' ? 'rotate' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                                        </svg>
                                    </button>
                                    {activeDropdown === 'admin' && (
                                        <div className="dropdown-menu">
                                            <ul>
                                                <li>
                                                    <Link to="/admin/user-requests" className="dropdown-item">
                                                        User Requests
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/admin/article-requests" className="dropdown-item">
                                                        Article Requests
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </li>
                        )}

                        {/* Articles dropdown - Available for all roles */}
                        <li className="nav-item">
                            <div className="dropdown">
                                <button
                                    onClick={(e) => toggleDropdown(e, 'articles')}
                                    className={`nav-link dropdown-toggle ${activeDropdown === 'articles' ? 'active' : ''}`}
                                >
                                    Artículos
                                    <svg className={`dropdown-arrow ${activeDropdown === 'articles' ? 'rotate' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                                    </svg>
                                </button>
                                {activeDropdown === 'articles' && (
                                    <div className="dropdown-menu">
                                        <ul>
                                            <li>
                                                <Link to="/articles" className="dropdown-item">
                                                    Artículos
                                                </Link>
                                            </li>
                                            {(userRole === 'admin' || userRole === 'escritor') && (
                                                <>
                                                    <li>
                                                        <Link to="/my-articles" className="dropdown-item">
                                                            Mis Artículos
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link to="/articles/new" className="dropdown-item"
                                                              state={{ validAccess: true }}>
                                                            Artículo Nuevo
                                                        </Link>
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </li>

                        {/* Tags - Available for all roles */}
                        <li className="nav-item">
                            <Link to="/tags" className="nav-link">
                                Tags
                            </Link>
                        </li>

                        {/* Drafts - Only for admin and escritor */}
                        {(userRole === 'admin' || userRole === 'escritor') && (
                            <li className="nav-item">
                                <Link to="/drafts" className="nav-link">
                                    Borradores
                                </Link>
                            </li>
                        )}

                        {/* Requests dropdown */}
                        <li className="nav-item">
                            <div className="dropdown">
                                <button
                                    onClick={(e) => toggleDropdown(e, 'requests')}
                                    className={`nav-link dropdown-toggle ${activeDropdown === 'requests' ? 'active' : ''}`}
                                >
                                    Mis Requests
                                    <svg className={`dropdown-arrow ${activeDropdown === 'requests' ? 'rotate' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                                    </svg>
                                </button>
                                {activeDropdown === 'requests' && (
                                    <div className="dropdown-menu">
                                        <ul>
                                            <li>
                                                <Link to="/requests/user" className="dropdown-item">
                                                    User Requests
                                                </Link>
                                            </li>
                                            {(userRole === 'admin' || userRole === 'escritor') && (
                                                <li>
                                                    <Link to="/requests/articles" className="dropdown-item">
                                                        Article Requests
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </li>

                        {/* Profile dropdown */}
                        <li className="nav-item">
                            <div className="dropdown">
                                <button
                                    onClick={(e) => toggleDropdown(e, 'profile')}
                                    className={`nav-link dropdown-toggle ${activeDropdown === 'profile' ? 'active' : ''}`}
                                >
                                    Perfil
                                    <svg className={`dropdown-arrow ${activeDropdown === 'profile' ? 'rotate' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                                    </svg>
                                </button>
                                {activeDropdown === 'profile' && (
                                    <div className="dropdown-menu">
                                        <ul>
                                            <li>
                                                <Link to="/profile" className="dropdown-item">
                                                    Profile
                                                </Link>
                                            </li>
                                        </ul>
                                        <div className="dropdown-divider"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="dropdown-item logout"
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;