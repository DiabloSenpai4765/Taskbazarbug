const fs = require("fs");
const { app, bookingsFilePath, bookings } = require("../backend/server");

// frontend/login-otp.js
let confirmationResultGlobal; 

window.onload = () => {
    const loginTriggerIcon = document.querySelector('footer .bi-person-fill');
    if (loginTriggerIcon) {
        loginTriggerIcon.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // Ensure these elements exist before adding listeners
    const loginOverlay = document.getElementById('loginOverlay');
    if(loginOverlay) loginOverlay.addEventListener('click', closeOtpLoginModal);
    
    const extraOverlay = document.getElementById('extraOverlay');
    if(extraOverlay) extraOverlay.addEventListener('click', closeExtraInfoModal);

    const successOverlay = document.getElementById('successOverlay');
    if(successOverlay) successOverlay.addEventListener('click', closeSuccessModal); 

    const otpCloseBtn = document.querySelector('#otpLoginModal .close-btn');
    if(otpCloseBtn) otpCloseBtn.addEventListener('click', closeOtpLoginModal);
    
    const extraInfoCloseBtn = document.querySelector('#extraInfoModal .close-btn');
    if(extraInfoCloseBtn) extraInfoCloseBtn.addEventListener('click', closeExtraInfoModal);

    const successCloseBtn = document.querySelector('#successModal .close-btn');
    if(successCloseBtn) successCloseBtn.addEventListener('click', closeSuccessModal); 
};

function closeOtpLoginModal() {
    if(document.getElementById('otpLoginModal')) document.getElementById('otpLoginModal').style.display = 'none';
    if(document.getElementById('loginOverlay')) document.getElementById('loginOverlay').style.display = 'none';
    // Clear OTP input and hide OTP section when closing modal
    if(document.getElementById("otpInput")) document.getElementById("otpInput").value = "";
    if(document.getElementById("otpSection")) document.getElementById("otpSection").style.display = "none";
    // Also reset recaptcha
    if(window.recaptchaVerifierInstance && typeof grecaptcha !== "undefined") {
        window.recaptchaVerifierInstance.render().then(function(widgetId) {
            grecaptcha.reset(widgetId);
        });
    }
}

function closeExtraInfoModal() {
    if(document.getElementById('extraInfoModal')) document.getElementById('extraInfoModal').style.display = 'none';
    if(document.getElementById('extraOverlay')) document.getElementById('extraOverlay').style.display = 'none';
    // Clear form fields
    if(document.getElementById('fullName')) document.getElementById('fullName').value = '';
    if(document.getElementById('displayName')) document.getElementById('displayName').value = '';
    if(document.getElementById('email')) document.getElementById('email').value = '';
}

// This function might be called from index.html too, so ensure it's globally accessible
function closeSuccessModal() { 
    if(document.getElementById('successModal')) {
        document.getElementById('successModal').style.display = 'none';
        // Reset styles for success modal to its default if it was changed to error
        document.getElementById('successModal').style.backgroundColor = '';
        document.getElementById('successModalTitle').style.color = '';
    }
    if(document.getElementById('successOverlay')) document.getElementById('successOverlay').style.display = 'none';
}

function showSuccessModal(title, message, isError = false) {
    const successModalTitle = document.getElementById('successModalTitle');
    const successModalMessage = document.getElementById('successModalMessage');
    const successOverlay = document.getElementById('successOverlay');
    const successModal = document.getElementById('successModal');
    const successIcon = successModal.querySelector('.bi-check-circle-fill');

    if (successModalTitle) successModalTitle.textContent = title;
    if (successModalMessage) successModalMessage.textContent = message;

    if (isError) {
        if(successIcon) successIcon.className = 'bi bi-x-circle-fill'; // Change icon to error
        if(successIcon) successIcon.style.color = '#dc3545'; // Red color for error icon
        if(successModal) successModal.style.backgroundColor = '#f8d7da'; // Light red background
        if(successModalTitle) successModalTitle.style.color = '#721c24'; // Dark red text
    } else {
        if(successIcon) successIcon.className = 'bi bi-check-circle-fill'; // Reset icon to success
        if(successIcon) successIcon.style.color = '#5e0055'; // Purple color for success icon
        if(successModal) successModal.style.backgroundColor = ''; // Reset background
        if(successModalTitle) successModalTitle.style.color = '#5e0055'; // Reset text color
    }
    
    if(successOverlay) successOverlay.style.display = 'block';
    if(successModal) {
        successModal.style.display = 'block';
        // Re-trigger animation if needed
        successModal.style.animation = 'none'; 
        setTimeout(() => { successModal.style.animation = ''; }, 10); 
    }
}


function sendOTP() {
    const phoneInput = document.getElementById("phoneInput");
    const phoneNumber = phoneInput.value;
    const appVerifier = window.recaptchaVerifierInstance;

    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        alert("Please enter a valid phone number with country code (e.g., +923001234567).");
        return;
    }
    if (!appVerifier) {
        alert("reCAPTCHA verifier not initialized. Please wait for it to load or refresh.");
        return;
    }

    firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
        .then((confirmationResult) => {
            confirmationResultGlobal = confirmationResult;
            if(document.getElementById("otpSection")) document.getElementById("otpSection").style.display = "block";
            showSuccessModal("OTP Sent!", `A verification code has been sent to ${phoneNumber}.`);
            console.log("OTP sent successfully to " + phoneNumber);
        })
        .catch((error) => {
            console.error("Error sending OTP:", error);
            showSuccessModal("Error Sending OTP", `Failed to send OTP. Please try again. Error: ${error.message}`, true);
            if(window.recaptchaVerifierInstance && typeof grecaptcha !== "undefined") {
                window.recaptchaVerifierInstance.render().then(function(widgetId) {
                    try { grecaptcha.reset(widgetId); } catch(e) { console.warn("Error resetting recaptcha", e); }
                });
            }
        });
}

function verifyOTP() {
    const otpInput = document.getElementById("otpInput");
    const code = otpInput.value;

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        alert("Please enter a valid 6-digit OTP.");
        return;
    }
    if (!confirmationResultGlobal) {
        alert("OTP sending process was not completed. Please send OTP first.");
        return;
    }

    confirmationResultGlobal.confirm(code)
        .then((result) => {
            const user = result.user;
            if (user && user.phoneNumber) {
                localStorage.setItem('customerPhone', user.phoneNumber);
            }
            console.log("User verified:", user.uid, user.phoneNumber);
            closeOtpLoginModal();
            showSuccessModal("Logged In!", "OTP verified successfully. Please complete your profile.", false); // Show success then immediately show extra info
            
            // Give a small delay before showing the extra info modal to allow success modal to be seen
            setTimeout(() => {
                if(document.getElementById('extraOverlay')) document.getElementById('extraOverlay').style.display = 'block';
                if(document.getElementById('extraInfoModal')) document.getElementById('extraInfoModal').style.display = 'block';
            }, 1500); // 1.5 seconds delay

        })
        .catch((error) => {
            console.error("Error verifying OTP:", error);
            showSuccessModal("OTP Verification Failed", "Invalid OTP or error verifying. Please try again. Error: " + error.message, true);
            if(otpInput) otpInput.value = ""; 
        });
}

function saveUserDetails() {
    const fullName = document.getElementById('fullName').value;
    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const currentUser = firebase.auth().currentUser;

    if (!fullName || !displayName || !email) {
        alert("Please fill in all profile details."); 
        return;
    }
    if (!currentUser || !currentUser.phoneNumber) {
        alert("User not authenticated or phone missing. Please log in again."); 
        return;
    }

    const userProfile = {
        name: fullName, 
        displayName: displayName, 
        email: email,
        phone: currentUser.phoneNumber 
    };

    fetch('http://localhost:4000/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => { throw new Error(errData.message || `Server Error: ${res.status}`) });
        }
        return res.json();
    })
    .then(data => {
        closeExtraInfoModal(); // Close the profile completion modal
        const currentUser = firebase.auth().currentUser;
        if (currentUser && currentUser.phoneNumber) {
            localStorage.setItem('customerPhone', currentUser.phoneNumber);
        }
        showSuccessModal("Profile Saved!", data.message || "Your profile has been successfully saved.", false);
    })
    .catch(err => {
        console.error("Error saving user profile:", err);
        showSuccessModal("Error Saving Profile", "Failed to save your profile: " + err.message, true);
    });
}
// NEW API: Get bookings for a specific vendor
app.get('/api/vendor/bookings/:vendorId', (req, res) => {
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            bookings = JSON.parse(data);
        } else {
            bookings = [];
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error loading bookings for vendor:`, err);
        bookings = [];
    }
    const { vendorId } = req.params;
    const vendorBookings = bookings.filter(booking => booking.vendorId === vendorId);
    res.status(200).json(vendorBookings);
});
