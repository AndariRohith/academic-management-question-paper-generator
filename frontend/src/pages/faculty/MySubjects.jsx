import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DashboardShared.css';

const MySubjects = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = 'http://127.0.0.1:5003'; // Subjects service

    useEffect(() => {
        if (user?.username) {
            fetchAssignedSubjects();
        }
    }, [user]);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/get_subjects`);
            const data = await res.json();

            // Filter subjects where faculty_assign matches current user
            // Assuming user.username is the Faculty ID
            const mySubjects = data.filter(s =>
                s.faculty_assign &&
                s.faculty_assign.toLowerCase() === user.username.toLowerCase()
            );

            setSubjects(mySubjects);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const totalSubjects = subjects.length;
    const uniqueSemesters = [...new Set(subjects.map(s => s.semester))].sort((a, b) => a - b);
    const uniqueRegulations = [...new Set(subjects.map(s => s.regulation_id || s.reg_name))].filter(Boolean);

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="mysubjects-page">
            <div className="page-header">
                <h1>📚 My Assigned Subjects</h1>
                <p>Overview of subjects assigned to you for this academic session</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>📚</div>
                    <div className="stat-info">
                        <h3>{totalSubjects}</h3>
                        <p>Total Subjects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>📅</div>
                    <div className="stat-info">
                        <h3>{uniqueSemesters.length}</h3>
                        <p>Active Semesters</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>📋</div>
                    <div className="stat-info">
                        <h3>{uniqueRegulations.length}</h3>
                        <p>Regulations</p>
                    </div>
                </div>
            </div>

            {/* Subjects Grid */}
            <h3 className="section-heading">Assigned Subjects List</h3>
            {subjects.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📭</div>
                    <p>No subjects are currently assigned to you.</p>
                </div>
            ) : (
                <div className="subjects-grid-cards">
                    {subjects.map((subj) => (
                        <div key={subj.subject_id} className="subject-card-display">
                            <div className="card-top">
                                <span className="sem-badge">Sem {subj.semester}</span>
                                <span className="reg-badge">{subj.regulation_id || 'R??'}</span>
                            </div>
                            <h3 className="subject-name">{subj.subject_name}</h3>
                            <div className="subject-code">{subj.subject_code}</div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <span>Credits:</span>
                                    <strong>{subj.credits}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Branch:</span>
                                    <strong>MCA</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: #1E293B;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                .stat-info h3 {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                    color: #F8FAFC;
                }
                .stat-info p {
                    margin: 0;
                    color: #94A3B8;
                    font-size: 14px;
                }
                .section-heading {
                    margin-bottom: 20px;
                    color: #E2E8F0;
                    font-size: 18px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 10px;
                }
                .subjects-grid-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }
                .subject-card-display {
                    background: #1E293B;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 24px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .subject-card-display:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                }
                .sem-badge, .reg-badge {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                }
                .sem-badge {
                    background: rgba(59, 130, 246, 0.15);
                    color: #60A5FA;
                }
                .reg-badge {
                    background: rgba(139, 92, 246, 0.15);
                    color: #A78BFA;
                }
                .subject-name {
                    font-size: 18px;
                    color: #F1F5F9;
                    margin: 0 0 5px 0;
                    line-height: 1.4;
                }
                .subject-code {
                    font-family: 'Monaco', monospace;
                    color: #94A3B8;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                .card-details {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding-top: 15px;
                    font-size: 14px;
                    color: #CBD5E1;
                }
                .detail-item span {
                    color: #64748B;
                    margin-right: 5px;
                }
            `}</style>
        </div>
    );
};

export default MySubjects;
