import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ImageUploader from '../../components/ImageUploader.tsx';
import './NewArticle.css';
import {API_URL} from "../../api/config.ts";
import '../../App.css';
import { Spinner } from '../../components/Spinner.tsx';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';

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
    const [formSubmitted, setFormSubmitted] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [showPreview, setShowPreview] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");

    // Auto-save related states
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    useEffect(() => {
        // Get draft ID from URL query parameter
        const queryParams = new URLSearchParams(location.search);
        const draftParam = queryParams.get('draft');
        // Load available tags
        axios.get(`${API_URL}/api/tags/`)
            .then(res => {
                setAvailableTags(res.data);
                addDebug(`Fetched ${res.data.length} tags`);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching tags:', err);
                addDebug(`Error fetching tags: ${err}`);
                setAlertMessage("Failed to load tags. Please refresh and try again.");
                setAlertType("error");
                setShowAlert(true);
                setIsLoading(false);
            });

        // Inside the useEffect where you load the draft
        if (draftParam) {
            setDraftId(draftParam);
            addDebug(`Loading draft with ID: ${draftParam}`);

            // Fetch the draft data
            axios.get(`${API_URL}/api/drafts/${draftParam}/`)
                .then(response => {
                    const draftData = response.data;
                    addDebug(`Loaded draft data: ${JSON.stringify(draftData)}`);

                    // Set form fields from draft
                    setTitle(draftData.titulo || '');
                    setDescription(draftData.descripcion || '');
                    setContent(draftData.contenido_markdown || '');
                    setImageUrl(draftData.imagen_url || '');

                    if (draftData.tags && Array.isArray(draftData.tags)) {
                        // Check if tags are objects with _id properties or just strings
                        const tagIds = draftData.tags.map((tag: any) =>
                            typeof tag === 'object' && tag._id ? tag._id : tag
                        );
                        setSelectedTags(tagIds);
                        addDebug(`Loaded tags from draft: ${tagIds.join(', ')}`);
                    }

                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error loading draft:', error);
                    addDebug(`Error loading draft: ${error.message}`);
                    setAlertMessage("Failed to load draft. Please try again.");
                    setAlertType("error");
                    setShowAlert(true);
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [location.search]);

    // Debounced auto-save function
    const autoSaveDraft = useCallback(
        async (formData: {
            title: string,
            description: string,
            content: string,
            imageUrl: string,
            tags: string[]
        }) => {
            if (!autoSaveEnabled || !formData.title) return;

            try {
                setSavingStatus('saving');
                addDebug('Auto-saving draft...');

                // Get user data from localStorage
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                const autorId = userData._id || 'unknown';

                const draftData = {
                    titulo: formData.title,
                    descripcion: formData.description,
                    contenido_markdown: formData.content,
                    imagen_url: formData.imageUrl,
                    tags: formData.tags,
                    autor_id: autorId,
                    fecha_creacion: new Date().toISOString(),
                    tipo: "nuevo",
                    borrador: true
                };

                let response;

                if (draftId) {
                    // Update existing draft
                    response = await axios.put(
                        `${API_URL}/api/drafts/update/${draftId}/`,
                        draftData
                    );
                    addDebug(`Updated draft with ID: ${draftId}`);
                } else {
                    // Create new draft
                    response = await axios.post(
                        `${API_URL}/api/pending_articles/`,
                        draftData
                    );
                    const newDraftId = response.data.pending_article._id;
                    setDraftId(newDraftId);
                    addDebug(`Created new draft with ID: ${newDraftId}`);
                }

                setLastSaved(new Date());
                setSavingStatus('saved');
            } catch (err) {
                console.error('Auto-save error:', err);
                addDebug(`Auto-save error: ${err}`);
                setSavingStatus('error');
            }
        },
        [draftId, autoSaveEnabled]
    );

    // Debounce effect for auto-save
    useEffect(() => {
        if (!title) return;

        const timeoutId = setTimeout(() => {
            autoSaveDraft({
                title,
                description,
                content,
                imageUrl,
                tags: selectedTags
            });
        }, 3000); // 3 seconds delay

        return () => clearTimeout(timeoutId);
    }, [title, description, content, imageUrl, selectedTags, autoSaveDraft]);

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

    const toggleAutoSave = () => {
        setAutoSaveEnabled(!autoSaveEnabled);
        addDebug(`Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`);
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

        // Check tags
        if (selectedTags.length === 0) {
            errors.tags = 'Seleccione al menos un tag';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        addDebug("Starting submission validation");

        if (!validateForm()) {
            addDebug("Form validation failed");
            setAlertMessage("Please fill in all required fields");
            setAlertType("error");
            setShowAlert(true);
            return;
        }

        setIsLoading(true);
        addDebug("Form validated, starting submission");

        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const autorId = userData._id || 'unknown';

            let pendingArticleId;

            // If we have a draft, update it but KEEP it as a draft
            if (draftId) {
                addDebug(`Using existing draft: ${draftId}`);

                // Update draft keeping it as a draft
                const updateData = {
                    titulo: title,
                    descripcion: description,
                    contenido_markdown: content,
                    imagen_url: imageUrl,
                    tags: selectedTags,
                    autor_id: autorId,
                    fecha_actualizacion: new Date().toISOString(),
                    tipo: "nuevo",
                    borrador: true  // Keep as draft
                };

                await axios.put(`${API_URL}/api/drafts/update/${draftId}/`, updateData);
                pendingArticleId = draftId;
                addDebug(`Updated draft ${draftId}`);
            } else {
                // Create new pending article as a draft
                const pendingArticleData = {
                    titulo: title,
                    descripcion: description,
                    contenido_markdown: content,
                    imagen_url: imageUrl,
                    tags: selectedTags,
                    autor_id: autorId,
                    fecha_creacion: new Date().toISOString(),
                    tipo: "nuevo",
                    borrador: true  // Create as draft
                };

                const pendingResponse = await axios.post(
                    `${API_URL}/api/pending_articles/`,
                    pendingArticleData
                );

                pendingArticleId = pendingResponse.data.pending_article._id;
                addDebug(`Created new pending article with ID: ${pendingArticleId}`);
            }

            // Push the draft to convert borrador to false
            try {
                const responsePush = await axios.put(
                    `${API_URL}/api/drafts/push/${pendingArticleId}/`
                );
                addDebug(`Draft pushed successfully: ${JSON.stringify(responsePush.data)}`);
            } catch (pushErr: any) {
                addDebug(`Error pushing draft: ${pushErr.message}`);
                throw pushErr; // Re-throw to handle in the outer catch block
            }

            // Create article request with the pending article ID
            const articleRequestData = {
                autor_id: autorId,
                tipo: "nuevo",
                id_articulo_nuevo: pendingArticleId
            };

            addDebug(`Sending article request data: ${JSON.stringify(articleRequestData)}`);

            const articleRequestResponse = await axios.post(
                `${API_URL}/api/requests/articles/`,
                articleRequestData
            );

            const articleRequest = articleRequestResponse.data;
            addDebug(`Article request created successfully: ${JSON.stringify(articleRequest)}`);

            // Mark form as submitted to prevent further edits
            setFormSubmitted(true);

            // Reset form fields
            setTitle('');
            setDescription('');
            setContent('');
            setImageUrl('');
            setSelectedTags([]);

            setAlertMessage("Article submitted successfully!");
            setAlertType("success");
            setShowAlert(true);

            // Redirect after a short delay
            setTimeout(() => {
                navigate('/articles');
            }, 1500);

        } catch (err: any) {
            console.error('Error creating article:', err);
            addDebug(`Error creating article: ${err.message}`);

            if (err.response) {
                addDebug(`Final error status: ${err.response.status}`);
                addDebug(`Final error data: ${JSON.stringify(err.response.data)}`);
            }

            setAlertMessage(`Failed to create article: ${err.message}`);
            setAlertType("error");
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (formSubmitted) {
        return (
            <div className="article-page">
                <h1>Article Submitted</h1>
                <div className="submission-success">
                    <CustomAlert
                        type="success"
                        message="Your article has been submitted successfully and is pending approval."
                        show={true}
                        onClose={() => {}}
                    />
                    <div className="center-content" style={{ marginTop: "30px" }}>
                        <p>You will be redirected to the articles page...</p>
                        <div className="spinner-wrapper">
                            <Spinner size="small" color="var(--primary-color)" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="article-page">
            <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                <Spinner size="medium" color="var(--primary-color)" />
            </div>
            <div className="article-skeleton">
                <div className="skeleton-line title-line" style={{ height: "40px", width: "80%" }}></div>
                <div className="skeleton-line" style={{ width: "50%", marginBottom: "30px" }}></div>
                <div className="article-image-placeholder" style={{ height: "300px", marginBottom: "20px" }}></div>
                <div className="skeleton-line" style={{ width: "100%" }}></div>
                <div className="skeleton-line" style={{ width: "100%" }}></div>
                <div className="skeleton-line" style={{ width: "90%" }}></div>
                <div className="skeleton-line" style={{ width: "95%" }}></div>
            </div>
        </div>;
    }

    return (
        <div className="article-page">
            <h1>Create New Article</h1>

            {showAlert && (
                <CustomAlert
                    type={alertType}
                    message={alertMessage}
                    show={showAlert}
                    onClose={() => setShowAlert(false)}
                />
            )}

            {/* Add this near the form */}
            <div className="auto-save-status">
                <label>
                    <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={toggleAutoSave}
                    />
                    Auto-save draft
                </label>
                <span className={`save-status ${savingStatus}`}>
                    {savingStatus === 'saving' && 'Saving...'}
                    {savingStatus === 'saved' && `Saved ${lastSaved?.toLocaleTimeString()}`}
                    {savingStatus === 'error' && 'Error saving'}
                </span>
            </div>

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
                        maxLength={100}
                        style={{resize: 'none'}}
                        className={formErrors.descripcion ? 'error-input' : ''}
                    ></textarea>
                    {formErrors.descripcion && <div className="error-message">{formErrors.descripcion}</div>}
                </div>

                <div className={`form-group ${formErrors.imagen_url ? 'has-error' : ''}`}>
                    <label>Image <span className="required-field">*</span></label>
                    <ImageUploader
                        onImageUploaded={handleImageUrlUpdate}
                        existingImageUrl={imageUrl}
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
                                <label htmlFor={`tag-${tag._id}`}>
                                    <input
                                        type="checkbox"
                                        id={`tag-${tag._id}`}
                                        value={tag._id}
                                        checked={selectedTags.includes(tag._id)}
                                        onChange={handleTagChange}
                                    />
                                    {tag.nombre}
                                </label>
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
            <div className="debug-info">
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