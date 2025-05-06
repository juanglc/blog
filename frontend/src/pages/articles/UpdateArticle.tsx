import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ImageUploader from '../../components/ImageUploader.tsx';
import './NewArticle.css';
import { API_URL } from "../../api/config.ts";
import '../../App.css';
import { Spinner } from "../../components/Spinner.tsx";
import { CustomAlert } from "../../components/alerts/Alerts.tsx";
import axios from 'axios';

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
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
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

    // Auto-save related states
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    // Debounce utility function
    function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const debounced = (...args: Parameters<F>) => {
            if (timeout !== null) {
                clearTimeout(timeout);
                timeout = null;
            }
            timeout = setTimeout(() => func(...args), waitFor);
        };

        debounced.cancel = () => {
            if (timeout !== null) {
                clearTimeout(timeout);
                timeout = null;
            }
        };

        return debounced as F & { cancel: () => void };
    }

    // Auto-save function
    const autoSaveDraft = useCallback(
        debounce(async () => {
            // Don't save if auto-save is disabled or if there's already a pending update
            if (!autoSaveEnabled || hasPendingUpdate || (!formData.titulo && !formData.descripcion && !formData.contenido_markdown)) {
                return;
            }

            try {
                setSavingStatus('saving');
                addDebug("Auto-saving draft...");

                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                const autorId = userData._id || 'unknown';

                // If we don't have a draft ID yet, check if one exists before creating
                if (!draftId) {
                    try {
                        addDebug(`Checking for existing draft for article ID: ${id}`);
                        const draftCheckResponse = await axios.get(`${API_URL}/api/drafts/check/${id}/`);

                        if (draftCheckResponse.data.draft_id) {
                            const existingDraftId = draftCheckResponse.data.draft_id;
                            setDraftId(existingDraftId);
                            addDebug(`Using existing draft with ID: ${existingDraftId}`);
                        }
                    } catch (checkError) {
                        addDebug(`Error checking for existing draft: ${checkError}`);
                        // Continue with creating a new draft if check fails
                    }
                }

                const draftData = {
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    contenido_markdown: formData.contenido_markdown,
                    imagen_url: formData.imagen_url,
                    tags: selectedTags,
                    autor_id: autorId,
                    fecha_creacion: new Date().toISOString(),
                    tipo: "update",
                    borrador: true,  // This is a draft
                    id_articulo_original: id
                };

                let response;
                if (draftId) {
                    // Update existing draft - use correct endpoint
                    response = await axios.put(
                        `${API_URL}/api/drafts/update/${draftId}/`,
                        draftData
                    );
                    addDebug(`Updated existing draft with ID: ${draftId}`);
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

                // Reset status after a delay
                setTimeout(() => {
                    if (setSavingStatus) {
                        setSavingStatus('idle');
                    }
                }, 2000);

            } catch (err: any) {
                console.error('Error auto-saving draft:', err);
                addDebug(`Error auto-saving: ${err.message}`);
                setSavingStatus('error');
            }
        }, 2000),
        [formData.titulo, formData.descripcion, formData.contenido_markdown, formData.imagen_url, selectedTags, id, draftId, autoSaveEnabled, hasPendingUpdate]
    );

    // Call auto-save when content changes
    useEffect(() => {
        if (formData.titulo || formData.descripcion || formData.contenido_markdown) {
            autoSaveDraft();
        }
        return () => autoSaveDraft.cancel();
    }, [formData, autoSaveDraft]);

    useEffect(() => {
        if (!id) {
            setError('Invalid article ID');
            setLoading(false);
            return;
        }

        const initializeArticle = async () => {
            try {
                setLoading(true);

                // Step 1: Check for existing draft
                let draftData = null;
                try {
                    addDebug(`Checking for existing draft for article ID: ${id}`);
                    const draftCheckResponse = await axios.get(`${API_URL}/api/drafts/check/${id}/`);

                    if (draftCheckResponse.data.draft_id) {
                        const draftId = draftCheckResponse.data.draft_id;
                        setDraftId(draftId);
                        addDebug(`Found existing draft with ID: ${draftId}`);

                        // Load the draft data
                        const draftResponse = await axios.get(`${API_URL}/api/drafts/${draftId}/`);
                        draftData = draftResponse.data;
                        addDebug(`Loaded draft data: ${JSON.stringify(draftData)}`);
                    } else {
                        addDebug('No existing draft found');
                    }
                } catch (error) {
                    addDebug(`Error checking for existing draft: ${error}`);
                    // Continue even if draft check fails
                }

                // Step 2: Check for pending updates
                try {
                    addDebug(`Checking pending updates for article ID: ${id}`);
                    const pendingRes = await fetch(`${API_URL}/api/pending_articles/check/${id}/`);

                    if (pendingRes.ok) {
                        const data = await pendingRes.json();
                        setHasPendingUpdate(data.hasPendingUpdate);
                        addDebug(data.hasPendingUpdate
                            ? 'There is already a pending update for this article'
                            : 'No pending updates found for this article');
                    }
                } catch (error) {
                    addDebug(`Error checking pending updates: ${error}`);
                }

                // Step 3: Check authorization
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
                } catch (error) {
                    setError('Authorization check failed');
                    setLoading(false);
                    return;
                }

                // Step 4: Load tags
                try {
                    const tagsRes = await fetch(`${API_URL}/api/tags/`);
                    if (!tagsRes.ok) throw new Error('Failed to fetch tags');
                    const tagsData = await tagsRes.json();
                    setAllTags(tagsData);
                    addDebug(`Loaded ${tagsData.length} tags`);
                } catch (error) {
                    addDebug(`Error loading tags: ${error}`);
                    // Continue anyway
                }

                // Step 5: Set form data - prioritize draft if exists
                if (draftData) {
                    // Populate form with draft data
                    setFormData({
                        titulo: draftData.titulo || '',
                        descripcion: draftData.descripcion || '',
                        contenido_markdown: draftData.contenido_markdown || '',
                        imagen_url: draftData.imagen_url || '',
                        autor: draftData.autor || '',
                        autor_id: draftData.autor_id || '',
                        fecha_creacion: draftData.fecha_creacion || '',
                        fecha_actualizacion: draftData.fecha_actualizacion || ''
                    });

                    // Set tags from draft
                    if (draftData.tags && Array.isArray(draftData.tags)) {
                        const tagIds = draftData.tags.map((tag: any) =>
                            typeof tag === 'object' && tag._id ? tag._id : tag
                        );
                        setSelectedTags(tagIds);
                        addDebug(`Loaded tags from draft: ${tagIds.join(', ')}`);
                    }
                } else {
                    // Load article data if no draft exists
                    try {
                        addDebug(`No draft data available, loading original article with ID: ${id}`);
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
                            fecha_actualizacion: data.fecha_actualizacion || ''
                        });

                        // Set selected tags
                        if (data.tags && data.tags.length > 0) {
                            const tagIds = data.tags.map((tag: Tag) =>
                                typeof tag === 'object' && tag._id ? tag._id : tag
                            );
                            setSelectedTags(tagIds);
                            addDebug(`Loaded tags from article: ${tagIds.join(', ')}`);
                        }
                    } catch (error) {
                        setError('Failed to load article');
                        addDebug(`Error loading article: ${error}`);
                    }
                }
            } catch (error) {
                setError(`An error occurred: ${error}`);
                addDebug(`Initialization error: ${error}`);
            } finally {
                setLoading(false);
            }
        };

        initializeArticle();
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
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const autorId = userData._id || 'unknown';

            let pendingArticleId;

            // If we have a draft, update it but KEEP it as a draft
            if (draftId) {
                addDebug(`Updating existing draft: ${draftId}`);

                // Update draft keeping it as a draft
                const updateData = {
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    contenido_markdown: formData.contenido_markdown,
                    imagen_url: formData.imagen_url,
                    tags: selectedTags,
                    autor_id: autorId,
                    fecha_actualizacion: new Date().toISOString(),
                    tipo: "update",
                    borrador: true,  // Keep as draft
                    id_articulo_original: id
                };

                await axios.put(`${API_URL}/api/drafts/update/${draftId}/`, updateData);
                pendingArticleId = draftId;
                addDebug(`Updated draft ${draftId}`);
            } else {
                // Create new pending article as a draft
                const pendingArticleData = {
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    contenido_markdown: formData.contenido_markdown,
                    imagen_url: formData.imagen_url,
                    tags: selectedTags,
                    autor_id: autorId,
                    fecha_creacion: new Date().toISOString(),
                    tipo: "update",
                    borrador: true,  // Create as draft
                    id_articulo_original: id
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
                tipo: "update",
                id_articulo_nuevo: pendingArticleId,
                id_articulo_original: id
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

            setAlert({
                message: "Your update request has been submitted for approval.",
                type: "success"
            });

            // Navigate after a short delay
            setTimeout(() => {
                navigate(`/articles/${id}`);
            }, 1500);

        } catch (err: any) {
            console.error('Error updating article:', err);
            setError('Failed to update article');
            addDebug(`Error updating article: ${err.message}`);

            if (err.response) {
                addDebug(`Final error status: ${err.response.status}`);
                addDebug(`Final error data: ${JSON.stringify(err.response.data)}`);
            }

            setAlert({
                message: `Error submitting update: ${err.message}`,
                type: "error"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (hasPendingUpdate) {
        return (
            <div className="article-page">
                <h1>Update Not Allowed</h1>
                <div className="pending-update-warning">
                    <CustomAlert
                        type="warning"
                        message="There is already a pending update request for this article. Please wait until it's reviewed before submitting another update."
                        show={true}
                        onClose={() => {}}
                    />
                    <div style={{ marginTop: "30px" }}>
                        <button
                            onClick={() => navigate(`/articles/${id}`)}
                            className="new-article-button"
                        >
                            Back to Article
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (formSubmitted) {
        return (
            <div className="article-page">
                <h1>Update Request Submitted</h1>
                <div className="submission-success">
                    <CustomAlert
                        type="success"
                        message="Your article update has been submitted successfully and is pending approval."
                        show={true}
                        onClose={() => {}}
                    />
                    <div className="center-content" style={{ marginTop: "30px" }}>
                        <p>You will be redirected to the article page...</p>
                        <div className="spinner-wrapper">
                            <Spinner size="small" color="var(--primary-color)" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="article-page">
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

    if (!article && !draftId) {
        return <p>Article not found.</p>;
    }

    return (
        <div className="article-page">
            <h1>Update Article</h1>

            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Auto-save status indicator */}
            <div className="auto-save-status">
                <label>
                    <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    />
                    Auto-save draft
                </label>
                <span className={`save-status ${savingStatus}`}>
                    {savingStatus === 'saving' && 'Saving...'}
                    {savingStatus === 'saved' && `Saved at ${lastSaved?.toLocaleTimeString()}`}
                    {savingStatus === 'error' && 'Error saving draft'}
                    {draftId && savingStatus === 'idle' && lastSaved && `Last saved at ${lastSaved.toLocaleTimeString()}`}
                </span>
            </div>

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