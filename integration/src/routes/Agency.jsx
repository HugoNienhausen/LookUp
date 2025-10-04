import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

const Agency = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrls, setImageUrls] = useState(['', '', '']);
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        setSuccess(false);

        try {
            const validUrls = imageUrls.filter(url => url.trim() !== '');

            if (validUrls.length === 0) {
                alert('You must provide at least one image URL');
                setCreating(false);
                return;
            }

            const images = validUrls.map((url) => ({
                url: url.trim(),
                dziUrl: url.trim(),
                metadata: {
                    width: 4000,
                    height: 3000
                }
            }));

            const challengeData = {
                title,
                description,
                images,
                rules: 'Annotate all visible features',
                objective: 'Identification and classification of elements',
                endDate: null
            };

            await api.createChallenge(challengeData);

            setSuccess(true);
            setTitle('');
            setDescription('');
            setImageUrls(['', '', '']);

            setTimeout(() => setSuccess(false), 5000);

        } catch (error) {
            console.error('Error creating challenge:', error);
            const errorMsg = error.response?.data?.error || 'Error creating challenge';
            alert(errorMsg);
        } finally{
            setCreating(false);
        }
    };

    const updateImageUrl = (index, value) => {
        const newUrls = [...imageUrls];
        newUrls[index] = value;
        setImageUrls(newUrls);
    };

    const addImageUrlField = () => {
        setImageUrls([...imageUrls, '']);
    };

    const removeImageUrlField = (index) => {
        const newUrls = imageUrls.filter((_, i) => i !== index);
        setImageUrls(newUrls);
    };

    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            color: 'white'
        }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
                🏢 Agency Panel
            </h1>
            <p style={{
                fontSize: '16px',
                color: 'var(--muted-foreground)',
                marginBottom: '32px'
            }}>
                Create new challenges for the community
            </p>

            {success && (
                <div style={{
                    padding: '16px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgb(34, 197, 94)',
                    borderRadius: '8px',
                    color: 'rgb(34, 197, 94)',
                    marginBottom: '24px',
                    fontSize: '14px'
                }}>
                    ✓ Challenge created successfully
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass" style={{
                padding: '32px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Challenge Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Mars Craters - Syrtis Major Region"
                        required
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the challenge objective..."
                        required
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Image URLs
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {imageUrls.map((url, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => updateImageUrl(index, e.target.value)}
                                    placeholder={`Image URL ${index + 1}`}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                                {imageUrls.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeImageUrlField(index)}
                                        style={{
                                            padding: '12px',
                                            background: 'rgba(212, 24, 61, 0.2)',
                                            border: '1px solid var(--destructive)',
                                            borderRadius: '8px',
                                            color: 'var(--destructive)',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addImageUrlField}
                        style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        + Add another image
                    </button>
                    <p style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginTop: '8px'
                    }}>
                        You can use placeholder URLs like: https://via.placeholder.com/4000x3000/8B4513/FFFFFF?text=Mars
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={creating}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'var(--primary)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--primary-foreground)',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        opacity: creating ? 0.6 : 1,
                        marginTop: '8px'
                    }}
                >
                    {creating ? 'Creating Challenge...' : '🚀 Create Challenge'}
                </button>
            </form>

            <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(108, 207, 246, 0.1)',
                border: '1px solid var(--primary)',
                borderRadius: '12px',
                fontSize: '14px',
                color: 'var(--muted-foreground)'
            }}>
                <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '8px' }}>
                    💡 Tips
                </div>
                <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                    <li>Use high-resolution images for better annotations</li>
                    <li>Clearly describe what users should annotate</li>
                    <li>You can add multiple related images to the challenge</li>
                </ul>
            </div>
        </div>
    );
};

export default Agency;

