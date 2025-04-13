const AuraStore = (function() {
    'use strict';

    // --- CONSTANTS & STATE ---
    const IMAGE_STORAGE_KEY = 'auraStoreProductImages';
    const CART_STORAGE_KEY = 'cart';
    const THEME_STORAGE_KEY = 'theme';
    const EMAIL_TARGET_KEY = 'auraStoreCheckoutEmailTarget'; // Defined here for potential reuse
    const DEFAULT_EMAIL_TARGET = 'admin@EdyStore.com'; // Default checkout email

    let currentImageTarget = null;       // Element ref for image upload
    let currentImageProductId = null;    // Product ID for image upload
    let editingListenersAttached = false;// Flag to prevent double attachment
    let mainScriptContent = '';          // Stores fetched content of this script for saving

    // --- DUMMY PRODUCT DATA STORE ---
    // In a real app, this would come from an API.
    // Prices are stored as numbers (integers for simplicity).
    const productDataStore = {
        'p1': { name: 'Produk Elegan 1', price: 249000, description: 'Blazer wanita modern dengan potongan presisi, terbuat dari bahan premium yang nyaman dipakai sehari-hari maupun acara formal.', image: 'img/2.png' },
        'p2': { name: 'Produk Elegan 2', price: 319000, description: 'Dress midi flowy dengan motif floral eksklusif. Sempurna untuk acara spesial atau tampilan kasual yang menawan.', image: 'img/2.png' },
        'p3': { name: 'Produk Elegan 3', price: 199000, description: 'Kemeja pria slim-fit berbahan katun berkualitas tinggi, nyaman dan cocok untuk gaya smart-casual.', image: 'img/2.png' },
        // Add more products here if needed
    };

    // --- UTILITY FUNCTIONS ---

    /**
     * Shows a toast notification message.
     * @param {string} message - The message to display.
     * @param {'info'|'success'|'warning'|'error'} type - Type of toast.
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast-notification');
        if (!toast) { console.warn("Toast element #toast-notification not found."); return; }

        toast.textContent = message;
        toast.className = `toast show ${type}`; // Apply type class

        // Clear existing timer if any
        if (toast.timer) clearTimeout(toast.timer);

        // Set timer to hide the toast
        toast.timer = setTimeout(() => {
            toast.classList.remove('show');
            // Optional: Reset classes after fade out
            // setTimeout(() => { toast.className = 'toast'; }, 500);
        }, 3500); // Show for 3.5 seconds
    }

    /**
     * Shows or hides the loading overlay.
     * @param {boolean} show - True to show, false to hide.
     * @param {string} [message="Memproses..."] - Message to display.
     */
    function showLoading(show, message = "Memproses...") {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        const messageEl = overlay.querySelector('p');
        if (messageEl) messageEl.textContent = message;
        overlay.classList.toggle('show', show);
    }

    /**
     * Formats a number as Indonesian Rupiah (IDR).
     * @param {number|string|null|undefined} price - The price number.
     * @returns {string} Formatted price string (e.g., "Rp 150.000").
     */
    function formatPrice(price) {
        const numericPrice = Number(price); // Convert to number
        if (isNaN(numericPrice)) {
            console.warn(`formatPrice: Invalid price value received: ${price}. Defaulting to 0.`);
            return 'Rp 0';
        }
        return `Rp ${numericPrice.toLocaleString('id-ID')}`;
    }

    /**
     * Parses a formatted price string (like "Rp 150.000") into a number.
     * @param {string} priceString - The formatted price string.
     * @returns {number} The parsed price as a number, or 0 if parsing fails.
     */
    function parsePrice(priceString) {
        if (typeof priceString !== 'string') return 0;
        // Remove "Rp", spaces, and thousand separators (.), then replace comma decimal if needed (though we use integers)
        const cleaned = priceString.replace(/Rp\s*|\./g, '').trim();
        const price = parseInt(cleaned, 10);
        return isNaN(price) ? 0 : price;
    }

    // --- LOCALSTORAGE HELPERS ---

    /** Safely gets data from localStorage. */
    function getLocalStorageItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`LocalStorage Error (Get ${key}):`, e);
            showToast(`Gagal memuat data (${key}).`, "error");
            return null;
        }
    }

    /** Safely sets data in localStorage. */
    function setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`LocalStorage Error (Set ${key}):`, e);
            // Provide more specific error for quota exceeded
            if (e.name === 'QuotaExceededError') {
                showToast("Gagal menyimpan data: Penyimpanan lokal penuh.", "error");
            } else {
                showToast(`Gagal menyimpan data (${key}).`, "error");
            }
            return false;
        }
    }

    /** Safely removes an item from localStorage. */
    function removeLocalStorageItem(key) {
         try {
             localStorage.removeItem(key);
             return true;
         } catch (e) {
             console.error(`LocalStorage Error (Remove ${key}):`, e);
             showToast(`Gagal menghapus data (${key}).`, "error");
             return false;
         }
    }


    // --- IMAGE STORAGE ---
    function getStoredImages() {
        return getLocalStorageItem(IMAGE_STORAGE_KEY) || {};
    }

    function storeImage(productId, imageDataUrl) {
        if (!productId || !imageDataUrl) return false;
        let images = getStoredImages();
        images[productId] = imageDataUrl;
        return setLocalStorageItem(IMAGE_STORAGE_KEY, images);
    }

    function getProductImageSource(productId, defaultImagePath = 'img/placeholder.png') {
        if (!productId) return defaultImagePath;
        const storedImages = getStoredImages();
        return storedImages[productId] || defaultImagePath;
    }

    // --- CART STORAGE ---
    function getCart() {
        return getLocalStorageItem(CART_STORAGE_KEY) || {};
    }

    function saveCart(cart) {
        return setLocalStorageItem(CART_STORAGE_KEY, cart);
    }

    /** Updates specific details (name, price, image, desc) for an item already in the cart. */
    function updateCartItemDetails(productId, details) {
        if (!productId || !details) return;
        let cart = getCart();
        if (cart[productId]) {
            // Ensure price is stored as a number
            if (details.price !== undefined) {
                details.price = parsePrice(String(details.price)); // Parse just in case
            }
            // Merge new details with existing item data
            cart[productId] = { ...cart[productId], ...details };
            saveCart(cart);
            console.log(`Cart item details updated for ${productId}:`, details);
        }
    }

    // --- THEME & MENU ---
    (function setupThemeAndMenu() {
        const themeToggle = document.getElementById('theme-toggle');
        const menuToggler = document.getElementById('menu-toggler');
        const navMenu = document.getElementById('nav-menu');

        // Theme Setup
        if (themeToggle) {
            const applyTheme = (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                setLocalStorageItem(THEME_STORAGE_KEY, theme); // Use safe setter
            };

            const savedTheme = getLocalStorageItem(THEME_STORAGE_KEY); // Use safe getter
            // Check system preference only if no theme is saved
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
            applyTheme(initialTheme);

            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                applyTheme(newTheme);
            });

            // Listen for system theme changes if no user preference is set
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                 if (!getLocalStorageItem(THEME_STORAGE_KEY)) { // Only apply if user hasn't chosen
                     applyTheme(e.matches ? 'dark' : 'light');
                 }
             });
        }

        // Mobile Menu Toggle
        if (menuToggler && navMenu) {
            const toggleMenu = (show) => {
                const isExpanded = typeof show === 'boolean' ? show : (menuToggler.getAttribute('aria-expanded') !== 'true');
                navMenu.classList.toggle('active', isExpanded);
                menuToggler.setAttribute('aria-expanded', String(isExpanded));
                const icon = menuToggler.querySelector('i');
                if (icon && typeof feather !== 'undefined') {
                    icon.setAttribute('data-feather', isExpanded ? 'x' : 'menu');
                    try { feather.replace(); } catch (e) { console.error("Feather replace error:", e); }
                } else if (icon) {
                    icon.textContent = isExpanded ? '✕' : '☰'; // Fallback
                }
            };

            menuToggler.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from closing menu immediately
                toggleMenu();
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !menuToggler.contains(e.target)) {
                    toggleMenu(false);
                }
            });

            // Close menu when clicking a nav link
            navMenu.addEventListener('click', (e) => {
                if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
                    toggleMenu(false);
                }
            });
        }
    })();

    // --- PRODUCT DATA STORE ACCESS ---

    /** Gets product data, falling back to cart for new/unsaved items. */
    function getProductData(productId) {
        let product = productDataStore[productId];

        // If not in store AND it's a 'new-' ID, check the cart
        if (!product && productId && productId.startsWith('new-')) {
            const cart = getCart();
            if (cart[productId]) {
                console.log(`Product ${productId} not in store, retrieving from cart.`);
                // Construct a product-like object from cart data
                product = {
                    id: productId,
                    name: cart[productId].name || "Produk Baru",
                    price: cart[productId].price || 0,
                    description: cart[productId].description || "Deskripsi belum diatur.",
                    image: cart[productId].image || 'img/placeholder.png'
                };
            } else {
                // If not in store or cart, create a default placeholder
                console.warn(`Product ${productId} not found in store or cart. Creating default.`);
                product = { id: productId, name: "Produk Baru", price: 0, description: "Deskripsi belum diatur.", image: 'img/placeholder.png' };
                // Optionally add this default to the data store?
                // updateProductData(productId, product); // Decide if needed
            }
        }

        // Return a copy with a guaranteed image path
        if (product) {
            return { ...product, image: product.image || 'img/placeholder.png' };
        }
        return null; // Product truly not found
    }

    /** Updates product data in the store. */
    function updateProductData(productId, data) {
        if (!productId) return;

        // Ensure price is a number
        if (data.price !== undefined && typeof data.price !== 'number') {
            data.price = parsePrice(String(data.price));
        }

        if (productDataStore[productId]) {
            // Merge updates with existing data
            productDataStore[productId] = { ...productDataStore[productId], ...data };
        } else {
            // Create new entry if it doesn't exist
            console.log(`Adding new product ${productId} to data store.`);
            productDataStore[productId] = {
                name: data.name || "Produk Baru",
                price: data.price !== undefined ? data.price : 0,
                description: data.description || "Deskripsi belum diatur.",
                image: data.image || 'img/placeholder.png',
                ...data // Include any other properties passed
            };
        }
        console.log(`Product data updated for ${productId}:`, productDataStore[productId]);
    }


    // --- CART LOGIC ---

    /** Updates the cart count display in the header. */
    function updateCartCount() {
        const cart = getCart();
        const element = document.getElementById('cart-count');
        if (!element) return;

        const totalItems = Object.values(cart).reduce((sum, item) => {
            // Ensure quantity is a valid number before adding
            const quantity = Number(item.quantity);
            return sum + (isNaN(quantity) ? 0 : quantity);
        }, 0);

        element.textContent = totalItems;
    }

    /** Handles adding a product to the cart. */
    function handleAddToCart(buttonElement) {
        if (!buttonElement) return;

        const productId = buttonElement.dataset.id;
        if (!productId) {
            console.error("Add to cart failed: Missing product ID on button.", buttonElement);
            showToast("Gagal menambahkan ke keranjang (ID produk tidak ditemukan).", "error");
            return;
        }

        // --- Determine product details ---
        let productName = buttonElement.dataset.name || "Nama Produk Error";
        let productPrice = parsePrice(buttonElement.dataset.price || '0');
        let productImageSrc = 'img/placeholder.png';
        let productDescription = "Deskripsi tidak tersedia.";
        let quantity = 1; // Default quantity

        // Try finding context: Detail Page or Product Card
        const detailContainer = buttonElement.closest('.product-info-details');
        const productCard = buttonElement.closest('.product-card');

        if (detailContainer) { // Detail Page Context
            const nameEl = document.getElementById('product-name');
            const priceEl = document.getElementById('product-price');
            const descEl = document.getElementById('product-description');
            const imgEl = document.getElementById('product-image');
            const quantityInput = document.getElementById('quantity');

            if (nameEl) productName = nameEl.textContent.trim() || productName;
            if (priceEl) productPrice = parsePrice(priceEl.textContent) || productPrice;
            if (descEl) productDescription = descEl.textContent.trim() || productDescription;
            if (imgEl) productImageSrc = getProductImageSource(productId, imgEl.src); // Use current displayed image

            if (quantityInput) {
                 const inputVal = parseInt(quantityInput.value, 10);
                 if (!isNaN(inputVal) && inputVal > 0) {
                     quantity = inputVal;
                 } else {
                     showToast("Jumlah produk tidak valid.", "warning");
                     quantityInput.value = '1'; // Reset to 1
                     quantity = 1; // Use default quantity
                 }
            }

        } else if (productCard) { // Product Card Context
            const titleLink = productCard.querySelector('.product-title a');
            const priceEl = productCard.querySelector('.product-price');
            const imgEl = productCard.querySelector('.editable-image'); // Get the editable image source

            if (titleLink) productName = titleLink.textContent.trim() || productName;
            if (priceEl) productPrice = parsePrice(priceEl.textContent) || productPrice;
            if (imgEl) productImageSrc = getProductImageSource(productId, imgEl.src); // Use current displayed image

            // Get description from data store for consistency
            const storedData = getProductData(productId);
            if (storedData) productDescription = storedData.description || productDescription;
        } else {
            // Fallback if button is not in expected context (less likely)
            console.warn("Add to cart button context not recognized (not in detail or card). Using button data only.");
            const storedData = getProductData(productId);
             if (storedData) {
                 productName = storedData.name || productName;
                 productPrice = storedData.price || productPrice;
                 productImageSrc = getProductImageSource(productId, storedData.image);
                 productDescription = storedData.description || productDescription;
             }
        }
        // Final validation on price
        if (isNaN(productPrice)) productPrice = 0;

        // --- Update Cart ---
        let cart = getCart();
        const currentItem = cart[productId];

        if (currentItem) {
            // Item exists, update quantity and details (in case they were edited)
            const currentQuantity = Number(currentItem.quantity) || 0;
            currentItem.quantity = currentQuantity + quantity;
            currentItem.name = productName;
            currentItem.price = productPrice;
            currentItem.image = productImageSrc; // Store the *current* image URL
            currentItem.description = productDescription;
        } else {
            // New item
            cart[productId] = {
                id: productId,
                name: productName,
                price: productPrice,
                quantity: quantity,
                image: productImageSrc, // Store the *current* image URL
                description: productDescription
            };
        }

        if (saveCart(cart)) {
            updateCartCount();
            showToast(`${quantity}x ${productName} ditambahkan!`, 'success');
            // Reset quantity input on detail page if applicable
            if (detailContainer && document.getElementById('quantity')) {
                document.getElementById('quantity').value = '1';
            }
            // Re-render cart if on cart page
            if (document.body.classList.contains('cart-page')) {
                renderCartItems();
            }
        } else {
            showToast("Gagal menyimpan keranjang.", "error");
        }
    }


    /** Renders the cart items table and summary. */
    function renderCartItems() {
        const cart = getCart();
        const cartContainer = document.getElementById('cart-items-container');
        if (!cartContainer) {
            console.error("Cart container #cart-items-container not found.");
            return;
        }

        // Get summary elements
        const cartTotalItemsEl = document.getElementById('cart-total-items');
        const cartSubtotalPriceEl = document.getElementById('cart-subtotal-price');
        const cartTotalPriceEl = document.getElementById('cart-total-price');
        const checkoutButton = document.getElementById('checkout-button');
        const clearCartBtn = document.getElementById('clear-cart-btn');

        if (!cartTotalItemsEl || !cartSubtotalPriceEl || !cartTotalPriceEl || !checkoutButton || !clearCartBtn) {
            console.error("One or more cart summary elements are missing!");
            return;
        }

        // Clear previous content (table or empty message)
        cartContainer.innerHTML = '';

        const items = Object.values(cart);
        let totalItemsCount = 0;
        let totalPriceValue = 0;
        const placeholderImg = 'img/placeholder.png';

        if (items.length === 0) {
            // Show empty cart message
            const p = document.createElement('p');
            p.className = 'empty-cart-message';
            p.setAttribute('contenteditable', 'true'); // Make message editable if desired
            p.textContent = 'Keranjang belanja Anda masih kosong.';
            cartContainer.appendChild(p);

            // Update summary for empty cart
            checkoutButton.disabled = true;
            clearCartBtn.disabled = true;
            cartTotalItemsEl.textContent = '0';
            cartSubtotalPriceEl.textContent = formatPrice(0);
            cartTotalPriceEl.textContent = formatPrice(0);
            updateCartCount(); // Ensure header count is also 0

        } else {
            // Create and populate the cart table
            checkoutButton.disabled = false;
            clearCartBtn.disabled = false;

            const table = document.createElement('table');
            table.className = 'cart-table';
            // Add explicit header row for better structure and accessibility
            table.innerHTML = `
                <thead>
                    <tr>
                        <th colspan="2"><span contenteditable="false">Produk</span></th>
                        <th><span contenteditable="false">Harga</span></th>
                        <th><span contenteditable="false">Jumlah</span></th>
                        <th><span contenteditable="false">Subtotal</span></th>
                        <th><span contenteditable="false">Aksi</span></th>
                    </tr>
                </thead>
                <tbody></tbody>`;
            const tbody = table.querySelector('tbody');

            items.forEach(item => {
                // Validate item data before rendering
                const itemQuantity = Number(item.quantity) || 0;
                const itemPrice = Number(item.price) || 0;
                if (itemQuantity <= 0) { // Skip items with 0 or negative quantity
                    console.warn(`Skipping item ${item.id} with invalid quantity: ${item.quantity}`);
                    return;
                }

                const subtotal = itemPrice * itemQuantity;
                totalItemsCount += itemQuantity;
                totalPriceValue += subtotal;

                // Use getProductImageSource which checks localStorage first
                const itemImageSrc = getProductImageSource(item.id, item.image || placeholderImg);

                const row = document.createElement('tr');
                row.dataset.productId = item.id; // Add data-id for easier targeting

                // Create table cells for better control and accessibility
                row.innerHTML = `
                    <td class="cart-item-image" data-label="Gambar">
                        <div class="editable-image-container" data-target-img-selector="tr[data-product-id='${item.id}'] .editable-image">
                            <img src="${itemImageSrc}" alt="${item.name || 'Gambar produk'}" class="editable-image" onerror="this.onerror=null; this.src='${placeholderImg}'; this.alt='Gambar tidak tersedia'">
                        </div>
                    </td>
                    <td class="cart-item-name" data-label="Produk"><span contenteditable="true">${item.name || 'Nama Produk Error'}</span></td>
                    <td data-label="Harga">${formatPrice(itemPrice)}</td>
                    <td data-label="Jumlah">
                        <div class="quantity-input-wrapper cart-quantity">
                            <button class="quantity-btn minus" data-id="${item.id}" data-change="-1" aria-label="Kurangi ${item.name || 'item'}" ${itemQuantity <= 1 ? 'disabled' : ''}>-</button>
                            <input type="number" value="${itemQuantity}" min="1" aria-label="Jumlah ${item.name || 'item'}" readonly>
                            <button class="quantity-btn plus" data-id="${item.id}" data-change="1" aria-label="Tambah ${item.name || 'item'}">+</button>
                        </div>
                    </td>
                    <td data-label="Subtotal" class="cart-item-subtotal">${formatPrice(subtotal)}</td>
                    <td class="cart-item-action" data-label="Aksi">
                        <button class="btn btn-remove" data-id="${item.id}" aria-label="Hapus ${item.name || 'item'}">
                            <i data-feather="trash-2" contenteditable="false"></i>
                        </button>
                    </td>`;
                tbody.appendChild(row);
            });

            cartContainer.appendChild(table);

            // Update summary for non-empty cart
            cartTotalItemsEl.textContent = totalItemsCount;
            const formattedTotalPrice = formatPrice(totalPriceValue);
            cartSubtotalPriceEl.textContent = formattedTotalPrice;
            cartTotalPriceEl.textContent = formattedTotalPrice;

            // Initialize Feather Icons for remove buttons etc.
            if (typeof feather !== 'undefined') {
                try { feather.replace(); } catch (e) { console.error("Feather replace error in renderCartItems:", e); }
            }
        }
        // Always update header count after rendering
        updateCartCount();
    }


    /** Updates the quantity of an item in the cart. Removes if quantity <= 0. */
    function updateQuantity(productId, change) {
        let cart = getCart();
        if (!cart[productId]) return; // Item not found

        const currentQuantity = Number(cart[productId].quantity) || 0;
        const newQuantity = currentQuantity + change;

        if (newQuantity <= 0) {
            // Remove item if quantity drops to 0 or below
            removeFromCart(productId); // This already saves and re-renders
        } else {
            cart[productId].quantity = newQuantity;
            if (saveCart(cart)) {
                // Re-render only if on cart page for performance
                if (document.body.classList.contains('cart-page')) {
                    renderCartItems();
                } else {
                    updateCartCount(); // Update header count if not on cart page
                }
            } else {
                 showToast("Gagal memperbarui jumlah.", "error");
            }
        }
    }

    /** Removes an item completely from the cart. */
    function removeFromCart(productId) {
        let cart = getCart();
        if (cart[productId]) {
            const productName = cart[productId].name || "Item"; // Get name before deleting
            delete cart[productId];
            if (saveCart(cart)) {
                showToast(`${productName} dihapus dari keranjang.`, 'info');
                // Always re-render if on cart page, otherwise just update count
                if (document.body.classList.contains('cart-page')) {
                    renderCartItems();
                } else {
                    updateCartCount();
                }
            } else {
                showToast("Gagal menghapus item.", "error");
                 // Add item back potentially? Or just leave the inconsistent state.
                 // For simplicity, we'll assume save failed but visually reflect the attempt if on cart page.
                 if (document.body.classList.contains('cart-page')) {
                     renderCartItems(); // Re-render to show it wasn't actually removed if save failed
                 }
            }
        }
    }

    /** Clears all items from the cart after confirmation. */
    function clearCart() {
        const cart = getCart();
        if (Object.keys(cart).length === 0) {
            showToast("Keranjang sudah kosong.", "info");
            return;
        }

        // Use confirm dialog
        if (confirm("Anda yakin ingin menghapus semua item dari keranjang belanja?")) {
            if (removeLocalStorageItem(CART_STORAGE_KEY)) {
                updateCartCount(); // Update header
                // Re-render if on cart page to show empty state
                if (document.body.classList.contains('cart-page')) {
                    renderCartItems();
                }
                showToast("Keranjang belanja telah dikosongkan.", "success");
            } else {
                // Error handled by removeLocalStorageItem
            }
        }
    }

    // --- EDITING FEATURES ---

    /** Sets up event listeners for content editing and image uploads. */
    function setupEditingFeatures() {
        if (editingListenersAttached) return; // Prevent attaching listeners multiple times

        const fileInput = document.getElementById('image-upload-input');
        if (fileInput) {
            // Use event delegation on the body for image container clicks
            document.body.addEventListener('click', handleImageContainerClick);
            // Direct listener for the hidden file input change event
            fileInput.addEventListener('change', handleFileSelect);
        } else {
            console.warn("Image upload input #image-upload-input not found. Image editing disabled.");
        }

        // Use event delegation for blur on contenteditable elements (capture phase is good)
        document.body.addEventListener('blur', handleContentBlur, true);

        editingListenersAttached = true;
        console.log("Editing features initialized.");
    }

    /** Handles clicks on image containers to trigger file input. */
    function handleImageContainerClick(event) {
        const container = event.target.closest('.editable-image-container');
        if (!container) return; // Click wasn't inside an editable image container

        // Get the specific image element selector from the container's data attribute
        const targetSelector = container.dataset.targetImgSelector;
        const fileInput = document.getElementById('image-upload-input');

        if (!targetSelector) {
            console.error("Image upload failed: Missing data-target-img-selector on container.", container);
            showToast("Gagal memulai unggah gambar (konfigurasi salah).", "error");
            return;
        }
        if (!fileInput) {
            console.error("Image upload failed: File input not found.");
            // No need for toast here, warning logged in setup
            return;
        }

        // Find the target image element using the selector
        currentImageTarget = document.querySelector(targetSelector);
        if (!currentImageTarget) {
            console.error(`Image upload failed: Target image element not found using selector: "${targetSelector}"`);
            showToast("Gagal memulai unggah gambar (target tidak ditemukan).", "error");
            return;
        }

        // Determine the associated product ID based on context
        const productCard = container.closest('.product-card');
        const cartRow = container.closest('tr[data-product-id]');
        const detailLayout = container.closest('.product-detail-layout'); // Check detail page context

        if (productCard) {
            currentImageProductId = productCard.dataset.id;
        } else if (cartRow) {
            currentImageProductId = cartRow.dataset.productId;
        } else if (detailLayout && document.getElementById('product-image') === currentImageTarget) {
            // Specifically check if the clicked image is the main detail image
            currentImageProductId = document.getElementById('detail-add-to-cart')?.dataset.id;
        } else {
            currentImageProductId = null; // Unknown context
            console.warn("Image upload: Could not determine product ID for context.", container);
        }

        // Only proceed if we have a target image and a product ID
        if (currentImageTarget && currentImageProductId) {
            fileInput.click(); // Open the file dialog
        } else if (currentImageTarget && !currentImageProductId) {
             showToast("Gagal ganti gambar (ID produk tidak diketahui).", "error");
             currentImageTarget = null; // Reset target
        } else {
             // Target image not found error handled above
        }
    }

    /** Handles the file selection after the user chooses an image. */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        // Use local copies in case these change before FileReader finishes
        const localImageTarget = currentImageTarget;
        const localProductId = currentImageProductId;

        // Reset global state immediately
        currentImageTarget = null;
        currentImageProductId = null;
        event.target.value = null; // Reset file input to allow selecting the same file again

        if (file && localImageTarget && localProductId) {
            if (!file.type.startsWith('image/')) {
                showToast("File yang dipilih bukan gambar.", "error");
                return;
            }
            // Optional: Check file size
            // const maxSize = 2 * 1024 * 1024; // 2MB limit
            // if (file.size > maxSize) {
            //     showToast("Ukuran gambar terlalu besar (maks 2MB).", "error");
            //     return;
            // }

            const reader = new FileReader();

            reader.onload = (e) => {
                const newImageDataUrl = e.target.result;
                // Update the image src on the page
                localImageTarget.src = newImageDataUrl;
                // Store the new image data in localStorage
                if (storeImage(localProductId, newImageDataUrl)) {
                    // Update the image URL in the cart data as well
                    updateCartItemDetails(localProductId, { image: newImageDataUrl });
                    showToast("Gambar produk berhasil diperbarui.", "success");
                    // Re-render cart if on cart page to show new image
                    if (document.body.classList.contains('cart-page')) {
                         renderCartItems();
                     }
                } else {
                    // Error saving to localStorage handled by storeImage
                }
            };

            reader.onerror = (e) => {
                console.error("FileReader Error:", e);
                showToast("Gagal membaca file gambar.", "error");
            };

            reader.readAsDataURL(file); // Read the file as Data URL

        } else {
            console.log("File selection cancelled or target/product ID missing.");
        }
    }

    /** Handles blur events on contenteditable elements to save changes. */
    function handleContentBlur(event) {
        const target = event.target;

        // Ensure it's a directly contenteditable element losing focus
        if (!target.isContentEditable || target.getAttribute('contenteditable') !== 'true') {
            return;
        }

        const originalValue = target.dataset.originalValue || target.textContent; // Store original for revert
        const newValue = target.textContent.trim();

        // If content hasn't changed, do nothing
        if (newValue === originalValue.trim()) {
            // console.log("Content blur: No change detected.");
            return;
        }
         console.log(`Content blur detected on ${target.tagName}: "${originalValue}" -> "${newValue}"`);

        // Update original value for next blur
        target.dataset.originalValue = newValue;


        let productId = null;
        let updateType = null; // e.g., 'name', 'price', 'description'
        let requiresReformat = false; // Does the element need reformatting (like price)?

        // Identify context and update type
        const productCard = target.closest('.product-card');
        const detailContainer = target.closest('.product-info-details');
        const cartRow = target.closest('tr[data-product-id]');

        // --- Product Data Related Edits ---
        if (productCard) {
            productId = productCard.dataset.id;
            if (target.matches('.product-title a')) updateType = 'name';
            else if (target.matches('.product-price')) { updateType = 'price'; requiresReformat = true; }
        } else if (detailContainer) {
            productId = document.getElementById('detail-add-to-cart')?.dataset.id;
            if (target.matches('#product-name')) updateType = 'name';
            else if (target.matches('#product-price')) { updateType = 'price'; requiresReformat = true; }
            else if (target.matches('#product-description')) updateType = 'description';
        } else if (cartRow) {
            productId = cartRow.dataset.productId;
            if (target.matches('.cart-item-name span')) updateType = 'name';
            // Price/Desc editing in cart table is generally not recommended, handle via detail page.
        }

        // --- Non-Product Data Edits (just log, no data store update) ---
        else if (target.closest('.section-title > span') ||
                 target.matches('.hero-title') ||
                 target.matches('.hero-subtitle') ||
                 target.closest('.site-footer p') ||
                 target.matches('.brand-logo') ||
                 target.closest('.nav-link span:not(#cart-count)') ||
                 target.closest('.breadcrumb-nav a, .breadcrumb-nav span') ||
                 target.closest('.additional-info span') ||
                 target.closest('.form-group label') || // Checkout form labels
                 target.closest('.form-section h3') ||   // Checkout form section titles
                 target.closest('.checkout-panel h2') || // Checkout panel titles
                 target.closest('.summary-row span:first-child') || // Cart/Order summary labels
                 target.matches('.whatsapp-edit-instruction') || // Instruction texts (if editable)
                 target.matches('.email-edit-instruction') || // Instruction texts (if editable)
                 target.matches('#email-target') || // Email target handled by inline script
                 target.matches('#whatsapp-target') // WhatsApp target handled by inline script (if re-added)
                )
        {
             // These edits don't affect product data store or cart directly.
             // The email target saving is handled by the checkout inline script's blur listener.
             console.log(`Generic content update (no data save): ${target.tagName} -> "${newValue}"`);
             // Optionally show a generic "Text updated" toast?
             // showToast("Teks diperbarui.", "info");
             return; // Exit early for generic text edits
        }

        // If it's a product data update, proceed with validation and saving
        if (updateType && productId) {
            let updateData = {};
            let isValid = true;

            switch (updateType) {
                case 'name':
                    if (!newValue) {
                        showToast("Nama produk tidak boleh kosong.", "error");
                        target.textContent = originalValue; // Revert visually
                        target.dataset.originalValue = originalValue; // Reset stored original
                        isValid = false;
                    } else {
                        updateData.name = newValue;
                        // Update relevant data attributes on buttons etc.
                        if (productCard) productCard.querySelector('.add-to-cart-btn').dataset.name = newValue;
                        if (detailContainer) {
                            document.getElementById('detail-add-to-cart').dataset.name = newValue;
                            const bc = document.getElementById('breadcrumb-product-name');
                            if (bc) bc.textContent = newValue; // Update breadcrumb
                        }
                    }
                    break;
                case 'price':
                    const newPrice = parsePrice(newValue);
                    if (isNaN(newPrice) || newPrice < 0) {
                        showToast("Harga produk tidak valid.", "error");
                        target.textContent = formatPrice(parsePrice(originalValue)); // Revert visually and format
                        target.dataset.originalValue = formatPrice(parsePrice(originalValue)); // Reset stored original formatted
                        isValid = false;
                    } else {
                        updateData.price = newPrice;
                        if (requiresReformat) target.textContent = formatPrice(newPrice); // Reformat visually
                        target.dataset.originalValue = formatPrice(newPrice); // Update stored original formatted

                        // Update relevant data attributes
                        if (productCard) productCard.querySelector('.add-to-cart-btn').dataset.price = newPrice;
                        if (detailContainer) document.getElementById('detail-add-to-cart').dataset.price = newPrice;
                    }
                    break;
                case 'description':
                    if (!newValue) showToast("Deskripsi produk sebaiknya diisi.", "warning");
                    updateData.description = newValue;
                    break;
            }

            // Perform the update if valid and data changed
            if (isValid && Object.keys(updateData).length > 0) {
                console.log(`Updating product ${productId} (${updateType}):`, updateData);
                updateProductData(productId, updateData); // Update main store
                updateCartItemDetails(productId, updateData); // Update cart data too
                showToast("Perubahan produk disimpan.", "success");

                // Re-render cart/checkout if needed (e.g., price change affects totals)
                if (document.body.classList.contains('cart-page') && (updateType === 'name' || updateType === 'price')) {
                    renderCartItems();
                } else if (document.body.classList.contains('checkout-page') && updateType === 'price') {
                     // Checkout summary needs update - trigger via event or direct call if possible
                     // Simplest might be to reload summary part via checkout inline script logic
                     console.log("Checkout price changed - summary needs update (requires inline script handling).");
                     // Example: Dispatch custom event for checkout script to listen to
                     // document.dispatchEvent(new CustomEvent('cartUpdated'));
                }
            }
        } else if (updateType && !productId) {
             console.warn("Content blur: Update type identified but no Product ID found for element:", target);
        }
    }


    // --- SAVING FEATURES ---

     /** Fetches the content of script.js to embed it later. */
     async function fetchMainScript() {
         // Avoid fetching if already fetched
         if (mainScriptContent) return;
         try {
             // Use a cache-busting query param for development if needed
             // const cacheBuster = `?v=${Date.now()}`;
             // const response = await fetch(`script.js${cacheBuster}`);
             const response = await fetch('script.js'); // Fetch the script itself

             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
             }
             mainScriptContent = await response.text();
             console.log("Main script content loaded successfully for embedding.");
         } catch (error) {
             console.error('Error fetching script.js:', error);
             showToast("Gagal memuat sumber daya script untuk penyimpanan HTML.", "error");
             // Provide fallback content to avoid breaking the save function entirely
             mainScriptContent = `/* Error: Failed to load script.js content. Functionality might be limited. */ console.error("Original script.js content could not be loaded.");`;
         }
     }

    /** Saves the current page state as a static HTML file. */
    function saveHtml() {
         // Ensure script content is available before saving
         if (!mainScriptContent) {
             console.error("Cannot save HTML: Main script content not loaded.");
             showToast("Gagal menyimpan: Sumber daya script belum siap. Coba lagi.", "error");
              // Optionally try fetching again here?
              // await fetchMainScript(); if(!mainScriptContent) return;
             return;
         }

         try {
             showLoading(true, "Menyiapkan HTML statis...");
             console.log("Saving static HTML with embedded script...");

             // 1. Clone the entire HTML document element
             const htmlClone = document.documentElement.cloneNode(true);
             console.log("Cloned HTML structure.");

             // 2. Clean the clone: Remove dynamic elements, editing attributes, styles
             console.log("Cleaning cloned HTML...");
             // Selectors for elements to remove entirely
             const selectorsToRemove = ['.action-toolbar', '#image-upload-input', '#loading-overlay', '#toast-notification'];
             selectorsToRemove.forEach(selector => {
                 const element = htmlClone.querySelector(selector);
                 if (element) {
                     element.remove();
                     console.log(`- Removed element: ${selector}`);
                 }
             });

             // Remove contenteditable attribute and focus styles
             htmlClone.querySelectorAll('[contenteditable="true"]').forEach(el => {
                 el.removeAttribute('contenteditable');
                 // Remove focus outline/shadow styles that might linger
                 el.style.outline = '';
                 el.style.outlineOffset = '';
                 el.style.boxShadow = '';
                 el.style.backgroundColor = ''; // Reset potential focus bg
                 el.style.margin = ''; // Reset focus margin adjustment
                 el.style.padding = ''; // Reset focus padding adjustment
             });
             console.log("- Removed contenteditable attributes and focus styles.");

             // Remove image edit indicators (::after pseudo-elements are harder, remove container class if needed)
             // For simplicity, we rely on contenteditable removal disabling the JS trigger.

             // 3. Embed the main script content
             console.log("Embedding script.js content...");
             const mainScriptTagInClone = htmlClone.querySelector('script[src="https://supergames19.github.io/onlain/EdyStore/script.js"]');
             if (mainScriptTagInClone) {
                 mainScriptTagInClone.removeAttribute('src'); // Remove external link
                 // IMPORTANT: Wrap the entire script content in a DOMContentLoaded listener
                 // AND a try...catch block within that listener for safety in the static file.
                 mainScriptTagInClone.textContent = `
// --- Embedded Script Content (AuraStore v3.5.0) ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("Static HTML: DOM ready, executing embedded script...");
  try {
    // Paste the entire fetched mainScriptContent here
    ${mainScriptContent}
    console.log("Static HTML: Embedded script executed.");
  } catch (error) {
    console.error('Error executing embedded script in static HTML:', error);
    alert("Terjadi kesalahan saat menjalankan script halaman statis. Beberapa fitur mungkin tidak berfungsi.");
  }
});
// --- End Embedded Script ---
`;
                 console.log("- Embedded script.js content into clone.");
             } else {
                 console.warn("- Could not find <script src='https://supergames19.github.io/onlain/EdyStore/script.js'> tag in clone to embed content.");
                 // Optionally inject a new script tag if the original is missing?
             }

             // 4. Remove OTHER inline scripts from the clone
             console.log("Removing other inline scripts from clone...");
             let inlineScriptsRemoved = 0;
             htmlClone.querySelectorAll('script:not([src])').forEach(inlineScript => {
                 // Check it's not the one we just embedded
                 if (!inlineScript.textContent.includes('// --- Embedded Script Content')) {
                     inlineScript.remove();
                     inlineScriptsRemoved++;
                 }
             });
             console.log(`- Removed ${inlineScriptsRemoved} other inline script(s).`);

             // 5. Modify Checkout Page Specifics in the Clone (if applicable)
             if (htmlClone.querySelector('.checkout-page')) { // Check if it's the checkout page
                 console.log("Checkout context: Enabling form fields & modifying button in clone...");
                 // Enable form fields
                 const formFieldSelectors = ['#name', '#address', '#phone', '#payment'];
                 formFieldSelectors.forEach(selector => {
                     const field = htmlClone.querySelector(selector);
                     if (field) {
                         field.removeAttribute('disabled');
                         field.removeAttribute('readonly');
                         field.style.opacity = ''; // Reset disabled styles
                         field.style.cursor = '';
                     }
                 });

                 // Modify the confirmation button
                 const confirmBtnClone = htmlClone.querySelector('#confirm-order-btn');
                 if (confirmBtnClone) {
                     confirmBtnClone.removeAttribute('disabled');
                     confirmBtnClone.style.opacity = ''; // Reset disabled styles
                     // Replace the mailto: action with a simple alert for the static file
                     confirmBtnClone.setAttribute('onclick', "alert('Pengiriman Email tidak aktif di versi halaman statis ini. Form ini hanya contoh.'); return false;");

                     // Remove the Feather icon (it won't render without JS re-init)
                     const btnIcon = confirmBtnClone.querySelector('i.feather');
                     if (btnIcon) btnIcon.remove();

                     // Change button text for clarity
                     const btnSpan = confirmBtnClone.querySelector('span');
                     if (btnSpan) btnSpan.textContent = 'Kirim Form (Contoh Statis)';
                 }
                 console.log("- Checkout fields enabled & Email button action modified in clone.");
             }

             // 6. Generate and Download the HTML file
             console.log("Generating HTML blob and triggering download...");
             // Use outerHTML of the cloned documentElement for the full structure
             const htmlContent = `<!DOCTYPE html>\n${htmlClone.outerHTML}`;
             const pageTitle = document.title || 'edited-page';
             // Create a cleaner filename
             const filename = `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_static.html`;

             const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

             // Use the 'a' download trick
             const link = document.createElement('a');
             link.href = URL.createObjectURL(blob);
             link.download = filename;
             document.body.appendChild(link); // Append to body to ensure click works
             link.click();
             document.body.removeChild(link); // Clean up the link
             URL.revokeObjectURL(link.href); // Free up memory

             showLoading(false);
             showToast("Halaman HTML statis berhasil disimpan.", "success");
             console.log(`Static HTML saved as ${filename}`);

         } catch (error) {
             showLoading(false);
             console.error("Error saving static HTML:", error);
             showToast(`Gagal menyimpan HTML: ${error.message}`, "error");
         }
    }

    /** Saves the current view as a JPG image using html2canvas. */
    function saveJpg(targetSelector = 'documentElement') {
         if (typeof html2canvas === 'undefined') {
             showToast("Error: Pustaka html2canvas tidak ditemukan.", "error");
             console.error("html2canvas library is missing. Please include it.");
             return;
         }

         let elementToCapture;
         let isFullPage = false;

         // Determine the element to capture
         if (targetSelector === 'documentElement' || targetSelector === document.documentElement || targetSelector === 'body' || targetSelector === document.body) {
             elementToCapture = document.documentElement; // Capture the whole page viewport
             isFullPage = true;
         } else if (typeof targetSelector === 'string') {
             elementToCapture = document.querySelector(targetSelector);
         } else if (targetSelector instanceof HTMLElement) {
             elementToCapture = targetSelector;
         } else {
             console.warn(`Invalid targetSelector for saveJpg: ${targetSelector}. Defaulting to documentElement.`);
             elementToCapture = document.documentElement;
             isFullPage = true;
         }

         if (!elementToCapture) {
             showToast(`Error: Target elemen '${targetSelector}' tidak ditemukan untuk disimpan sebagai JPG.`, "error");
             return;
         }

         showLoading(true, "Membuat gambar JPG...");

         // Temporarily hide fixed/sticky elements that might interfere with capture
         // Target common fixed elements like header and toolbar
         const fixedElements = document.querySelectorAll('.site-header, .action-toolbar, [style*="position: fixed"], [style*="position: sticky"]');
         const originalStyles = new Map();

         fixedElements.forEach(el => {
             // Only hide if it's not the element being captured itself or inside it (unless capturing full page)
             if (elementToCapture !== el && (!elementToCapture.contains(el) || isFullPage)) {
                 originalStyles.set(el, { display: el.style.display, visibility: el.style.visibility });
                 el.style.visibility = 'hidden';
                 // el.style.display = 'none'; // Using visibility might be slightly better for layout preservation
             }
         });

         // Add a small delay to allow the browser to render the style changes
         setTimeout(() => {
             const scrollX = window.scrollX || window.pageXOffset;
             const scrollY = window.scrollY || window.pageYOffset;

             // Determine capture dimensions carefully
             const captureWidth = isFullPage
                 ? Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth)
                 : elementToCapture.offsetWidth;
             const captureHeight = isFullPage
                 ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
                 : elementToCapture.offsetHeight;

             const canvasOptions = {
                 allowTaint: false,      // Attempt to load cross-origin images
                 useCORS: true,          // Use CORS for images
                 logging: false,         // Disable html2canvas logging
                 scale: window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio || 1, // Limit scale for performance
                 width: captureWidth,    // Explicit width
                 height: captureHeight,   // Explicit height
                 // windowWidth: window.innerWidth, // Provide window dimensions
                 // windowHeight: window.innerHeight,
                 x: 0,                  // Capture from top-left
                 y: 0,
                 scrollX: -scrollX,      // Apply negative scroll to capture the scrolled content
                 scrollY: -scrollY,
                 ignoreElements: (el) => el.matches('.action-toolbar, #loading-overlay, #toast-notification'), // Ignore toolbar etc.
                 onclone: (clonedDoc) => {
                     // Remove editing artifacts from the clone before rendering
                     clonedDoc.querySelectorAll('[contenteditable="true"]').forEach(el => {
                         el.removeAttribute('contenteditable');
                         el.style.outline = 'none';
                         el.style.boxShadow = 'none';
                         el.style.backgroundColor = '';
                         el.style.margin = '';
                         el.style.padding = '';
                     });
                     // Remove image edit indicators if they are CSS-based and need explicit removal
                     // clonedDoc.querySelectorAll('.editable-image-container').forEach(el => el.classList.add('hide-indicator-for-capture'));
                 }
             };

             console.log("Capturing element with html2canvas:", elementToCapture, canvasOptions);

             html2canvas(elementToCapture, canvasOptions)
             .then(canvas => {
                 // Generate filename
                 const pageTitle = document.title || 'screenshot';
                 const targetName = (typeof targetSelector === 'string' && targetSelector !== 'documentElement')
                     ? targetSelector.replace(/[^a-z0-9]/gi, '') // Clean selector name
                     : 'capture';
                 const filename = `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${targetName}.jpg`;

                 // Create download link
                 const link = document.createElement('a');
                 link.href = canvas.toDataURL('image/jpeg', 0.90); // JPG format, 90% quality
                 link.download = filename;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);

                 showToast("Gambar JPG berhasil disimpan.", "success");
                 console.log(`JPG saved as ${filename}`);
             })
             .catch(error => {
                 console.error('html2canvas Error:', error);
                 showToast(`Gagal menyimpan JPG: ${error.message || 'Terjadi kesalahan'}`, "error");
             })
             .finally(() => {
                 // Restore original styles of hidden elements
                 fixedElements.forEach(el => {
                     if (originalStyles.has(el)) {
                         const styles = originalStyles.get(el);
                         el.style.display = styles.display || '';
                         el.style.visibility = styles.visibility || '';
                     }
                 });
                 showLoading(false); // Hide loading indicator
             });
         }, 150); // Delay ms
    }

    // --- ADD NEW PRODUCT ---
    /** Adds a new placeholder product card to the grid. */
    function addNewProduct() {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) {
            showToast("Area produk tidak ditemukan untuk menambah produk baru.", "error");
            return;
        }

        const existingCards = productGrid.querySelectorAll('.product-card').length;
        const newProductId = `new-${Date.now()}`; // Unique ID for the new product
        const defaultName = `Produk Baru ${existingCards + 1}`;
        const defaultPrice = 0;
        const defaultDesc = "Edit deskripsi produk di sini.";
        const defaultImage = 'img/placeholder.png';

        // Add basic data to the store immediately
        updateProductData(newProductId, {
            name: defaultName,
            price: defaultPrice,
            description: defaultDesc,
            image: defaultImage
        });

        // Create the new product card element
        const newCard = document.createElement('article');
        newCard.className = 'product-card';
        newCard.dataset.id = newProductId; // Set the data-id attribute

        newCard.innerHTML = `
            <figure class="product-image-wrapper">
                <div class="editable-image-container" data-target-img-selector=".product-card[data-id='${newProductId}'] img">
                    <img src="${defaultImage}" alt="${defaultName}" loading="lazy" class="editable-image" data-id="${newProductId}">
                </div>
                <div class="product-hover-overlay">
                    <a href="detail-produk.html?id=${newProductId}" class="btn btn-outline-light btn-sm">
                        <span contenteditable="true">Lihat Detail</span>
                    </a>
                </div>
            </figure>
            <div class="product-info">
                <h3 class="product-title">
                    <a href="detail-produk.html?id=${newProductId}" contenteditable="true">${defaultName}</a>
                </h3>
                <span class="product-price" contenteditable="true">${formatPrice(defaultPrice)}</span>
                <button class="btn btn-secondary add-to-cart-btn btn-sm" data-id="${newProductId}" data-name="${defaultName}" data-price="${defaultPrice}">
                    <i data-feather="shopping-cart" contenteditable="false"></i> <span contenteditable="true">Tambah</span>
                </button>
            </div>`;

        productGrid.appendChild(newCard);

        // Initialize Feather icons on the new card
        if (typeof feather !== 'undefined') {
            try { feather.replace({ width: '1em', height: '1em' }); } catch (e) { console.error("Feather replace error on new product:", e); }
        }

        showToast("Produk baru ditambahkan. Silakan edit detailnya.", "success");

        // Scroll to the new card and focus its title for editing
        newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const newTitleLink = newCard.querySelector('.product-title a');
        if (newTitleLink) {
            newTitleLink.focus();
             // Try to select the text for easier editing (might not work in all browsers)
            try {
                 window.getSelection()?.selectAllChildren(newTitleLink);
             } catch (e) {}
        }
    }


    // --- EVENT LISTENERS SETUP ---
    /** Sets up global event listeners, mostly using delegation. */
    function setupGlobalEventListeners() {
        console.log("Setting up global event listeners...");

        // Delegated listener on the body for common actions
        document.body.addEventListener('click', (event) => {
            // --- Add to Cart ---
            const addToCartBtn = event.target.closest('.add-to-cart-btn');
            if (addToCartBtn) {
                handleAddToCart(addToCartBtn);
                return; // Action handled
            }

            // --- Cart Quantity Change ---
            const qtyBtn = event.target.closest('.quantity-btn');
            if (qtyBtn && qtyBtn.closest('.cart-quantity')) { // Check context is cart quantity
                const productId = qtyBtn.dataset.id;
                const change = parseInt(qtyBtn.dataset.change, 10);
                if (productId && !isNaN(change)) {
                    updateQuantity(productId, change);
                }
                return; // Action handled
            }

            // --- Remove from Cart ---
            const removeBtn = event.target.closest('.btn-remove');
            if (removeBtn && removeBtn.closest('.cart-table')) { // Check context is cart table
                const productId = removeBtn.dataset.id;
                if (productId) {
                    removeFromCart(productId);
                }
                return; // Action handled
            }

             // --- Clear Cart ---
             const clearCartBtn = event.target.closest('#clear-cart-btn');
             if (clearCartBtn) {
                 clearCart();
                 return; // Action handled
             }

             // --- Proceed to Checkout ---
             const checkoutBtn = event.target.closest('#checkout-button');
             if (checkoutBtn && !checkoutBtn.disabled) {
                 const cart = getCart();
                 if (Object.keys(cart).length > 0) {
                     window.location.href = 'checkout.html';
                 } else {
                     showToast("Keranjang kosong, tidak bisa checkout.", "warning");
                 }
                 return; // Action handled
             }
        });

        // Direct listeners for static toolbar buttons
        const saveHtmlBtn = document.getElementById('save-html-btn');
        const saveJpgBtn = document.getElementById('save-jpg-btn');
        const addProductBtn = document.getElementById('add-product-btn');

        if (saveHtmlBtn) {
             saveHtmlBtn.addEventListener('click', saveHtml);
        } else { console.warn("Save HTML button not found."); }

        if (saveJpgBtn) {
            saveJpgBtn.addEventListener('click', () => saveJpg(saveJpgBtn.dataset.target || 'documentElement'));
        } else { console.warn("Save JPG button not found."); }

        if (addProductBtn) {
             addProductBtn.addEventListener('click', addNewProduct);
         } else {
             // This button is expected to be missing on some pages, so warning isn't critical.
             // console.log("Add Product button not found (may be expected).");
         }

        console.log("Global event listeners attached.");
    }


    // --- INITIALIZATION ---
    /** Initializes the AuraStore application. */
    async function init() {
        console.log("AuraStore v3.5.0 Initializing...");

        // 1. Fetch main script content early for saveHTML function
        await fetchMainScript();

        // 2. Initial UI Updates
        updateCartCount(); // Update cart count in header immediately

        // 3. Initialize Feather Icons
        try {
            if (typeof feather !== 'undefined') {
                feather.replace();
                 console.log("Feather icons initialized.");
            } else {
                console.warn("Feather icons library not loaded during init.");
            }
        } catch (e) { console.error("Feather Icon Replacement Error:", e); }

        // 4. Setup Global Event Listeners (Delegation)
        setupGlobalEventListeners();

        // 5. Setup Editing Features (Image Upload, Content Blur)
        setupEditingFeatures();

        // 6. Page-Specific Initializations
        const currentPage = document.body.className.split(' ').find(cls => cls.endsWith('-page'))?.replace('-page', '') ||
                           (document.querySelector('.product-detail-container') ? 'detail' :
                           (document.querySelector('.product-grid') ? 'index' : 'other'));

        console.log(`Determined Page Type: ${currentPage}`);

        switch(currentPage) {
            case 'cart':
                console.log("Cart Page: Rendering items...");
                renderCartItems();
                break;
            case 'index':
                console.log("Index Page: Syncing product grid data from store...");
                document.querySelectorAll('.product-grid .product-card').forEach(card => {
                    const productId = card.dataset.id;
                    if (!productId) return;
                    const product = getProductData(productId); // Get data (checks store/cart)
                    if (!product) {
                        console.warn(`Product data not found for ID: ${productId} in grid. Card might be outdated.`);
                        // Optionally remove the card? card.remove();
                        return;
                    }
                    // Sync display elements with stored data
                    const imgEl = card.querySelector('.editable-image');
                    const priceEl = card.querySelector('.product-price');
                    const titleLink = card.querySelector('.product-title a');
                    const addBtn = card.querySelector('.add-to-cart-btn');

                    if (imgEl) {
                        const finalSrc = getProductImageSource(productId, product.image);
                        if (imgEl.src !== finalSrc) imgEl.src = finalSrc;
                        imgEl.alt = product.name || 'Gambar Produk';
                        imgEl.onerror = () => { imgEl.src = 'img/placeholder.png'; imgEl.alt = 'Gambar tidak tersedia'; };
                    }
                    if (titleLink) titleLink.textContent = product.name;
                    if (priceEl) priceEl.textContent = formatPrice(product.price);
                    if (addBtn) {
                        addBtn.dataset.name = product.name;
                        addBtn.dataset.price = product.price;
                    }
                });
                break;
            case 'detail':
                // Initialization handled by inline script in detail-produk.html
                console.log("Detail Page: Initialization delegated to inline script.");
                break;
            case 'checkout':
                // Initialization handled by inline script in checkout.html
                console.log("Checkout Page: Initialization delegated to inline script.");
                break;
            default:
                console.log("Other Page Type: No specific page initialization.");
        }

        // 7. Set current year in footers
        const yearSpans = document.querySelectorAll('#current-year, #current-year-footer, #current-year-footer-cart, #current-year-checkout');
        if (yearSpans.length > 0) {
            const currentYear = new Date().getFullYear();
            yearSpans.forEach(span => { span.textContent = currentYear; });
        }

        console.log(`AuraStore Initialization Complete.`);
    }

    // --- PUBLIC API ---
    // Expose only the functions needed by inline scripts or potentially other modules.
    return {
        // Core functions needed by pages
        runInit: init,                    // To start the application
        getProductData: getProductData,         // For detail page loading
        getProductImageSource: getProductImageSource, // For detail/checkout image loading
        getCart: getCart,                 // For checkout summary loading
        formatPrice: formatPrice,           // For displaying prices
        showToast: showToast,             // For user feedback
        updateCartCount: updateCartCount,     // For updating header count
    };

})();

// --- START EXECUTION ---
// Ensure the script runs after the DOM is fully parsed
document.addEventListener('DOMContentLoaded', () => {
    AuraStore.runInit().catch(error => {
        console.error("Unhandled Error during AuraStore Initialization:", error);
        // Display a user-friendly error message on the page
        const body = document.body;
        if(body && !document.getElementById('init-error-msg')) { // Prevent multiple messages
            const errorMsg = document.createElement('div');
            errorMsg.id = 'init-error-msg';
            errorMsg.textContent = "Terjadi kesalahan saat memuat aplikasi. Beberapa fitur mungkin tidak berfungsi. Silakan coba muat ulang halaman.";
            errorMsg.style.color = 'red';
            errorMsg.style.backgroundColor = 'rgba(255,0,0,0.1)';
            errorMsg.style.border = '1px solid red';
            errorMsg.style.padding = '1rem';
            errorMsg.style.margin = '1rem';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.borderRadius = '8px';
            body.prepend(errorMsg); // Add message at the top
            // Optionally hide the main content or show loading indicator indefinitely
            // document.querySelector('main')?.style.display = 'none';
        }
    });
});