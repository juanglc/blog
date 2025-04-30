import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/login/LoginPage';
import SignUp from './pages/signup/SignUp';
import ArticleCards from './components/articles/ArticleCards';
import ArticlePage from './pages/articles/ArticlePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import NewArticle from './pages/articles/NewArticle';
import UpdateArticle from "./pages/articles/UpdateArticle.tsx";

interface PrivateRouteProps {
    element: React.ReactNode;
    requiredRoles?: string[]; // Permitir múltiples roles
}

const PrivateRoute = ({ element, requiredRoles }: PrivateRouteProps) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Si no hay token, redirige a login
    if (!token) return <Navigate to="/login" replace />;

    // Si se especifican roles y el rol del usuario no está incluido, redirige
    if (requiredRoles && !requiredRoles.includes(user.rol)) {
        return <Navigate to="/articles" replace />;
    }

    return <>{element}</>;
};

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Admin routes */}
                <Route path="/admin" element={
                    <PrivateRoute element={<AdminDashboard />} requiredRoles={['admin']} />
                } />

                {/* Protected routes */}
                <Route path="/articles" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/:id" element={<PrivateRoute element={<ArticlePage />} />} />
                <Route path="/articles/tag/:tagId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/author/:authorId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/new" element={
                    <PrivateRoute element={<NewArticle />} requiredRoles={['admin', 'escritor']} />
                } />
                <Route path="/articles/update/:id" element={
                    <PrivateRoute element={<UpdateArticle />} requiredRoles={['admin', 'escritor']} />
                } />
                <Route path="/tags/:tagId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/authors/:authorId" element={<PrivateRoute element={<ArticleCards />} />} />

                {/* Redirect root to admin, articles, or login based on auth state and role */}
                <Route path="/" element={
                    (() => {
                        const token = localStorage.getItem('token');
                        if (!token) return <Navigate to="/login" replace />;

                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        if (user.rol === 'admin') return <Navigate to="/admin" replace />;
                        return <Navigate to="/articles" replace />;
                    })()
                } />

                {/* 404 - Similar logic as root route */}
                <Route path="*" element={
                    (() => {
                        const token = localStorage.getItem('token');
                        if (!token) return <Navigate to="/login" replace />;

                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        if (user.rol === 'admin') return <Navigate to="/admin" replace />;
                        return <Navigate to="/articles" replace />;
                    })()
                } />
            </Routes>
        </Router>
    );
}

export default App;