import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('userRole');
        const username = sessionStorage.getItem('username');

        if (isLoggedIn === 'true' && userRole && username) {
            setUser({ role: userRole, username });
        }
        setLoading(false);
    }, []);

    const login = (role, username) => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('loginTime', new Date().toISOString());
        setUser({ role, username });
    };

    const logout = () => {
        sessionStorage.clear();
        setUser(null);
    };

    const isAuthenticated = () => {
        return user !== null;
    };

    const getRole = () => {
        return user?.role || null;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        getRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
