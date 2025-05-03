// frontend/src/pages/UpdateArticle.tsx
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ImageUploader from '../../components/ImageUploader.tsx';
import './ArticlePage.css';
import {API_URL} from "../../api/config.ts";
import UserProfileBadge from "../../components/userInfo/UserProfileBadge.tsx";

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
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Tags state
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Form data state
    const [formData, setFormData] = useState<ArticleData>({
        titulo: '',
        descripcion: '',
        contenido_markdown: '',
        imagen_url: '',
        autor: '',
        fecha_creacion: '',
        tags: []
    });

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    useEffect(() => {
        // Fetch all available tags
        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_URL}/api/tags/`);
                if (!response.ok) {
                    throw new Error('Failed to fetch tags');
                }
                const data = await response.json();
                addDebug(`Fetched ${data.length} tags`);
                setAllTags(data);
            } catch (error) {
                console.error('Error fetching tags:', error);
                addDebug(`Error fetching tags: ${error}`);
            }
        };

        fetchTags();
    }, []);

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        const fetchArticle = async () => {
            try {
                addDebug(`Fetching article with ID: ${id}`);
                const response = await fetch(`${API_URL}/api/articles/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch article');
                }
                const data = await response.json();
                addDebug(`Article data received: ${JSON.stringify(data)}`);
                setArticle(data);

                // Initialize form with article data
                setFormData({
                    titulo: data.titulo || '',
                    descripcion: data.descripcion || '',
                    contenido_markdown: data.contenido_markdown || '',
                    imagen_url: data.imagen_url || '',
                    autor: data.autor || '',
                    fecha_creacion: data.fecha_creacion || '',
                    fecha_actualizacion: data.fecha_actualizacion || '',
                });

                // Set selected tags based on article tags
                if (data.tags && data.tags.length > 0) {
                    // First, extract the tag names from the article tags
                    const articleTagNames = data.tags.map((tag: Tag) => tag.nombre);
                    addDebug(`Article has tags: ${articleTagNames.join(', ')}`);

                    // Then find the corresponding tag IDs from allTags
                    const tagIds = allTags
                        .filter(tag => articleTagNames.includes(tag.nombre))
                        .map(tag => tag._id as string);

                    addDebug(`Mapped to tag IDs: ${tagIds.join(', ')}`);
                    setSelectedTags(tagIds);
                }
            } catch (error) {
                console.error('Error fetching article:', error);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        if (allTags.length > 0) {
            fetchArticle();
        }
    }, [id, allTags]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
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
            case 'link':
                modifiedText = text.substring(0, start) + `[${text.substring(start, end) || 'texto del enlace'}](https://ejemplo.com)` + text.substring(end);
                break;
            case 'code':
                modifiedText = text.substring(0, start) + `\`\`\`\n${text.substring(start, end) || 'código'}\n\`\`\`` + text.substring(end);
                break;
            case 'blockquote':
                modifiedText = text.substring(0, start) + `> ${text.substring(start, end) || 'cita'}` + text.substring(end);
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

        setFormData(prev => ({...prev, contenido_markdown: modifiedText}));

        // Clear content error if it exists
        if (formErrors.contenido_markdown) {
            setFormErrors(prev => ({ ...prev, contenido_markdown: undefined }));
        }

        addDebug(`Inserted ${markdownSyntax} markdown syntax`);

        // Focus back on textarea after a short delay
        setTimeout(() => {
            textArea.focus();
            const newCursorPos = modifiedText.length;
            textArea.selectionStart = newCursorPos;
            textArea.selectionEnd = newCursorPos;
        }, 10);
    };

    const handleImageUrlUpdate = (url: string) => {
        setFormData(prev => ({...prev, imagen_url: url}));

        // Clear image error if it exists
        if (formErrors.imagen_url) {
            setFormErrors(prev => ({ ...prev, imagen_url: undefined }));
        }

        addDebug(`Image URL updated: ${url}`);
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        // Check title
        if (!formData.titulo || formData.titulo.trim() === '') {
            errors.titulo = "Title is required";
            isValid = false;
        }

        // Check description
        if (!formData.descripcion || formData.descripcion.trim() === '') {
            errors.descripcion = "Description is required";
            isValid = false;
        }

        // Check content
        if (!formData.contenido_markdown || formData.contenido_markdown.trim() === '') {
            errors.contenido_markdown = "Content is required";
            isValid = false;
        }

        // Check image
        if (!formData.imagen_url) {
            errors.imagen_url = "Image is required";
            isValid = false;
        }

        // Optional: validate tags
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
            setMessage({ text: "Please fill in all required fields", type: "error" });
            return;
        }

        setSubmitting(true);
        addDebug("Form validated, starting submission");

        try {
            const articleData = {
                titulo: formData.titulo,
                contenido_markdown: formData.contenido_markdown,
                imagen_url: formData.imagen_url,
                tags: selectedTags, // Send only the tag IDs
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
                setMessage({ text: "Article updated successfully!", type: "success" });
                navigate(`/articles/${id}`);
            } else {
                setMessage({ text: `Error: ${result.error || 'Unknown error'}`, type: "error" });
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
            <UserProfileBadge/>
            <h1>Update Article</h1>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
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
                        <button type="button" onClick={() => insertMarkdown('link')} title="Link">
                            🔗
                        </button>
                        <button type="button" onClick={() => insertMarkdown('code')} title="Code Block">
                            &lt;/&gt;
                        </button>
                        <button type="button" onClick={() => insertMarkdown('blockquote')} title="Quote">
                            💬
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
            <div className="debug-info" style={{ marginTop: '30px', padding: '10px', background: '#f8f9fa', border: '1px solid #ddd' }}>
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