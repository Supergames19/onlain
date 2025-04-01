
        document.addEventListener('DOMContentLoaded', () => {
            // --- Referensi Elemen ---
            const imageUpload = document.getElementById('image-upload');
            const devicePhoto = document.getElementById('device-photo');
            const saveHtmlBtn = document.getElementById('save-html-btn');
            const saveJpgBtn = document.getElementById('save-jpg-btn');
            const savePngBtn = document.getElementById('save-png-btn');
            const notificationContainer = document.getElementById('notification-container');
            const providerCanvas = document.getElementById('provider-signature-pad');
            const customerCanvas = document.getElementById('customer-signature-pad');
            const clearProviderBtn = document.getElementById('clear-provider-sig');
            const clearCustomerBtn = document.getElementById('clear-customer-sig');
            const allSaveButtons = [saveHtmlBtn, saveJpgBtn, savePngBtn]; // Array of save buttons

            let providerSignaturePad, customerSignaturePad; // Signature Pad instances

            // --- Inisialisasi Signature Pad ---
            function resizeCanvas(canvas) {
                if (!canvas) return;
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                // Store current content before resizing
                const context = canvas.getContext("2d");
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                context.scale(ratio, ratio);

                // Restore content after resizing (might not be perfect, SignaturePad handles this better)
                // context.putImageData(imageData, 0, 0); // SignaturePad's fromData is better

                // Clear after resize, let SignaturePad handle redraw if needed
                context.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
            }

            function initializeSignaturePads() {
                // Check if SignaturePad library is loaded
                if (typeof SignaturePad === 'undefined') {
                    console.error("Signature Pad library not loaded!");
                    alert("Gagal memuat fitur tanda tangan. Library tidak ditemukan.");
                    // Disable signature-related buttons
                    clearProviderBtn.disabled = true;
                    clearCustomerBtn.disabled = true;
                    return;
                }

                try {
                    resizeCanvas(providerCanvas);
                    resizeCanvas(customerCanvas);

                    providerSignaturePad = new SignaturePad(providerCanvas, {
                        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent background
                        penColor: "rgb(0, 0, 100)" // Dark blue for provider
                    });
                    customerSignaturePad = new SignaturePad(customerCanvas, {
                        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent background
                        penColor: "rgb(0, 0, 0)" // Black for customer
                    });

                    clearProviderBtn.addEventListener('click', () => providerSignaturePad?.clear());
                    clearCustomerBtn.addEventListener('click', () => customerSignaturePad?.clear());

                    // Debounced resize handler
                    let resizeTimeout;
                    window.addEventListener("resize", () => {
                        clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(() => {
                            console.log("Resizing signature pads...");
                            // Store data before resize
                            const providerData = providerSignaturePad?.toData();
                            const customerData = customerSignaturePad?.toData();

                            resizeCanvas(providerCanvas);
                            resizeCanvas(customerCanvas);

                            // Restore data after resize
                            if (providerSignaturePad && providerData?.length > 0) {
                                providerSignaturePad.fromData(providerData);
                            } else {
                                providerSignaturePad?.clear(); // Ensure it's clear if no data
                            }
                            if (customerSignaturePad && customerData?.length > 0) {
                                customerSignaturePad.fromData(customerData);
                            } else {
                                customerSignaturePad?.clear(); // Ensure it's clear if no data
                            }
                        }, 250); // Debounce resize events
                    });

                } catch (error) {
                    console.error("Gagal menginisialisasi Signature Pad:", error);
                    alert("Gagal memuat fitur tanda tangan. Kesalahan: " + error.message);
                    clearProviderBtn.disabled = true;
                    clearCustomerBtn.disabled = true;
                }
            }
            // Initialize after a short delay to ensure canvas dimensions are stable
            setTimeout(initializeSignaturePads, 150);

            // --- Ganti Gambar ---
            imageUpload.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        devicePhoto.src = e.target.result;
                        devicePhoto.style.minHeight = 'auto'; // Allow natural height after upload
                    };
                    reader.onerror = function (e) {
                        console.error("Error reading file:", e);
                        alert("Gagal membaca file gambar.");
                    };
                    reader.readAsDataURL(file);
                }
            });

            // --- Helper: Get Clean HTML with Embedded Signatures ---
            function getCleanedHtmlForSave(element, providerSigDataUrl, customerSigDataUrl) {
                const clonedElement = element.cloneNode(true);

                // Remove contenteditable attribute and editing styles
                const editables = clonedElement.querySelectorAll('[contenteditable="true"]');
                editables.forEach(el => {
                    el.removeAttribute('contenteditable');
                    // Remove styles potentially added by focus/hover
                    el.style.removeProperty('border');
                    el.style.removeProperty('box-shadow');
                    el.style.removeProperty('background-color');
                    el.style.removeProperty('outline');
                    el.style.removeProperty('cursor');
                });

                // Replace provider signature canvas with image or placeholder
                const providerWrapper = clonedElement.querySelector('#provider-signature-pad')?.closest('.signature-wrapper');
                if (providerWrapper) {
                    if (providerSigDataUrl) {
                        const img = document.createElement('img');
                        img.src = providerSigDataUrl;
                        img.alt = "Tanda Tangan Penyedia Jasa";
                        img.className = "signature-image"; // Apply specific class for styling
                        img.style.cssText = "max-width:100%;height:auto;display:block;margin:0 auto;"; // Keep basic inline style too
                        providerWrapper.parentNode.replaceChild(img, providerWrapper);
                    } else {
                        const p = document.createElement('div');
                        p.className = 'signature-placeholder';
                        p.textContent = '( Belum ditandatangani )';
                        providerWrapper.parentNode.replaceChild(p, providerWrapper);
                    }
                    clonedElement.querySelector('#clear-provider-sig')?.remove(); // Remove clear button
                }

                // Replace customer signature canvas with image or placeholder
                const customerWrapper = clonedElement.querySelector('#customer-signature-pad')?.closest('.signature-wrapper');
                if (customerWrapper) {
                    if (customerSigDataUrl) {
                        const img = document.createElement('img');
                        img.src = customerSigDataUrl;
                        img.alt = "Tanda Tangan Konsumen";
                        img.className = "signature-image"; // Apply specific class for styling
                        img.style.cssText = "max-width:100%;height:auto;display:block;margin:0 auto;"; // Keep basic inline style too
                        customerWrapper.parentNode.replaceChild(img, customerWrapper);
                    } else {
                        const p = document.createElement('div');
                        p.className = 'signature-placeholder';
                        p.textContent = '( Belum ditandatangani )';
                        customerWrapper.parentNode.replaceChild(p, customerWrapper);
                    }
                    clonedElement.querySelector('#clear-customer-sig')?.remove(); // Remove clear button
                }

                // Remove any lingering hover/focus styles from the main container itself if needed
                clonedElement.style.removeProperty('box-shadow');
                // Optionally remove the main border for the saved HTML content if desired
                // clonedElement.style.removeProperty('border');

                return clonedElement.innerHTML;
            }

            // --- Fungsi Simpan sebagai HTML ---
            saveHtmlBtn.addEventListener('click', function () {
                const buttonElement = this;
                const originalButtonText = buttonElement.textContent;

                // Disable button
                buttonElement.disabled = true;
                buttonElement.textContent = 'Menyimpan HTML...';

                try {
                    const providerSigDataUrl = providerSignaturePad && !providerSignaturePad.isEmpty() ? providerSignaturePad.toDataURL('image/png') : null;
                    const customerSigDataUrl = customerSignaturePad && !customerSignaturePad.isEmpty() ? customerSignaturePad.toDataURL('image/png') : null;

                    // Get cleaned content
                    const cleanHtmlContent = getCleanedHtmlForSave(notificationContainer, providerSigDataUrl, customerSigDataUrl);

                    // Get current image src (might be data URL or original placeholder)
                    const currentImageSrc = devicePhoto.src;

                    // Construct the full HTML file content
                    // Note: Using the existing CSS from the <style> block is more maintainable than embedding a huge string.
                    // We extract the CSS here.
                    let pageCSS = "";
                    try {
                        // Attempt to get all styles defined in the document
                        for (let sheet of document.styleSheets) {
                            // Check if the sheet is internal or external but accessible
                            if (sheet.href === null || sheet.href.startsWith(window.location.origin)) {
                                try {
                                    Array.from(sheet.cssRules).forEach(rule => pageCSS += rule.cssText + '\n');
                                } catch (e) {
                                    console.warn("Could not read CSS rules from stylesheet:", sheet.href, e);
                                    // If reading fails (e.g., cross-origin), try to fetch and append if needed - more complex
                                }
                            } else if (sheet.href && sheet.href.includes('fonts.googleapis.com')) {
                                // Keep Google Fonts link separately
                                pageCSS += `@import url('${sheet.href}');\n`;
                            }
                        }
                    } catch (e) {
                        console.error("Error extracting CSS:", e);
                        // Fallback to a simpler set of styles if extraction fails
                        pageCSS = `body{font-family:Roboto,sans-serif;padding:20px;} .container{max-width:650px;margin:auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);} h2{color:#3498db;text-align:center;} .footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:15px;border-top:1px solid #eee;} .signature-column{flex:1;text-align:center;} .signature-column img{max-width:180px;height:auto;display:block;margin:auto;} .signature-placeholder{border:1px dashed #ccc;padding:20px;text-align:center;color:#999;min-height:60px;} img#device-photo{max-width:80%;display:block;margin:15px auto;border:1px solid #eee;} /* Add other essential styles */`;
                    }

                    const fileContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informasi Servis</title>
    <style>
        /* Extracted or Fallback CSS */
        ${pageCSS}

        /* Ensure device photo in saved HTML uses the correct source */
        img#device-photo {
           content: url("${currentImageSrc}"); /* More reliable way to set src in CSS */
           /* The alt attribute will be in the HTML structure below */
        }
        .signature-image { /* Style for saved signature images */
            max-width: 90%; height: auto; display: block; margin: 0 auto 10px auto;
            border-bottom: 1px solid #eee; padding-bottom: 5px;
        }
         .signature-placeholder { /* Style for placeholder in saved HTML */
            display: flex; justify-content: center; align-items: center; min-height: 80px;
            border: 1px dashed #ccc; border-radius: 4px; font-style: italic; color: #999; font-size: 0.9em;
            padding: 10px; box-sizing: border-box; text-align: center; margin-bottom: 10px; background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="container" id="notification-container">
        ${cleanHtmlContent}
        </div>
</body>
</html>`;

                    // Generate filename
                    let filename = 'notifikasi_servis_ttd.html';
                    try {
                        // Find the first strong tag inside a p tag (likely the customer name)
                        const nameElement = notificationContainer.querySelector('p > strong');
                        if (nameElement) {
                            const customerName = nameElement.textContent.trim();
                            if (customerName && customerName !== '[Nama Pelanggan]') {
                                // Sanitize filename
                                const sanitizedName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                filename = `notifikasi_${sanitizedName}.html`;
                            }
                        }
                    } catch (e) {
                        console.warn("Could not generate filename from customer name:", e);
                    }

                    // Create Blob and Download Link
                    const blob = new Blob([fileContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log('HTML file saved.');
                    alert('File HTML berhasil dibuat!');

                } catch (error) {
                    console.error("Error saving HTML:", error);
                    alert("Gagal menyimpan file HTML. Kesalahan: " + error.message);
                } finally {
                    // Re-enable button
                    buttonElement.disabled = false;
                    buttonElement.textContent = originalButtonText;
                }
            });

            // --- **REFINED** Fungsi Inti Simpan sebagai Gambar (JPG/PNG) ---
            async function saveAsImage(format, buttonElement) {
                const formatUpper = format.toUpperCase(); // JPG or PNG
                const originalButtonText = buttonElement.textContent;

                // Disable ALL save buttons and show progress on the clicked one
                allSaveButtons.forEach(btn => btn.disabled = true);
                buttonElement.textContent = `Menyimpan ${formatUpper}...`;

                // Temporarily remove focus from any editable element to avoid focus ring in screenshot
                if (document.activeElement && document.activeElement.hasAttribute('contenteditable')) {
                    document.activeElement.blur();
                }
                // Add a small delay to allow blur to apply visually
                await new Promise(resolve => setTimeout(resolve, 50));

                try {
                    console.log(`Starting ${formatUpper} generation...`);
                    const canvas = await html2canvas(notificationContainer, {
                        useCORS: true, // Attempt to load cross-origin images (like placeholder)
                        backgroundColor: '#ffffff', // Explicit white background
                        scale: window.devicePixelRatio * 1.5, // Adjust scale for balance (2 can be large)
                        logging: false, // Disable html2canvas console logs
                        // --- CRITICAL: Clean the CLONED document before rendering ---
                        onclone: (clonedDoc) => {
                            const clonedContainer = clonedDoc.getElementById('notification-container');
                            if (!clonedContainer) return;

                            // 1. Remove contenteditable and related styles from the clone
                            clonedContainer.querySelectorAll('[contenteditable="true"]').forEach(el => {
                                el.removeAttribute('contenteditable');
                                el.style.border = 'none'; // Remove any border
                                el.style.boxShadow = 'none'; // Remove any shadow
                                el.style.backgroundColor = 'transparent'; // Ensure transparent background unless intended
                                el.style.outline = 'none'; // Remove outline
                                el.style.cursor = 'default'; // Reset cursor
                            });

                            // 2. Hide the "Clear TTD" buttons in the clone
                            clonedContainer.querySelectorAll('.clear-sig-button').forEach(btn => {
                                btn.style.display = 'none';
                            });

                            // 3. Remove dashed border from signature wrappers in the clone
                            clonedContainer.querySelectorAll('.signature-wrapper').forEach(wrapper => {
                                wrapper.style.border = '1px solid transparent'; // Make border transparent
                                // Optional: If background was added, remove it
                                // wrapper.style.backgroundColor = 'transparent';
                            });

                            // 4. Ensure the main container in the clone has its standard border (or none if preferred)
                            // clonedContainer.style.border = '1px solid var(--border-color)'; // Keep original border
                            clonedContainer.style.boxShadow = 'none'; // Remove hover shadow effect from clone

                            // 5. Ensure image source is correctly resolved (html2canvas usually handles this, but check if issues)
                            const imgClone = clonedContainer.querySelector('#device-photo');
                            if (imgClone && imgClone.src !== devicePhoto.src) {
                                console.log("Correcting image source in clone.");
                                imgClone.src = devicePhoto.src; // Ensure src is the current one
                            }
                        }
                    });
                    console.log('Canvas generated.');

                    // --- Convert canvas to Data URL & Trigger Download ---
                    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                    const quality = format === 'jpeg' ? 0.93 : undefined; // JPG quality (0-1)
                    const imageDataUrl = canvas.toDataURL(mimeType, quality);

                    // Generate filename
                    let filename = `notifikasi_servis_ttd.${format}`;
                    try {
                        const nameElement = notificationContainer.querySelector('p > strong'); // More specific selector
                        if (nameElement) {
                            const customerName = nameElement.textContent.trim();
                            if (customerName && customerName !== '[Nama Pelanggan]') {
                                const sanitizedName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                filename = `notifikasi_${sanitizedName}.${format}`;
                            }
                        }
                    } catch (e) {
                        console.warn("Could not generate filename from customer name:", e);
                    }

                    // Trigger download
                    const a = document.createElement('a');
                    a.href = imageDataUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    console.log(`File ${formatUpper} saved.`);
                    alert(`File ${formatUpper} berhasil dibuat dan diunduh!`);

                } catch (error) {
                    console.error(`Error saat membuat ${formatUpper}:`, error);
                    alert(`Gagal membuat file ${formatUpper}. Periksa konsol (F12) untuk detail error. Kesalahan: ${error.message}`);
                } finally {
                    // --- Re-enable all save buttons & Reset text ---
                    allSaveButtons.forEach(btn => btn.disabled = false);
                    buttonElement.textContent = originalButtonText; // Reset only the clicked button's text
                    console.log(`${formatUpper} generation process finished.`);
                }
            }

            // --- Event Listeners for Image Save Buttons ---
            saveJpgBtn.addEventListener('click', function () {
                saveAsImage('jpeg', this); // Pass format and the button element
            });

            savePngBtn.addEventListener('click', function () {
                saveAsImage('png', this); // Pass format and the button element
            });

        }); // End DOMContentLoaded