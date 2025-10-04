import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [challengesData, rankingData] = await Promise.all([
                api.getChallenges(),
                api.getRanking()
            ]);
            setChallenges(challengesData);
            setRanking(rankingData.slice(0, 5)); // Top 5
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
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
                Loading...
            </div>
        );
    }

    return (
        <div style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'white'
        }}>
            <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    background: 'linear-gradient(to right, var(--primary), var(--accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Welcome to LookUp
                </h1>
                <p style={{
                    fontSize: '20px',
                    color: 'var(--muted-foreground)',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Contribute to science by annotating space images and earn rewards
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                        Available Challenges
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {challenges.map(challenge => (
                            <div
                                key={challenge.id}
                                className="glass glass-hover"
                                style={{
                                    padding: '24px',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/challenge/${challenge.id}`)}
                            >
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    color: 'var(--primary)'
                                }}>
                                    {challenge.title || challenge.name}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: 'var(--muted-foreground)',
                                    marginBottom: '12px'
                                }}>
                                    {challenge.description}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '12px',
                                        color: 'var(--accent)',
                                        background: 'rgba(255, 209, 102, 0.1)',
                                        padding: '4px 12px',
                                        borderRadius: '12px'
                                    }}>
                                        {challenge.images.length} images
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: 'var(--primary)',
                                        background: 'rgba(108, 207, 246, 0.1)',
                                        padding: '4px 12px',
                                        borderRadius: '12px'
                                    }}>
                                        {challenge.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                        🏆 Global Ranking
                    </h2>
                    <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
                        {ranking.map((entry, index) => (
                            <div
                                key={entry.userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderBottom: index < ranking.length - 1 ? '1px solid var(--border)' : 'none'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    {entry.rank}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {entry.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                        {entry.score} points
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {user && (
                        <div className="glass" style={{
                            padding: '20px',
                            borderRadius: '12px',
                            marginTop: '20px'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                                Your Statistics
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                                        Role
                                    </div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        background: user.role === 'validator' 
                                            ? 'linear-gradient(135deg, rgba(108, 207, 246, 0.25), rgba(108, 207, 246, 0.15))' 
                                            : user.role === 'agency' 
                                            ? 'linear-gradient(135deg, rgba(255, 209, 102, 0.25), rgba(255, 209, 102, 0.15))' 
                                            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.15))',
                                        border: user.role === 'validator' 
                                            ? '2px solid rgba(108, 207, 246, 0.5)' 
                                            : user.role === 'agency' 
                                            ? '2px solid rgba(255, 209, 102, 0.5)' 
                                            : '2px solid rgba(139, 92, 246, 0.5)',
                                        borderRadius: '24px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: user.role === 'validator' 
                                            ? '#6CCFF6' 
                                            : user.role === 'agency' 
                                            ? '#FFD166' 
                                            : '#A78BFA',
                                        boxShadow: user.role === 'validator' 
                                            ? '0 4px 12px rgba(108, 207, 246, 0.3), 0 0 20px rgba(108, 207, 246, 0.15)' 
                                            : user.role === 'agency' 
                                            ? '0 4px 12px rgba(255, 209, 102, 0.3), 0 0 20px rgba(255, 209, 102, 0.15)' 
                                            : '0 4px 12px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.15)',
                                        transition: 'all 0.3s ease',
                                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                        letterSpacing: '0.5px',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        {user.role === 'explorer' ? '🔍 Explorer' :
                                         user.role === 'participant' ? '🔍 Explorer' :
                                         user.role === 'validator' ? '✓ Validator' :
                                         user.role === 'agency' ? '🏢 Agency' : user.role}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                        Score
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {user.score || 0}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                        Annotations
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
                                        {user.annotations_count || 0}
                                    </div>
                                </div>
                                {(user.role === 'explorer' || user.role === 'participant') && user.annotations_count < 20 && (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '12px',
                                        background: 'rgba(108, 207, 246, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: 'var(--primary)'
                                    }}>
                                        🎯 {20 - user.annotations_count} more annotations to become a Validator
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;

