import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ImageUploader from '../components/ImageUploader';
import './ArticlePage.css';
import API_URL from "src/api/config.ts";

type Tag = {
    _id: string;
    nombre: string;
    descripcion: string;
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
    const [showPreview, setShowPreview] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const addDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    };

    useEffect(() => {
        axios.get(`${API_URL}api/tags/`)
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
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleTagChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;

        if (checked) {
            setSelectedTags(prev => [...prev, value]);
            addDebug(`Added tag: ${value}`);
        } else {
            setSelectedTags(prev => prev.filter(tag => tag !== value));
            addDebug(`Removed tag: ${value}`);
        }
    };

    const handleImageUrlUpdate = (url: string) => {
        setImageUrl(url);
        addDebug(`Image URL updated: ${url}`);
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
            case 'image':
                modifiedText = text.substring(0, start) + `![${text.substring(start, end) || 'descripción de la imagen'}](https://ejemplo.com/imagen.jpg)` + text.substring(end);
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        addDebug("Starting submission");

        try {
            // Convert selected tag names to tag objects
            const tagsList = selectedTags.map(tagId => {
                const foundTag = availableTags.find(tag => tag._id === tagId);
                return {
                    nombre: foundTag?.nombre || '',
                    descripcion: foundTag?.descripcion || ''
                };
            });

            addDebug(`Prepared tags: ${JSON.stringify(tagsList)}`);

            const articleData = {
                titulo: title,
                contenido_markdown: content,
                imagen_url: imageUrl || '/media/images/default.jpg',
                tags: tagsList,
                autor_id: 'udf5a934c',
                descripcion: description,
                fecha_creacion: new Date().toISOString()
            };

            addDebug(`Sending article data: ${JSON.stringify(articleData)}`);
            console.log('Sending POST request with data:', articleData);

            // Use the create endpoint with POST
            const response = await axios.post(
                `${API_URL}api/articles/create/`,
                articleData
            );

            console.log('Response received:', response);
            console.log('Created article with ID:', response.data.id);
            addDebug(`Article created with ID: ${response.data.id}`);

            // Navigate to the newly created article
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
            <h1>Create New Article</h1>

            {error && <div className="message error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="titulo">Title</label>
                    <input
                        type="text"
                        id="titulo"
                        value={title}
                        onChange={handleTitleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="descripcion">Description</label>
                    <textarea
                        id="descripcion"
                        value={description}
                        onChange={handleDescriptionChange}
                        rows={3}
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>Image</label>
                    <ImageUploader onImageUploaded={handleImageUrlUpdate} />
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

                <div className="form-group">
                    <label>Tags</label>
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
                </div>

                <div className="form-group">
                    <label htmlFor="contenido_markdown">Content</label>
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
                        <button type="button" onClick={() => insertMarkdown('image')} title="Image">
                            🖼️
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
                            required
                        ></textarea>
                    ) : (
                        <div className="preview article-content">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
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