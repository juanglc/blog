// src/pages/admin/ArticleRequestDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import './ArticleRequestsDetails.css';
import UserProfileBadge from '../../../../components/userInfo/UserProfileBadge.tsx';
import '../../../../App.css';

const ArticleRequestDetails = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const keyMapping: { [key: string]: string } = {
        _id: 'Request ID',
        autor_id: 'Author ID',
        autor: 'Author',
        tipo: 'Type',
        id_articulo_nuevo: 'New Article ID',
        articulo_nuevo: 'New Article',
        estado: 'Status',
        fecha: 'Date',
    };

    useEffect(() => {
        fetchRequestDetails();
    }, [requestId]);

    const fetchRequestDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/requests/articles/${requestId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const requestData = response.data;

            // Si existe un id_articulo_nuevo, obtener los datos del pending_article
            if (requestData?.id_articulo_nuevo) {
                const pendingArticleResponse = await axios.get(
                    `${API_URL}/api/pending_articles/${requestData.id_articulo_nuevo}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                requestData.pending_article = pendingArticleResponse.data;
            }
            setRequest(requestData);
            setLoading(false);
        } catch (err) {
            setError('Failed to load request details');
            setLoading(false);
            console.error('Error fetching request details:', err);
        }
    };

    const handleViewOriginalArticle = () => {
        if (request?.pending_article?.id_articulo_original) {
            navigate(`/articles/${request.pending_article.id_articulo_original}`, {
                state: { fromAdmin: true }, // Pass state to indicate navigation from admin
            });
        }
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Request object:', request);

            if (!request?.pending_article) {
                console.error('Pending article data is missing.');
                return;
            }

            await axios.put(
                `${API_URL}/api/requests/articles/${requestId}/approve/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if(request.tipo === 'nuevo')
            {
                await axios.post(
                    `${API_URL}/api/articles/create/`,
                    request.pending_article,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }
            else
            {
                await axios.put(
                    `${API_URL}/api/articles/${request.pending_article.id_articulo_original}/update/`,
                    request.pending_article,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }
            await axios.put(
                `${API_URL}/api/pending_articles/delete/${request.pending_article._id}/`,
                { headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` } }
            );
            setTimeout(() => navigate('/admin/article-requests'), 1500);
            navigate('/admin/article-requests');
        } catch (err) {
            console.error('Error creating or updating article:', err);
        }
    };

    const handleReject = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/requests/articles/${requestId}/reject/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await axios.put(
                `${API_URL}/api/pending_articles/${request.pending_article._id}/to_draft/`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setTimeout(() => navigate('/admin/article-requests'), 1500);
            navigate('/admin/article-requests');
        } catch (err) {
            console.error('Error rejecting request:', err);
        }
    };

    if (loading) return <div className="loading">Loading request details...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="article-request-details">
            <div className={"user-wrapper"}>
                <UserProfileBadge/>
            </div>
            <h1>Request Details</h1>
            <div className="request-details">
                {Object.entries(request).map(([key, value]) => {
                    if (!value || key === 'pending_article') return null; // Exclude pending_article

                    const displayKey = keyMapping[key] || key; // Use mapped name or fallback to original key

                    return (
                        <div key={key} className="request-detail">
                            <strong>{displayKey}:</strong> {String(value)}
                        </div>
                    );
                })}
            </div>
            <hr/>
            {request?.id_articulo_nuevo && (
                <button
                    className="view-pending-article-button"
                    onClick={() => navigate(`/admin/pending-article/${request.id_articulo_nuevo}`)}
                >
                    View Pending Article
                </button>
            )}
            {request?.tipo === 'update' && request?.pending_article?.id_articulo_original && (
                <button
                    className="view-original-article-button"
                    onClick={handleViewOriginalArticle}
                >
                    View Original Article
                </button>
            )}
            <hr />
            <div className="action-buttons">
                <button
                    onClick={handleApprove}
                    disabled={request?.estado !== 'pendiente'}
                >
                    Approve
                </button>
                <button
                    className="reject-button"
                    onClick={handleReject}
                    disabled={request?.estado !== 'pendiente'}
                >
                    Reject
                </button>
            </div>
            <hr />
            <button
                className="back-button"
                onClick={() => navigate('/admin/article-requests')}
            >
                Back to Article Requests
            </button>
        </div>
    );
};

export default ArticleRequestDetails;