async function geocodeLocation(location) {
  if (!location) return null;
  if (!geocodeLocation.cache) geocodeLocation.cache = {};
  if (geocodeLocation.cache[location]) return geocodeLocation.cache[location];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      geocodeLocation.cache[location] = coords;
      return coords;
    }
  } catch (err) {
    console.error('Geocoding error', err);
  }
  return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearestVendor(query) {
  try {
    const res = await fetch('http://localhost:4000/api/vendors');
    const vendors = await res.json();
    const filtered = vendors.filter(v =>
      (v.category && v.category.toLowerCase().includes(query.toLowerCase())) ||
      (v.name && v.name.toLowerCase().includes(query.toLowerCase()))
    );
    if (filtered.length === 0) {
      alert(`No vendors found for ${query}`);
      return;
    }
    if (!navigator.geolocation) {
      window.location.href = `vendors-list.html?search=${encodeURIComponent(query)}`;
      return;
    }
    navigator.geolocation.getCurrentPosition(async pos => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      let nearest = null;
      let minDist = Infinity;
      for (const v of filtered) {
        if (!v.location) continue;
        const coords = await geocodeLocation(v.location);
        if (!coords) continue;
        const d = calculateDistance(userLat, userLon, coords.lat, coords.lon);
        if (d < minDist) {
          minDist = d;
          nearest = v;
        }
      }
      if (nearest) {
        const confirmBooking = confirm(`Nearest vendor is ${nearest.name} in ${nearest.location}. Book now?`);
        if (confirmBooking) {
          window.location.href = `booking.html?vendorId=${nearest.id}&vendorName=${encodeURIComponent(nearest.name)}&service=${encodeURIComponent(nearest.category)}`;
        }
      } else {
        window.location.href = `vendors-list.html?search=${encodeURIComponent(query)}`;
      }
    }, () => {
      window.location.href = `vendors-list.html?search=${encodeURIComponent(query)}`;
    });
  } catch (err) {
    console.error('Find nearest vendor error', err);
    window.location.href = `vendors-list.html?search=${encodeURIComponent(query)}`;
  }
}