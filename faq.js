import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7ArgnF73dIzmuOzzv47SpCantzLIExvg",
  authDomain: "rescue-f7520.firebaseapp.com",
  projectId: "rescue-f7520",
  appId: "1:677596488183:web:9bb91d7849391a378e4ef2"
};

// Initialize Firebase only if not already initialized
let app;
const existingApps = getApps();
if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized in faq.js");
} else {
  app = existingApps[0];
  console.log("Using existing Firebase app instance in faq.js");
}

const db = getFirestore(app);

// Collection name for FAQs
const FAQ_COLLECTION = "faqs";

/**
 * Submit a new FAQ question
 * @param {string} userName - Name of the user asking the question
 * @param {string} userEmail - Email of the user
 * @param {string} userContact - Contact number of the user
 * @param {string} userQuestion - The question text
 * @returns {Promise<string>} - Returns the document ID of the created FAQ
 */
export async function submitFAQQuestion(userName, userEmail, userContact, userQuestion) {
  try {
    const faqData = {
      userName: userName,
      userEmail: userEmail,
      userContact: userContact,
      userQuestion: userQuestion,
      answered: false,
      date: new Date().toISOString(),
      answer: null,
      answeredDate: null
    };

    const docRef = await addDoc(collection(db, FAQ_COLLECTION), faqData);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting FAQ question:", error);
    throw error;
  }
}

/**
 * Get all FAQ questions
 * @param {boolean} onlyUnanswered - If true, returns only unanswered questions
 * @returns {Promise<Array>} - Array of FAQ objects with id field
 */
export async function getAllFAQQuestions(onlyUnanswered = false) {
  try {
    console.log("getAllFAQQuestions called with onlyUnanswered:", onlyUnanswered);
    console.log("Database reference:", db ? "Connected" : "Not connected");
    
    let q = query(collection(db, FAQ_COLLECTION), orderBy("date", "desc"));
    console.log("Query created for collection:", FAQ_COLLECTION);
    
    const querySnapshot = await getDocs(q);
    console.log("Query executed, documents found:", querySnapshot.size);
    
    const faqs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      
      if (!onlyUnanswered || !data.answered) {
        faqs.push({
          id: doc.id,
          userName: data.userName || "",
          userEmail: data.userEmail || "",
          userContact: data.userContact || "",
          userQuestion: data.userQuestion || "",
          answered: data.answered || false,
          date: data.date || new Date().toISOString(),
          answer: data.answer || null,
          answeredDate: data.answeredDate || null
        });
      }
    });
    
    console.log("Total FAQ questions after filtering:", faqs.length);
    return faqs;
  } catch (error) {
    console.error("Error fetching FAQ questions:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get a single FAQ question by ID
 * @param {string} faqId - The document ID of the FAQ
 * @returns {Promise<Object>} - FAQ object with id field
 */
export async function getFAQQuestionById(faqId) {
  try {
    const faqs = await getAllFAQQuestions();
    const faq = faqs.find(f => f.id === faqId);
    return faq || null;
  } catch (error) {
    console.error("Error fetching FAQ question:", error);
    throw error;
  }
}

/**
 * Update FAQ question with an answer
 * @param {string} faqId - The document ID of the FAQ to update
 * @param {string} answer - The answer text
 * @returns {Promise<void>}
 */
export async function answerFAQQuestion(faqId, answer) {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, faqId);
    await updateDoc(faqRef, {
      answer: answer,
      answered: true,
      answeredDate: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error answering FAQ question:", error);
    throw error;
  }
}

/**
 * Delete a FAQ question
 * @param {string} faqId - The document ID of the FAQ to delete
 * @returns {Promise<void>}
 */
export async function deleteFAQQuestion(faqId) {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, faqId);
    await deleteDoc(faqRef);
  } catch (error) {
    console.error("Error deleting FAQ question:", error);
    throw error;
  }
}

/**
 * Update FAQ question details (for admin editing)
 * @param {string} faqId - The document ID of the FAQ to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateFAQQuestion(faqId, updates) {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, faqId);
    await updateDoc(faqRef, updates);
  } catch (error) {
    console.error("Error updating FAQ question:", error);
    throw error;
  }
}
