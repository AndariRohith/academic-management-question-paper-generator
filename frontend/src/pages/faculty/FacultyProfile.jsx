import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DashboardShared.css';

const FacultyProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const apiUrl = 'http://127.0.0.1:5000'; // Faculty service

    useEffect(() => {
        if (user?.username) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/get_faculty`);
            const data = await res.json();
            // Find current faculty from list
            // Assuming username corresponds to faculty_id or name.
            // A more robust backend would have a /me endpoint, but we work with what we have.
            const currentFaculty = data.data.find(
                f => f.faculty_id === user.username || f.name === user.username
            );

            setProfile(currentFaculty);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (!profile) return <div className="error-state">Profile not found for {user?.username}</div>;

    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="profile-avatar-placeholder">
                    {profile.name.charAt(0)}
                </div>
                <h2>{profile.name}</h2>
                <p className="title">{profile.designation || 'Faculty Member'}</p>
                <span className="profile-badge">🎓 {profile.qualification || 'PhD'}</span>
            </div>

            <div className="profile-body">
                <div className="section-title">Personal Information</div>
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-icon">👤</div>
                        <div className="info-content">
                            <label>Full Name</label>
                            <span>{profile.name}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">🆔</div>
                        <div className="info-content">
                            <label>Faculty ID</label>
                            <span>{profile.faculty_id}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">💼</div>
                        <div className="info-content">
                            <label>Designation</label>
                            <span>{profile.designation || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">🎓</div>
                        <div className="info-content">
                            <label>Qualification</label>
                            <span>{profile.qualification || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">📅</div>
                        <div className="info-content">
                            <label>Date of Joining</label>
                            <span>{profile.date_of_joining || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">🤝</div>
                        <div className="info-content">
                            <label>Nature of Association</label>
                            <span>{profile.nature_of_association || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">📧</div>
                        <div className="info-content">
                            <label>Email</label>
                            <span>{profile.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">📱</div>
                        <div className="info-content">
                            <label>Phone</label>
                            <span>{profile.phone || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">⏳</div>
                        <div className="info-content">
                            <label>Experience</label>
                            <span>{profile.experience || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {profile.research_interests && (
                    <>
                        <div className="section-title">Research & Interests</div>
                        <div className="research-tags">
                            {profile.research_interests.split(',').map((tag, i) => (
                                <span key={i} className="tag">{tag.trim()}</span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .profile-avatar-placeholder {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    color: white;
                    font-weight: bold;
                    margin: 0 auto 15px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default FacultyProfile;
