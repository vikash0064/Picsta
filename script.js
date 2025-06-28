const accessKey = "sFN2ciKbK12eYc1gNzSh2eyNckczjOInXFzu_4grsv4";
const searchForm = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");
const searchResult = document.getElementById("search-result");
const showMoreBtn = document.getElementById("show-more-btn");
const tags = document.querySelectorAll(".tags span");

// Modal elements
const modal = document.getElementById("image-modal");
const modalImg = document.getElementById("modal-image");
const modalCreatorImg = document.getElementById("modal-creator-img");
const modalCreatorName = document.getElementById("modal-creator-name");
const modalDescription = document.getElementById("modal-description");
const modalDownloadBtn = document.getElementById("modal-download-btn");
const modalSaveBtn = document.getElementById("modal-save-btn");
const closeModal = document.querySelector(".close-modal");

// Mobile menu elements
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

let keyword = "";
let page = 1;
let currentImageData = null;

// Mobile menu toggle
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Load popular images on page load
window.addEventListener('load', () => {
    keyword = "nature";
    searchImages();
});

// Form submission handler
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    page = 1;
    keyword = searchBox.value.trim();
    if (keyword) {
        searchImages();
    } else {
        keyword = "nature";
        searchImages();
    }
});

async function searchImages() {
    keyword = keyword || "nature"; // Default to nature if empty
    const url = `https://api.unsplash.com/search/photos?page=${page}&query=${keyword}&client_id=${accessKey}&per_page=12`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if(page === 1) {
            searchResult.innerHTML = "";
        }

        const results = data.results;

        if(results.length === 0) {
            searchResult.innerHTML = `<p class="no-results">No results found for "${keyword}". Try another search.</p>`;
            showMoreBtn.style.display = "none";
            return;
        }

        results.forEach((result) => {
            const imageCard = document.createElement("div");
            imageCard.className = "image-card";
            
            const image = document.createElement("img");
            image.src = result.urls.regular;
            image.alt = result.alt_description || "Unsplash image";
            
            image.addEventListener("click", () => {
                openModal(result);
            });
            
            const imageActions = document.createElement("div");
            imageActions.className = "image-actions";
            
            const downloadBtn = document.createElement("button");
            downloadBtn.className = "download-btn";
            downloadBtn.title = "Download";
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                downloadImage(result.urls.full, `${keyword}-${result.id}.jpg`);
            });
            
            const saveBtn = document.createElement("button");
            saveBtn.className = "save-btn";
            saveBtn.title = "Save";
            saveBtn.innerHTML = '<i class="fas fa-heart"></i>';
            saveBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                saveImage(result);
            });
            
            imageActions.appendChild(downloadBtn);
            imageActions.appendChild(saveBtn);
            
            const creatorInfo = document.createElement("div");
            creatorInfo.className = "creator-info";
            creatorInfo.innerHTML = `
                <img src="${result.user.profile_image.small}" alt="${result.user.name}">
                <span>${result.user.name}</span>
            `;
            
            imageCard.appendChild(image);
            imageCard.appendChild(imageActions);
            imageCard.appendChild(creatorInfo);
            searchResult.appendChild(imageCard);
        });

        showMoreBtn.style.display = "block";
    } catch (error) {
        console.error("Error fetching images:", error);
        searchResult.innerHTML = `<p class="error-message">Failed to load images. Please try again later.</p>`;
        showMoreBtn.style.display = "none";
    }
}

// Open modal with image details
function openModal(imageData) {
    currentImageData = imageData;
    modalImg.src = imageData.urls.regular;
    modalCreatorImg.src = imageData.user.profile_image.medium;
    modalCreatorName.textContent = imageData.user.name;
    modalDescription.textContent = imageData.alt_description || "No description available";
    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Check if image is saved and update button appearance
    const savedImages = JSON.parse(localStorage.getItem("savedImages")) || [];
    const isSaved = savedImages.some(img => img.id === imageData.id);
    
    if (isSaved) {
        modalSaveBtn.innerHTML = '<i class="fas fa-heart"></i> Saved';
        modalSaveBtn.classList.add("saved");
    } else {
        modalSaveBtn.innerHTML = '<i class="far fa-heart"></i> Save';
        modalSaveBtn.classList.remove("saved");
    }
}

// Close modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

// Modal download button
modalDownloadBtn.addEventListener("click", () => {
    if (currentImageData) {
        downloadImage(currentImageData.urls.full, `${keyword}-${currentImageData.id}.jpg`);
    }
});

// Modal save button
modalSaveBtn.addEventListener("click", () => {
    if (currentImageData) {
        const isSaved = saveImage(currentImageData);
        
        if (isSaved) {
            modalSaveBtn.innerHTML = '<i class="fas fa-heart"></i> Saved';
            modalSaveBtn.classList.add("saved");
        } else {
            modalSaveBtn.innerHTML = '<i class="far fa-heart"></i> Save';
            modalSaveBtn.classList.remove("saved");
        }
    }
});

// Save image function that returns true/false
function saveImage(imageData) {
    const savedImages = JSON.parse(localStorage.getItem("savedImages")) || [];
    
    // Check if image is already saved
    const existingIndex = savedImages.findIndex(img => img.id === imageData.id);
    
    if (existingIndex === -1) {
        // Save new image
        savedImages.push({
            id: imageData.id,
            urls: imageData.urls,
            alt: imageData.alt_description,
            user: {
                name: imageData.user.name,
                profile_image: imageData.user.profile_image
            }
        });
        localStorage.setItem("savedImages", JSON.stringify(savedImages));
        showDownloadNotification("Image saved to collection!");
        return true;
    } else {
        // Remove if already saved (toggle off)
        savedImages.splice(existingIndex, 1);
        localStorage.setItem("savedImages", JSON.stringify(savedImages));
        showDownloadNotification("Image removed from collection!");
        return false;
    }
}

// Download image function
async function downloadImage(url, filename) {
    try {
        // Fetch the image
        const response = await fetch(url);
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Convert to blob
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create temporary anchor element
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || `fotomela-image-${Date.now()}.jpg`;
        a.style.display = "none";
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            showDownloadNotification("Download started successfully!");
        }, 100);
        
    } catch (error) {
        console.error("Download failed:", error);
        showDownloadNotification("Download failed. Please try again.");
    }
}

// Notification function
function showDownloadNotification(message = "Download started!") {
    // Remove any existing notifications first
    const existingNotif = document.querySelector(".download-notification");
    if (existingNotif) {
        document.body.removeChild(existingNotif);
    }
    
    const notification = document.createElement("div");
    notification.className = "download-notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
       setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Show more images
showMoreBtn.addEventListener("click", () => {
    page++;
    searchImages();
});

// Tag click handlers
tags.forEach(tag => {
    tag.addEventListener("click", () => {
        keyword = tag.textContent;
        page = 1;
        searchImages();
        searchBox.value = "";
    });
});

// Keyboard navigation in modal
document.addEventListener("keydown", (e) => {
    if (modal.style.display === "block") {
        if (e.key === "Escape") {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }
});

// Infinite scroll implementation
window.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 5 && showMoreBtn.style.display === "block") {
        page++;
        searchImages();
    }
});

// Function to check if an element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Lazy loading implementation
const lazyLoadImages = () => {
    const images = document.querySelectorAll(".image-card img");
    
    images.forEach(img => {
        if (isInViewport(img) && !img.src) {
            img.src = img.dataset.src;
        }
    });
};

// Add scroll event for lazy loading
window.addEventListener("scroll", lazyLoadImages);
window.addEventListener("load", lazyLoadImages);
window.addEventListener("resize", lazyLoadImages);

// Check for saved images in local storage on page load
window.addEventListener("load", () => {
    const savedImages = JSON.parse(localStorage.getItem("savedImages")) || [];
    console.log("Saved images:", savedImages);
});

// Function to handle offline state
function handleConnection() {
    if (navigator.onLine) {
        console.log("Online");
    } else {
        console.log("Offline");
        searchResult.innerHTML = `
            <div class="offline-message">
                <i class="fas fa-wifi"></i>
                <h3>You're offline</h3>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
        showMoreBtn.style.display = "none";
    }
}

// Listen for online/offline events
window.addEventListener("online", handleConnection);
window.addEventListener("offline", handleConnection);

// Initial check
handleConnection();