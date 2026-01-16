// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAMR2wMFEHYIGCHJQPaW_3pMJ0h7ECncH8",
    authDomain: "animal-48d35.firebaseapp.com",
    projectId: "animal-48d35",
    storageBucket: "animal-48d35.firebasestorage.app",
    messagingSenderId: "18590928031",
    appId: "1:18590928031:web:2c457eb3cb18e647dd66aa",
    measurementId: "G-BJF5Z7WM5Q"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);