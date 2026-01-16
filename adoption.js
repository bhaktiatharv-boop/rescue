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
  console.log("Firebase initialized in adoption.js");
} else {
  app = existingApps[0];
  console.log("Using existing Firebase app instance in adoption.js");
}

const db = getFirestore(app);

// Collection name for Adoptions
const ADOPTION_COLLECTION = "adoptions";

/**
 * Submit a new adoption request
 * @param {string} animalId - ID of the animal being adopted
 * @param {string} animalName - Name of the animal
 * @param {string} animalType - Type of the animal
 * @param {string} name - Name of the adopter
 * @param {string} email - Email address
 * @param {string} contact - Contact number
 * @param {string} address - Address of the adopter
 * @returns {Promise<string>} - Returns the document ID of the created adoption request
 */
export async function submitAdoptionRequest(animalId, animalName, animalType, name, email, contact, address) {
  try {
    const adoptionData = {
      animalId: animalId,
      animalName: animalName,
      animalType: animalType,
      name: name,
      email: email,
      contact: contact,
      address: address,
      status: 'pending',
      date: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, ADOPTION_COLLECTION), adoptionData);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting adoption request:", error);
    throw error;
  }
}

/**
 * Get all adoption requests
 * @param {boolean} onlyPending - If true, returns only pending requests
 * @returns {Promise<Array>} - Array of adoption objects with id field
 */
export async function getAllAdoptionRequests(onlyPending = false) {
  try {
    console.log("getAllAdoptionRequests called with onlyPending:", onlyPending);
    console.log("Database reference:", db ? "Connected" : "Not connected");
    
    let q = query(collection(db, ADOPTION_COLLECTION), orderBy("date", "desc"));
    console.log("Query created for collection:", ADOPTION_COLLECTION);
    
    const querySnapshot = await getDocs(q);
    console.log("Query executed, documents found:", querySnapshot.size);
    
    const adoptions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      
      if (!onlyPending || data.status === 'pending') {
        adoptions.push({
          id: doc.id,
          animalId: data.animalId || "",
          animalName: data.animalName || "",
          animalType: data.animalType || "",
          name: data.name || "",
          email: data.email || "",
          contact: data.contact || "",
          address: data.address || "",
          status: data.status || 'pending',
          date: data.date || new Date().toISOString()
        });
      }
    });
    
    console.log("Total adoptions after filtering:", adoptions.length);
    return adoptions;
  } catch (error) {
    console.error("Error fetching adoption requests:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get a single adoption request by ID
 * @param {string} adoptionId - The document ID of the adoption request
 * @returns {Promise<Object>} - Adoption object with id field
 */
export async function getAdoptionRequestById(adoptionId) {
  try {
    const adoptions = await getAllAdoptionRequests();
    const adoption = adoptions.find(a => a.id === adoptionId);
    return adoption || null;
  } catch (error) {
    console.error("Error fetching adoption request:", error);
    throw error;
  }
}

/**
 * Update adoption request status
 * @param {string} adoptionId - The document ID of the adoption request to update
 * @param {string} status - New status (pending/accepted/rejected)
 * @returns {Promise<void>}
 */
export async function updateAdoptionRequestStatus(adoptionId, status) {
  try {
    const adoptionRef = doc(db, ADOPTION_COLLECTION, adoptionId);
    await updateDoc(adoptionRef, {
      status: status
    });
  } catch (error) {
    console.error("Error updating adoption request status:", error);
    throw error;
  }
}

/**
 * Delete an adoption request
 * @param {string} adoptionId - The document ID of the adoption request to delete
 * @returns {Promise<void>}
 */
export async function deleteAdoptionRequest(adoptionId) {
  try {
    const adoptionRef = doc(db, ADOPTION_COLLECTION, adoptionId);
    await deleteDoc(adoptionRef);
  } catch (error) {
    console.error("Error deleting adoption request:", error);
    throw error;
  }
}

/**
 * Update adoption request details
 * @param {string} adoptionId - The document ID of the adoption request to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateAdoptionRequest(adoptionId, updates) {
  try {
    const adoptionRef = doc(db, ADOPTION_COLLECTION, adoptionId);
    await updateDoc(adoptionRef, updates);
  } catch (error) {
    console.error("Error updating adoption request:", error);
    throw error;
  }
}
