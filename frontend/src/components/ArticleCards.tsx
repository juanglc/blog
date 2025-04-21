import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ArticleCards.css';
import '../pages/ArticlePage.css';
// src/api/config.js
import API_URL from '../api/config';

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
        nombre: string;
        descripcion: string;
    }>;
};

type PaginationData = {
    total: number;
    page: number;
    per_page: number;
    pages: number;
};

export default function ArticleCards() {
    const { tagId, authorId } = useParams<{ tagId?: string; authorId?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authorName, setAuthorName] = useState<string>('');
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        per_page: 9,
        pages: 0
    });
    const navigate = useNavigate();

    const isTagView = !!tagId;
    const isAuthorView = !!authorId;
    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        setLoading(true);

        let apiUrl = `${API_URL}api/articles/`;

        if (isTagView) {
            apiUrl = `${API_URL}api/articles/tag/${tagId}/`;
        } else if (isAuthorView) {
            apiUrl = `${API_URL}api/articles/author/${authorId}/`;
        }

        // Add pagination parameters
        apiUrl += `?page=${currentPage}&per_page=9`;

        axios.get(apiUrl)
            .then(res => {
                console.log("Articles data received:", res.data);
                setArticles(res.data.articles);
                setPagination(res.data.pagination);

                // Get the author name from the first article if it exists
                if (isAuthorView && res.data.articles.length > 0) {
                    setAuthorName(res.data.articles[0].autor || 'Desconocido');
                }

                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching articles:', err);
                setError('Failed to load articles');
                setLoading(false);
            });
    }, [tagId, authorId, isTagView, isAuthorView, currentPage]);


    const handleCardClick = (id: string) => {
        navigate(`/articles/${id}`);
    };

    const handleTagClick = (e: React.MouseEvent, tagName: string) => {
        e.stopPropagation(); // Prevent card click event
        navigate(`/tags/${tagName}`);
    };

    const handleAuthorClick = (e: React.MouseEvent, author: string, authorId: string) => {
        e.stopPropagation(); // Prevent card click event
        navigate(`/authors/${authorId || author}`);
    };

    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
    };

    // Generate an array of page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = [];
        const { page, pages } = pagination;

        // Always show first page
        pageNumbers.push(1);

        // Calculate range around current page
        let startPage = Math.max(2, page - 1);
        let endPage = Math.min(pages - 1, page + 1);

        // Add ellipsis after first page if needed
        if (startPage > 2) {
            pageNumbers.push('...');
        }

        // Add page numbers around current page
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        // Add ellipsis before last page if needed
        if (endPage < pages - 1) {
            pageNumbers.push('...');
        }

        // Add last page if there's more than one page
        if (pages > 1) {
            pageNumbers.push(pages);
        }

        return pageNumbers;
    };

    if (loading) {
        return <div className="loading">Loading articles...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button className="back-button" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    let pageTitle = "Artículos Recientes";
    if (isTagView) {
        pageTitle = `Artículos con tag: ${tagId}`;
    } else if (isAuthorView) {
        pageTitle = `Artículos de: ${authorName || 'Cargando...'}`;
    }

    return (
        <div className="article-section">
            <h2 className="article-title-main">{pageTitle}</h2>

            {articles.length === 0 ? (
                <p>No se encontraron artículos.</p>
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
                                    : `${API_URL}${article.imagen_url.startsWith('/') ? '' : '/'}${article.imagen_url}`}
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
                                            onClick={(e) => handleAuthorClick(e, article.autor, article.autor_id || "")}
                                        >
                                            {article.autor || 'Desconocido'}
                                        </button>
                                    </p>
                                    <p><strong>Fecha:</strong> {new Date(article.fecha_creacion).toLocaleDateString()}</p>
                                </div>
                                <div className="article-tags-small">
                                    {article.tags.map((tag, idx) => (
                                        <button
                                            key={idx}
                                            className="tag-button"
                                            onClick={(e) => handleTagClick(e, tag.nombre)}
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

            {/* Pagination controls */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="pagination-button"
                    >
                        &laquo; Anterior
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
                        Siguiente &raquo;
                    </button>
                </div>
            )}

            {(isTagView || isAuthorView) ? (
                <>
                    <div>
                        <button
                            onClick={() => navigate('/articles')}
                            className="new-article-button"
                            style={{ marginTop: '20px' }}
                        >
                            Volver a Artículos
                        </button>
                    </div>
                    <hr />
                    <div>
                        <button onClick={() => navigate(-1)} className="back-button">
                            Volver
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <hr />
                    <div className="new-button">
                        <button
                            onClick={() => navigate('/articles/new')}
                            className="new-article-button"
                        >
                            Nuevo Artículo
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}