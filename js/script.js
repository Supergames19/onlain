document.addEventListener('DOMContentLoaded', () => {
    console.log("Editor Ready!");

    const saveHtmlButton = document.getElementById('save-html-button');
    const saveJpgButton = document.getElementById('save-jpg-button');
    const contentToCapture = document.getElementById('editable-content'); // Target element for JPG capture

    // --- Image Editing Feature ---
    const imageContainers = document.querySelectorAll('.editable-image-container');
    console.log(`Found ${imageContainers.length} editable image containers.`);

    imageContainers.forEach(container => {
        const fileInput = container.querySelector('.hidden-file-input');
        const imageElement = container.querySelector('img'); // Check for direct <img> tag

        if (!fileInput) {
            console.warn("Skipping image container, missing hidden file input:", container);
            return;
        }

        // Use container click to trigger file input for better click area
        container.addEventListener('click', (e) => {
            // Prevent triggering if clicking on an interactive element inside (like a future link/button)
            if (e.target.closest('a, button')) return;
            console.log("Image container clicked, triggering file input for:", container.dataset.id || container);
            fileInput.click(); // Trigger the hidden file input
        });

        // Handle file selection
        fileInput.addEventListener('change', (event) => {
             const file = event.target.files[0];
             console.log("File selected:", file ? file.name : 'None');

            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const dataUrl = e.target.result; // Get image as Data URL
                    console.log("Image loaded into FileReader for:", container.dataset.id || container);

                    // Apply the image data
                    if (imageElement) {
                        // If container has an <img> tag (e.g., featured image)
                        imageElement.src = dataUrl;
                        console.log("Updated <img> src.");
                    } else {
                        // If container uses background-image (e.g., gallery)
                        container.style.backgroundImage = `url('${dataUrl}')`;
                        console.log("Updated background-image style.");
                    }
                    // Store the Data URL in the dataset for saving purposes
                    container.dataset.imageDataUrl = dataUrl;
                    console.log("Stored data URL in dataset.");
                }
                reader.readAsDataURL(file); // Read file content

            } else if (file) {
                 alert('Harap pilih file gambar yang valid (JPG, PNG, GIF, dll.).');
                 console.warn("Invalid file type selected:", file.type);
            }
            // Reset input value to allow selecting the same file again if needed
            event.target.value = null;
        });
    });

    // --- Function to Save Page as HTML ---
    function savePageHtml() {
        console.log("Attempting to save HTML...");
        // Set loading state
        saveHtmlButton.classList.add('loading');
        saveHtmlButton.disabled = true;
        saveHtmlButton.innerHTML = '<i class="fa-solid fa-spinner"></i> Menyimpan HTML...';

        try {
            // 1. Clone the entire document to work on a copy
            const clonedDoc = document.cloneNode(true);

            // 2. Remove unwanted elements from the clone (save buttons, script tags)
            const elementsToRemove = clonedDoc.querySelectorAll('.save-buttons-container, script#interactive-script, script[src="script.js"]'); // More specific selector
            elementsToRemove.forEach(el => el.remove());
            console.log("Removed save buttons and scripts from clone.");

            // 3. Remove 'contenteditable' attribute from all elements in the clone
            const editableElements = clonedDoc.querySelectorAll('[contenteditable="true"]');
            editableElements.forEach(el => el.removeAttribute('contenteditable'));
            console.log("Removed contenteditable attributes from clone.");

            // 4. Apply edited images (using stored Data URLs) to the clone
            const editedImages = clonedDoc.querySelectorAll('.editable-image-container[data-image-data-url]');
             console.log(`Applying ${editedImages.length} edited images to clone...`);
             editedImages.forEach(container => {
                 const dataUrl = container.dataset.imageDataUrl;
                 const img = container.querySelector('img');
                 if(dataUrl){ // Ensure dataUrl exists
                    if (img) {
                        img.src = dataUrl; // Update src for <img> tags
                    } else {
                        container.style.backgroundImage = `url('${dataUrl}')`; // Update background for divs
                    }
                    // Optional: Remove the dataset attribute from the final HTML
                    // container.removeAttribute('data-image-data-url');
                 } else {
                    console.warn("Container has data-image-data-url attribute but no value?", container);
                 }
            });

            // 5. Get the final HTML string from the cleaned clone
            // Use outerHTML of the html element for the full document structure
            const finalHtml = clonedDoc.documentElement.outerHTML;
            console.log("Generated final HTML string.");

            // 6. Create a Blob and trigger download
            const blob = new Blob([finalHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const downloader = document.createElement('a');
            downloader.href = url;

            // Generate filename from page title
            const pageTitle = clonedDoc.getElementById('page-title')?.textContent?.trim() || 'halaman-produk-diedit';
            const filename = pageTitle.toLowerCase().replace(/[\s\W-]+/g, '-') + '.html'; // Sanitize filename
            downloader.download = filename;

            document.body.appendChild(downloader);
            downloader.click();
            document.body.removeChild(downloader);
            URL.revokeObjectURL(url); // Clean up Blob URL
            console.log(`HTML saved as "${filename}".`);
            // alert(`Halaman telah disimpan sebagai "${filename}".`); // Optional success alert

        } catch (error) {
            console.error("Failed to save HTML:", error);
            alert("Terjadi kesalahan saat menyimpan halaman HTML. Silakan cek konsol (F12) untuk detail.");
        } finally {
             // Reset loading state regardless of success or failure
            saveHtmlButton.classList.remove('loading');
            saveHtmlButton.disabled = false;
            saveHtmlButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan HTML';
            console.log("Save HTML process finished.");
        }
    } // end savePageHtml

    // --- Function to Save Page as JPG ---
    function savePageJpg() {
         console.log("Attempting to save JPG...");
         // Check if html2canvas library is loaded
         if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library is not loaded!');
            alert('Library html2canvas tidak ditemukan. Gagal menyimpan JPG.');
            return;
         }

         // Set loading state
         saveJpgButton.classList.add('loading');
         saveJpgButton.disabled = true;
         saveJpgButton.innerHTML = '<i class="fa-solid fa-spinner"></i> Memproses JPG...';
         alert('Sedang memproses gambar JPG, ini mungkin perlu beberapa saat...'); // Inform user

         // Temporarily hide elements that shouldn't be in the capture (like outlines, maybe overlays)
         const editableElements = contentToCapture.querySelectorAll('[contenteditable="true"]');
         const originalOutlines = new Map();
         editableElements.forEach(el => {
            originalOutlines.set(el, el.style.outline); // Store original outline
            el.style.outline = 'none'; // Remove outline for capture
         });
          // Hide save buttons container if it's inside the captured area (it shouldn't be with current HTML)
          // const saveBtnContainer = contentToCapture.querySelector('.save-buttons-container');
          // if (saveBtnContainer) saveBtnContainer.style.visibility = 'hidden';

         // Options for html2canvas
         const options = {
             allowTaint: false, // Prevent tainting canvas if possible
             useCORS: true,    // Attempt to load cross-origin images
             scale: window.devicePixelRatio || 1.5, // Use device DPI or slightly higher scale for better quality
             backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff', // Use body background
             logging: false, // Disable html2canvas console logging
             scrollX: 0, // Ensure capture starts from the left edge
             scrollY: 0, // Ensure capture starts from the top edge
             windowWidth: contentToCapture.scrollWidth, // Use element's scroll width
             windowHeight: contentToCapture.scrollHeight, // Use element's scroll height
             onclone: (clonedDoc) => {
                // Perform actions on the *cloned* document before rendering
                // Ensure outlines are removed in the clone as well
                const clonedEditables = clonedDoc.querySelectorAll('[contenteditable="true"]');
                clonedEditables.forEach(el => el.style.outline = 'none');
                // Hide save buttons in clone if needed
                // const clonedSaveBtns = clonedDoc.querySelector('.save-buttons-container');
                // if(clonedSaveBtns) clonedSaveBtns.style.display = 'none';
                console.log("Document cloned for html2canvas rendering.");
            }
         };

         html2canvas(contentToCapture, options).then(canvas => {
             console.log("html2canvas processing successful.");
             // Convert canvas to JPG Data URL
             // Quality: 0 (low) to 1 (high)
             const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92); // Use slightly higher quality

             // Trigger download
             const downloader = document.createElement('a');
             downloader.href = imageDataUrl;
             const pageTitle = document.getElementById('page-title')?.textContent?.trim() || 'halaman-produk';
             const filename = pageTitle.toLowerCase().replace(/[\s\W-]+/g, '-') + '-capture.jpg'; // Sanitize filename
             downloader.download = filename;
             document.body.appendChild(downloader);
             downloader.click();
             document.body.removeChild(downloader);
             console.log(`JPG saved as "${filename}".`);
             // alert(`Gambar JPG telah disimpan sebagai "${filename}".`); // Optional success alert

         }).catch(error => {
             console.error('Error during html2canvas operation:', error);
             alert('Gagal membuat gambar JPG. Mungkin ada masalah dengan elemen atau gambar eksternal. Cek konsol (F12).');
         }).finally(() => {
              // Restore temporarily hidden elements/styles
              editableElements.forEach(el => {
                 el.style.outline = originalOutlines.get(el) || ''; // Restore original outline
              });
              // if (saveBtnContainer) saveBtnContainer.style.visibility = 'visible';

              // Reset loading state
             saveJpgButton.classList.remove('loading');
             saveJpgButton.disabled = false;
             saveJpgButton.innerHTML = '<i class="fa-solid fa-file-image"></i> Simpan JPG';
             console.log("Save JPG process finished.");
         });

    } // end savePageJpg


    // Add event listeners to the buttons
    if (saveHtmlButton) {
        saveHtmlButton.addEventListener('click', savePageHtml);
    } else {
        console.error("Save HTML button not found!");
    }

    if (saveJpgButton) {
        saveJpgButton.addEventListener('click', savePageJpg);
    } else {
        console.error("Save JPG button not found!");
    }

    // --- CTA Link Editing (using inline onclick in HTML is sufficient here) ---
    // No additional JS needed for the link prompt as it's handled inline.
    // The stopPropagation in the inline span's onclick prevents the link prompt when editing text.


}); // End DOMContentLoaded
