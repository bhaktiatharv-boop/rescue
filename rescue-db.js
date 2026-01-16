import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7ArgnF73dIzmuOzzv47SpCantzLIExvg",
  authDomain: "rescue-f7520.firebaseapp.com",
  projectId: "rescue-f7520",
  storageBucket: "rescue-f7520.firebasestorage.app",
  appId: "1:677596488183:web:9bb91d7849391a378e4ef2"
};

// Initialize Firebase only if not already initialized
let app;
try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase initialized in rescue-db.js");
    } else {
        app = existingApps[0];
        console.log("Using existing Firebase app instance");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log("Firestore and Storage initialized:", { db: !!db, storage: !!storage, auth: !!auth });

// Collection name for Rescue requests
const RESCUE_COLLECTION = "rescues";

/**
 * Convert image file to Base64 string
 * @param {File} imageFile - The image file to convert
 * @returns {Promise<string>} - Returns the Base64 encoded string
 */
async function fileToBase64(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Upload image to Firebase Storage
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<string>} - Returns the Base64 encoded image string
 */
async function uploadRescueImage(imageFile) {
  try {
    console.log('Converting image to Base64:', imageFile.name, 'Size:', imageFile.size);
    const base64Data = await fileToBase64(imageFile);
    console.log("Image converted to Base64 successfully, size:", base64Data.length, "bytes");
    console.log("First 100 chars:", base64Data.substring(0, 100));
    return base64Data;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw error;
  }
}

/**
 * Submit a new rescue request
 * @param {string} userName - Name of the person reporting
 * @param {string} contactNumber - Contact number
 * @param {string} emailId - Email address
 * @param {string} currentLocation - Location with coordinates
 * @param {string} description - Description of the situation
 * @param {File} imageFile - Image file of the animal (optional)
 * @returns {Promise<string>} - Returns the document ID of the created rescue request
 */
export async function submitRescueRequest(userName, contactNumber, emailId, currentLocation, description, imageFile = null) {
  try {
    console.log("Starting rescue request submission...");
    console.log("Firebase app initialized:", !!app);
    console.log("Firestore database:", !!db);
    
    let imageURL = null;
    let imageFileName = null;
    let imageUploadError = null;
    
    // Upload image if provided
    if (imageFile) {
      imageFileName = imageFile.name;
      try {
        console.log("Uploading image:", imageFile.name);
        imageURL = await uploadRescueImage(imageFile);
        console.log("Image uploaded successfully:", imageURL);
      } catch (uploadError) {
        console.warn("Image upload failed, but continuing to save rescue request:", uploadError);
        // Record the error but continue with the rest of the data
        imageUploadError = uploadError.message || "Image upload failed";
        imageURL = null;
      }
    }
    
    const rescueData = {
      userName: userName,
      contactNumber: contactNumber,
      emailId: emailId,
      currentLocation: currentLocation,
      description: description,
      imageURL: imageURL,
      imageFileName: imageFileName,
      imageUploadError: imageUploadError,
      status: 'pending',
      date: new Date().toISOString()
    };

    console.log("Preparing to save to Firestore:", {
      collection: RESCUE_COLLECTION,
      userName: rescueData.userName,
      hasImageURL: !!rescueData.imageURL,
      imageURLLength: rescueData.imageURL ? rescueData.imageURL.length : 0,
      imageFileName: rescueData.imageFileName
    });

    // Check Firebase Auth state (for debugging)
    const currentUser = auth.currentUser;
    console.log("Current Firebase Auth user:", currentUser ? currentUser.email : "Not authenticated");
    
    // Note: If Firestore rules require auth but user is not authenticated, this will fail
    // Make sure your Firestore rules allow writes, or ensure user is authenticated via Firebase Auth

    // Save to Firestore
    console.log("Attempting to add document to collection:", RESCUE_COLLECTION);
    const docRef = await addDoc(collection(db, RESCUE_COLLECTION), rescueData);
    const docId = docRef.id;
    
    console.log("Document saved successfully with ID:", docId);
    
    // Verify the document was created
    try {
      const verifyDoc = await getDoc(doc(db, RESCUE_COLLECTION, docId));
      if (verifyDoc.exists()) {
        console.log("Verified: Document exists in Firestore");
      } else {
        console.error("Warning: Document was not found after creation");
      }
    } catch (verifyError) {
      console.warn("Could not verify document creation:", verifyError);
    }
    
    return docId;
  } catch (error) {
    console.error("Error submitting rescue request:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = "Failed to submit rescue request to database";
    if (error.code === 'permission-denied') {
      errorMessage = "Permission denied by Firestore. Please check your Firestore security rules - they may require authentication. Error code: permission-denied";
    } else if (error.code === 'unavailable') {
      errorMessage = "Database is temporarily unavailable. Please try again later.";
    } else if (error.code === 'unauthenticated') {
      errorMessage = "Authentication required. Please make sure you are logged in.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    throw new Error(errorMessage);
  }
}

/**
 * Get all rescue requests
 * @param {boolean} onlyPending - If true, returns only pending requests
 * @returns {Promise<Array>} - Array of rescue objects with id field
 */
export async function getAllRescueRequests(onlyPending = false) {
  try {
    console.log("getAllRescueRequests called with onlyPending:", onlyPending);
    console.log("Database reference:", db ? "Connected" : "Not connected");
    
    let q = query(collection(db, RESCUE_COLLECTION), orderBy("date", "desc"));
    console.log("Query created for collection:", RESCUE_COLLECTION);
    
    const querySnapshot = await getDocs(q);
    console.log("Query executed, documents found:", querySnapshot.size);
    
    const rescues = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      
      if (!onlyPending || data.status === 'pending') {
        rescues.push({
          id: doc.id,
          userName: data.userName || "",
          contactNumber: data.contactNumber || "",
          emailId: data.emailId || "",
          currentLocation: data.currentLocation || "",
          description: data.description || "",
          imageURL: data.imageURL || null,
          imageFileName: data.imageFileName || null,
          imageUploadError: data.imageUploadError || null,
          status: data.status || 'pending',
          date: data.date || new Date().toISOString()
        });
      }
    });
    
    console.log("Total rescues after filtering:", rescues.length);
    return rescues;
  } catch (error) {
    console.error("Error fetching rescue requests:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get a single rescue request by ID
 * @param {string} rescueId - The document ID of the rescue request
 * @returns {Promise<Object>} - Rescue object with id field
 */
export async function getRescueRequestById(rescueId) {
  try {
    const rescues = await getAllRescueRequests();
    const rescue = rescues.find(r => r.id === rescueId);
    return rescue || null;
  } catch (error) {
    console.error("Error fetching rescue request:", error);
    throw error;
  }
}

/**
 * Update rescue request status
 * @param {string} rescueId - The document ID of the rescue request to update
 * @param {string} status - New status (pending/accepted/rejected)
 * @returns {Promise<void>}
 */
export async function updateRescueRequestStatus(rescueId, status) {
  try {
    const rescueRef = doc(db, RESCUE_COLLECTION, rescueId);
    await updateDoc(rescueRef, {
      status: status
    });
  } catch (error) {
    console.error("Error updating rescue request status:", error);
    throw error;
  }
}

/**
 * Delete a rescue request
 * @param {string} rescueId - The document ID of the rescue request to delete
 * @returns {Promise<void>}
 */
export async function deleteRescueRequest(rescueId) {
  try {
    const rescueRef = doc(db, RESCUE_COLLECTION, rescueId);
    await deleteDoc(rescueRef);
  } catch (error) {
    console.error("Error deleting rescue request:", error);
    throw error;
  }
}

/**
 * Update rescue request details
 * @param {string} rescueId - The document ID of the rescue request to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateRescueRequest(rescueId, updates) {
  try {
    const rescueRef = doc(db, RESCUE_COLLECTION, rescueId);
    await updateDoc(rescueRef, updates);
  } catch (error) {
    console.error("Error updating rescue request:", error);
    throw error;
  }
}
