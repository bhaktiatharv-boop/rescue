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
  console.log("Firebase initialized in donation.js");
} else {
  app = existingApps[0];
  console.log("Using existing Firebase app instance in donation.js");
}

const db = getFirestore(app);

// Collection name for Donations
const DONATION_COLLECTION = "donations";

/**
 * Submit a new donation
 * @param {string} name - Name of the donor
 * @param {string} email - Email address
 * @param {string} contact - Contact number
 * @param {number} amount - Donation amount
 * @param {string} purpose - Purpose of donation
 * @param {string} message - Optional message
 * @returns {Promise<string>} - Returns the document ID of the created donation
 */
export async function submitDonation(name, email, contact, amount, purpose, message = "") {
  try {
    const donationData = {
      name: name,
      email: email,
      contact: contact,
      amount: parseFloat(amount),
      purpose: purpose,
      message: message || "",
      date: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, DONATION_COLLECTION), donationData);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting donation:", error);
    throw error;
  }
}

/**
 * Get all donations
 * @returns {Promise<Array>} - Array of donation objects with id field
 */
export async function getAllDonations() {
  try {
    console.log("getAllDonations called");
    console.log("Database reference:", db ? "Connected" : "Not connected");
    
    let q = query(collection(db, DONATION_COLLECTION), orderBy("date", "desc"));
    console.log("Query created for collection:", DONATION_COLLECTION);
    
    const querySnapshot = await getDocs(q);
    console.log("Query executed, documents found:", querySnapshot.size);
    
    const donations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      
      donations.push({
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        contact: data.contact || "",
        amount: data.amount || 0,
        purpose: data.purpose || "",
        message: data.message || "",
        date: data.date || new Date().toISOString()
      });
    });
    
    console.log("Total donations:", donations.length);
    return donations;
  } catch (error) {
    console.error("Error fetching donations:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get a single donation by ID
 * @param {string} donationId - The document ID of the donation
 * @returns {Promise<Object>} - Donation object with id field
 */
export async function getDonationById(donationId) {
  try {
    const donations = await getAllDonations();
    const donation = donations.find(d => d.id === donationId);
    return donation || null;
  } catch (error) {
    console.error("Error fetching donation:", error);
    throw error;
  }
}

/**
 * Get total donation amount
 * @returns {Promise<number>} - Total amount of all donations
 */
export async function getTotalDonations() {
  try {
    const donations = await getAllDonations();
    const total = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    return total;
  } catch (error) {
    console.error("Error calculating total donations:", error);
    throw error;
  }
}

/**
 * Delete a donation
 * @param {string} donationId - The document ID of the donation to delete
 * @returns {Promise<void>}
 */
export async function deleteDonation(donationId) {
  try {
    const donationRef = doc(db, DONATION_COLLECTION, donationId);
    await deleteDoc(donationRef);
  } catch (error) {
    console.error("Error deleting donation:", error);
    throw error;
  }
}

/**
 * Update donation details
 * @param {string} donationId - The document ID of the donation to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateDonation(donationId, updates) {
  try {
    const donationRef = doc(db, DONATION_COLLECTION, donationId);
    await updateDoc(donationRef, updates);
  } catch (error) {
    console.error("Error updating donation:", error);
    throw error;
  }
}
