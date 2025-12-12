import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/sietk-logo.png';
import '../../styles/DashboardShared.css';

const FacultyDashboard = () => {
    const [activePage, setActivePage] = useState('home');
    const { logout } = useAuth();

    const menuItems = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'subjects', label: 'My Subjects', icon: '📚' },
        { id: 'bank', label: 'Question Bank', icon: '📝' },
        { id: 'papers', label: 'Generate Papers', icon: '🎯' },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return (
                    <div className="welcome-card">
                        <h2>Welcome, Faculty!</h2>
                        <p>
                            Manage your teaching operations from this dashboard. You can view your assigned subjects,
                            upload questions to the question bank, generate unique question paper sets, and access
                            resources — all in one place!
                        </p>
                    </div>
                );
            case 'profile':
                return (
                    <div className="section-card">
                        <h2>👤 My Profile</h2>
                        <p>View and update your personal details, contact information, and qualifications.</p>
                    </div>
                );
            case 'subjects':
                return (
                    <div className="section-card">
                        <h2>📚 My Subjects</h2>
                        <p>View the list of subjects assigned to you for the current semester.</p>
                    </div>
                );
            case 'bank':
                return (
                    <div className="section-card">
                        <h2>📝 Question Bank</h2>
                        <p>Upload, organize, and manage questions for your subjects.</p>
                    </div>
                );
            case 'papers':
                return (
                    <div className="section-card">
                        <h2>🎯 Generate Question Papers</h2>
                        <p>Create multiple unique question paper sets from your question bank.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-container faculty-theme">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <img src={logo} alt="SIET Logo" className="logo" />
                        <div className="header-text">
                            <h1>SIET - MCA Department</h1>
                            <p>Faculty Dashboard</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <div className="user-avatar">F</div>
                            <div className="user-details">
                                <span>Faculty Member</span>
                                <small>Instructor</small>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="main-layout">
                {/* Sidebar */}
                <aside className="sidebar faculty-sidebar">
                    <div className="sidebar-title">Menu</div>
                    <nav className="nav-links">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
                                onClick={() => setActivePage(item.id)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="logout-section">
                        <button className="logout-btn" onClick={logout}>
                            <span className="nav-icon">🚪</span>
                            <span className="nav-label">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="content-area">
                    <div className="content-wrapper">
                        {renderContent()}
                    </div>
                </main>
            </div>

            <style>{`
        .welcome-card {
          background: linear-gradient(135deg, #1E293B 0%, rgba(14, 165, 233, 0.1) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
        }
        .welcome-card h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #0EA5E9, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .welcome-card p {
          color: #94A3B8;
          font-size: 15px;
          line-height: 1.7;
          max-width: 600px;
        }
        .section-card {
          background: #1E293B;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
        }
        .section-card h2 {
          font-size: 22px;
          font-weight: 700;
          color: #F1F5F9;
          margin-bottom: 12px;
        }
        .section-card p {
          color: #94A3B8;
          line-height: 1.6;
        }
      `}</style>
        </div>
    );
};

export default FacultyDashboard;
