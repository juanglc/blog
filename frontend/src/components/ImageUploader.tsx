// src/components/ImageUploader.tsx
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './ImageUploader.css';
import API_URL from '../api/config';

type ImageUploaderProps = {
    onImageUploaded: (imageUrl: string) => void;
    label?: string;
    existingImageUrl?: string;
};

function ImageUploader({ onImageUploaded, label = 'Upload Image', existingImageUrl }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Set the preview URL from the existing image URL when component mounts
    useEffect(() => {
        if (existingImageUrl) {
            const fullUrl = existingImageUrl.startsWith('http')
                ? existingImageUrl
                : `${API_URL}${existingImageUrl}`;
            setPreviewUrl(fullUrl);
        }
    }, [existingImageUrl]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post(`${API_URL}/api/upload/image/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Call the callback with the image URL
            onImageUploaded(response.data.url);
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    }, [onImageUploaded]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        multiple: false
    });

    return (
        <div className="image-uploader">
            <label>{label}</label>
            <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                {previewUrl ? (
                    <div className="preview-container">
                        <img src={previewUrl} alt="Preview" className="image-preview" />
                        <p>Drop a new image to change</p>
                    </div>
                ) : (
                    <p>{uploading ? 'Uploading...' : 'Drag & drop an image, or click to select'}</p>
                )}
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default ImageUploader;