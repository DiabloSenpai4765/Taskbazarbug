// frontend/my-bookings.js
document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookingsList');
    const customerInfo = document.getElementById('customerInfo');

    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    const customerPhone = localStorage.getItem('customerPhone') || phoneParam;

    if (customerInfo) {
        if (customerPhone) {
            customerInfo.textContent = `Viewing bookings for: ${customerPhone}`;
        } else {
            customerInfo.textContent = 'Please log in to view your bookings.';
        }
    }

    if (!customerPhone) {
        bookingsList.innerHTML = "<p class='no-bookings-message'>No customer phone provided.</p>";
        return;
    }

    loadBookings(customerPhone);

    async function loadBookings(phone) {
        bookingsList.innerHTML = '<p class="no-bookings-message">Loading bookings...</p>';
        try {
            const response = await fetch(`/api/customer/bookings/${encodeURIComponent(phone)}`);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
            const bookings = await response.json();
            displayBookings(bookings);
        } catch (err) {
            console.error('Failed to load bookings:', err);
            bookingsList.innerHTML = `<p class='no-bookings-message error-message'>Error loading bookings: ${err.message}</p>`;
        }
    }

    function displayBookings(list) {
        bookingsList.innerHTML = '';
        if (!list || list.length === 0) {
            bookingsList.innerHTML = "<p class='no-bookings-message'>No bookings found.</p>";
            return;
        }

        list.sort((a, b) => new Date(a.requestedDate + ' ' + a.requestedTime) - new Date(b.requestedDate + ' ' + b.requestedTime));

        list.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'booking-card';
            card.innerHTML = `
                <h3>${booking.vendorName} - ${booking.serviceBooked}</h3>
                <span class="status-badge ${booking.status}">${booking.status}</span>
                <p><strong>Date:</strong> ${booking.requestedDate}</p>
                <p><strong>Time:</strong> ${booking.requestedTime}</p>
                ${booking.quotedPrice ? `<p><strong>Price:</strong> PKR ${booking.quotedPrice.toFixed(2)}</p>` : ''}
                ${booking.paymentMethod ? `<p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>` : ''}
                ${booking.paymentStatus ? `<p><strong>Payment Status:</strong> <span class="status-badge ${booking.paymentStatus}">${booking.paymentStatus}</span></p>` : ''}
            `;
            bookingsList.appendChild(card);
        });
    }
});