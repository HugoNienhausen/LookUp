import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [annotations, setAnnotations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, [user]);

    const loadUserData = async () => {
        try {
            const [allAnnotations, ranking] = await Promise.all([
                api.getAnnotations(),
                api.getRanking()
            ]);

            const userAnnotations = allAnnotations.filter(a => a.userId === user.id);
            setAnnotations(userAnnotations);
            const userRank = ranking.find(r => r.userId === user.id);

            setStats({
                totalAnnotations: user.annotations_count || 0,
                validated: userAnnotations.filter(a => a.status === 'validated').length,
                pending: userAnnotations.filter(a => a.status === 'pending').length,
                rejected: userAnnotations.filter(a => a.status === 'rejected').length,
                score: user.score || 0,
                rank: userRank ? userRank.rank : 'N/A'
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = () => {
        const roles = {
            explorer: { label: 'Explorer', color: 'var(--muted)' },
            participant: { label: 'Participant', color: 'var(--muted)' },
            validator: { label: 'Validator', color: 'var(--primary)' },
            agency: { label: 'Agency', color: 'var(--accent)' }
        };
        return roles[user.role] || roles.explorer;
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'white'
            }}>
                Loading profile...
            </div>
        );
    }

    const roleBadge = getRoleBadge();

    return (
        <div style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'white'
        }}>
            <div className="glass" style={{
                padding: '32px',
                borderRadius: '12px',
                marginBottom: '32px',
                display: 'flex',
                gap: '32px',
                alignItems: 'center'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: 'var(--primary-foreground)',
                    flexShrink: 0
                }}>
                    {user.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {user.name}
                    </h1>
                    <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                        {user.email}
                    </p>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: `${roleBadge.color}20`,
                        border: `1px solid ${roleBadge.color}`,
                        borderRadius: '20px',
                        color: roleBadge.color,
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {roleBadge.label}
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: '12px 24px',
                        background: 'var(--destructive)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--destructive-foreground)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#b91c1c';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--destructive)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    🚪 Sign Out
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats.score}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        Total Points
                    </div>
                </div>

                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--accent)' }}>
                        #{stats.rank}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        Global Ranking
                    </div>
                </div>

                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats.totalAnnotations}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        Total Annotations
                    </div>
                </div>

                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#22c55e' }}>
                        {stats.validated}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        Validated
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                Annotation History
            </h2>

            {annotations.length === 0 ? (
                <div className="glass" style={{
                    padding: '60px',
                    textAlign: 'center',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                        You haven't made any annotations yet
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                        Start contributing to challenges!
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {annotations.map(annotation => (
                        <div
                            key={annotation.id}
                            className="glass"
                            style={{
                                padding: '20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                                    Challenge: {annotation.challengeId}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                                    {new Date(annotation.createdAt).toLocaleDateString()} • {annotation.annotations?.length || 0} anotaciones
                                </div>
                            </div>
                            <div>
                                <span style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background:
                                        annotation.status === 'validated' ? 'rgba(34, 197, 94, 0.1)' :
                                            annotation.status === 'rejected' ? 'rgba(212, 24, 61, 0.1)' :
                                                'rgba(255, 209, 102, 0.1)',
                                    color:
                                        annotation.status === 'validated' ? '#22c55e' :
                                            annotation.status === 'rejected' ? 'var(--destructive)' :
                                                'var(--accent)',
                                    border:
                                        annotation.status === 'validated' ? '1px solid #22c55e' :
                                            annotation.status === 'rejected' ? '1px solid var(--destructive)' :
                                                '1px solid var(--accent)'
                                }}>
                                    {annotation.status === 'validated' ? '✓ Validated' :
                                        annotation.status === 'rejected' ? '✗ Rejected' :
                                            '⏳ Pending'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;

