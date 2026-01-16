// Authentication System using localStorage
// This will be replaced with backend authentication later

// Check if user is logged in
function isLoggedIn() {
    const user = localStorage.getItem('currentUser');
    return user !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Login function
function login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user: user };
    }
    return { success: false, message: 'Invalid email or password' };
}

// Signup function
function signup(name, email, password, contact, isAdmin = false) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'User with this email already exists' };
    }
    
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        contact: contact,
        isAdmin: isAdmin,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return { success: true, user: newUser };
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Require authentication - redirect to login if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Require admin - redirect to index if not admin
function requireAdmin() {
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
