import { useEffect, useRef, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BASE_URL } from '@/app/config/config';

export const FeatureImageUploader = ({ UpdateFeatureImage, featuredImage, title = 'Featured Image' }) => {

    const [imagePreview, setImagePreview] = useState(featuredImage);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
    const [fileName, setFileName] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);
    const uploadController = useRef(null);

    useEffect(() => {
        if (imagePreview !== null || imagePreview !== '')
            UpdateFeatureImage(imagePreview);
    }, [imagePreview]);

    useEffect(() => {
        if (featuredImage !== null || featuredImage !== '') {
            if (featuredImage !== imagePreview)
                setImagePreview(featuredImage);
        }
    }, [featuredImage]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            await uploadToBackend(file);

        }
    };

    const uploadToBackend = async (file) => {

        const token = localStorage.getItem('auth_token');
        const UPLOAD_URL = `${BASE_URL}admin/images/upload-image`; // Replace with your actual endpoint

        const UPLOAD_HEADERS = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        };

        const formData = new FormData();
        formData.append('image', file);
        formData.append('generate_thumbnails', true);
        formData.append('thumbnail_sizes[]', 500);

        uploadController.current = new AbortController();

        setUploadStatus('uploading');
        setUploadProgress(0);
        setUploadError('');

        try {
            // Simulate upload with XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setUploadStatus('success');
                    setUploadProgress(100);
                    console.log('Upload successful:', xhr.responseText);
                    try {
                        // Parse the response to get the uploaded image URL
                        const response = JSON.parse(xhr.responseText);

                        // Update preview with the server URL
                        if (response?.data?.file_url) {
                            // const serverImageUrl = response.url || response.imageUrl || response.data.url;
                            setImagePreview(response?.data?.file_url);
                        }

                        console.log('Upload successful:', response);
                    } catch (parseError) {
                        console.log('Upload successful, but could not parse response:', xhr.responseText);
                    }
                } else {
                    throw new Error(`Upload failed with status: ${xhr.status}`);
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                throw new Error('Network error during upload');
            });

            // Handle abort
            xhr.addEventListener('abort', () => {
                setUploadStatus('idle');
                setUploadProgress(0);
            });


            xhr.open('POST', UPLOAD_URL); // Replace with your actual endpoint

            Object.entries(UPLOAD_HEADERS).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });

            xhr.send(formData);

            uploadController.current.xhr = xhr;

        } catch (error) {
            setUploadStatus('error');
            setUploadError(error.message || 'Upload failed');
            setUploadProgress(0);
        }
    };

    const cancelUpload = () => {
        if (uploadController.current?.xhr) {
            uploadController.current.xhr.abort();
        }
        setUploadStatus('idle');
        setUploadProgress(0);
    };

    const removeImage = () => {
        setImagePreview(null);
        setFileName('');
        setUploadStatus('idle');
        setUploadProgress(0);
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getStatusIcon = () => {
        switch (uploadStatus) {
            case 'uploading':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (uploadStatus) {
            case 'uploading':
                return `Uploading... ${uploadProgress}%`;
            case 'success':
                return 'Upload successful';
            case 'error':
                return `Upload failed: ${uploadError}`;
            default:
                return fileName;
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {title}
            </label>

            <div className="flex items-center space-x-4">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === 'uploading'}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Image'}
                </button>

                {fileName && (
                    <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <span className="text-sm text-gray-600">
                            {getStatusText()}
                        </span>
                        {uploadStatus === 'uploading' && (
                            <button
                                type="button"
                                onClick={cancelUpload}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {uploadStatus === 'uploading' && (
                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadStatus === 'uploading'}
            />

            {imagePreview && (
                <div className="mt-4 relative">
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Status overlay */}
                    {/* {uploadStatus === 'success' && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center w-100">
                            <div className="bg-white rounded-full p-2">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                    )} */}

                    {uploadStatus === 'error' && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error message */}
            {uploadStatus === 'error' && uploadError && (
                <div className="mt-2 text-sm text-red-600">
                    {uploadError}
                </div>
            )}
        </div>
    );
}