// frontend/vendors-list.js
document.addEventListener('DOMContentLoaded', () => {
  const vendorContainer = document.getElementById("vendorContainer");
  const searchInput = document.getElementById('searchVendorsInput');
  const categoryFilterSelect = document.getElementById('categoryFilterSelect');
  let allVendors = [];

  function displayVendors(vendorsToDisplay) {
    vendorContainer.innerHTML = "";
    if (!vendorsToDisplay || vendorsToDisplay.length === 0) {
      vendorContainer.innerHTML = "<p class='no-vendors-message'>No vendors found matching your criteria. Try broadening your search!</p>";
      return;
    }
    vendorsToDisplay.forEach(vendor => {
      const imageSrc = vendor.image && vendor.image.trim() !== "" ? vendor.image : 'placeholder-vendor.png';

      const card = `
 <div class="vendor-card">
 <div class="vendor-image-container">
 <img src="${imageSrc}" alt="${vendor.name || 'Vendor'}" /> 
 </div>
 <h4>${vendor.name || 'N/A'}</h4>
 <p class="category">${vendor.category || 'N/A'}</p>
 ${vendor.experience !== undefined ? `<p class="experience"><i class="bi bi-award-fill"></i> ${vendor.experience} years experience</p>` : ''}
 ${vendor.location ? `<p class="location"><i class="bi bi-geo-alt-fill"></i> ${vendor.location}</p>` : ''}
 ${vendor.description ? `<p class="description">${vendor.description.substring(0, 100)}${vendor.description.length > 100 ? '...' : ''}</p>` : ''}
 ${vendor.status === 'approved' ? `<p class="verified-badge-card"><i class="bi bi-patch-check-fill"></i> Verified</p>` : ''}
 <button class="btn-book-now" onclick="navigateToBooking('${vendor.id || vendor.phone}', '${vendor.name}', '${vendor.category}')">Book Now</button> 
 </div>
 `;
      vendorContainer.insertAdjacentHTML('beforeend', card);
    });
  }

  window.navigateToBooking = function (vendorId, vendorName, vendorService) {
    window.location.href = `booking.html?vendorId=${encodeURIComponent(vendorId)}&vendorName=${encodeURIComponent(vendorName)}&service=${encodeURIComponent(vendorService)}`;
  }

  async function loadVendors() {
    try {
      vendorContainer.innerHTML = "<p class='no-vendors-message'>Loading vendors...</p>";

      const response = await fetch('http://localhost:4000/api/vendors');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      allVendors = await response.json();
      console.log("Fetched vendors from /api/vendors:", allVendors);

      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get('category');
      const searchQuery = urlParams.get('search');

      if (category) {
        if (categoryFilterSelect) categoryFilterSelect.value = category;
        document.querySelectorAll('.filter-btn-group .filter-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-service') === category) {
            btn.classList.add('active');
          }
        });
      } else {
        document.querySelectorAll('.filter-btn-group .filter-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-service') === 'all');
        });
      }
      if (searchQuery && searchInput) {
        searchInput.value = searchQuery;
      }

      applyFilters();

    } catch (error) {
      console.error("Failed to load vendors:", error);
      vendorContainer.innerHTML = `<p class='no-vendors-message' style='color:red;'>Error loading vendors: ${error.message}. Check console and ensure server is running.</p>`;
    }
  }

  window.applyFilters = function () {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categoryFilterSelect ? categoryFilterSelect.value : "all";
    let filteredVendors = allVendors;

    if (selectedCategory !== "all") {
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.category && vendor.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      filteredVendors = filteredVendors.filter(vendor =>
        (vendor.name && vendor.name.toLowerCase().includes(searchTerm)) ||
        (vendor.category && vendor.category.toLowerCase().includes(searchTerm)) ||
        (vendor.description && vendor.description.toLowerCase().includes(searchTerm)) ||
        (vendor.location && vendor.location.toLowerCase().includes(searchTerm))
      );
    }
    displayVendors(filteredVendors);
  }

  document.querySelectorAll('.filter-btn-group .filter-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn-group .filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const service = btn.getAttribute("data-service");
      if (categoryFilterSelect) categoryFilterSelect.value = service;
      applyFilters();
    });
  });

  const mainSearchButton = document.querySelector('.filters-container .search-button');
  if (mainSearchButton) {
    mainSearchButton.addEventListener('click', applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }

  loadVendors();
});