// frontend/src/components/tags/TagsList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/config.ts';
import { Spinner } from '../../components/Spinner.tsx';
import './TagsList.css';
import '../../App.css';

interface Tag {
    _id: string;
    nombre: string;
    descripcion: string;
}

interface Article {
    id: string;
    titulo: string;
    descripcion: string;
    imagen_url: string;
    autor: string;
    autor_id: string;
    fecha_creacion: string;
    tags: Tag[];
}

interface PaginationData {
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export default function TagsList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedTagName, setSelectedTagName] = useState<string>('');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        per_page: 9,
        pages: 0
    });

    const navigate = useNavigate();

    // Get current page from URL params or default to 1
    const currentPage = parseInt(searchParams.get('page') || '1');

    // Get tagId from URL params if available
    const tagIdFromUrl = searchParams.get('tagId');

    useEffect(() => {
        fetchTags();
    }, []);

    useEffect(() => {
        if (tagIdFromUrl && tagIdFromUrl !== selectedTag) {
            setSelectedTag(tagIdFromUrl);
            fetchArticlesByTag(tagIdFromUrl, currentPage);
        }
    }, [tagIdFromUrl, currentPage]);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/tags/`);
            const fetchedTags = response.data || [];
            setTags(fetchedTags);

            // If tagIdFromUrl exists, fetch articles for that tag
            if (tagIdFromUrl) {
                setSelectedTag(tagIdFromUrl);
                // Find tag name for the selected tag
                const tag = fetchedTags.find((t: Tag) => t._id === tagIdFromUrl);
                if (tag) {
                    setSelectedTagName(tag.nombre);
                } else {
                    // If tag not found in the list, fetch it separately
                    try {
                        const tagResponse = await axios.get(`${API_URL}/api/tags/${tagIdFromUrl}`);
                        setSelectedTagName(tagResponse.data.nombre);
                    } catch (err) {
                        console.error('Error fetching tag details:', err);
                        setSelectedTagName('Tag');
                    }
                }
                fetchArticlesByTag(tagIdFromUrl, currentPage);
            }
            // If no tag is selected, find and select the RPG tag by default
            else {
                const rpgTag = fetchedTags.find((tag: Tag) => tag.nombre.toLowerCase() === 'rpg');
                if (rpgTag) {
                    setSelectedTag(rpgTag._id);
                    setSelectedTagName(rpgTag.nombre);
                    setSearchParams({ tagId: rpgTag._id, page: '1' });
                    fetchArticlesByTag(rpgTag._id, 1);
                }
            }
        } catch (err: any) {
            console.error('Error fetching tags:', err);
            setError(err.message || 'Failed to fetch tags');
        } finally {
            setLoading(false);
        }
    };

    const fetchArticlesByTag = async (tagId: string, page: number) => {
        try {
            setArticlesLoading(true);
            const response = await axios.get(`${API_URL}/api/articles/tag/${tagId}/?page=${page}&per_page=9`);
            setArticles(response.data.articles || []);
            setPagination(response.data.pagination);

            // Find tag name for the selected tag if it's not set already
            if (!selectedTagName) {
                const tag = tags.find(t => t._id === tagId);
                if (tag) {
                    setSelectedTagName(tag.nombre);
                } else {
                    // If tag is not found in the current tags list, fetch it individually
                    try {
                        const tagResponse = await axios.get(`${API_URL}/api/tags/${tagId}`);
                        if (tagResponse.data && tagResponse.data.nombre) {
                            setSelectedTagName(tagResponse.data.nombre);
                        }
                    } catch (err) {
                        console.error('Error fetching tag name:', err);
                    }
                }
            }
        } catch (err: any) {
            console.error('Error fetching articles by tag:', err);
            setError(err.message || 'Failed to fetch articles');
        } finally {
            setArticlesLoading(false);
        }
    };

    const handleTagClick = (tagId: string) => {
        setSelectedTag(tagId);
        setSearchParams({ tagId, page: '1' });

        // Update the tag name immediately when a tag is clicked
        const tag = tags.find(t => t._id === tagId);
        if (tag) {
            setSelectedTagName(tag.nombre);
        }

        // Then fetch articles for the new tag
        setArticlesLoading(true);
        fetchArticlesByTag(tagId, 1);
    };

    const handleArticleClick = (articleId: string) => {
        navigate(`/articles/${articleId}`);
    };

    const handlePageChange = (page: number) => {
        if (selectedTag) {
            setSearchParams({ tagId: selectedTag, page: page.toString() });
            fetchArticlesByTag(selectedTag, page);
        } else {
            setSearchParams({ page: page.toString() });
        }
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
        return (
            <div className="tags-list-page">
                <h1>Tags</h1>
                <div className="spinner-wrapper" style={{ margin: "20px auto" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tags-list-page">
                <h1>Tags</h1>
                <div className="error-container">{error}</div>
            </div>
        );
    }

    return (
        <div className="tags-list-page">
            <h1>Tags</h1>

            <div className="tags-filter-buttons">
                {tags.map((tag) => (
                    <button
                        key={tag._id}
                        className={selectedTag === tag._id ? 'active' : ''}
                        onClick={() => handleTagClick(tag._id)}
                    >
                        {tag.nombre}
                    </button>
                ))}
            </div>

            {selectedTag && (
                <>
                    {!articlesLoading && (
                        <h2>Articles tagged with "{selectedTagName}"</h2>
                    )}

                    {articlesLoading ? (
                        <div className="spinner-wrapper" style={{ margin: "20px auto" }}>
                            <Spinner size="medium" color="var(--primary-color)" />
                        </div>
                    ) : articles.length === 0 ? (
                        <p>No articles found with this tag.</p>
                    ) : (
                        <div className="article-grid">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="article-card"
                                    onClick={() => handleArticleClick(article.id)}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/articles/author/${article.autor_id || article.autor}`);
                                                    }}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/tags?tagId=${tag._id}`);
                                                    }}
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
                </>
            )}
        </div>
    );
}