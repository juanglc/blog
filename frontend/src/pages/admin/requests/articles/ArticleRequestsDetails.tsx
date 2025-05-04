import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../api/config.ts';
import './ArticleRequestsDetails.css';
import UserProfileBadge from '../../../../components/userInfo/UserProfileBadge.tsx';
import { Spinner } from '../../../../components/Spinner.tsx';
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

            // Check if this is an approved request
            if (requestData?.id_articulo_nuevo && requestData?.estado === 'aprobado') {
                // For approved requests, fetch from articles endpoint
                try {
                    const articleResponse = await axios.get(
                        `${API_URL}/api/articles/${requestData.id_articulo_nuevo}/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    requestData.pending_article = articleResponse.data;
                } catch (articleErr) {
                    console.error('Error fetching approved article:', articleErr);
                }
            }
            // If not approved, try to fetch from pending_articles
            else if (requestData?.id_articulo_nuevo) {
                try {
                    const pendingArticleResponse = await axios.get(
                        `${API_URL}/api/pending_articles/${requestData.id_articulo_nuevo}/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    requestData.pending_article = pendingArticleResponse.data;
                } catch (pendingErr) {
                    console.error('Error fetching pending article:', pendingErr);
                }
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
                {
                    pending_article_id: request.pending_article._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if(request.tipo === 'nuevo') {
                const articleResponse = await axios.post(
                    `${API_URL}/api/articles/create/`,
                    request.pending_article,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log('Article creation response:', articleResponse.data);

                // The ID is returned in the 'id' field
                const newArticleId = articleResponse.data.id;

                if (!newArticleId) {
                    console.error('Could not get new article ID from response:', articleResponse.data);
                    throw new Error('Missing article ID in response');
                }

                // Update the article request with the new ID - fixed according to backend expectations
                await axios.put(
                    `${API_URL}/api/requests/articles/${requestId}/set_new_id/`,
                    { new_id: newArticleId },  // Changed from id_articulo to new_id to match backend
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } else {
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

            await axios.delete(
                `${API_URL}/api/pending_articles/${request.pending_article._id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            navigate('/admin/article-requests');
        } catch (err) {
            console.error('Error creating or updating article:', err);
            setError('Failed to approve the article request.');
        }
    };

    const handleReject = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/requests/articles/${requestId}/reject/`,
                {
                    pending_article_id: request.pending_article._id
                },
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

    if (loading) {
        return (
            <div className="article-request-details">
                <h1 className="skeleton-line title-line"></h1>

                <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>

                <div className="request-details">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line" style={{ width: '75%' }}></div>
                </div>

                <div className="action-buttons">
                    <div className="skeleton-line" style={{ width: '50%', marginBottom: '15px' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                </div>
            </div>
        );
    }

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
            {/* For pending or rejected requests, show the pending article button */}
            {request?.id_articulo_nuevo && (request?.estado === 'pendiente' || request?.estado === 'denegado') && (
                <button
                    className="view-pending-article-button"
                    onClick={() => navigate(`/admin/pending-article/${request.id_articulo_nuevo}`)}
                >
                    View Pending Article
                </button>
            )}

            {/* For approved requests, show the approved article button */}
            {request?.id_articulo_nuevo && request?.estado === 'aprobado' && (
                <button
                    className="view-article-button"
                    onClick={() => navigate(`/articles/${request.id_articulo_nuevo}`)}
                >
                    View Approved Article
                </button>
            )}

            {/* For update requests, show the original article button */}
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