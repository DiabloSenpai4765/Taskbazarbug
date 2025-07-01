// frontend/map.js

// Initialize Leaflet map
const map = L.map('map').setView([30.3753, 69.3451], 6); // Centered on Pakistan

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let markers = [];
let locationCache = {};

async function geocodeLocation(location) {
  if (locationCache[location]) return locationCache[location];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      locationCache[location] = coords;
      return coords;
    }
  } catch (err) {
    console.error('Geocoding error', err);
  }
  return null;
}

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

async function addVendorsToMap(vendors, filter) {
  clearMarkers();
  for (const vendor of vendors) {
    if (filter !== 'all' && vendor.category !== filter) continue;
    if (!vendor.location) continue;
    const coords = await geocodeLocation(vendor.location);
    if (coords) {
      const marker = L.marker([coords.lat, coords.lon]).addTo(map);
      const popup = `<strong>${vendor.name}</strong><br>${vendor.category}<br>${vendor.location}<br><a href="booking.html?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.name)}&service=${encodeURIComponent(vendor.category)}">Book Now</a>`;
      marker.bindPopup(popup);
      markers.push(marker);
    }
  }
}


async function loadVendors() {
  try {
    const res = await fetch('http://localhost:4000/api/vendors');
    const vendors = await res.json();
    const filterSelect = document.getElementById('serviceFilter');

    const update = () => {
      const selected = filterSelect ? filterSelect.value : 'all';
      addVendorsToMap(vendors, selected);
    };

    if (filterSelect) filterSelect.addEventListener('change', update);
    update();
  } catch (err) {
    console.error('Failed to load vendors', err);
  }
}

document.addEventListener('DOMContentLoaded', loadVendors);
