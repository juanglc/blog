import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './ArticlePage.css';
import API_URL from "../api/config";

type Article = {
    imagen_url: string;
    titulo: string;
    contenido_markdown: string;
    autor: string;
    autor_id?: string;
    fecha_creacion: string;
    descripcion: string;
    tags: Array<{
        nombre: string;
        descripcion: string;
    }>;
    fecha_actualizacion: string;
};

export default function ArticlePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add new states for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        const fetchArticle = async () => {
            try {
                const response = await fetch(`${API_URL}/api/articles/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch article');
                }
                const data = await response.json();
                setArticle(data);
            } catch (error) {
                console.error('Error fetching article:', error);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    // Handle delete confirmation modal
    const openDeleteModal = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setConfirmationText('');
    };

    // Handle input change but prevent pasting
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmationText(e.target.value);
    };

    // Prevent paste on the confirmation input
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        return false;
    };

    // Handle article deletion
    const handleDeleteArticle = async () => {
        if (!article || confirmationText !== article.titulo) {
            return;
        }

        setIsDeleting(true);

        try {
            await axios.delete(`${API_URL}/api/articles/${id}/delete/`);
            navigate('/articles', { state: { message: 'Artículo eliminado correctamente' } });
        } catch (error) {
            console.error('Error deleting article:', error);
            setError('Failed to delete article');
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    if (!article) {
        return <p>Article not found.</p>;
    }

    return (
        <div className="article-page">
            <h1>{article.titulo}</h1>
            <p>{article.descripcion}</p>
            <img
                src={article.imagen_url.startsWith('http')
                    ? article.imagen_url
                    : `${API_URL}${article.imagen_url.startsWith('/') ? '' : '/'}${article.imagen_url}`}
                alt={article.titulo}
                className="article-image"
            />
            <p>
                <strong>Autor:</strong>
                <button
                    className="author-button"
                    onClick={() => navigate(`/authors/${article.autor_id || article.autor}`)}
                >
                    {article.autor || 'Desconocido'}
                </button>
            </p>
            <p><strong>Fecha:</strong> {new Date(article.fecha_creacion).toLocaleDateString()}</p>

            {article.fecha_actualizacion && (
                <p><strong>Última actualización:</strong> {new Date(article.fecha_actualizacion).toLocaleDateString()}</p>
            )}
            <div className="article-content">
                <ReactMarkdown>{article.contenido_markdown}</ReactMarkdown>
            </div>
            <div className="article-tags">
                <h3>Tags:</h3>
                <div className="tags-container">
                    {article.tags.map((tag, index) => (
                        <button
                            key={index}
                            className="tag-button"
                            onClick={() => navigate(`/tags/${tag.nombre}`)}
                        >
                            {tag.nombre}
                        </button>
                    ))}
                </div>
            </div>
            <div className="article-actions" style={{ marginTop: '20px' }}>
                <button
                    onClick={() => navigate(`/articles/update/${id}`)}
                    className="update-button">
                    Update Article
                </button>
            </div>
            <hr/>
            <div className="article-actions">
                <button
                    onClick={openDeleteModal}
                    className="delete-button">
                    Eliminar Artículo
                </button>
            </div>
            <hr/>
            <div className="back-button-container">
                <button
                    onClick={() => navigate('/articles')}
                    className="back-button">
                    Volver
                </button>
            </div>

            {/* Delete Confirmation Modal */}
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
                            onChange={handleInputChange}
                            onPaste={handlePaste}
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