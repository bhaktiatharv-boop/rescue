import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7ArgnF73dIzmuOzzv47SpCantzLIExvg",
  authDomain: "rescue-f7520.firebaseapp.com",
  projectId: "rescue-f7520",
  appId: "1:677596488183:web:9bb91d7849391a378e4ef2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin login button handler
document.addEventListener('DOMContentLoaded', function() {
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function() {
      // Pre-fill admin email
      document.getElementById('email').value = 'admin@rescue.com';
      document.getElementById('email').focus();
      // Show hint
      const errorEl = document.getElementById('error');
      if (errorEl) {
        errorEl.innerText = 'Please enter your admin password';
        errorEl.style.color = '#2a9d8f';
      }
    });
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // 🚫 NO reload

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : { name: email, email: email };
    
    // Check if user is admin (check email or isAdmin flag)
    // Admin emails - you can add more admin emails here
    const adminEmails = ['admin@rescue.com', 'admin@animalrescue.com'];
    const isAdmin = userData.isAdmin || adminEmails.includes(user.email.toLowerCase());
    
    // Store in localStorage for auth.js compatibility
    const currentUser = {
      id: user.uid,
      name: userData.name || email,
      email: user.email,
      isAdmin: isAdmin
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Clear any previous error messages
    document.getElementById("error").innerText = "";
    
    // Redirect based on user type
    if (isAdmin) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    document.getElementById("error").innerText = err.message;
  }
});