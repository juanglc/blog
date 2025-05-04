import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ImageUploader from '../../components/ImageUploader.tsx';
import './NewArticle.css';
import { API_URL } from "../../api/config.ts";
import UserProfileBadge from "../../components/userInfo/UserProfileBadge.tsx";
import '../../App.css';
import { Spinner } from "../../components/Spinner.tsx";
import { CustomAlert } from "../../components/alerts/Alerts.tsx";

type Tag = {
    nombre: string;
    descripcion?: string;
    _id?: string;
};

type ArticleData = {
    imagen_url: string;
    titulo: string;
    contenido_markdown: string;
    autor: string;
    autor_id: string;
    fecha_creacion: string;
    descripcion: string;
    tags?: Tag[];
    fecha_actualizacion?: string;
};

type FormErrors = {
    titulo?: string;
    descripcion?: string;
    contenido_markdown?: string;
    imagen_url?: string;
    tags?: string;
};

export default function UpdateArticle() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | "info" | "warning" } | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Tags state
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    // Form data state
    const [formData, setFormData] = useState<ArticleData>({
        titulo: '',
        descripcion: '',
        contenido_markdown: '',
        imagen_url: '',
        autor: '',
        autor_id: '',
        fecha_creacion: '',
        tags: []
    });

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        // Step 1: Fetch only autor_id for authorization
        const checkAuthorization = async () => {
            try {
                addDebug(`Checking authorization for article ID: ${id}`);
                const res = await fetch(`${API_URL}/api/articles/get/author/${id}/`);
                if (!res.ok) throw new Error('Failed to fetch author');
                const { autor_id } = await res.json();

                if (userId && userId !== autor_id) {
                    navigate(`/articles`, {
                        state: {
                            message: "You are not authorized to edit this article.",
                            alertType: "warning"
                        }
                    });
                    return;
                }

                // Step 2: Fetch tags and article only if authorized
                fetchTagsAndArticle();
            } catch (error) {
                setError('Authorization check failed');
                setLoading(false);
            }
        };

        const fetchTagsAndArticle = async () => {
            try {
                // Fetch tags
                const tagsRes = await fetch(`${API_URL}/api/tags/`);
                if (!tagsRes.ok) throw new Error('Failed to fetch tags');
                const tagsData = await tagsRes.json();
                setAllTags(tagsData);

                // Fetch article
                addDebug(`Fetching article with ID: ${id}`);
                const articleRes = await fetch(`${API_URL}/api/articles/${id}`);
                if (!articleRes.ok) throw new Error('Failed to fetch article');
                const data = await articleRes.json();
                setArticle(data);

                // Initialize form with article data
                setFormData({
                    titulo: data.titulo || '',
                    descripcion: data.descripcion || '',
                    contenido_markdown: data.contenido_markdown || '',
                    imagen_url: data.imagen_url || '',
                    autor: data.autor || '',
                    autor_id: data.autor_id || '',
                    fecha_creacion: data.fecha_creacion || '',
                    fecha_actualizacion: data.fecha_actualizacion || '',
                    tags: data.tags || []
                });

                // Set selected tags
                if (data.tags && data.tags.length > 0) {
                    const articleTagNames = data.tags.map((tag: Tag) => tag.nombre);
                    const tagIds = tagsData
                        .filter((tag: Tag) => articleTagNames.includes(tag.nombre))
                        .map((tag: Tag) => tag._id as string);
                    setSelectedTags(tagIds);
                }
            } catch (error) {
                setError('Failed to load article or tags');
            } finally {
                setLoading(false);
            }
        };

        checkAuthorization();
    }, [id, userId, navigate]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleTagChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;

        if (checked) {
            setSelectedTags(prev => [...prev, value]);
            addDebug(`Added tag: ${value}`);
            if (formErrors.tags) {
                setFormErrors({ ...formErrors, tags: undefined });
            }
        } else {
            setSelectedTags(prev => prev.filter(tag => tag !== value));
            addDebug(`Removed tag: ${value}`);
        }
    };

    const insertMarkdown = (markdownSyntax: string) => {
        const textArea = document.getElementById('contenido_markdown') as HTMLTextAreaElement;
        if (!textArea) return;

        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = formData.contenido_markdown;

        let modifiedText = '';

        switch (markdownSyntax) {
            case 'bold':
                modifiedText = text.substring(0, start) + `**${text.substring(start, end) || 'texto en negrita'}**` + text.substring(end);
                break;
            case 'italic':
                modifiedText = text.substring(0, start) + `*${text.substring(start, end) || 'texto en cursiva'}*` + text.substring(end);
                break;
            case 'heading1':
                modifiedText = text.substring(0, start) + `# ${text.substring(start, end) || 'Título principal'}` + text.substring(end);
                break;
            case 'heading2':
                modifiedText = text.substring(0, start) + `## ${text.substring(start, end) || 'Subtítulo'}` + text.substring(end);
                break;
            case 'heading3':
                modifiedText = text.substring(0, start) + `### ${text.substring(start, end) || 'Encabezado nivel 3'}` + text.substring(end);
                break;
            case 'list':
                modifiedText = text.substring(0, start) + `\n- ${text.substring(start, end) || 'Item 1'}\n- Item 2\n- Item 3` + text.substring(end);
                break;
            case 'numberedList':
                modifiedText = text.substring(0, start) + `\n1. ${text.substring(start, end) || 'Item 1'}\n2. Item 2\n3. Item 3` + text.substring(end);
                break;
            case 'divider':
                modifiedText = text.substring(0, start) + `\n---\n` + text.substring(end);
                break;
            default:
                return;
        }

        setFormData(prev => ({ ...prev, contenido_markdown: modifiedText }));

        if (formErrors.contenido_markdown) {
            setFormErrors(prev => ({ ...prev, contenido_markdown: undefined }));
        }

        addDebug(`Inserted ${markdownSyntax} markdown syntax`);

        setTimeout(() => {
            textArea.focus();
            const newCursorPos = modifiedText.length;
            textArea.selectionStart = newCursorPos;
            textArea.selectionEnd = newCursorPos;
        }, 10);
    };

    const handleImageUrlUpdate = (url: string) => {
        setFormData(prev => ({ ...prev, imagen_url: url }));

        if (formErrors.imagen_url) {
            setFormErrors(prev => ({ ...prev, imagen_url: undefined }));
        }

        addDebug(`Image URL updated: ${url}`);
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!formData.titulo || formData.titulo.trim() === '') {
            errors.titulo = "Title is required";
            isValid = false;
        }
        if (!formData.descripcion || formData.descripcion.trim() === '') {
            errors.descripcion = "Description is required";
            isValid = false;
        }
        if (!formData.contenido_markdown || formData.contenido_markdown.trim() === '') {
            errors.contenido_markdown = "Content is required";
            isValid = false;
        }
        if (!formData.imagen_url) {
            errors.imagen_url = "Image is required";
            isValid = false;
        }
        if (selectedTags.length === 0) {
            errors.tags = "Select at least one tag";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!id) return;

        setError('');
        addDebug("Starting submission validation");

        if (!validateForm()) {
            addDebug("Form validation failed");
            setAlert({ message: "Please fill in all required fields", type: "error" });
            return;
        }

        setSubmitting(true);
        addDebug("Form validated, starting submission");

        try {
            const articleData = {
                titulo: formData.titulo,
                contenido_markdown: formData.contenido_markdown,
                imagen_url: formData.imagen_url,
                tags: selectedTags,
                descripcion: formData.descripcion,
            };

            addDebug(`Sending article data: ${JSON.stringify(articleData)}`);
            const response = await fetch(`${API_URL}/api/articles/${id}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData),
            });

            const result = await response.json();
            addDebug(`Response received: ${JSON.stringify(result)}`);

            if (response.ok) {
                setAlert({ message: "Article updated successfully!", type: "success" });
                navigate(`/articles/${id}`);
            } else {
                setAlert({ message: `Error: ${result.error || 'Unknown error'}`, type: "error" });
            }
        } catch (err) {
            console.error('Error updating article:', err);
            setError('Failed to update article');
            addDebug(`Error updating article: ${err}`);
        } finally {
            setSubmitting(false);
        }
    };

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    if (loading) {
        return <div className="article-page">
            <UserProfileBadge />
            <h1>Update Article</h1>
            <div className="spinner-wrapper" style={{ margin: "30px auto" }}>
                <Spinner size="large" color="var(--primary-color)" />
            </div>
            <div className="article-skeleton">
                <div className="skeleton-line title-line" style={{ height: "40px", width: "60%" }}></div>
                <div className="skeleton-line" style={{ width: "80%", marginBottom: "20px" }}></div>
                <div className="skeleton-line" style={{ width: "100%" }}></div>
                <div className="skeleton-line" style={{ width: "100%" }}></div>
            </div>
        </div>;
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
            <h1>Update Article</h1>

            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            <form onSubmit={handleSubmit}>
                <div className={`form-group ${formErrors.titulo ? 'has-error' : ''}`}>
                    <label htmlFor="titulo">Title <span className="required-field">*</span></label>
                    <input
                        type="text"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        className={formErrors.titulo ? 'error-input' : ''}
                    />
                    {formErrors.titulo && <div className="error-message">{formErrors.titulo}</div>}
                </div>

                <div className={`form-group ${formErrors.descripcion ? 'has-error' : ''}`}>
                    <label htmlFor="descripcion">Description <span className="required-field">*</span></label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={3}
                        maxLength={100}
                        style={{resize: 'none'}}
                        className={formErrors.descripcion ? 'error-input' : ''}
                    ></textarea>
                    {formErrors.descripcion && <div className="error-message">{formErrors.descripcion}</div>}
                </div>

                <div className={`form-group ${formErrors.imagen_url ? 'has-error' : ''}`}>
                    <label htmlFor="imagen_url">Image <span className="required-field">*</span></label>
                    <ImageUploader
                        onImageUploaded={handleImageUrlUpdate}
                        existingImageUrl={formData.imagen_url}
                        required={true}
                    />
                    {formData.imagen_url && (
                        <img
                            src={formData.imagen_url.startsWith('http')
                                ? formData.imagen_url
                                : `${API_URL}${formData.imagen_url}`}
                            alt="Preview"
                            className="image-preview"
                            style={{ maxWidth: '200px', marginTop: '10px' }}
                        />
                    )}
                    {formErrors.imagen_url && <div className="error-message">{formErrors.imagen_url}</div>}
                </div>

                <div className={`form-group ${formErrors.tags ? 'has-error' : ''}`}>
                    <label>Tags</label>
                    <div className="tags-container">
                        {allTags.map(tag => (
                            <div key={tag._id} className="tag-checkbox">
                                <input
                                    type="checkbox"
                                    id={`tag-${tag._id}`}
                                    value={tag._id as string}
                                    checked={selectedTags.includes(tag._id as string)}
                                    onChange={handleTagChange}
                                />
                                <label htmlFor={`tag-${tag._id}`}>{tag.nombre}</label>
                            </div>
                        ))}
                    </div>
                    {formErrors.tags && <div className="error-message">{formErrors.tags}</div>}
                </div>

                <div className={`form-group ${formErrors.contenido_markdown ? 'has-error' : ''}`}>
                    <label htmlFor="contenido_markdown">Content <span className="required-field">*</span></label>
                    <div className="markdown-toolbar">
                        <button type="button" onClick={() => insertMarkdown('bold')} title="Bold">
                            <strong>B</strong>
                        </button>
                        <button type="button" onClick={() => insertMarkdown('italic')} title="Italic">
                            <em>I</em>
                        </button>
                        <button type="button" onClick={() => insertMarkdown('heading1')} title="Header 1">
                            H1
                        </button>
                        <button type="button" onClick={() => insertMarkdown('heading2')} title="Header 2">
                            H2
                        </button>
                        <button type="button" onClick={() => insertMarkdown('heading3')} title="Header 3">
                            H3
                        </button>
                        <button type="button" onClick={() => insertMarkdown('list')} title="Bulleted List">
                            •
                        </button>
                        <button type="button" onClick={() => insertMarkdown('numberedList')} title="Numbered List">
                            1.
                        </button>
                        <button type="button" onClick={() => insertMarkdown('divider')} title="Horizontal Line">
                            —
                        </button>
                        <button type="button" onClick={togglePreview} className="preview-button" title="Toggle Preview">
                            {showPreview ? 'Edit' : 'Preview'}
                        </button>
                    </div>

                    {!showPreview ? (
                        <textarea
                            id="contenido_markdown"
                            name="contenido_markdown"
                            value={formData.contenido_markdown}
                            onChange={handleChange}
                            rows={12}
                            className={formErrors.contenido_markdown ? 'error-input' : ''}
                        ></textarea>
                    ) : (
                        <div className="preview article-content">
                            <ReactMarkdown>{formData.contenido_markdown}</ReactMarkdown>
                        </div>
                    )}
                    {formErrors.contenido_markdown && <div className="error-message">{formErrors.contenido_markdown}</div>}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="update-button"
                        disabled={submitting}
                    >
                        {submitting ? 'Updating...' : 'Update Article'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="cancel-button"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Debug Information */}
            <div className="debug-info">
                <h3>Debug Information</h3>
                <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {debugInfo.map((msg, i) => (
                        <div key={i}>{msg}</div>
                    ))}
                </pre>
            </div>
            <div>
                <button
                    onClick={() => navigate('/articles')}
                    className="new-article-button"
                    style={{ marginTop: '20px' }}
                >
                    Volver a Artículos
                </button>
            </div>
        </div>
    );
}