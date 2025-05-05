import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../api/config.ts";
import { CustomAlert } from "../../components/alerts/Alerts.tsx";
import { Spinner } from '../Spinner.tsx';
import './MyArticles.css'
import '../../App.css';

type Article = {
    imagen_url: string;
    titulo: string;
    contenido_markdown: string;
    autor: string;
    autor_id?: string;
    fecha_creacion: string;
    descripcion: string;
    id: string;
    tags: Array<{
        _id: string;
        nombre: string;
    }>;
};

type PaginationData = {
    total: number;
    page: number;
    per_page: number;
    pages: number;
};

export default function MyArticles() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        per_page: 9,
        pages: 0
    });
    const navigate = useNavigate();
    const location = useLocation();
    const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);

    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;
    const userRole = user.rol;

    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        setLoading(true);

        if (!userId) {
            setError('Usuario no autenticado');
            setLoading(false);
            return;
        }

        // Add pagination parameters to the API request
        axios.get(`${API_URL}/api/articles/author/${userId}?page=${currentPage}&per_page=9`)
            .then(res => {
                setArticles(res.data.articles);
                setPagination(res.data.pagination);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching articles:', err);
                setError('Error al cargar tus artículos');
                setLoading(false);
            });
    }, [userId, currentPage]);

    useEffect(() => {
        if (location.state?.message) {
            setAlert({
                message: location.state.message,
                type: location.state.alertType || "info"
            });

            // Limpiar el state para evitar que se repita al recargar
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, location.pathname, navigate]);

    const handleCardClick = (id: string) => {
        navigate(`/articles/${id}`);
    };

    const handleTagClick = (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation(); // Prevent card click event
        navigate(`/articles/tag/${tagId}`);
    };

    const handleAuthorClick = (e: React.MouseEvent, author: string, authorId: string) => {
        e.stopPropagation(); // Prevent card click event
        navigate(`/articles/author/${authorId || author}`);
    };

    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const { page, pages } = pagination;

        pageNumbers.push(1);

        let startPage = Math.max(2, page - 1);
        let endPage = Math.min(pages - 1, page + 1);

        if (startPage > 2) {
            pageNumbers.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < pages - 1) {
            pageNumbers.push('...');
        }

        if (pages > 1) {
            pageNumbers.push(pages);
        }

        return pageNumbers;
    };

    if (loading) {
        return <div className="article-section">
            <h2 className="article-title-main">Mis Artículos</h2>
            <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                <Spinner size="medium" color="var(--primary-color)" />
            </div>
            <div className="article-grid skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="article-card loading-card">
                        <div className="article-image-placeholder"></div>
                        <div className="article-content">
                            <div className="skeleton-line title-line"></div>
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button className="back-button" onClick={() => navigate(-1)}>Volver</button>
            </div>
        );
    }

    return (
        <div className="article-section">
            {alert && (
                <div className="mt-2 mb-4 w-full">
                    <CustomAlert
                        type={alert.type as "info" | "success" | "warning" | "error"}
                        message={alert.message}
                        show={!!alert}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            <h2 className="article-title-main">Mis Artículos</h2>

            {articles.length === 0 ? (
                <div className="no-articles">
                    <p>No has publicado ningún artículo todavía.</p>
                    {(userRole === 'admin' || userRole === 'escritor') && (
                        <button
                            onClick={() => navigate('/articles/new', {
                                state: { validAccess: true }
                            })}
                            className="new-article-button"
                        >
                            Crear mi primer artículo
                        </button>
                    )}
                </div>
            ) : (
                <div className="article-grid">
                    {articles.map((article, index) => (
                        <div
                            key={index}
                            className="article-card"
                            onClick={() => handleCardClick(article.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={article.imagen_url.startsWith('http')
                                    ? article.imagen_url
                                    : `${API_URL}${article.imagen_url}`}
                                alt={article.titulo}
                                className="article-image"
                            />
                            <div className="article-content">
                                <h3 className="article-title">{article.titulo}</h3>
                                <p className="article-description">{article.descripcion}</p>
                                <div className="article-meta">
                                    <p>
                                        <strong>Autor:</strong>{' '}
                                        <button
                                            className="author-button"
                                            onClick={(e) => handleAuthorClick(e, article.autor, article.autor_id || '')}
                                        >
                                            {article.autor || 'Desconocido'}
                                        </button>
                                    </p>
                                    <p><strong>Fecha:</strong> {new Date(article.fecha_creacion).toLocaleDateString()}</p>
                                </div>
                                <div className="article-tags-small">
                                    {article.tags.map((tag) => (
                                        <button
                                            key={tag._id}
                                            className="tag-button"
                                            onClick={(e) => handleTagClick(e, tag._id)}
                                        >
                                            {tag.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="pagination-button"
                    >
                        &laquo; Previous
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                            <button
                                key={`page-${pageNum}`}
                                onClick={() => handlePageChange(Number(pageNum))}
                                className={`pagination-button ${pagination.page === pageNum ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        )
                    ))}

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="pagination-button"
                    >
                        Next &raquo;
                    </button>
                </div>
            )}

            <hr />
            <div className="action-buttons">
                <button onClick={() => navigate(-1)} className="back-button">
                    Volver
                </button>

                {(userRole === 'admin' || userRole === 'escritor') && (
                    <button
                        onClick={() => navigate('/articles/new', {
                            state: { validAccess: true }
                        })}
                        className="new-article-button"
                    >
                        New Article
                    </button>
                )}
            </div>
        </div>
    );
}