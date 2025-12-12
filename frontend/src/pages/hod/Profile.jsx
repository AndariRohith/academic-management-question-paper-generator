import hodPhoto from '../../assets/hod-photo.png';
import '../../styles/DashboardShared.css';

const Profile = () => {
    return (
        <div className="profile-card">
            <div className="profile-header">
                <img src={hodPhoto} alt="HOD Photo" className="profile-avatar" />
                <h2>Mr. J. S. Ananda Kumar</h2>
                <p className="title">Associate Professor & HOD (Incharge), MCA</p>
                <span className="profile-badge">🎓 15+ Years Experience</span>
            </div>

            <div className="profile-body">
                <div className="section-title">Personal Information</div>
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-icon">👤</div>
                        <div className="info-content">
                            <label>Full Name</label>
                            <span>Mr. J. S. Ananda Kumar</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">🎓</div>
                        <div className="info-content">
                            <label>Qualification</label>
                            <span>M.Tech, (Ph.D.)</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">💼</div>
                        <div className="info-content">
                            <label>Experience</label>
                            <span>11 Years Teaching + 4 Years IT Industry</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">📧</div>
                        <div className="info-content">
                            <label>Email</label>
                            <span>anandakumar@sietk.org</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">📱</div>
                        <div className="info-content">
                            <label>Phone</label>
                            <span>+91-9876543210</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">🏛️</div>
                        <div className="info-content">
                            <label>Department</label>
                            <span>Master of Computer Application (MCA)</span>
                        </div>
                    </div>
                </div>

                <div className="section-title">Research & Interests</div>
                <div className="research-tags">
                    <span className="tag">Data Analytics</span>
                    <span className="tag">Machine Learning</span>
                    <span className="tag">Query Optimization</span>
                    <span className="tag">Data Science</span>
                    <span className="tag">Smart Systems</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;
