import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB1EDBn0z7I0CjHbQ9PGJCDaAX0zqN7c0",
  authDomain: "taskbazaar-b3f78.firebaseapp.com",
  databaseURL: "https://taskbazaar-b3f78-default-rtdb.firebaseio.com",
  projectId: "taskbazaar-b3f78",
  storageBucket: "taskbazaar-b3f78.firebasestorage.app",
  messagingSenderId: "821504433998",
  appId: "1:821504433998:web:1a6945b2e7d4cc1d4cc81f",
  measurementId: "G-2GBDNM8DNL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const vendorContainer = document.getElementById("vendorContainer");

function loadVendors(serviceFilter = "all") {
  vendorContainer.innerHTML = "Loading vendors...";
  const vendorRef = ref(db, "/");

  onValue(vendorRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return vendorContainer.innerHTML = "No vendors found.";

    let html = "";
    Object.values(data).forEach(vendor => {
      if (serviceFilter === "all" || vendor.service.toLowerCase() === serviceFilter) {
        html += `
          <div class="vendor-card">
            <img src="${vendor.image}" alt="vendor" />
            <h4>${vendor.name}</h4>
            <p>${vendor.service}</p>
            <p>${vendor.location || vendor.address}</p>
          </div>`;
      }
    });

    vendorContainer.innerHTML = html || "No vendors match this filter.";
  });
}

// Load all vendors initially
loadVendors();

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const service = btn.getAttribute("data-service");
    loadVendors(service);
  });
});

// Footer icons
document.addEventListener('DOMContentLoaded', () => {
  const footerIcons = document.querySelectorAll('footer i');
  footerIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      footerIcons.forEach(i => i.classList.remove('active'));
      icon.classList.add('active');
    });
  });

  const path = window.location.pathname;
  const homeIcon = document.querySelector('footer .bi-house-door-fill');
  const mapIcon = document.querySelector('footer .bi-map-fill');
  if (mapIcon && path.includes('map.html')) {
    mapIcon.classList.add('active');
  } else if (homeIcon && (path.endsWith('/') || path.includes('index.html'))) {
    homeIcon.classList.add('active');
  }
});
