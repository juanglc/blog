import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './ImageUploader.css';
import {API_URL} from "../api/config.ts";

type ImageUploaderProps = {
    onImageUploaded: (imageUrl: string) => void;
    label?: string;
    existingImageUrl?: string;
    required?: boolean;
};

function ImageUploader({
                           onImageUploaded,
                           label = 'Upload Image',
                           existingImageUrl,
                           required = true
                       }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [imageSelected, setImageSelected] = useState(!!existingImageUrl);

    // Set the preview URL from the existing image URL when component mounts
    useEffect(() => {
        if (existingImageUrl) {
            setPreviewUrl(existingImageUrl);
            setImageSelected(true);
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

            // Get the imageUrl from the response
            const imageUrl = response.data.imageUrl;

            if (!imageUrl) {
                throw new Error('No image URL returned from server');
            }

            // Call the callback with the image URL
            onImageUploaded(imageUrl);
            setImageSelected(true);
            setError('');
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
            <label>
                {label}
                {required && !imageSelected && <span className="required-indicator"> *</span>}
            </label>
            <div
                {...getRootProps()}
                className={`dropzone ${required && !imageSelected ? 'required' : ''}`}
            >
                <input {...getInputProps()} required={required && !imageSelected} />
                {previewUrl ? (
                    <div className="preview-container">
                        <img src={previewUrl} alt="Preview" className="image-preview" />
                        <p>Drop a new image to change</p>
                    </div>
                ) : (
                    <p>{uploading ? 'Uploading...' : `Drag & drop an image, or click to select${required ? ' (required)' : ''}`}</p>
                )}
            </div>
            {error && <p className="error-message">{error}</p>}
            {required && !imageSelected && !uploading && !error && (
                <p className="error-message">An image is required</p>
            )}
        </div>
    );
}

export default ImageUploader;