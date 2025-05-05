// frontend/src/pages/articles/DraftsList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../api/config.ts";
import UserProfileBadge from "../../components/userInfo/UserProfileBadge.tsx";
import { Spinner } from '../../components/Spinner.tsx';
import { CustomAlert } from '../../components/alerts/Alerts.tsx';
import './DraftsList.css';

type Draft = {
    _id: string;
    titulo: string;
    descripcion: string;
    fecha_creacion: string;
    fecha_actualizacion?: string;
    tipo: 'nuevo' | 'update';
    id_articulo_original?: string;
};

export default function DraftsList() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
    const navigate = useNavigate();

    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;

    useEffect(() => {
        if (!userId) {
            setError("User not authenticated");
            setLoading(false);
            return;
        }

        fetchDrafts();
    }, [userId]);

    const fetchDrafts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/drafts/all/${userId}/`);
            setDrafts(response.data.drawers || []);
        } catch (err: any) {
            console.error('Error fetching drafts:', err);
            setError(err.message || 'Failed to fetch drafts');
            setAlert({
                message: 'Failed to load drafts. Please try again later.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDraft = async (draftId: string) => {
        if (!confirm('Are you sure you want to delete this draft?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/drafts/delete/${draftId}/`);
            setAlert({
                message: 'Draft deleted successfully',
                type: 'success'
            });
            // Update the drafts list
            fetchDrafts();
        } catch (err: any) {
            console.error('Error deleting draft:', err);
            setAlert({
                message: 'Failed to delete draft',
                type: 'error'
            });
        }
    };

    const handleEditDraft = (draft: Draft) => {
        if (draft.tipo === 'nuevo') {
            // For new article drafts, navigate to new article page with draft ID
            navigate(`/articles/new?draft=${draft._id}`);
        } else if (draft.tipo === 'update' && draft.id_articulo_original) {
            // For update drafts, navigate to update article page with original article ID
            navigate(`/articles/update/${draft.id_articulo_original}`);
        } else {
            // Fallback in case of unexpected draft type
            navigate(`/drafts/edit/${draft._id}`);
        }
    };

    if (loading) {
        return (
            <div className="drafts-page">
                <div className="user-wrapper">
                    <UserProfileBadge />
                </div>
                <h1>My Drafts</h1>
                <div className="spinner-wrapper" style={{ marginBottom: "20px" }}>
                    <Spinner size="medium" color="var(--primary-color)" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="drafts-page">
                <div className="user-wrapper">
                    <UserProfileBadge />
                </div>
                <h1>My Drafts</h1>
                <CustomAlert
                    type="error"
                    message={error}
                    show={true}
                    onClose={() => setError(null)}
                />
                <button
                    onClick={() => navigate('/articles')}
                    className="secondary-button"
                >
                    Back to Articles
                </button>
            </div>
        );
    }

    return (
        <div className="drafts-page">
            <div className="user-wrapper">
                <UserProfileBadge />
            </div>
            <h1>My Drafts</h1>

            {alert && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    show={!!alert}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="drafts-actions">
                <button
                    onClick={() => navigate('/articles/new')}
                    className="primary-button"
                >
                    Create New Article
                </button>
            </div>

            {drafts.length === 0 ? (
                <div className="no-drafts">
                    <p>You don't have any drafts yet.</p>
                </div>
            ) : (
                <div className="drafts-list">
                    {drafts.map(draft => (
                        <div key={draft._id} className="draft-card">
                            <div className="draft-header">
                                <h3>{draft.titulo || 'Untitled Draft'}</h3>
                                <span className={`draft-type ${draft.tipo === 'nuevo' ? 'new' : 'update'}`}>
                  {draft.tipo === 'nuevo' ? 'New Article' : 'Update'}
                </span>
                            </div>
                            <p className="draft-description">{draft.descripcion || 'No description'}</p>
                            <div className="draft-meta">
                                <span>Created: {new Date(draft.fecha_creacion).toLocaleDateString()}</span>
                                {draft.fecha_actualizacion && (
                                    <span>Last Updated: {new Date(draft.fecha_actualizacion).toLocaleDateString()}</span>
                                )}
                            </div>
                            <div className="draft-actions">
                                <button onClick={() => handleEditDraft(draft)} className="edit-button">
                                    Edit Draft
                                </button>
                                <button onClick={() => handleDeleteDraft(draft._id)} className="delete-button">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => navigate('/articles')}
                className="secondary-button"
                style={{ marginTop: '20px' }}
            >
                Back to Articles
            </button>
        </div>
    );
}