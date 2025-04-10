// --- DOM Elements ---
const productImageUploadInput = document.getElementById('productImageUpload');
const productImageDisplay = document.getElementById('productImageDisplay');
const saveHtmlBtn = document.getElementById('saveHtmlBtn');
const saveJpgBtn = document.getElementById('saveJpgBtn');
const resetBtn = document.getElementById('resetBtn');
const shopeeAdCard = document.getElementById('shopeeAdCard');
const statusMessageEl = document.getElementById('statusMessage');
const allActionButtons = document.querySelectorAll('.toolbar-container .toolbar-button, .toolbar-container label.toolbar-button');
const editableElements = shopeeAdCard.querySelectorAll('[contenteditable="true"]');
const allImageInputs = document.querySelectorAll('input[type="file"]');

// --- Initial State Storage ---
function storeInitialState() {
    // Store initial image source
    if (productImageDisplay) {
        const initialSrc = productImageDisplay.dataset.initialSrc || productImageDisplay.src;
        productImageDisplay.src = initialSrc; // Set current src to initial
        if (!productImageDisplay.dataset.initialSrc) {
            productImageDisplay.dataset.initialSrc = initialSrc; // Store if not already stored
        }
    }
    // Store initial HTML for editable elements
    editableElements.forEach(el => {
        if (typeof el.dataset.initialHtml === 'undefined') {
            el.dataset.initialHtml = el.innerHTML; // Store initial content if not already stored
        }
        el.innerHTML = el.dataset.initialHtml; // Restore initial content
         // Trigger visibility check on restore/load
         checkElementVisibility(el);
    });
    console.log("Initial Shopee Ad state loaded/restored.");
}

// --- Status Message ---
let statusTimeout;
function showStatus(message, type = 'info', duration = 4000) {
    clearTimeout(statusTimeout);
    let icon = '';
    switch (type) {
        case 'success': icon = '✅ '; break;
        case 'error':   icon = '❌ '; break;
        case 'loading': icon = '⏳ '; break;
        case 'info':    icon = 'ℹ️ '; break;
    }
    statusMessageEl.textContent = icon + message;
    statusMessageEl.className = `status-message ${type} show`; // Apply type class and show

    if (duration > 0) {
        statusTimeout = setTimeout(() => {
            statusMessageEl.classList.remove('show');
            // Optional: Reset text/class after fade out
            // setTimeout(() => { statusMessageEl.textContent = ''; statusMessageEl.className = 'status-message'; }, 400);
        }, duration);
    }
}

// --- Button State ---
function disableButtons(loadingButton = null) {
    allActionButtons.forEach(button => {
        let isLabel = button.tagName === 'LABEL';
        if (!isLabel) {
            button.disabled = true;
        } else {
            // For labels acting as buttons, prevent clicks and indicate disabled state
            button.style.pointerEvents = 'none';
            button.setAttribute('aria-disabled', 'true');
        }
        // Dim buttons not actively loading
        button.style.opacity = (button === loadingButton) ? '1' : '0.6';

        // Show loading text on the active button
        if (button === loadingButton) {
            const loadingText = '⏳ Proses...';
            button.dataset.originalText = isLabel ? button.innerHTML : button.textContent;
            if (isLabel) { button.innerHTML = loadingText; } else { button.textContent = loadingText; }
        }
    });
    // Disable file inputs too
    allImageInputs.forEach(input => input.disabled = true);
}

function enableButtons() {
    allActionButtons.forEach(button => {
        let isLabel = button.tagName === 'LABEL';
        if (!isLabel) {
            button.disabled = false;
        } else {
            button.style.pointerEvents = 'auto';
            button.removeAttribute('aria-disabled');
        }
        // Restore original text if it was changed
        if (button.dataset.originalText) {
            if (isLabel) { button.innerHTML = button.dataset.originalText; } else { button.textContent = button.dataset.originalText; }
            delete button.dataset.originalText; // Clean up dataset
        }
        button.style.opacity = '1'; // Restore full opacity
    });
    allImageInputs.forEach(input => input.disabled = false);
}

// --- Image Upload ---
function handleImageUpload(event, displayElement) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (displayElement && displayElement.tagName === 'IMG') {
                displayElement.src = e.target.result;
                showStatus('Gambar produk diganti.', 'success');
            }
        };
        reader.onerror = function () {
            showStatus('Gagal memuat pratinjau gambar.', 'error');
        };
        reader.readAsDataURL(file);
    } else if (file) {
        // Handle invalid file type
        showStatus('Format file tidak valid. Pilih file gambar (JPG, PNG, GIF, dll.).', 'error');
    }
    // Reset file input to allow selecting the same file again
    event.target.value = null;
}

// --- Reset ---
function resetContent() {
    if (confirm('Yakin ingin mereset semua perubahan ke template awal?')) {
        disableButtons(resetBtn);
        showStatus('Mereset konten...', 'loading', 0); // Show loading indefinitely
        setTimeout(() => { // Add delay for visual feedback
            try {
                storeInitialState(); // Restore initial state (includes visibility checks)
                showStatus('Konten berhasil direset ke template awal.', 'success');
            } catch (e) {
                console.error("Reset Error:", e);
                showStatus('Gagal mereset konten.', 'error');
            } finally {
                enableButtons();
            }
        }, 50); // Short delay
    }
}

// --- Filename Generation ---
function generateFilename(extension) {
    const nameElement = shopeeAdCard.querySelector('.shopee-ad-name');
    let baseName = 'shopee_produk_iklan'; // Default base name
    if (nameElement && nameElement.textContent.trim()) {
        // Use product name, sanitize, limit length
        baseName = nameElement.textContent.trim()
            .substring(0, 50) // Limit length
            .replace(/[^a-z0-9_]/gi, '_') // Replace non-alphanumeric with underscore
            .replace(/__+/g, '_') // Replace multiple underscores
            .toLowerCase();
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ''); // YYYYMMDDHHMMSS format
    return `${baseName || 'produk'}_${timestamp}.${extension}`;
}


// --- Save HTML (Using <link> to style.css) ---
function saveHtml() {
     disableButtons(saveHtmlBtn);
     showStatus('Menyiapkan file HTML...', 'loading', 0);

     // Use setTimeout for UI feedback
     setTimeout(() => {
         try {
             // 1. Clone and clean the ad card HTML
             const cardClone = shopeeAdCard.cloneNode(true);
             cardClone.querySelectorAll('[contenteditable="true"]').forEach(el => {
                 el.removeAttribute('contenteditable');
                 el.removeAttribute('data-initial-html');
                 el.classList.remove('editable-focus'); // Remove focus class if present
             });
             cardClone.querySelectorAll('[data-initial-src]').forEach(el => {
                 el.removeAttribute('data-initial-src');
             });
             cardClone.querySelectorAll('.image-upload-overlay').forEach(el => el.remove());
             cardClone.classList.remove('is-capturing'); // Ensure capture class is removed

             // Remove dynamically hidden elements based on content (important for static output)
             checkElementVisibility(cardClone.querySelector('.sponsored-tag'), true); // Pass true to remove if hidden
             cardClone.querySelectorAll('.seller-badge').forEach(badge => checkElementVisibility(badge, true));
             checkElementVisibility(cardClone.querySelector('.discount-tag'), true);
             // Ensure sub-elements inside discount tag are also correctly handled if needed
             const discountTagClone = cardClone.querySelector('.discount-tag');
             if (discountTagClone) {
                  const percentSpanClone = discountTagClone.querySelector('.percent');
                  const offSpanClone = discountTagClone.querySelector('.off');
                  if(percentSpanClone && percentSpanClone.textContent.trim() === '') percentSpanClone.remove();
                  if(offSpanClone && offSpanClone.textContent.trim() === '') offSpanClone.remove();
             }

             // 2. Construct the final HTML string, linking to style.css
             const finalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iklan Shopee - ${cardClone.querySelector('.shopee-ad-name')?.textContent?.substring(0, 30) || 'Produk'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Tautan ke file CSS eksternal -->
    <!-- PENTING: Agar tampilan benar, file HTML ini harus berada di folder yang sama dengan style.css -->
    
    <style>
        :root {
    /* Shopee Colors */
    --shopee-orange: #EE4D2D;
    --shopee-orange-dark: #d73210;
    --shopee-orange-light: #ff7b5a;
    --shopee-red-discount: #f04c59;
    --shopee-red-mall: #d0011b;
    --shopee-gold-star: #FFCE3D;
    --shopee-star-badge-icon-color: var(--shopee-text-white);
    --shopee-orange-star-seller: #f57c0f;
    --shopee-bg: #f5f5f5;
    --shopee-card-bg: #ffffff;
    --shopee-border: #e8e8e8;
    --shopee-text-primary: rgba(0, 0, 0, 0.87);
    --shopee-text-secondary: rgba(0, 0, 0, 0.54);
    --shopee-text-light: rgba(0, 0, 0, 0.4);
    --shopee-text-white: #ffffff;
    /* NEW: Base background for sponsored tag */
    --shopee-sponsored-bg: rgba(0, 0, 0, 0.25);

    /* Editor specific */
    --primary-color: var(--shopee-orange);
    --primary-darker: var(--shopee-orange-dark);
    --card-bg: var(--shopee-card-bg);
    --border-color: #dbdbdb;
    --text-color: var(--shopee-text-primary);
    --success-color: #2a9d8f;
    --error-color: #e79551; /* Adjusted error color for better contrast */
    --loading-color: #e9c46a;
    --info-color: #adb5bd;
    --shadow-sm: 0 1px 1px rgba(0, 0, 0, 0.05);
    --font-primary: 'Roboto', sans-serif;
    --toolbar-height: 65px;
}

*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-primary);
    line-height: 1.4;
    background: var(--shopee-bg);
    color: var(--text-color);
    padding-top: calc(var(--toolbar-height) + 15px); /* Add space for toolbar */
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 70vh; /* Changed from 75vh */
    overflow-x: hidden;
    font-size: 14px;
}

/* --- Toolbar --- */
.toolbar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(5px);
    box-shadow: var(--shadow-sm);
    z-index: 1000;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
    height: var(--toolbar-height);
}

.toolbar {
    max-width: 100%;
    margin: 0 auto;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    height: 100%;
}

.toolbar-button,
.toolbar label.toolbar-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 7px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}

.toolbar-button:hover,
.toolbar label.toolbar-button:hover {
    background-color: var(--primary-darker);
}

.toolbar-button:disabled,
.toolbar label.toolbar-button[aria-disabled="true"] {
    /* Keep background color for loading state, just change opacity */
    opacity: 0.6;
    cursor: not-allowed;
    /* Remove pointer-events from label when disabled */
}
.toolbar label.toolbar-button[aria-disabled="true"] {
    pointer-events: none;
}

.toolbar-button.reset {
    background-color: #efefef;
    color: var(--shopee-text-primary);
}

.toolbar-button.reset:hover {
    background-color: #e0e0e0;
}

.toolbar input[type="file"] {
    display: none; /* Hide the actual file input */
}

/* --- Status Message --- */
.status-message {
    width: calc(100% - 20px); /* Full width with padding */
    max-width: 500px; /* Limit max width */
    margin: 8px auto 5px auto;
    padding: 0 15px; /* Start with no vertical padding */
    border-radius: 6px;
    font-size: 0.85em;
    font-weight: 500;
    text-align: center;
    opacity: 0;
    height: 0; /* Start collapsed */
    overflow: hidden;
    transition: opacity 0.4s ease, height 0.4s ease, margin-top 0.4s ease, padding 0.4s ease;
    border: 1px solid transparent;
    z-index: 999;
    position: relative; /* Needed for z-index */
}

.status-message.show {
    opacity: 1;
    height: auto; /* Expand height */
    padding: 8px 15px; /* Add vertical padding when shown */
    margin-top: 10px; /* Add margin when shown */
}

.status-message.success {
    background-color: #d4edda;
    color: #155724;
    border-color: var(--success-color);
}

.status-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border-color: var(--error-color);
}

.status-message.loading {
    background-color: #fff3cd;
    color: #856404;
    border-color: var(--loading-color);
}

.status-message.info {
    background-color: #e2e3e5;
    color: #383d41;
    border-color: var(--info-color);
}

/* --- Main Content Area --- */
.main-content {
    padding: 10px 15px; /* Reduced top padding */
    width: 100%;
    display: flex;
    justify-content: center;
    flex-grow: 1;
}

/* --- Shopee Ad Card Styles --- */
.shopee-ad-container {
    background-color: var(--shopee-card-bg);
    border: 1px solid var(--shopee-border);
    border-radius: 3px;
    width: 100%;
    max-width: 200px; /* Default width */
    font-size: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer; /* Indicates interactivity */
    position: relative; /* For absolute positioning inside */
}

.shopee-ad-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Ad Media Area */
.shopee-ad-media {
    position: relative; /* For absolute positioning of overlays */
    width: 100%;
    aspect-ratio: 1 / 1; /* Make it square */
    background-color: #f9f9f9; /* Fallback color */
    overflow: hidden; /* Ensure overlays stay within bounds */
}

.shopee-ad-media img {
    display: block; /* Remove extra space below image */
    width: 100%;
    height: 100%;
    object-fit: contain; /* Fit image within container */
}

/* Sponsored Tag */
.sponsored-tag {
    position: absolute;
    top: 6px;
    left: 6px;
    background-color: var(--shopee-sponsored-bg); /* Use variable */
    color: white;
    font-size: 9px;
    font-weight: 500;
    padding: 1px 4px;
    border-radius: 2px;
    z-index: 2;
    text-transform: capitalize;
    line-height: 1.2;
    display: inline-block; /* Default display */
}
/* Hide if empty (handled by JS, but CSS fallback) */
.sponsored-tag:empty { display: none; }

/* Discount Tag */
.discount-tag {
    position: absolute;
    top: 0;
    right: 0;
    background-color: var(--shopee-red-discount); /* Use variable */
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 4px 2px 4px;
    text-align: center;
    z-index: 2;
    min-width: 38px;
    border-bottom-left-radius: 3px;
    line-height: 1;
    display: block; /* Default display */
}
.discount-tag .percent { font-size: 11px; display: block; font-weight: 700; }
.discount-tag .off { font-size: 8px; display: block; text-transform: uppercase; font-weight: 500; }
/* Visibility for empty state handled by JS checkElementVisibility */

/* Helper class for hiding during JPG capture if empty */
.discount-tag.discount-tag--hide-capture {
    display: none !important; /* Force hide during capture if empty */
}


/* Seller Badges */
.seller-badges {
    position: absolute;
    top: 25px; /* Position below Sponsored tag */
    left: 6px;
    z-index: 3; /* Above other elements */
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.seller-badge {
    color: var(--shopee-text-white);
    font-size: 9px;
    font-weight: 500;
    padding: 1px 4px;
    border-radius: 2px;
    line-height: 1.2;
    display: inline-flex; /* Use flex for icon alignment */
    align-items: center;
    gap: 2px; /* Space between icon and text */
}
.seller-badge.mall { background-color: var(--shopee-red-mall); } /* Use variable */
.seller-badge.star { background-color: var(--shopee-orange-star-seller); } /* Use variable */

/* Star Icon for Star Seller Badge */
.seller-badge.star::before {
    content: '★';
    font-size: 8px;
    color: var(--shopee-star-badge-icon-color); /* Use variable */
    line-height: 1;
    display: inline-block;
    margin-right: 1px; /* Small space */
    font-weight: normal; /* Ensure star is not bold */
}
/* Hide icon if badge text is empty */
.seller-badge.star:empty::before { display: none; }

/* Hide empty badges */
.seller-badge:empty { display: none; }

/* Ad Content Area */
.shopee-ad-content {
    padding: 8px;
    flex-grow: 1; /* Allow content to take remaining space */
    display: flex;
    flex-direction: column; /* Stack elements vertically */
}

/* Product Name */
.shopee-ad-name {
    font-size: 12px;
    color: var(--shopee-text-primary);
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box; /* Required for line clamping */
    -webkit-line-clamp: 2; /* Limit to 2 lines */
    -webkit-box-orient: vertical;
    text-overflow: ellipsis; /* Add "..." if text overflows */
    margin-bottom: 4px;
    min-height: calc(1.35em * 2); /* Reserve space for 2 lines */
    font-weight: 400; /* Regular weight */
}

/* Price Row */
.shopee-ad-price-row {
    display: flex;
    align-items: baseline; /* Align based on text baseline */
    gap: 5px;
    margin-bottom: 5px;
}

.current-price {
    color: var(--shopee-orange);
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    display: inline-flex; /* Align currency properly */
    align-items: baseline;
}
.current-price .currency {
    font-size: 10px;
    font-weight: 400; /* Lighter currency symbol */
    margin-right: 1px;
    align-self: flex-start; /* Align Rp slightly higher */
}

.original-price {
    color: var(--shopee-text-light);
    font-size: 10px;
    text-decoration: line-through; /* Strikethrough */
    line-height: 1;
    display: inline-flex;
    align-items: baseline;
}
.original-price .currency {
    font-size: 9px;
    margin-right: 1px;
    align-self: flex-start;
}

/* Info Row (Rating & Sold) */
.shopee-ad-info-row {
    display: flex;
    justify-content: space-between; /* Space out rating and sold */
    align-items: center;
    margin-top: auto; /* Push to bottom if content area has extra space */
    margin-bottom: 4px;
    color: var(--shopee-text-secondary);
    font-size: 10px;
    gap: 5px; /* Space between items if they wrap */
}

.rating-section {
    display: flex;
    align-items: center;
    gap: 2px; /* Space between star and text */
}

.star-icon {
    width: 10px;
    height: 10px;
    display: inline-block;
    vertical-align: middle;
    margin-bottom: 1px; /* Fine-tune vertical alignment */
    fill: var(--shopee-gold-star); /* Star color */
}

.rating-text {
    display: inline-flex; /* Keep rating and count together */
    align-items: center;
    gap: 2px;
}
.rating-text .count {
    color: var(--shopee-text-light); /* Lighter color for count */
}

.units-sold {
    white-space: nowrap; /* Prevent wrapping */
}

/* Shop Location */
.shop-location {
    color: var(--shopee-text-secondary);
    font-size: 10px;
}

/* Image Upload Overlay */
.image-upload-overlay {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    opacity: 0; /* Hidden by default */
    transition: opacity 0.3s ease;
    pointer-events: none; /* Non-interactive by default */
    z-index: 10; /* Above image */
    bottom: 8px;
    right: 8px;
}
/* Make the label interactive */
label.image-upload-overlay {
    pointer-events: auto;
}
/* Show overlay on hover */
.shopee-ad-media:hover .image-upload-overlay {
    opacity: 1;
}

/* Content Editable Styling */
[contenteditable="true"] {
    outline: none; /* Remove default browser outline */
    border: 1px solid transparent; /* Placeholder for hover/focus */
    padding: 0; /* Base padding */
    margin: 0; /* Base margin */
    cursor: text;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    border-radius: 2px;
    display: inline; /* Default for spans etc. */
}

/* Add subtle padding/margin to make elements easier to click/edit */
/* These negative margins pull the element back to its original position */
.shopee-ad-name[contenteditable="true"] { display: block; padding: 1px 3px; margin: -1px -3px; } /* Block for name */
.current-price span[contenteditable="true"],
.original-price span[contenteditable="true"],
.units-sold[contenteditable="true"],
.shop-location[contenteditable="true"],
.rating-text span[contenteditable="true"] { padding: 1px 3px; margin: -1px -3px; }

/* Specific styling for tags/badges when editable */
.discount-tag[contenteditable="true"] { display: block; padding: 3px 4px 2px 4px; margin: 0; }
.seller-badge[contenteditable="true"] { display: inline-flex; padding: 1px 4px; margin: 0; }
.sponsored-tag[contenteditable="true"] { display: inline-block; padding: 1px 4px; margin: 0; }

/* Hover/Focus states */
[contenteditable="true"]:hover {
    background-color: #f0f5ff; /* Light blue background on hover */
    border-color: #c0d5ff; /* Blue border */
}
[contenteditable="true"].editable-focus, /* Use class for focus */
[contenteditable="true"]:focus { /* Fallback */
    background-color: #e6f0ff; /* Slightly darker blue on focus */
    border: 1px solid var(--shopee-orange); /* Use Shopee orange for focus border */
    box-shadow: none; /* Remove any default focus shadow */
}

/* --- JPG Capture Class --- */
/* Applied to the container during html2canvas capture */
.is-capturing {
    transform: none !important; /* Remove hover transform */
    box-shadow: none !important; /* Remove hover shadow */
    border: 1px solid var(--shopee-border) !important; /* Ensure default border */
    cursor: default !important; /* Default cursor */
}

/* Reset specific editing styles during capture */
.is-capturing [contenteditable="true"],
.is-capturing [contenteditable="true"]:hover,
.is-capturing [contenteditable="true"]:focus,
.is-capturing [contenteditable="true"].editable-focus {
    border-color: transparent !important;
    box-shadow: none !important;
    /* Keep original background colors, don't force transparent */
    /* background-color: transparent !important; */
    cursor: default !important;
    /* Reset padding/margin added for editing */
    padding: 0 !important;
    margin: 0 !important;
}

/* Re-apply necessary layout padding/margin during capture if needed (check visually) */
/* These might not be strictly necessary if the base layout is correct */
 /* Example: .is-capturing .shopee-ad-name { padding: 1px 3px !important; margin: -1px -3px !important; } */
 /* It's generally better to rely on the non-editable base styles */

 /* Force original padding for tags/badges during capture */
 .is-capturing .discount-tag { padding: 3px 4px 2px 4px !important; margin: 0 !important; }
 .is-capturing .seller-badge { padding: 1px 4px !important; margin: 0 !important; }
 .is-capturing .sponsored-tag { padding: 1px 4px !important; margin: 0 !important; }


/* Force background colors and display for elements that might be hidden/styled by JS/empty states */
.is-capturing .sponsored-tag:not(:empty) {
    background-color: var(--shopee-sponsored-bg) !important;
    display: inline-block !important; /* Ensure display */
}
.is-capturing .discount-tag:not(.discount-tag--hide-capture) { /* Check against helper class */
    background-color: var(--shopee-red-discount) !important;
    display: block !important; /* Ensure display */
}
.is-capturing .seller-badge.mall:not(:empty) {
    background-color: var(--shopee-red-mall) !important;
    display: inline-flex !important; /* Ensure display */
}
.is-capturing .seller-badge.star:not(:empty) {
    background-color: var(--shopee-orange-star-seller) !important;
    display: inline-flex !important; /* Ensure display */
}

/* Force other visibility rules during capture */
.is-capturing .seller-badge.star:not(:empty)::before { display: inline-block !important; }
.is-capturing .discount-tag:not(.discount-tag--hide-capture) .percent:not(:empty) { display: block !important; }
.is-capturing .discount-tag:not(.discount-tag--hide-capture) .off:not(:empty) { display: block !important; }
.is-capturing .seller-badges { display: flex !important; flex-direction: column !important; gap: 3px !important; }
.is-capturing .image-upload-overlay { display: none !important; opacity: 0 !important; } /* Hide upload button */


/* --- Responsive Styles --- */
@media (max-width: 650px) {
    /* Allow toolbar to scroll horizontally on smaller screens */
    .toolbar {
        justify-content: flex-start; /* Align buttons to the left */
        flex-wrap: nowrap; /* Prevent wrapping */
        overflow-x: auto; /* Enable horizontal scroll */
        padding-bottom: 10px; /* Add padding for scrollbar */
        -webkit-overflow-scrolling: touch; /* Smoother scrolling on iOS */
         scrollbar-width: thin; /* Firefox */
         scrollbar-color: var(--border-color) transparent; /* Firefox */
    }
     .toolbar::-webkit-scrollbar { height: 5px; }
     .toolbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px;}

    .toolbar > * {
        flex-shrink: 0; /* Prevent buttons from shrinking */
    }
}

@media (max-width: 480px) {
    body {
        padding-top: calc(var(--toolbar-height) + 5px); /* Reduce top padding */
        font-size: 13px; /* Slightly adjust base font size */
    }
    .main-content {
        padding: 5px; /* Reduce padding around card */
    }
    .shopee-ad-container {
        max-width: 95%; /* Allow card to take more width */
    }
    .toolbar-button, .toolbar label.toolbar-button {
        padding: 6px 10px;
        font-size: 0.75rem; /* Smaller font size for buttons */
    }
    .status-message {
        max-width: 100%;
        width: calc(100% - 10px); /* Adjust width */
        margin-left: 5px;
        margin-right: 5px;
    }

    /* Adjust card element sizes for smaller screens */
    .shopee-ad-container { font-size: 11px; }
    .shopee-ad-name { font-size: 11px; min-height: calc(1.35em * 2); }
    .current-price { font-size: 13px; }
    .current-price .currency { font-size: 9px; }
    .original-price { font-size: 9px; }
    .original-price .currency { font-size: 8px; }
    .discount-tag { font-size: 9px; min-width: 34px; padding: 2px 3px 1px 3px; }
    .discount-tag .percent { font-size: 10px; }
    .discount-tag .off { font-size: 7px; }
    .shopee-ad-info-row, .shop-location { font-size: 9px; }
    .star-icon { width: 9px; height: 9px; }
    .seller-badge, .sponsored-tag { font-size: 8px; padding: 1px 3px; }
    .seller-badges { top: 22px; left: 5px; gap: 2px; } /* Adjust position */
    .sponsored-tag { top: 5px; left: 5px; }
    .seller-badge.star::before { font-size: 7px; margin-right: 1px; }
}
    </style>
</head>
<body>
    ${cardClone.outerHTML}

    <!-- JavaScript (script.js) is intentionally NOT included. -->
    <!-- This file is a static representation of the ad card. -->
</body>
</html>`;

             // 3. Create Blob and trigger download
             const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
             const f = generateFilename('html');
             const l = document.createElement('a');
             l.href = URL.createObjectURL(blob);
             l.download = f;
             document.body.appendChild(l);
             l.click();
             document.body.removeChild(l);
             URL.revokeObjectURL(l.href);
             // Update status message with reminder
             showStatus(`File "${f}" (HTML) diunduh! Pastikan disimpan bersama style.css.`, 'success', 6000);

         } catch (e) {
             console.error('Save HTML Error:', e);
             showStatus('Gagal menyimpan file HTML.', 'error', 6000);
         } finally {
             enableButtons(); // Ensure buttons are always re-enabled
         }
     }, 50); // Small delay remains for UI feedback
 }


// --- Save JPG ---
function saveJpg() {
    disableButtons(saveJpgBtn);
    showStatus('Memproses gambar JPG...', 'loading', 0);
    // Ensure no element has focus outline during capture
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }

     // Prepare for capture: Temporarily modify elements for correct visual state
     const discountTag = shopeeAdCard.querySelector('.discount-tag');
     let addedHideClass = false; // Track if we added the class
     if (discountTag) {
         const percentSpan = discountTag.querySelector('.percent');
         const offSpan = discountTag.querySelector('.off');
         // Check if BOTH parts are effectively empty
         const hasContent = (percentSpan && percentSpan.textContent.trim() !== '') || (offSpan && offSpan.textContent.trim() !== '');
         if (!hasContent) {
             discountTag.classList.add('discount-tag--hide-capture'); // Add class to hide via CSS rule
             addedHideClass = true;
         } else {
             // Ensure class is removed if it has content (might be redundant but safe)
             discountTag.classList.remove('discount-tag--hide-capture');
         }
     }

    shopeeAdCard.classList.add('is-capturing'); // Apply capture styles

    setTimeout(() => { // Delay to allow styles to apply
        html2canvas(shopeeAdCard, {
            useCORS: true,        // Try to capture cross-origin images (like the initial one)
            allowTaint: true,     // May help with cross-origin images but taints canvas
            scale: 3,             // Increase scale for higher resolution output
            logging: false,       // Disable html2canvas console logging
            backgroundColor: null,// Capture with transparency initially
            removeContainer: true // Clean up temporary container used by html2canvas
        })
        .then(canvas => {
            // Create a new canvas to draw a white background
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const ctx = finalCanvas.getContext('2d');

            // Fill background with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Draw the captured transparent canvas onto the white background
            ctx.drawImage(canvas, 0, 0);

            // Convert the final canvas to JPG Data URL
            const imgData = finalCanvas.toDataURL('image/jpeg', 0.95); // Quality 0.95

            // Create download link
            const filename = generateFilename('jpg');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = filename;
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link); // Clean up link

            showStatus(`File "${filename}" (JPG) berhasil diunduh!`, 'success');
        })
        .catch(e => {
            console.error('JPG Capture Error:', e);
            showStatus(`Gagal membuat JPG: ${e.message}. Coba refresh halaman.`, 'error', 6000);
        })
        .finally(() => {
            // Cleanup after capture attempt (success or fail)
            shopeeAdCard.classList.remove('is-capturing');
            // Remove the helper class if it was added
            if (discountTag && addedHideClass) {
                discountTag.classList.remove('discount-tag--hide-capture');
            }
            enableButtons(); // Re-enable buttons
        });
    }, 250); // Increased delay for rendering complex styles before capture
}

 // --- Helper: Check Element Visibility ---
 // Hides element if its text content (trimmed) is empty, shows otherwise.
 // Optionally removes the element from DOM if removeWhenHidden is true (used in saveHTML).
 function checkElementVisibility(element, removeWhenHidden = false) {
     if (!element) return;

     let hasContent = false;
     let intendedDisplay = 'none'; // Default to hidden

     // Specific logic for different element types
     if (element.classList.contains('discount-tag')) {
         const percentSpan = element.querySelector('.percent');
         const offSpan = element.querySelector('.off');
         // Considered visible if either part has content
         hasContent = (percentSpan && percentSpan.textContent.trim() !== '') || (offSpan && offSpan.textContent.trim() !== '');
         intendedDisplay = 'block'; // Discount tag is block level

         // Also hide/show individual spans within the discount tag based on their content
         if (percentSpan) percentSpan.style.display = percentSpan.textContent.trim() !== '' ? 'block' : 'none';
         if (offSpan) offSpan.style.display = offSpan.textContent.trim() !== '' ? 'block' : 'none';

     } else if (element.classList.contains('seller-badge')) {
         // Simple text content check is enough for badges
         hasContent = element.textContent.trim() !== '';
         intendedDisplay = 'inline-flex'; // Badges use inline-flex
          // Special handling for star badge icon
          if (element.classList.contains('star')) {
               const beforeStyle = window.getComputedStyle(element, '::before');
               // The ::before element itself doesn't affect the textContent check,
               // but we ensure the badge itself is visible only if text exists.
               // The CSS handles hiding the ::before if the badge text is empty.
          }

     } else if (element.classList.contains('sponsored-tag')) {
         hasContent = element.textContent.trim() !== '';
         intendedDisplay = 'inline-block'; // Sponsored tag is inline-block
     } else {
         // Fallback for any other element passed (if needed)
         hasContent = element.textContent.trim() !== '';
         // Determine display based on default browser style or explicitly set style
         // This part is less critical as we mainly care about the tags/badges
         intendedDisplay = window.getComputedStyle(element).display || 'inline';
         if (intendedDisplay === 'none') intendedDisplay = 'inline'; // Avoid setting 'none' if it was already none
     }

     // Apply visibility or remove
     if (hasContent) {
         element.style.display = intendedDisplay;
     } else {
         if (removeWhenHidden) {
             element.remove(); // Remove from DOM (for HTML save)
             console.log("Removed empty element:", element);
         } else {
             element.style.display = 'none'; // Hide in the editor
         }
     }
 }


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    storeInitialState(); // Load initial data and apply visibility
    console.log("Shopee Ad Editor (Pro) Initialized - Upgraded v2.");

    // Add input/blur listeners for real-time visibility checks on editable tags/badges
    editableElements.forEach(el => {
        if (el.classList.contains('seller-badge') || el.classList.contains('sponsored-tag') || el.classList.contains('discount-tag')) {
             // Use 'input' for immediate feedback as user types/deletes
            el.addEventListener('input', () => checkElementVisibility(el));
            // Use 'blur' as a fallback check when user clicks away
            el.addEventListener('blur', () => checkElementVisibility(el));
        }

        // Add focus/blur classes for visual feedback
        el.addEventListener('focus', () => el.classList.add('editable-focus'));
        el.addEventListener('blur', () => el.classList.remove('editable-focus'));

        // Handle paste as plain text
        el.addEventListener('paste', (e) => {
            e.preventDefault(); // Prevent default paste behavior (which might include styles)
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            // Insert plain text using execCommand (works with contenteditable)
            document.execCommand('insertText', false, text);
            // Trigger visibility check after paste
             if (el.classList.contains('seller-badge') || el.classList.contains('sponsored-tag') || el.classList.contains('discount-tag')) {
                 checkElementVisibility(el);
             }
        });
    });

    // Attach event listeners to buttons and inputs
    productImageUploadInput.addEventListener('change', (e) => handleImageUpload(e, productImageDisplay));
    saveHtmlBtn.addEventListener('click', saveHtml);
    saveJpgBtn.addEventListener('click', saveJpg);
    resetBtn.addEventListener('click', resetContent);
});
