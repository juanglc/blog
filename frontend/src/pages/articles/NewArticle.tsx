import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ImageUploader from '../../components/ImageUploader.tsx';
import './ArticlePage.css';
import {API_URL} from "../../api/config.ts";
import UserProfileBadge from "../../components/userInfo/UserProfileBadge.tsx";

type Tag = {
    _id: string;
    nombre: string;
    descripcion: string;
};

type FormErrors = {
    titulo?: string;
    descripcion?: string;
    contenido_markdown?: string;
    imagen_url?: string;
    tags?: string;
};

export default function NewArticle() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [showPreview, setShowPreview] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/tags/`)
            .then(res => {
                setAvailableTags(res.data);
                addDebug(`Fetched ${res.data.length} tags`);
            })
            .catch(err => {
                console.error('Error fetching tags:', err);
                addDebug(`Error fetching tags: ${err}`);
            });
    }, []);

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if (formErrors.titulo) {
            setFormErrors({...formErrors, titulo: undefined});
        }
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        if (formErrors.descripcion) {
            setFormErrors({...formErrors, descripcion: undefined});
        }
    };

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (formErrors.contenido_markdown) {
            setFormErrors({...formErrors, contenido_markdown: undefined});
        }
    };

    const handleTagChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;

        if (checked) {
            setSelectedTags(prev => [...prev, value]);
            addDebug(`Added tag: ${value}`);
            if (formErrors.tags) {
                setFormErrors({...formErrors, tags: undefined});
            }
        } else {
            setSelectedTags(prev => prev.filter(tag => tag !== value));
            addDebug(`Removed tag: ${value}`);
        }
    };

    const handleImageUrlUpdate = (url: string) => {
        setImageUrl(url);
        addDebug(`Image URL updated: ${url}`);
        if (formErrors.imagen_url) {
            setFormErrors({...formErrors, imagen_url: undefined});
        }
    };

    const insertMarkdown = (markdownSyntax: string) => {
        const textArea = document.getElementById('contenido_markdown') as HTMLTextAreaElement;
        if (!textArea) return;

        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = content;

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

        setContent(modifiedText);
        if (formErrors.contenido_markdown) {
            setFormErrors({...formErrors, contenido_markdown: undefined});
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

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        // Check title
        if (!title || title.trim() === '') {
            errors.titulo = 'El título no puede estar vacío';
            isValid = false;
        }

        // Check description
        if (!description || description.trim() === '') {
            errors.descripcion = 'La descripción no puede estar vacía';
            isValid = false;
        }

        // Check content
        if (!content || content.trim() === '') {
            errors.contenido_markdown = 'El contenido no puede estar vacío';
            isValid = false;
        }

        // Check image
        if (!imageUrl) {
            errors.imagen_url = 'Debe subir una imagen';
            isValid = false;
        }

        // Check tags (optional)
        if (selectedTags.length === 0) {
            errors.tags = 'Seleccione al menos un tag';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        addDebug("Starting submission validation");

        if (!validateForm()) {
            addDebug("Form validation failed");
            return;
        }

        setIsLoading(true);
        addDebug("Form validated, starting submission");

        try {
            // Transform selectedTags into an array of objects with an _id field
            const formattedTags = selectedTags.map(tagId => ({ _id: tagId }));

            const articleData = {
                titulo: title,
                contenido_markdown: content,
                imagen_url: imageUrl,
                tags: formattedTags, // Send tags as objects with _id
                autor_id: 'escritor',
                descripcion: description,
                fecha_creacion: new Date().toISOString()
            };

            addDebug(`Sending article data: ${JSON.stringify(articleData)}`);
            const response = await axios.post(`${API_URL}/api/articles/create/`, articleData);

            addDebug(`Article created with ID: ${response.data.id}`);
            navigate(`/articles/${response.data.id}`);
        } catch (err) {
            console.error('Error creating article:', err);
            setError('Failed to create article');
            addDebug(`Error creating article: ${err}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="article-page">
            <UserProfileBadge />
            <h1>Create New Article</h1>

            {error && <div className="message error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className={`form-group ${formErrors.titulo ? 'has-error' : ''}`}>
                    <label htmlFor="titulo">Title <span className="required-field">*</span></label>
                    <input
                        type="text"
                        id="titulo"
                        value={title}
                        onChange={handleTitleChange}
                        className={formErrors.titulo ? 'error-input' : ''}
                    />
                    {formErrors.titulo && <div className="error-message">{formErrors.titulo}</div>}
                </div>

                <div className={`form-group ${formErrors.descripcion ? 'has-error' : ''}`}>
                    <label htmlFor="descripcion">Description <span className="required-field">*</span></label>
                    <textarea
                        id="descripcion"
                        value={description}
                        onChange={handleDescriptionChange}
                        rows={3}
                        maxLength={100} // Limita la entrada a 100 caracteres
                        className={formErrors.descripcion ? 'error-input' : ''}
                    ></textarea>
                    {formErrors.descripcion && <div className="error-message">{formErrors.descripcion}</div>}
                </div>

                <div className={`form-group ${formErrors.imagen_url ? 'has-error' : ''}`}>
                    <label>Image <span className="required-field">*</span></label>
                    <ImageUploader
                        onImageUploaded={handleImageUrlUpdate}
                        required={true}
                    />
                    {formErrors.imagen_url && <div className="error-message">{formErrors.imagen_url}</div>}
                    {imageUrl && (
                        <img
                            src={imageUrl.startsWith('http')
                                ? imageUrl
                                : `${API_URL}${imageUrl}`}
                            alt="Preview"
                            className="image-preview"
                            style={{ maxWidth: '200px', marginTop: '10px' }}
                        />
                    )}
                </div>

                <div className={`form-group ${formErrors.tags ? 'has-error' : ''}`}>
                    <label>Tags <span className="required-field">*</span></label>
                    <div className="tags-container">
                        {availableTags.map(tag => (
                            <div key={tag._id} className="tag-checkbox">
                                <input
                                    type="checkbox"
                                    id={`tag-${tag._id}`}
                                    value={tag._id}
                                    checked={selectedTags.includes(tag._id)}
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
                            value={content}
                            onChange={handleContentChange}
                            rows={12}
                            className={formErrors.contenido_markdown ? 'error-input' : ''}
                        ></textarea>
                    ) : (
                        <div className="preview article-content">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
                    {formErrors.contenido_markdown && <div className="error-message">{formErrors.contenido_markdown}</div>}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="update-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Article'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="cancel-button"
                        disabled={isLoading}
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
        </div>
    );
}