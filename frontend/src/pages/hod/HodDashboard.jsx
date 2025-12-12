import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/sietk-logo.png';
import '../../styles/DashboardShared.css';

// Embedded page components
import Profile from './Profile';
import Stats from './Stats';
import Faculty from './Faculty';
import Regulation from './Regulation';
import Subjects from './Subjects';
import QuestionBank from './QuestionBank';
import Generator from './Generator';

const HodDashboard = () => {
    const [activePage, setActivePage] = useState('profile');
    const { logout } = useAuth();

    const menuItems = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'faculty', label: 'Manage Faculty', icon: '👨‍🏫' },
        { id: 'regulation', label: 'Regulations', icon: '📋' },
        { id: 'subjects', label: 'Manage Subjects', icon: '📚' },
        { id: 'questionbank', label: 'Question Bank', icon: '📝' },
        { id: 'generator', label: 'Generate Papers', icon: '🎯' },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'profile':
                return <Profile />;
            case 'dashboard':
                return <Stats />;
            case 'faculty':
                return <Faculty />;
            case 'regulation':
                return <Regulation />;
            case 'subjects':
                return <Subjects />;
            case 'questionbank':
                return <QuestionBank />;
            case 'generator':
                return <Generator />;
            default:
                return <Profile />;
        }
    };

    return (
        <div className="dashboard-container hod-theme">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <img src={logo} alt="SIET Logo" className="logo" />
                        <div className="header-text">
                            <h1>SIET - MCA Department</h1>
                            <p>HOD Dashboard</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <div className="user-avatar">H</div>
                            <div className="user-details">
                                <span>Head of Department</span>
                                <small>Administrator</small>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="main-layout">
                {/* Sidebar */}
                <aside className="sidebar hod-sidebar">
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

export default HodDashboard;
