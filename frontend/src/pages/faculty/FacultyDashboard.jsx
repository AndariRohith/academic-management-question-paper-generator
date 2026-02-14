import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/sietk-logo.png';
import '../../styles/DashboardShared.css';

// Embedded page components
import FacultyProfile from './FacultyProfile';
import MySubjects from './MySubjects';
import FacultyQuestionBank from './FacultyQuestionBank';
import FacultyGenerator from './FacultyGenerator';

const FacultyDashboard = () => {
    // 1. first navigation page is profile like same as hod page. by defalut opens the profile of the faculty.
    const [activePage, setActivePage] = useState('profile');
    const { logout } = useAuth();

    const menuItems = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'subjects', label: 'My Subjects', icon: '📚' },
        { id: 'questionbank', label: 'Question Bank', icon: '📝' },
        { id: 'generator', label: 'Generate Papers', icon: '🎯' },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'profile':
                return <FacultyProfile />;
            case 'subjects':
                return <MySubjects />;
            case 'questionbank':
                return <FacultyQuestionBank />;
            case 'generator':
                return <FacultyGenerator />;
            default:
                return <FacultyProfile />;
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
                                <small>Academic Staff</small>
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
        </div>
    );
};

export default FacultyDashboard;
