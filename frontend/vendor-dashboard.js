// frontend/vendor-dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookingsList');
    const dashboardMessage = document.getElementById('dashboardMessage');
    const loggedInVendorInfo = document.getElementById('loggedInVendorInfo');

    // !!! IMPORTANT: For a real application, vendorId should come from a secure login session.
    // For demonstration, let's use a placeholder or assume it's passed via URL parameter.
    // Example: http://localhost:4000/vendor-dashboard.html?vendorId=2
    const urlParams = new URLSearchParams(window.location.search);
    const currentVendorId = urlParams.get('vendorId') || '2'; // Default to '2' (Expert Electrician) for testing

    if (currentVendorId) {
        loggedInVendorInfo.textContent = `Viewing bookings for Vendor ID: ${currentVendorId}`;
        loadVendorBookings(currentVendorId);
    } else {
        bookingsList.innerHTML = '<p class="no-bookings-message">No vendor ID provided. Cannot load bookings.</p>';
        loggedInVendorInfo.textContent = 'Please provide a Vendor ID in the URL (e.g., ?vendorId=1) or log in.';
    }

    async function loadVendorBookings(vendorId) {
        bookingsList.innerHTML = '<p class="no-bookings-message">Loading bookings...</p>';
        dashboardMessage.style.display = 'none';

        try {
            const response = await fetch(`/api/vendor/bookings/${encodeURIComponent(vendorId)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const bookings = await response.json();
            displayBookings(bookings);
        } catch (error) {
            console.error('Failed to load vendor bookings:', error);
            bookingsList.innerHTML = `<p class='no-bookings-message error-message' style='color:red;'>Error loading bookings: ${error.message}. Ensure the server is running and the vendor ID is correct.</p>`;
        }
    }

    function displayBookings(bookingsToDisplay) {
        bookingsList.innerHTML = "";
        if (!bookingsToDisplay || bookingsToDisplay.length === 0) {
            bookingsList.innerHTML = "<p class='no-bookings-message'>No active bookings found for this vendor.</p>";
            return;
        }

        bookingsToDisplay.sort((a, b) => new Date(a.requestedDate + ' ' + a.requestedTime) - new Date(b.requestedDate + ' ' + b.requestedTime));

        bookingsToDisplay.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            bookingCard.innerHTML = `
                <h3>Booking #${booking.id.substring(booking.id.length - 4)} - ${booking.serviceBooked}</h3>
                <span class="status-badge ${booking.status}">${booking.status}</span>
                <p><strong>Customer:</strong> ${booking.customerName}</p>
                <p><strong>Contact:</strong> ${booking.customerPhone} ${booking.customerEmail ? `(${booking.customerEmail})` : ''}</p>
                <p><strong>Requested Date:</strong> ${booking.requestedDate}</p>
                <p><strong>Requested Time:</strong> ${booking.requestedTime}</p>
                <p><strong>Notes:</strong> ${booking.serviceNotes || 'N/A'}</p>
                ${booking.quotedPrice ? `<p><strong>Quoted Price:</strong> PKR ${booking.quotedPrice.toFixed(2)}</p>` : ''}
                ${booking.paymentMethod ? `<p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>` : ''}
                ${booking.paymentStatus ? `<p><strong>Payment Status:</strong> <span class="status-badge ${booking.paymentStatus}">${booking.paymentStatus}</span></p>` : ''}

                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button onclick="updateBookingStatus('${booking.id}', 'accepted')">Accept</button>
                        <button class="reject-btn" onclick="updateBookingStatus('${booking.id}', 'rejected')">Reject</button>
                        <div class="price-input-group">
                            <input type="number" id="price-${booking.id}" placeholder="Set Price (PKR)" min="0" step="0.01">
                            <select id="paymentMethod-${booking.id}">
                                <option value="">Select Payment Method</option>
                                <option value="COD">Cash on Delivery</option>
                                <option value="Online">Online Payment</option>
                            </select>
                            <button onclick="setBookingPrice('${booking.id}')">Set Price & Method</button>
                        </div>
                    ` : ''}
                    ${(booking.status === 'accepted' && booking.quotedPrice) ? `
                        <button onclick="updateBookingStatus('${booking.id}', 'completed')">Mark as Completed</button>
                    ` : ''}
                     ${(booking.status === 'completed' && booking.paymentStatus === 'unpaid' && booking.paymentMethod === 'COD') ? `
                        <button onclick="markPaymentReceived('${booking.id}')">Mark Payment Received (COD)</button>
                    ` : ''}
                </div>
            `;
            bookingsList.appendChild(bookingCard);
        });
    }

    window.updateBookingStatus = async function(bookingId, status) {
        dashboardMessage.style.display = 'none';
        try {
            const response = await fetch(`/api/vendor/bookings/${bookingId}/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(result.message, 'success');
                loadVendorBookings(currentVendorId); // Reload bookings to reflect changes
            } else {
                showMessage(result.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            showMessage('An unexpected error occurred.', 'error');
        }
    };

    window.setBookingPrice = async function(bookingId) {
        dashboardMessage.style.display = 'none';
        const priceInput = document.getElementById(`price-${bookingId}`);
        const paymentMethodSelect = document.getElementById(`paymentMethod-${bookingId}`);
        const price = priceInput.value;
        const paymentMethod = paymentMethodSelect.value;

        if (!price || price <= 0) {
            showMessage('Please enter a valid price.', 'error');
            return;
        }
        if (!paymentMethod) {
            showMessage('Please select a payment method.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/vendor/bookings/${bookingId}/set-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price, paymentMethod })
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(result.message, 'success');
                loadVendorBookings(currentVendorId); // Reload bookings
            } else {
                showMessage(result.message || 'Failed to set price', 'error');
            }
        } catch (error) {
            console.error('Error setting booking price:', error);
            showMessage('An unexpected error occurred.', 'error');
        }
    };

    window.markPaymentReceived = async function(bookingId) {
        dashboardMessage.style.display = 'none';
        try {
            const response = await fetch(`/api/vendor/bookings/${bookingId}/set-price`, { // Re-using set-price to update paymentStatus
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: 'paid' }) // Only update paymentStatus
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(`Payment for booking ${bookingId} marked as received!`, 'success');
                loadVendorBookings(currentVendorId); // Reload bookings
            } else {
                showMessage(result.message || 'Failed to mark payment as received', 'error');
            }
        } catch (error) {
            console.error('Error marking payment received:', error);
            showMessage('An unexpected error occurred.', 'error');
        }
    };

    function showMessage(message, type) {
        dashboardMessage.textContent = message;
        dashboardMessage.className = `message-area ${type}-message`;
        dashboardMessage.style.display = 'block';
        setTimeout(() => {
            dashboardMessage.style.display = 'none';
        }, 5000); // Hide message after 5 seconds
    }
});