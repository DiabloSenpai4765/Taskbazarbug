let regConfirmationResult;
let phoneVerified = false;

function sendOTPRegister() {
    const phone = document.getElementById('regPhone').value.trim();
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        alert('Please enter a valid phone number with country code.');
        return;
    }
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    }
    const appVerifier = window.recaptchaVerifier;
    firebase.auth().signInWithPhoneNumber(phone, appVerifier)
        .then((res) => {
            regConfirmationResult = res;
            document.getElementById('otpSection').style.display = 'block';
            alert('OTP sent to ' + phone);
        })
        .catch((err) => {
            alert('Error sending OTP: ' + err.message);
        });
}

function verifyOTPRegister() {
    const code = document.getElementById('regOtp').value.trim();
    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit OTP.');
        return;
    }
    if (!regConfirmationResult) {
        alert('Please send OTP first.');
        return;
    }
    regConfirmationResult.confirm(code)
        .then(() => {
            phoneVerified = true;
            document.getElementById('otpSection').style.display = 'none';
            alert('Phone verified successfully');
        })
        .catch((err) => {
            alert('OTP verification failed: ' + err.message);
        });
}

function validateRegistration(event) {
    event.preventDefault();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        alert('Invalid email format');
        return;
    }
    if (pass !== confirm) {
        alert('Passwords do not match');
        return;
    }
    if (!phoneVerified) {
        alert('Please verify your phone number');
        return;
    }
    alert('Registered successfully!');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', validateRegistration);
    }
});