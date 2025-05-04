import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import './ArticleRequests.css';
import '../../../../App.css';
import UserProfileBadge from '../../../../components/userInfo/UserProfileBadge.tsx';
import { Spinner } from '../../../../components/Spinner.tsx';

interface ArticleRequest {
    _id: string;
    autor_id: string;
    autor: string;
    tipo: string;
    fecha: string;
}

const ArticleRequests = () => {
    const [requests, setRequests] = useState<ArticleRequest[]>([]);
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
                    ? `${API_URL}/api/requests/articles/active/`
                    : filter === 'rejected'
                        ? `${API_URL}/api/requests/articles/rejected/`
                        : `${API_URL}/api/requests/articles/approved/`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setRequests(response.data.requests || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to load article requests');
            setLoading(false);
            console.error('Error fetching article requests:', err);
        }
    };

    const handleRequestClick = (requestId: string) => {
        navigate(`/admin/article-requests/${requestId}`);
    };

    if (loading) {
        return (
            <div className="article-requests">
                <div className={"user-wrapper"}>
                    <UserProfileBadge />
                </div>
                <h1 className="skeleton-line title-line"></h1>

                <div className="filter-buttons">
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                    <div className="skeleton-line" style={{ width: '100px' }}></div>
                </div>

                <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>

                <table>
                    <thead>
                    <tr>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                        <th className="skeleton-line"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {[1, 2, 3, 4, 5].map((item) => (
                        <tr key={item}>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                            <td className="skeleton-line"></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (error) return <div className="error">{error}</div>;

    return (
        <div className="article-requests">
            <div className={"user-wrapper"}>
                <UserProfileBadge />
            </div>
            <h1>Article Requests</h1>
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
                    <th>Author ID</th>
                    <th>Author</th>
                    <th>Type</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {requests.map((request) => (
                    <tr key={request._id} onClick={() => handleRequestClick(request._id)}>
                        <td>{request._id}</td>
                        <td>{request.autor_id}</td>
                        <td>{request.autor}</td>
                        <td>{request.tipo}</td>
                        <td>{request.fecha}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ArticleRequests;