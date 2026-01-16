import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7ArgnF73dIzmuOzzv47SpCantzLIExvg",
  authDomain: "rescue-f7520.firebaseapp.com",
  projectId: "rescue-f7520",
  appId: "1:677596488183:web:9bb91d7849391a378e4ef2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin signup button handler
document.addEventListener('DOMContentLoaded', function() {
  const adminSignupBtn = document.getElementById('adminSignupBtn');
  if (adminSignupBtn) {
    adminSignupBtn.addEventListener('click', function() {
      // Pre-fill admin email
      document.getElementById('email').value = 'admin@rescue.com';
      document.getElementById('email').focus();
      // Show hint
      const msgEl = document.getElementById('msg');
      if (msgEl) {
        msgEl.innerText = 'Enter your name and password to create admin account';
        msgEl.style.color = '#2a9d8f';
      }
    });
  }
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // 🚫 NO reload

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Check if user is admin (check email)
    // Admin emails - must match the same list in login.js
    const adminEmails = ['admin@rescue.com', 'admin@animalrescue.com'];
    const isAdmin = adminEmails.includes(email.toLowerCase());

    // Save user data to Firestore with isAdmin flag
    await setDoc(doc(db, "users", cred.user.uid), {
      name: name,
      email: email,
      isAdmin: isAdmin
    });

    // Store in localStorage for auth.js compatibility
    const currentUser = {
      id: cred.user.uid,
      name: name,
      email: email,
      isAdmin: isAdmin
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Clear any previous messages
    document.getElementById("msg").innerText = "";
    
    // Redirect based on user type
    if (isAdmin) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    document.getElementById("msg").innerText = err.message;
  }
});
