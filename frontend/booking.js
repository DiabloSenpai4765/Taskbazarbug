// frontend/booking.js
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const vendorIdInput = document.getElementById('vendorId');
    const bookingMessageDiv = document.getElementById('bookingMessage');
    const bookingVendorInfoDiv = document.getElementById('bookingVendorInfo');

    // Get vendorId, vendorName, service from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const vendorId = urlParams.get('vendorId');
    const vendorName = urlParams.get('vendorName');
    const service = urlParams.get('service');

    if (vendorId && vendorIdInput) {
        vendorIdInput.value = vendorId;
    } else {
        bookingMessageDiv.textContent = 'Error: Vendor ID not found. Please go back and select a vendor.';
        bookingMessageDiv.className = 'message-area error-message';
        bookingMessageDiv.style.display = 'block';
        if(bookingForm) bookingForm.style.display = 'none'; // Hide form if no vendor ID
    }
    
    if (bookingVendorInfoDiv) {
        if (vendorName && service) {
            bookingVendorInfoDiv.innerHTML = `
                <h3>Booking with: ${decodeURIComponent(vendorName)}</h3>
                <p>Service: ${decodeURIComponent(service)}</p>
            `;
        } else if (vendorName) {
             bookingVendorInfoDiv.innerHTML = `<h3>Booking with: ${decodeURIComponent(vendorName)}</h3>`;
        } else {
            bookingVendorInfoDiv.innerHTML = `<h3>Vendor details unavailable.</h3>`;
        }
    }


    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            bookingMessageDiv.style.display = 'none';
            bookingMessageDiv.className = 'message-area';
            
            const submitButton = bookingForm.querySelector('.submit-btn');
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting Request...';

            const formData = new FormData(bookingForm);
            const bookingData = {
                vendorId: formData.get('vendorId'), // Already set from URL param
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                customerEmail: formData.get('customerEmail'),
                requestedDate: formData.get('requestedDate'),
                requestedTime: formData.get('requestedTime'),
                serviceNotes: formData.get('serviceNotes'),
                // Add vendorName and service for convenience in bookings.json
                vendorName: vendorName ? decodeURIComponent(vendorName) : "N/A",
                serviceBooked: service ? decodeURIComponent(service) : "N/A"
            };

            // Basic validation
            if (!bookingData.customerName || !bookingData.customerPhone || !bookingData.requestedDate || !bookingData.requestedTime || !bookingData.vendorId) {
                bookingMessageDiv.textContent = 'Please fill in all required fields.';
                bookingMessageDiv.className = 'message-area error-message';
                bookingMessageDiv.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Request Booking';
                return;
            }

            try {
                const response = await fetch('http://localhost:4000/api/bookings/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingData),
                });

                const result = await response.json();

                if (response.ok) {
                    bookingMessageDiv.textContent = result.message || 'Booking request submitted successfully!';
                    bookingMessageDiv.className = 'message-area success-message';
                    bookingForm.reset(); 
                    
                } else {
                    bookingMessageDiv.textContent = result.message || `Error: ${response.statusText}`;
                    bookingMessageDiv.className = 'message-area error-message';
                }
            } catch (error) {
                console.error('Booking submission error:', error);
                bookingMessageDiv.textContent = 'An unexpected error occurred. Please try again.';
                bookingMessageDiv.className = 'message-area error-message';
            } finally {
                bookingMessageDiv.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Request Booking';
            }
        });
    }
});