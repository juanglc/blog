import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/login/LoginPage';
import SignUp from './pages/signup/SignUp';
import ArticleCards from './components/articles/ArticleCards';
import ArticlePage from './pages/articles/ArticlePage';
import NewArticle from './pages/articles/NewArticle';
import UpdateArticle from "./pages/articles/UpdateArticle.tsx";
import PendingArticle from './pages/admin/PendingArticle';
import DraftsList from './pages/drafts/DraftsList.tsx';
import MyArticles from './components/articles/MyArticles';

import ArticleRequests from './pages/admin/requests/articles/ArticleRequests.tsx';
import ArticleRequestDetails from './pages/admin/requests/articles/ArticleRequestsDetails.tsx';

import UserRequests from './pages/admin/requests/users/UserRequests.tsx';
import UserRequestsDetails from './pages/admin/requests/users/UserRequestsDetails.tsx';

import UserProfile from './pages/UserProfile.tsx';
import TagsList from './pages/tags/TagsList.tsx';
import UserRequestsPage from './pages/userRequestsPage/UserRequestPage.tsx';
import RequestDetails from './pages/userRequestsPage/Details.tsx';
import ArticleRequestsPage from './pages/articleRequestsPage/ArticleRequestsPage.tsx';
import ArticleDetails from './pages/articleRequestsPage/ArticleDetails.tsx';
import NavigationBar from './components/navBar/NavigationBar.tsx';

interface PrivateRouteProps {
    element: React.ReactNode;
    requiredRoles?: string[];
    requireUserId?: boolean;
    requireValidToken?: boolean;
}

const PrivateRoute = ({ element, requiredRoles, requireUserId, requireValidToken }: PrivateRouteProps) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    const location = useLocation();
    const validAccess = location.state?.validAccess === true;

    if (!token) return <Navigate to="/login" replace />;
    if (requiredRoles && !requiredRoles.includes(user.rol)) {
        return <Navigate to="/articles" replace />;
    }
    if (requireUserId && !userId) {
        return <Navigate to="/articles" replace />;
    }

    if (requireValidToken && !validAccess) {
        return <Navigate to="/articles" replace />;
    }

    return <>{element}</>;
};

// Component to conditionally render the NavigationBar
// Component to conditionally render the NavigationBar
const NavBarWrapper = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    useEffect(() => {
        if (isAuthPage) {
            document.body.classList.add('no-navbar');
        } else {
            document.body.classList.remove('no-navbar');
        }
    }, [isAuthPage]);

    return isAuthPage ? null : <NavigationBar />;
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
            <NavBarWrapper />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/admin/article-requests" element={
                    <PrivateRoute element={<ArticleRequests />} requiredRoles={['admin']} />
                } />
                <Route path="/admin/article-requests/:requestId" element={
                    <PrivateRoute element={<ArticleRequestDetails />} requiredRoles={['admin']} />
                } />
                <Route path="/pending-article/:id" element={
                    <PrivateRoute
                        element={<PendingArticle />}
                        requiredRoles={['admin', 'escritor']}
                        requireValidToken={true}
                    />
                } />
                <Route path="/admin/user-requests" element={
                    <PrivateRoute element={<UserRequests />} requiredRoles={['admin']} />
                } />
                <Route path="/admin/user-requests/:requestId" element={
                    <PrivateRoute element={<UserRequestsDetails />} requiredRoles={['admin']} />
                } />

                {/* User requests routes */}
                <Route path="/requests/user" element={
                    <PrivateRoute element={<UserRequestsPage />} requireUserId={true} />
                } />
                <Route path="/requests/user/:requestId" element={
                    <PrivateRoute element={<RequestDetails />} requireUserId={true} />
                } />

                {/* Article requests routes */}
                <Route path="/requests/articles" element={
                    <PrivateRoute element={<ArticleRequestsPage />} requireUserId={true} requiredRoles={['admin', 'escritor']}/>
                } />
                <Route path="/requests/articles/:requestId" element={
                    <PrivateRoute element={<ArticleDetails />} requireUserId={true} requiredRoles={['admin', 'escritor']}/>
                } />

                {/* Drafts route */}
                <Route path="/drafts" element={
                    <PrivateRoute element={<DraftsList />} requireUserId={true} requiredRoles={['admin', 'escritor']}/>
                } />

                {/* My Articles route */}
                <Route path="/my-articles" element={
                    <PrivateRoute element={<MyArticles />} requireUserId={true} />
                } />

                {/* Protected routes */}
                {/* Tags route */}
                <Route path="/tags" element={<PrivateRoute element={<TagsList />} />} />
                <Route path="/articles" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/:id" element={<PrivateRoute element={<ArticlePage />} />} />
                <Route path="/articles/tag/:tagId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/author/:authorId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/articles/new" element={
                    <PrivateRoute
                        element={<NewArticle />}
                        requiredRoles={['admin', 'escritor']}
                        requireValidToken={true}
                    />
                } />
                <Route path="/articles/update/:id" element={
                    <PrivateRoute
                        element={<UpdateArticle />}
                        requiredRoles={['admin', 'escritor']}
                        requireValidToken={true}
                    />
                } />
                <Route path="/tags/:tagId" element={<PrivateRoute element={<ArticleCards />} />} />
                <Route path="/authors/:authorId" element={<PrivateRoute element={<ArticleCards />} />} />

                {/* User profile route */}
                <Route path="/profile" element={
                    <PrivateRoute element={<UserProfile />} />
                } />

                {/* Redirect root to admin, articles, or login based on auth state and role */}
                <Route path="/" element={
                    (() => {
                        const token = localStorage.getItem('token');
                        if (!token) return <Navigate to="/login" replace />;
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