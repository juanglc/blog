import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './ArticlePage.css';
import { API_URL } from "../../api/config.ts";
import { Spinner } from '../../components/Spinner.tsx';
import { CustomAlert } from "../../components/alerts/Alerts.tsx";
import '../../App.css';

type Article = {
    imagen_url: string;
    titulo: string;
    contenido_markdown: string;
    autor: string;
    autor_id?: string;
    fecha_creacion: string;
    descripcion: string;
    tags: Array<{
        _id: string;
        nombre: string;
        descripcion: string;
    }>;
    fecha_actualizacion: string;
};

type AlertType = "info" | "success" | "warning" | "error";

export default function ArticlePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ message: string, type: AlertType } | null>(null);

    // Add new states for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.rol;
    const userId = user._id;

    // Separate states for edit and delete permissions
    const [canEditArticle, setCanEditArticle] = useState(false);
    const [canDeleteArticle, setCanDeleteArticle] = useState(false);

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        const fetchArticle = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/articles/${id}`);
                const fetchedArticle = response.data;

                // Check edit permission - only author can edit (admin or writer)
                const hasEditPermission =
                    (userRole === 'admin' && userId === fetchedArticle.autor_id) ||
                    (userRole === 'escritor' && userId === fetchedArticle.autor_id);

                // Check delete permission - admins can delete any article, authors can delete their own
                const hasDeletePermission =
                    userRole === 'admin' ||
                    (userRole === 'escritor' && userId === fetchedArticle.autor_id);

                console.log("Permission check:", {
                    userRole,
                    userId,
                    authorId: fetchedArticle.autor_id,
                    hasEditPermission,
                    hasDeletePermission
                });

                setCanEditArticle(hasEditPermission);
                setCanDeleteArticle(hasDeletePermission);
                setArticle(fetchedArticle);
            } catch (err) {
                console.error('Error fetching article:', err);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id, userRole, userId]);

    useEffect(() => {
        if (location.state?.message) {
            setAlert({
                message: location.state.message,
                type: (location.state.alertType as AlertType) || "info"
            });

            // Clear state to prevent message repetition on reload
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, location.pathname, navigate]);

    const openDeleteModal = () => {
        setShowDeleteModal(true);
        // Focus on input field once modal is shown
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setConfirmationText('');
    };

    const handleDeleteArticle = async () => {
        if (!article || confirmationText !== article.titulo) {
            return;
        }

        setIsDeleting(true);

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/articles/${id}/delete/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/articles', {
                state: {
                    message: 'Artículo eliminado correctamente',
                    alertType: 'success'
                }
            });
        } catch (err) {
            console.error('Error deleting article:', err);
            setAlert({
                message: 'Failed to delete article',
                type: 'error'
            });
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    const handleTagClick = (tagId: string) => {
        navigate(`/tags?tagId=${tagId}`);
    };

    const handleAuthorClick = () => {
        navigate(`/articles/author/${article?.autor_id || article?.autor}`);
    };

    if (loading) {
        return (
            <div className="article-page">
                <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>

                <h1 className="skeleton-line title-line"></h1>
                <p className="skeleton-line description-line"></p>

                <div className="article-image-placeholder"></div>

                <div className="article-meta">
                    <div className="skeleton-line meta-line"></div>
                    <div className="skeleton-line meta-line"></div>
                </div>

                <div className="article-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line" style={{ width: '75%' }}></div>
                    <div className="skeleton-line" style={{ width: '90%' }}></div>
                    <div className="skeleton-line"></div>
                </div>

                <div className="article-tags">
                    <h3 className="skeleton-line" style={{ width: '30%' }}></h3>
                    <div className="tags-container">
                        <span className="skeleton-tag"></span>
                        <span className="skeleton-tag"></span>
                        <span className="skeleton-tag"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="article-page">
                <div className="error-container">
                    <p>{error}</p>
                    <button className="back-button" onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="article-page">
                <div className="error-container">
                    <p>Article not found.</p>
                    <button className="back-button" onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="article-page">
            {alert && (
                <div className="mt-2 mb-4 w-full">
                    <CustomAlert
                        type={alert.type}
                        message={alert.message}
                        show={!!alert}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            <h1>{article.titulo}</h1>
            <p className="article-description">{article.descripcion}</p>

            <img
                src={article.imagen_url.startsWith('http')
                    ? article.imagen_url
                    : `${API_URL}${article.imagen_url}`}
                alt={article.titulo}
                className="article-image"
            />

            <div className="article-meta">
                <p>
                    <strong>Autor:</strong>{' '}
                    <button
                        className="author-button"
                        onClick={handleAuthorClick}
                    >
                        {article.autor || 'Desconocido'}
                    </button>
                </p>
                <p><strong>Fecha:</strong> {new Date(article.fecha_creacion).toLocaleDateString()}</p>

                {article.fecha_actualizacion && (
                    <p><strong>Última actualización:</strong> {new Date(article.fecha_actualizacion).toLocaleDateString()}</p>
                )}
            </div>

            <div className="article-content">
                <ReactMarkdown>{article.contenido_markdown}</ReactMarkdown>
            </div>

            <div className="article-tags">
                <h3>Tags:</h3>
                <div className="tags-container">
                    {article.tags?.map(tag => (
                        <button
                            key={tag._id}
                            className="tag-button"
                            onClick={() => handleTagClick(tag._id)}
                        >
                            {tag.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditionally render buttons based on permission states */}
            {canEditArticle && (
                <div className="article-actions">
                    <hr/>
                    <button
                        onClick={() => navigate(`/articles/update/${id}`, {
                            state: { validAccess: true }
                        })}
                        className="update-button">
                        Update Article
                    </button>
                    <hr />
                </div>
            )}

            {canDeleteArticle && (
                <div className="article-actions">
                    <button
                        onClick={openDeleteModal}
                        className="delete-button">
                        Eliminar Artículo
                    </button>
                </div>
            )}

            <hr />

            <div className="navigation-buttons">
                <button
                    onClick={() => navigate(-1)}
                    className="back-button">
                    Volver
                </button>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>¿Estás seguro que quieres eliminar este artículo?</h3>
                        <p>Esta acción no se puede deshacer.</p>
                        <p>Escribe el título del artículo para confirmar:</p>
                        <p className="article-title-confirmation">{article.titulo}</p>

                        <input
                            ref={inputRef}
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            onPaste={(e) => e.preventDefault()}
                            placeholder="Escribe el título exacto"
                            className="confirmation-input"
                        />

                        <div className="modal-actions">
                            <button
                                onClick={handleDeleteArticle}
                                disabled={confirmationText !== article.titulo || isDeleting}
                                className={`delete-confirm-button ${confirmationText === article.titulo ? 'enabled' : ''}`}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                            <button onClick={closeDeleteModal} className="cancel-button">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}