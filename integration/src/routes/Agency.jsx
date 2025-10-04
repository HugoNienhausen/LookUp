import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

/**
 * Página de Agencia - Crear challenges
 */
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
            // Filtrar URLs vacías
            const validUrls = imageUrls.filter(url => url.trim() !== '');

            if (validUrls.length === 0) {
                alert('Debes proporcionar al menos una URL de imagen');
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
                rules: 'Anota todas las características visibles',
                objective: 'Identificación y clasificación de elementos',
                endDate: null
            };

            await api.createChallenge(challengeData);

            setSuccess(true);
            setTitle('');
            setDescription('');
            setImageUrls(['', '', '']);

            setTimeout(() => setSuccess(false), 5000);

        } catch (error) {
            console.error('Error creando challenge:', error);
            const errorMsg = error.response?.data?.error || 'Error al crear el challenge';
            alert(errorMsg);
        } finally {
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
                🏢 Panel de Agencia
            </h1>
            <p style={{
                fontSize: '16px',
                color: 'var(--muted-foreground)',
                marginBottom: '32px'
            }}>
                Crea nuevos challenges para la comunidad
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
                    ✓ Challenge creado exitosamente
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass" style={{
                padding: '32px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Title */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Título del Challenge
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Cráteres de Marte - Región Syrtis Major"
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

                {/* Description */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Descripción
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe el objetivo del challenge..."
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

                {/* Images */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        URLs de Imágenes
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {imageUrls.map((url, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => updateImageUrl(index, e.target.value)}
                                    placeholder={`URL de imagen ${index + 1}`}
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
                        + Añadir otra imagen
                    </button>
                    <p style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginTop: '8px'
                    }}>
                        Puedes usar URLs de placeholder como: https://via.placeholder.com/4000x3000/8B4513/FFFFFF?text=Mars
                    </p>
                </div>

                {/* Submit */}
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
                    {creating ? 'Creando Challenge...' : '🚀 Crear Challenge'}
                </button>
            </form>

            {/* Info box */}
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
                    💡 Consejos
                </div>
                <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                    <li>Usa imágenes de alta resolución para mejores anotaciones</li>
                    <li>Describe claramente qué deben anotar los usuarios</li>
                    <li>Puedes añadir múltiples imágenes relacionadas al challenge</li>
                </ul>
            </div>
        </div>
    );
};

export default Agency;

