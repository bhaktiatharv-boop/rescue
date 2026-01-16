import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
        console.log("Firebase initialized in animals-db.js");
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

console.log("Firestore and Storage initialized:", { db: !!db, storage: !!storage });

// Collection name for Animals
const ANIMALS_COLLECTION = "animals";

/**
 * Convert image file to Base64 string
 * @param {File} imageFile - The image file to convert
 * @returns {Promise<string>} - Returns the Base64 encoded string
 */
export async function fileToBase64(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log(`fileToBase64: Image converted, size: ${reader.result.length} bytes`);
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      console.error('fileToBase64 error:', error);
      reject(error);
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Upload animal image to Firebase Storage
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<string>} - Returns the Base64 encoded image string
 */
export async function uploadAnimalImage(imageFile) {
  try {
    console.log('Converting image to Base64:', imageFile.name);
    const base64Data = await fileToBase64(imageFile);
    console.log("Image converted to Base64 successfully, size:", base64Data.length);
    return base64Data;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw error;
  }
}

/**
 * Add a new animal for adoption
 * @param {string} name - Name of the animal
 * @param {string} type - Type of animal (Dog, Cat, Bird, etc.)
 * @param {string} age - Age of the animal
 * @param {string} gender - Gender of the animal
 * @param {string} description - Description of the animal
 * @param {File} imageFile - Image file of the animal (optional)
 * @param {string} compressedImageBase64 - Pre-compressed Base64 image string (optional)
 * @returns {Promise<string>} - Returns the document ID of the created animal
 */
export async function addAnimal(name, type, age, gender, description, imageFile = null, compressedImageBase64 = null) {
  try {
    console.log("Starting animal add...");
    console.log("Firebase app initialized:", !!app);
    console.log("Firestore database:", !!db);
    
    let imageURL = null;
    let imageFileName = null;
    let imageUploadError = null;
    
    // Use pre-compressed image if provided, otherwise try to upload the file
    if (compressedImageBase64) {
      console.log("Using pre-compressed image, size:", compressedImageBase64.length);
      imageURL = compressedImageBase64;
    } else if (imageFile) {
      imageFileName = imageFile.name;
      try {
        console.log("Uploading animal image:", imageFile.name);
        imageURL = await uploadAnimalImage(imageFile);
        console.log("Animal image uploaded successfully, size:", imageURL.length);
      } catch (uploadError) {
        console.warn("Image upload failed, but continuing to save animal:", uploadError);
        imageUploadError = uploadError.message || "Image upload failed";
        imageURL = null;
      }
    }
    
    const animalData = {
      name: name,
      type: type,
      age: age,
      gender: gender,
      description: description,
      imageURL: imageURL,
      imageFileName: imageFileName,
      imageUploadError: imageUploadError,
      dateAdded: new Date().toISOString()
    };

    console.log("Preparing to save to Firestore:", {
      collection: ANIMALS_COLLECTION,
      data: animalData
    });

    // Save to Firestore
    console.log("Attempting to add document to collection:", ANIMALS_COLLECTION);
    const docRef = await addDoc(collection(db, ANIMALS_COLLECTION), animalData);
    const docId = docRef.id;
    
    console.log("Animal saved successfully with ID:", docId);
    return docId;
  } catch (error) {
    console.error("Error adding animal:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    throw new Error(error.message || "Failed to add animal to database");
  }
}

/**
 * Get all animals
 * @returns {Promise<Array>} - Array of animal objects with id field
 */
export async function getAllAnimals() {
  try {
    console.log("getAllAnimals called");
    console.log("Database reference:", db ? "Connected" : "Not connected");
    
    let q = query(collection(db, ANIMALS_COLLECTION), orderBy("dateAdded", "desc"));
    console.log("Query created for collection:", ANIMALS_COLLECTION);
    
    const querySnapshot = await getDocs(q);
    console.log("Query executed, documents found:", querySnapshot.size);
    
    const animals = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      
      animals.push({
        id: doc.id,
        name: data.name || "",
        type: data.type || "",
        age: data.age || "",
        gender: data.gender || "",
        description: data.description || "",
        imageURL: data.imageURL || null,
        imageFileName: data.imageFileName || null,
        imageUploadError: data.imageUploadError || null,
        dateAdded: data.dateAdded || new Date().toISOString()
      });
    });
    
    console.log("Total animals:", animals.length);
    return animals;
  } catch (error) {
    console.error("Error fetching animals:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Get a single animal by ID
 * @param {string} animalId - The document ID of the animal
 * @returns {Promise<Object>} - Animal object with id field
 */
export async function getAnimalById(animalId) {
  try {
    const animals = await getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    return animal || null;
  } catch (error) {
    console.error("Error fetching animal:", error);
    throw error;
  }
}

/**
 * Update an animal
 * @param {string} animalId - The document ID of the animal to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateAnimal(animalId, updates) {
  try {
    const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
    await updateDoc(animalRef, updates);
    console.log("Animal updated successfully:", animalId);
  } catch (error) {
    console.error("Error updating animal:", error);
    throw error;
  }
}

/**
 * Delete an animal
 * @param {string} animalId - The document ID of the animal to delete
 * @returns {Promise<void>}
 */
export async function deleteAnimal(animalId) {
  try {
    const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
    await deleteDoc(animalRef);
    console.log("Animal deleted successfully:", animalId);
  } catch (error) {
    console.error("Error deleting animal:", error);
    throw error;
  }
}
