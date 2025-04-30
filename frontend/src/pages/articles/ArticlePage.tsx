import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './ArticlePage.css';
import {API_URL} from "../../api/config.ts";
import UserProfileBadge from "../../components/userInfo/UserProfileBadge";

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

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.rol;

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

    const openDeleteModal = () => {
        setShowDeleteModal(true);
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
            <UserProfileBadge />
            <h1>{article.titulo}</h1>
            <p>{article.descripcion}</p>
            <img
                src={article.imagen_url.startsWith('http')
                    ? article.imagen_url
                    : `${API_URL}${article.imagen_url}`}
                alt={article.titulo}
                className="article-image"
            />
            <p>
                <strong>Autor:</strong>
                <button
                    className="author-button"
                    onClick={() => navigate(`/articles/author/${article.autor_id || article.autor}`)}
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
                    {article.tags?.map(tag => (
                        <button
                            key={tag._id}
                            className="tag-button"
                            onClick={() => navigate(`/articles/tag/${tag._id}`)} // Navigate using tag ID
                        >
                            {tag.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditionally render buttons for admin or escritor */}
            {(userRole === 'admin' || userRole === 'escritor') && (
                <div className="article-actions" style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => navigate(`/articles/update/${id}`)}
                        className="update-button">
                        Update Article
                    </button>
                    <hr/>
                    <button
                        onClick={openDeleteModal}
                        className="delete-button">
                        Eliminar Artículo
                    </button>
                </div>
            )}
            <hr/>
            <div className="back-button-container">
                <button
                    onClick={() => navigate('/articles')}
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