import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './PendingArticle.css';
import { API_URL } from '../../api/config';

type PendingArticle = {
    _id: string;
    titulo: string;
    descripcion: string;
    contenido_markdown: string;
    imagen_url: string;
    tags: Array<{
        _id: string;
        nombre: string;
        descripcion: string;
    }>;
    autor: string;
    fecha_creacion: string;
};

export default function PendingArticle() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [article, setArticle] = useState<PendingArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        const fetchArticle = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/pending_articles/${id}/`);
                setArticle(response.data);
            } catch (error) {
                console.error('Error fetching pending article:', error);
                setError('Failed to load pending article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    const handleBack = () => {
        const previousPath = location.state?.from || '/admin/article-requests';
        navigate(previousPath);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    if (!article) {
        return <p>Pending article not found.</p>;
    }

    return (
        <div className="pending-article-page">
            <h1>{article.titulo}</h1>
            <p>{article.descripcion}</p>
            <img
                src={article.imagen_url.startsWith('http')
                    ? article.imagen_url
                    : `${API_URL}${article.imagen_url}`}
                alt={article.titulo}
                className="pending-article-image"
            />
            <p><strong>Autor:</strong> {article.autor}</p>
            <p><strong>Fecha:</strong> {new Date(article.fecha_creacion).toLocaleDateString()}</p>
            <div className="pending-article-content">
                <ReactMarkdown>{article.contenido_markdown}</ReactMarkdown>
            </div>
            <div className="pending-article-tags">
                <h3>Tags:</h3>
                <div className="tags-container">
                    {article.tags?.map(tag => (
                        <span key={tag._id} className="tag-pill">
                            {tag.nombre}
                        </span>
                    ))}
                </div>
            </div>
            <hr />
            <button onClick={handleBack} className="back-button">
                Volver
            </button>
        </div>
    );
}