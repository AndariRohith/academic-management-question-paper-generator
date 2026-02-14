import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/sietk-logo.png';
import './Login.css';

const Login = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [hodUser, setHodUser] = useState('');
    const [hodPass, setHodPass] = useState('');
    const [facultyUser, setFacultyUser] = useState('');
    const [facultyPass, setFacultyPass] = useState('');
    const [hodError, setHodError] = useState('');
    const [facultyError, setFacultyError] = useState('');
    const [showHodPass, setShowHodPass] = useState(false);
    const [showFacultyPass, setShowFacultyPass] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Demo credentials
    const hodCredentials = { username: 'hod', password: 'hod123' };
    const facultyCredentials = { username: 'faculty', password: 'faculty123' };

    useEffect(() => {
        if (user) {
            if (user.role === 'hod') {
                navigate('/hod');
            } else {
                navigate('/faculty');
            }
        }
    }, [user, navigate]);

    const handleHodLogin = (e) => {
        e.preventDefault();
        if (hodUser === hodCredentials.username && hodPass === hodCredentials.password) {
            login('hod', hodUser);
            navigate('/hod');
        } else {
            setHodError('Invalid credentials. Please try again.');
        }
    };

    const handleFacultyLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://127.0.0.1:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: facultyUser, password: facultyPass }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                login('faculty', data.user.username);
                navigate('/faculty');
            } else {
                setFacultyError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setFacultyError('Server error. Please try again.');
        }
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
        setHodError('');
        setFacultyError('');
    };

    return (
        <div className="login-page">
            {/* Background Orbs */}
            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>
            <div className="bg-orb orb-3"></div>

            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <img src={logo} alt="SIET Logo" className="logo" />
                    <div className="header-text">
                        <h1>Siddharth Institute of Engineering & Technology</h1>
                        <h2>(Autonomous)</h2>
                    </div>
                    <img src={logo} alt="SIET Logo" className="logo" />
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="department-badge">Master of Computer Application</div>

                <div className={`flip-container ${isFlipped ? 'flipped' : ''}`}>
                    <div className="flipper">
                        {/* Front: HOD Login */}
                        <div className="card-face card-front">
                            <div className="card-header">
                                <div className="icon hod-icon">👨‍💼</div>
                                <h3>HOD Login</h3>
                                <p>Access your administrative dashboard</p>
                            </div>

                            {hodError && <div className="error-message">{hodError}</div>}

                            <form className="login-form" onSubmit={handleHodLogin}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="User ID"
                                        value={hodUser}
                                        onChange={(e) => setHodUser(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type={showHodPass ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={hodPass}
                                        onChange={(e) => setHodPass(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowHodPass(!showHodPass)}
                                    >
                                        {showHodPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <div className="btn-group">
                                    <button type="submit" className="btn btn-submit-hod">Sign In</button>
                                    <button type="button" className="btn btn-clear" onClick={() => { setHodUser(''); setHodPass(''); }}>Clear</button>
                                </div>
                            </form>

                            <div className="switch-link">
                                <span>Faculty member? </span>
                                <a onClick={flipCard}>Login here →</a>
                            </div>
                        </div>

                        {/* Back: Faculty Login */}
                        <div className="card-face card-back">
                            <div className="card-header">
                                <div className="icon faculty-icon">👨‍🏫</div>
                                <h3>Faculty Login</h3>
                                <p>Access your teaching dashboard</p>
                            </div>

                            {facultyError && <div className="error-message">{facultyError}</div>}

                            <form className="login-form" onSubmit={handleFacultyLogin}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="User ID"
                                        value={facultyUser}
                                        onChange={(e) => setFacultyUser(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type={showFacultyPass ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={facultyPass}
                                        onChange={(e) => setFacultyPass(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowFacultyPass(!showFacultyPass)}
                                    >
                                        {showFacultyPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <div className="btn-group">
                                    <button type="submit" className="btn btn-submit-faculty">Sign In</button>
                                    <button type="button" className="btn btn-clear" onClick={() => { setFacultyUser(''); setFacultyPass(''); }}>Clear</button>
                                </div>
                            </form>

                            <div className="switch-link">
                                <span>HOD? </span>
                                <a onClick={flipCard}>← Login here</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
