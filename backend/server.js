// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
exports.app = app;
const PORT = 4000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

// --- Static File Serving ---
// Serve frontend files directly from the 'frontend' directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Directory for uploaded files (e.g., vendor certifications)
const uploadsDir = path.join(__dirname, 'uploads'); 
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir)); // Make '/uploads' accessible

// --- Multer Configuration for file uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Store files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize filename to replace spaces with underscores
        const sanitizedFilename = file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedFilename); // Unique filename
    }
});
const upload = multer({ storage: storage });

// --- Data Storage (JSON files) ---
const vendorsFilePath = path.join(__dirname, 'vendors.json');
let vendors = []; // In-memory array to hold vendor data

// Function to load vendors from vendors.json
function loadVendorsFromFile() {
    try {
        if (fs.existsSync(vendorsFilePath)) {
            const data = fs.readFileSync(vendorsFilePath, 'utf8');
            // Check if data is empty or malformed before parsing
            if (data.trim() === '') {
                vendors = [];
                console.warn(`[${new Date().toISOString()}] vendors.json is empty or malformed. Initializing empty array.`);
                fs.writeFileSync(vendorsFilePath, JSON.stringify([])); // Write empty array if file is empty
            } else {
                vendors = JSON.parse(data);
                console.log(`[${new Date().toISOString()}] Vendors loaded from file. Total: ${vendors.length}`);
            }
        } else {
            // If file doesn't exist, create it with an empty array
            fs.writeFileSync(vendorsFilePath, JSON.stringify([])); 
            vendors = [];
            console.log(`[${new Date().toISOString()}] vendors.json created as it did not exist.`);
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error reading or creating vendors.json:`, err);
        vendors = []; // Ensure vendors is an empty array on error
    }
}
loadVendorsFromFile(); // Load vendors once when the server starts

const customersFilePath = path.join(__dirname, 'customers.json');
let customers = []; // In-memory array to hold customer data

// Load customers data (similar logic to vendors)
try {
    if (fs.existsSync(customersFilePath)) {
        const data = fs.readFileSync(customersFilePath, 'utf8');
        if (data.trim() === '') {
            customers = [];
            console.warn(`[${new Date().toISOString()}] customers.json is empty or malformed. Initializing empty array.`);
            fs.writeFileSync(customersFilePath, JSON.stringify([])); 
        } else {
            customers = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] Customers loaded from file. Total: ${customers.length}`);
        }
    } else {
        fs.writeFileSync(customersFilePath, JSON.stringify([]));
        customers = [];
        console.log(`[${new Date().toISOString()}] customers.json created as it did not exist.`);
    }
} catch (err) {
    console.error(`[${new Date().toISOString()}] Error reading or creating customers.json:`, err);
    customers = [];
}

// Function to save vendors to vendors.json
function saveVendors() {
    try {
        fs.writeFileSync(vendorsFilePath, JSON.stringify(vendors, null, 2));
        console.log(`[${new Date().toISOString()}] Vendors saved to file. Total: ${vendors.length}`);
    } catch (err) { 
        console.error(`[${new Date().toISOString()}] Error writing to vendors.json:`, err);
    }
}

// Function to save customers to customers.json
function saveCustomers() {
    try {
        fs.writeFileSync(customersFilePath, JSON.stringify(customers, null, 2));
        console.log(`[${new Date().toISOString()}] Customers saved to file. Total: ${customers.length}`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error writing to customers.json:`, err);
    }
}

// --- API Endpoints ---

// Serve the index.html on root access
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Vendor Registration Endpoint
app.post('/register-vendor', upload.single('certification'), (req, res) => {
    loadVendorsFromFile(); // Load latest state to prevent overwriting
    const { name, email, phone, category, experience, description, location } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Certification document is required.' });
    }
    const certificationPath = `/uploads/${req.file.filename}`; 

    // Basic validation
    if (!name || !email || !phone || !category || !experience || !location ) {
        return res.status(400).json({ message: 'All fields are required including location.' });
    }

    // Check if vendor with this phone or email already exists (case-insensitive for email)
    if (vendors.some(v => v.phone === phone || v.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ message: 'Vendor with this phone or email already exists.' });
    }

    const newVendor = {
        id: Date.now().toString(), // Unique ID for the vendor
        name, email, phone, category,
        experience: parseInt(experience, 10), // Ensure experience is a number
        description, location, 
        image: '', // Placeholder for now, can be extended later for vendor images
        certificationPath, 
        approved: false, // Default to not approved
        status: 'pending' // Initial status
    };

    vendors.push(newVendor);
    saveVendors(); // Save the updated vendors array to the file
    res.status(200).json({ message: 'Vendor registered successfully! Your application is awaiting admin approval.' });
});

// Admin API: Get all vendors (for admin panel)
app.get('/admin/api/all-vendors', (req, res) => {
    loadVendorsFromFile(); // Ensure we have the latest data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log(`[${new Date().toISOString()}] Admin API: Sending all vendors. Count: ${vendors.length}`);
    res.json(vendors);
});

// Public API: Get approved vendors (for vendors-list page)
app.get('/api/vendors', (req, res) => {
    loadVendorsFromFile(); // Ensure we have the latest data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const approvedVendors = vendors.filter(v => v.approved === true && v.status === 'approved');
    console.log(`[${new Date().toISOString()}] Public API: Sending approved vendors. Count: ${approvedVendors.length}`); 
    res.json(approvedVendors);
});

// Admin API: Approve a vendor
app.post('/admin/api/approve-vendor', (req, res) => {
    loadVendorsFromFile(); // Ensure we're working with the latest data
    const { phone } = req.body;
    const vendorIndex = vendors.findIndex(v => v.phone === phone);

    if (vendorIndex !== -1) {
        vendors[vendorIndex].approved = true; 
        vendors[vendorIndex].status = 'approved';
        saveVendors(); // Save changes
        res.status(200).json({ message: `Vendor '${vendors[vendorIndex].name || phone}' approved successfully!` });
    } else {
        res.status(404).json({ message: 'Vendor not found.' });
    }
});

// Admin API: Reject a vendor
app.post('/admin/api/reject-vendor', (req, res) => {
    loadVendorsFromFile(); // Ensure we're working with the latest data
    const { phone } = req.body;
    const vendorIndex = vendors.findIndex(v => v.phone === phone);

    if (vendorIndex !== -1) {
        vendors[vendorIndex].approved = false; // Set approved to false
        vendors[vendorIndex].status = 'rejected'; // Set status to rejected
        saveVendors(); // Save changes
        res.status(200).json({ message: `Vendor '${vendors[vendorIndex].name || phone}' rejected successfully.` });
    } else {
        res.status(404).json({ message: 'Vendor not found.' });
    }
});

// Customer Registration/Profile Update Endpoint
app.post('/register-customer', (req, res) => {
    // Reload customers to ensure we have the most current data before modifying
    try {
        if (fs.existsSync(customersFilePath)) {
            const data = fs.readFileSync(customersFilePath, 'utf8');
            if (data.trim() === '') {
                customers = [];
            } else {
                customers = JSON.parse(data);
            }
        }
    } catch (err) { 
        console.error(`[${new Date().toISOString()}] Error reloading customers.json before registration:`, err); 
        customers = []; // Reset on error
    }

    const { name, displayName, email, phone } = req.body;

    if (!name || !email || !phone || !displayName) {
        return res.status(400).json({ message: 'All profile fields (Full Name, Display Name, Email, Phone) are required.' });
    }

    // Check if customer with this phone or email already exists
    if (customers.some(c => c.phone === phone || c.email.toLowerCase() === email.toLowerCase())) {
        // If updating an existing user's profile (e.g., they logged in with phone and now adding email)
        // You might want to update existing entry rather than rejecting if phone matches
        const existingCustomerIndex = customers.findIndex(c => c.phone === phone);
        if (existingCustomerIndex !== -1) {
            // Update existing customer's details
            customers[existingCustomerIndex] = { ...customers[existingCustomerIndex], name, displayName, email };
            saveCustomers();
            return res.status(200).json({ message: 'Customer profile updated successfully!' });
        }
        return res.status(409).json({ message: 'Customer with this email already exists.' }); // Phone number match should be caught by existingCustomerIndex check
    }

    const newCustomer = { id: Date.now().toString(), name, displayName, email, phone };
    customers.push(newCustomer);
    saveCustomers();
    res.status(200).json({ message: 'Customer profile saved successfully!' });
});

// Booking Request Endpoint
const bookingsFilePath = path.join(__dirname, 'bookings.json');
exports.bookingsFilePath = bookingsFilePath;
let bookings = [];
exports.bookings = bookings;

// Load bookings data
try {
    if (fs.existsSync(bookingsFilePath)) {
        const data = fs.readFileSync(bookingsFilePath, 'utf8');
        if (data.trim() === '') {
            bookings = [];
            console.warn(`[${new Date().toISOString()}] bookings.json is empty or malformed. Initializing empty array.`);
            fs.writeFileSync(bookingsFilePath, JSON.stringify([])); 
        } else {
            bookings = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] Bookings loaded from file. Total: ${bookings.length}`);
        }
    } else {
        fs.writeFileSync(bookingsFilePath, JSON.stringify([]));
        bookings = [];
        console.log(`[${new Date().toISOString()}] bookings.json created as it did not exist.`);
    }
} catch (err) {
    console.error(`[${new Date().toISOString()}] Error reading or creating bookings.json:`, err);
    bookings = [];
}

// Function to save bookings to bookings.json
function saveBookings() {
    try {
        fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));
        console.log(`[${new Date().toISOString()}] Bookings saved to file. Total: ${bookings.length}`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error writing to bookings.json:`, err);
    }
}

app.post('/api/bookings/request', (req, res) => {
    // Reload bookings to ensure we have the most current data before modifying
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            if (data.trim() === '') {
                bookings = [];
            } else {
                bookings = JSON.parse(data);
            }
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error reloading bookings.json before new booking:`, err);
        bookings = [];
    }

    const { vendorId, customerName, customerPhone, customerEmail, requestedDate, requestedTime, serviceNotes, vendorName, serviceBooked } = req.body;

    if (!vendorId || !customerName || !customerPhone || !requestedDate || !requestedTime) {
        return res.status(400).json({ message: 'Missing required booking details.' });
    }

    const newBooking = {
        id: Date.now().toString(),
        vendorId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '', // Optional
        requestedDate,
        requestedTime,
        serviceNotes: serviceNotes || '', // Optional
        vendorName, // Stored for easier lookup in bookings.json
        serviceBooked, // Stored for easier lookup
        status: 'pending', // Initial status of the booking request
        quotedPrice: null, // New field for price
        finalPrice: null, // New field for final agreed price
        paymentMethod: null, // New field for payment method (COD, Online)
        paymentStatus: 'unpaid' // New field for payment status
    };

    bookings.push(newBooking);
    saveBookings();
    res.status(201).json({ message: 'Booking request submitted successfully! The vendor will be notified.' });
});

// NEW API: Get bookings for a specific customer (by phone number)
app.get('/api/customer/bookings/:phone', (req, res) => {
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            bookings = JSON.parse(data);
        } else {
            bookings = [];
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error loading bookings for customer:`, err);
        bookings = [];
    }

    const { phone } = req.params;
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    res.status(200).json(customerBookings);
});

// NEW API: Get bookings for a specific vendor (by vendorId)
app.get('/api/vendor/bookings/:vendorId', (req, res) => {
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            bookings = data.trim() ? JSON.parse(data) : [];
        } else {
            bookings = [];
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error loading bookings for vendor:`, err);
        return res.status(500).json({ message: 'Error loading bookings data.' });
    }

    const { vendorId } = req.params;
    const vendorBookings = bookings.filter(b => b.vendorId === vendorId);
    res.status(200).json(vendorBookings);
});

// NEW API: Update booking status by vendor
app.post('/api/vendor/bookings/:bookingId/update-status', (req, res) => {
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            bookings = JSON.parse(data);
        } else {
            return res.status(404).json({ message: 'Bookings data file not found.' });
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error reloading bookings.json for status update:`, err);
        return res.status(500).json({ message: 'Error loading booking data.' });
    }

    const { bookingId } = req.params;
    const { status } = req.body; // Expected status: 'accepted', 'rejected', 'completed'

    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex !== -1) {
        if (['accepted', 'rejected', 'completed'].includes(status)) {
            bookings[bookingIndex].status = status;
            saveBookings();
            res.status(200).json({ message: `Booking ${bookingId} status updated to ${status}.` });
        } else {
            res.status(400).json({ message: 'Invalid status provided.' });
        }
    } else {
        res.status(404).json({ message: 'Booking not found.' });
    }
});

// NEW API: Set quoted price by vendor
app.post('/api/vendor/bookings/:bookingId/set-price', (req, res) => {
    try {
        if (fs.existsSync(bookingsFilePath)) {
            const data = fs.readFileSync(bookingsFilePath, 'utf8');
            bookings = JSON.parse(data);
        } else {
            return res.status(404).json({ message: 'Bookings data file not found.' });
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error reloading bookings.json for price update:`, err);
        return res.status(500).json({ message: 'Error loading booking data.' });
    }

    const { bookingId } = req.params;
    const { price, paymentMethod } = req.body; // price can be quotedPrice, paymentMethod can be 'COD' or 'Online'

    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex !== -1) {
        if (price !== undefined && price !== null) {
            bookings[bookingIndex].quotedPrice = parseFloat(price); // Store as number
            bookings[bookingIndex].finalPrice = parseFloat(price); // For simplicity, initial quote is final price
        }
        if (paymentMethod && ['COD', 'Online'].includes(paymentMethod)) {
            bookings[bookingIndex].paymentMethod = paymentMethod;
        } else if (paymentMethod) {
            return res.status(400).json({ message: 'Invalid payment method provided. Must be COD or Online.' });
        }
        
        saveBookings();
        res.status(200).json({ message: `Booking ${bookingId} price and payment method updated.` });
    } else {
        res.status(404).json({ message: 'Booking not found.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Serving frontend files from: ${path.resolve(__dirname, '..', 'frontend')}`);
    console.log(`Uploaded files will be stored in '${path.resolve(uploadsDir)}' and accessible via '/uploads' route.`);
    console.log(`Vendors data is managed in: ${path.resolve(vendorsFilePath)}`);
    console.log(`Customers data is managed in: ${path.resolve(customersFilePath)}`);
    console.log(`Bookings data is managed in: ${path.resolve(bookingsFilePath)}`);
});