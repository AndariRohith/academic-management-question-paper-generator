/**
 * Authentication Module
 * Handles user session management using sessionStorage
 */

const Auth = {
    // Store session data after successful login
    login(role, username) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('loginTime', new Date().toISOString());
    },

    // Clear session and redirect to login
    logout() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    },

    // Get the current user's role
    getRole() {
        return sessionStorage.getItem('userRole');
    },

    // Get the current username
    getUsername() {
        return sessionStorage.getItem('username');
    },

    // Require authentication - redirects to login if not authenticated
    // allowedRoles: optional array of roles that can access the page
    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            window.location.replace('login.html');
            return false;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(this.getRole())) {
            alert('Access denied. You do not have permission to view this page.');
            window.location.replace('login.html');
            return false;
        }

        return true;
    },

    // Redirect authenticated users to their dashboard
    redirectToDashboard() {
        if (this.isAuthenticated()) {
            const role = this.getRole();
            if (role === 'hod') {
                window.location.replace('hod_dashboard.html');
            } else if (role === 'faculty') {
                window.location.replace('faculty_dashboard.html');
            }
            return true;
        }
        return false;
    }
};

// Make Auth globally available
window.Auth = Auth;
