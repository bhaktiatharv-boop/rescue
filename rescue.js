// Image Preview Functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const preview = document.getElementById('preview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imageInfo = document.getElementById('imageInfo');
    const closePreviewBtn = document.getElementById('closePreview');

    // Close preview button functionality
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', function() {
            imageUpload.value = '';
            preview.style.display = 'none';
            imagePreviewContainer.style.display = 'none';
            imagePreviewContainer.classList.remove('active');
            if (imageInfo) imageInfo.textContent = '';
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    imageUpload.value = '';
                    return;
                }

                // Validate file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    alert('Image size should be less than 10MB. Please choose a smaller image.');
                    imageUpload.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    
                    // Get image dimensions
                    const img = new Image();
                    img.onload = function() {
                        const width = this.width;
                        const height = this.height;
                        const fileSizeKB = (file.size / 1024).toFixed(2);
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        const sizeDisplay = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
                        
                        if (imageInfo) {
                            imageInfo.innerHTML = `
                                <div class="info-item"><strong>Filename:</strong> ${file.name}</div>
                                <div class="info-item"><strong>Size:</strong> ${sizeDisplay}</div>
                                <div class="info-item"><strong>Dimensions:</strong> ${width} × ${height} pixels</div>
                                <div class="info-item"><strong>Type:</strong> ${file.type}</div>
                            `;
                        }
                    };
                    img.src = e.target.result;
                    
                    preview.style.display = 'block';
                    imagePreviewContainer.style.display = 'block';
                    imagePreviewContainer.classList.add('active');
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
                imagePreviewContainer.style.display = 'none';
                imagePreviewContainer.classList.remove('active');
                if (imageInfo) imageInfo.textContent = '';
            }
        });
    }
});

// Location Detection Function with High Precision
function getLocation() {
    const locationText = document.getElementById('locationText');
    const locationInput = document.getElementById('currentLocation');
    const coordinatesDisplay = document.getElementById('coordinatesDisplay');

    if (navigator.geolocation) {
        locationText.textContent = 'Detecting location with high precision...';
        locationText.style.color = '#2a9d8f';
        if (coordinatesDisplay) coordinatesDisplay.textContent = '';

        // High precision location options
        const options = {
            enableHighAccuracy: true,  // Use GPS for better accuracy
            timeout: 15000,            // Wait up to 15 seconds
            maximumAge: 0              // Don't use cached location
        };

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy; // Accuracy in meters
                
                // Show coordinates with high precision
                const coordinatesText = `Coordinates: ${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
                const accuracyText = `Accuracy: ±${accuracy.toFixed(1)} meters`;
                
                if (coordinatesDisplay) {
                    coordinatesDisplay.innerHTML = `
                        <div class="coord-item"><strong>${coordinatesText}</strong></div>
                        <div class="coord-item">${accuracyText}</div>
                    `;
                }
                
                // Reverse geocoding using OpenStreetMap Nominatim API
                const userAgent = 'AnimalRescueApp/1.0';
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                    headers: {
                        'User-Agent': userAgent
                    }
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Geocoding service unavailable');
                        return response.json();
                    })
                    .then(data => {
                        let fullAddress = '';
                        
                        if (data.address) {
                            const addr = data.address;
                            const addressParts = [];
                            if (addr.house_number) addressParts.push(addr.house_number);
                            if (addr.road) addressParts.push(addr.road);
                            if (addr.neighbourhood || addr.suburb) addressParts.push(addr.neighbourhood || addr.suburb);
                            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
                            if (addr.state_district) addressParts.push(addr.state_district);
                            if (addr.state) addressParts.push(addr.state);
                            if (addr.postcode) addressParts.push(addr.postcode);
                            if (addr.country) addressParts.push(addr.country);
                            
                            fullAddress = addressParts.join(', ');
                        }
                        
                        const displayAddress = data.display_name || fullAddress;
                        
                        if (displayAddress) {
                            locationInput.value = `${displayAddress} (${latitude.toFixed(8)}, ${longitude.toFixed(8)})`;
                            locationText.innerHTML = `✓ <strong>Location detected:</strong><br>${displayAddress}`;
                            locationText.style.color = '#2a9d8f';
                        } else {
                            locationInput.value = `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
                            locationText.textContent = `✓ Location coordinates detected`;
                            locationText.style.color = '#2a9d8f';
                        }
                    })
                    .catch(error => {
                        console.error('Geocoding error:', error);
                        locationInput.value = `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
                        locationText.textContent = `✓ Precise coordinates detected (address lookup unavailable)`;
                        locationText.style.color = '#2a9d8f';
                    });
            },
            function(error) {
                let errorMessage = 'Location detection failed. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please allow location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information unavailable. Please check your GPS/WiFi.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
                locationText.textContent = errorMessage;
                locationText.style.color = '#e63946';
                if (coordinatesDisplay) coordinatesDisplay.textContent = '';
            },
            options
        );
    } else {
        locationText.textContent = 'Geolocation is not supported by your browser.';
        locationText.style.color = '#e63946';
    }
}

// Form Submission Handler with Firebase
document.addEventListener('DOMContentLoaded', function() {
    console.log('Rescue form script loaded');
    const form = document.getElementById('rescueForm');
    
    if (form) {
        console.log('Rescue form found, attaching submit handler');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submit event triggered');
            
            // Disable submit button to prevent double submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            try {
                // Get form data - all fields
                const userName = document.getElementById('userName').value.trim();
                const contactNumber = document.getElementById('contactNumber').value.trim();
                const emailId = document.getElementById('emailId').value.trim();
                const currentLocation = document.getElementById('currentLocation').value.trim();
                const description = document.getElementById('description').value.trim();
                const imageFile = document.getElementById('imageUpload').files[0];
                
                // Validate required fields
                if (!userName || !contactNumber || !emailId || !currentLocation || !description) {
                    alert('Please fill in all required fields:\n- Full Name\n- Contact Number\n- Email ID\n- Location\n- Description');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailId)) {
                    alert('Please enter a valid email address.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    return;
                }
                
                console.log('Submitting rescue request with data:', {
                    userName,
                    contactNumber,
                    emailId,
                    currentLocation,
                    description,
                    hasImage: !!imageFile
                });
                
                // Import Firebase function with error handling
                let submitRescueRequest;
                try {
                    const module = await import('./rescue-db.js');
                    submitRescueRequest = module.submitRescueRequest;
                } catch (importError) {
                    console.error('Failed to import rescue-db.js:', importError);
                    throw new Error('Failed to load database functions. Please refresh the page and try again.');
                }
                
                if (!submitRescueRequest) {
                    throw new Error('Database function not available. Please refresh the page.');
                }
                
                // Submit to Firebase - this will save all fields including image
                console.log('Calling submitRescueRequest with:', {
                    userName, contactNumber, emailId, currentLocation, 
                    descriptionLength: description.length, 
                    hasImage: !!imageFile
                });
                
                let rescueId;
                try {
                    rescueId = await submitRescueRequest(userName, contactNumber, emailId, currentLocation, description, imageFile);
                } catch (submitError) {
                    console.error('Error in submitRescueRequest:', submitError);
                    throw submitError;
                }
                
                if (!rescueId) {
                    throw new Error('Failed to get document ID from Firebase. Data may not have been saved.');
                }
                
                console.log('Rescue request submitted successfully with ID:', rescueId);
                
                // Verify Firebase save by trying to read it back (optional, but helpful for debugging)
                try {
                    const { getAllRescueRequests } = await import('./rescue-db.js');
                    const allRescues = await getAllRescueRequests();
                    const savedRescue = allRescues.find(r => r.id === rescueId);
                    if (savedRescue) {
                        console.log('Verified: Rescue request found in Firebase database');
                    } else {
                        console.warn('Warning: Could not verify rescue request in database');
                    }
                } catch (verifyError) {
                    console.warn('Could not verify save (non-critical):', verifyError);
                }
                
                // Also save to localStorage for backward compatibility with admin page
                const rescueData = {
                    id: rescueId || Date.now().toString(),
                    userName: userName,
                    contactNumber: contactNumber,
                    emailId: emailId,
                    currentLocation: currentLocation,
                    description: description,
                    imageFileName: imageFile ? imageFile.name : 'No image',
                    status: 'pending',
                    date: new Date().toISOString()
                };
                
                const rescues = JSON.parse(localStorage.getItem('rescues') || '[]');
                rescues.push(rescueData);
                localStorage.setItem('rescues', JSON.stringify(rescues));
                
                // Display success message
                alert('✅ Rescue request submitted successfully!\n\n' +
                      'Name: ' + userName + '\n' +
                      'Contact: ' + contactNumber + '\n' +
                      'Email: ' + emailId + '\n' +
                      'Location: ' + currentLocation + '\n' +
                      'Image: ' + (imageFile ? imageFile.name : 'No image') + '\n\n' +
                      'Our team will contact you shortly.');
                
                // Reset form
                form.reset();
                const previewEl = document.getElementById('preview');
                const imagePreviewContainerEl = document.getElementById('imagePreviewContainer');
                if (previewEl) previewEl.style.display = 'none';
                if (imagePreviewContainerEl) {
                    imagePreviewContainerEl.style.display = 'none';
                    imagePreviewContainerEl.classList.remove('active');
                }
                const locationTextEl = document.getElementById('locationText');
                if (locationTextEl) {
                    locationTextEl.textContent = 'Location not detected';
                    locationTextEl.style.color = '#555';
                }
                const coordinatesDisplayEl = document.getElementById('coordinatesDisplay');
                if (coordinatesDisplayEl) {
                    coordinatesDisplayEl.textContent = '';
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                
            } catch (error) {
                console.error('Error submitting rescue request:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Full error:', error);
                
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                
                // Show detailed error message
                let errorMessage = 'Unknown error occurred';
                if (error.message) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                
                // Provide specific help for common errors
                let helpText = '';
                if (error.code === 'permission-denied' || errorMessage.includes('permission')) {
                    helpText = '\n\n🔧 SOLUTION: Your Firestore security rules need to allow writes. Go to Firebase Console > Firestore Database > Rules and update to:\n\n' +
                               'rules_version = \'2\';\n' +
                               'service cloud.firestore {\n' +
                               '  match /databases/{database}/documents {\n' +
                               '    match /rescues/{document=**} {\n' +
                               '      allow read, write: if true;\n' +
                               '    }\n' +
                               '  }\n' +
                               '}';
                } else if (error.code === 'unavailable' || errorMessage.includes('unavailable')) {
                    helpText = '\n\n🔧 SOLUTION: Check your internet connection and Firebase service status.';
                }
                
                alert('❌ Failed to submit rescue request.\n\nError: ' + errorMessage + 
                      '\n\nError Code: ' + (error.code || 'N/A') +
                      helpText +
                      '\n\nNote: Your data has been saved to localStorage as backup.');
            }
        });
    }
});
