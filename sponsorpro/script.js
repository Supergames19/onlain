document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing Scarlett Editor V2...");

    // --- Configuration ---
    const JPG_QUALITY = 0.92; // JPG quality (0.0 to 1.0)
    const CANVAS_SCALE = window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio || 1; // Limit scale for performance

    // --- Element References ---
    const saveHtmlBtn = document.getElementById('saveHtmlBtn');
    const saveJpgBtn = document.getElementById('saveJpgBtn');
    const mobileContainer = document.querySelector('.mobile-container');
    const editableImages = document.querySelectorAll('.editable-image');

    // --- Check Essential Elements ---
    if (!mobileContainer) {
        console.error("Fatal Error: '.mobile-container' element not found.");
        alert("Error: Kontainer utama tidak ditemukan. Script tidak dapat berjalan.");
        return; // Stop script execution if container is missing
    }
    if (!saveHtmlBtn || !saveJpgBtn) {
        console.warn("Warning: Save buttons not found. Save functionality disabled.");
        // Optionally disable or hide the controls div
        document.querySelector('.edit-controls')?.remove();
    }

    // --- Image Editing Functionality ---
    function setupImageEditing() {
        console.log(`Initializing image editing for ${editableImages.length} elements...`);
        editableImages.forEach(img => {
            // Derive the expected input ID from the image ID
            const inputId = img.id ? img.id + 'Input' : null;
            if (!inputId) {
                console.warn("Skipping image - missing ID:", img);
                return; // Skip images without an ID
            }

            const fileInput = document.getElementById(inputId);
            if (!fileInput) {
                console.warn(`No file input found with ID: ${inputId} for image:`, img);
                return; // Skip if no corresponding input found
            }

            // 1. Add visual cue & click listener to image
            img.style.cursor = 'pointer'; // Indicate interactivity
            img.addEventListener('click', () => {
                console.log(`Image clicked: ${img.id}. Triggering input: ${inputId}`);
                fileInput.click(); // Trigger the hidden file input
            });

            // 2. Add change listener to the file input
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                console.log(`File selected for ${inputId}:`, file);

                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        // Update the src attribute of the corresponding image
                        img.src = e.target.result;
                        console.log(`Image source updated for ${img.id}`);
                    }
                    reader.onerror = (err) => {
                        console.error(`Error reading file for ${img.id}:`, err);
                        alert(`Gagal membaca file gambar untuk ${img.id}.`);
                    }

                    reader.readAsDataURL(file); // Read the file as Data URL

                } else if (file) {
                    // File selected, but not a valid image type
                    console.warn(`Invalid file type selected for ${img.id}: ${file.type}`);
                    alert("Harap pilih file gambar yang valid (contoh: JPG, PNG, GIF).");
                } else {
                    // No file selected (e.g., user cancelled)
                    console.log(`No file selected for ${img.id}.`);
                }

                // Reset the input value to allow selecting the same file again
                event.target.value = null;
            });
        });
        console.log("Image editing setup complete.");
    }
    setupImageEditing(); // Initialize image editing

    // --- Content Editable Placeholder Handling (Optional) ---
    // Add focus/blur handlers to clear/restore placeholders if needed
    // Example:
    // document.querySelectorAll('[contenteditable="true"][data-placeholder]').forEach(el => {
    //     el.addEventListener('focus', () => { if (el.textContent === el.dataset.placeholder) el.textContent = ''; });
    //     el.addEventListener('blur', () => { if (el.textContent.trim() === '') el.textContent = el.dataset.placeholder; });
    // });


    // --- Save HTML Functionality ---
    function saveHtml() {
        console.log("Saving HTML...");
        if (!mobileContainer) return; // Should have been caught earlier

        // 1. Clone the container to avoid modifying the live page
        const containerClone = mobileContainer.cloneNode(true);

        // 2. Clean the clone: Remove editing attributes and elements
        // Remove contenteditable attributes
        containerClone.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.removeAttribute('contenteditable');
            // Remove temporary editing styles (optional, but good practice)
            el.style.outline = '';
            el.style.backgroundColor = '';
            el.style.cursor = ''; // Reset cursor
        });

        // Remove image editing hover/focus styles and cursors
        containerClone.querySelectorAll('.editable-image').forEach(img => {
            img.style.cursor = ''; // Reset cursor
            img.style.opacity = ''; // Reset hover opacity
            img.style.outline = ''; // Remove hover outline
        });

        // Remove hidden file inputs
        containerClone.querySelectorAll('.hidden-file-input').forEach(input => {
            input.remove();
        });
        console.log("Cleaned cloned container for HTML saving.");

        // 3. Get the cleaned HTML content
        const cleanedHtmlContent = containerClone.innerHTML;

        // 4. Construct the full HTML document string
        const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edited Scarlett Page</title>
    <!-- Link original CSS files -->
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        /* Minimal critical styles for standalone viewing */
        body { margin: 0; padding: 20px; display: flex; justify-content: center; background-color: #f0f2f5; font-family: sans-serif; }
        .mobile-container { max-width: 500px; width: 100%; background-color: #fff; overflow: hidden; border-radius: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }
    </style>
</head>
<body>
    <!-- Embed the cleaned content within a container -->
    <div class="mobile-container">
        ${cleanedHtmlContent}
    </div>
</body>
</html>`;

        // 5. Create a Blob and trigger download
        try {
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'edited-scarlett-page.html';
            document.body.appendChild(link); // Append to body for browser compatibility
            link.click();
            document.body.removeChild(link); // Clean up the link element
            URL.revokeObjectURL(link.href); // Free up memory
            console.log("HTML file download triggered.");
        } catch (error) {
            console.error("Error creating or downloading HTML blob:", error);
            alert("Gagal membuat file HTML untuk diunduh.");
        }
    }

    // Add listener if button exists
    if (saveHtmlBtn) {
        saveHtmlBtn.addEventListener('click', saveHtml);
    }

    // --- Save JPG Functionality ---
    function saveJpg() {
        console.log("Saving JPG...");
        if (typeof html2canvas === 'undefined') {
            console.error("html2canvas library is not loaded.");
            alert("Error: Pustaka html2canvas tidak ditemukan. Tidak dapat menyimpan sebagai JPG.");
            return;
        }
        if (!mobileContainer) return; // Should be caught earlier

        // Options for html2canvas
        const options = {
            scale: CANVAS_SCALE, // Use configured scale
            useCORS: true,       // Attempt to load cross-origin images
            logging: false,      // Disable excessive logging
            backgroundColor: '#ffffff', // Set explicit white background for JPG
            scrollX: 0, // Ensure capture starts from top-left
            scrollY: 0,
            windowWidth: mobileContainer.scrollWidth, // Use element's dimensions
            windowHeight: mobileContainer.scrollHeight,
            onclone: (clonedDocument) => {
                // Clean the cloned document *before* canvas rendering
                const containerInClone = clonedDocument.querySelector('.mobile-container');
                if (containerInClone) {
                     // Remove editing outlines/styles
                    containerInClone.querySelectorAll('[contenteditable="true"]').forEach(el => {
                        el.style.outline = 'none';
                        el.style.backgroundColor = 'transparent';
                        el.style.cursor = 'default';
                    });
                    containerInClone.querySelectorAll('.editable-image').forEach(img => {
                        img.style.cursor = 'default';
                        img.style.opacity = '';
                        img.style.outline = 'none';
                    });
                     // Remove hidden file inputs from clone
                     containerInClone.querySelectorAll('.hidden-file-input').forEach(input => {
                         input.remove();
                     });
                }
            }
        };

        console.log("Capturing element with html2canvas:", mobileContainer);
        html2canvas(mobileContainer, options)
            .then(canvas => {
                console.log("Canvas generated successfully.");
                // Convert canvas to JPG data URL
                const jpgDataUrl = canvas.toDataURL('image/jpeg', JPG_QUALITY);

                // Create a download link
                const link = document.createElement('a');
                link.href = jpgDataUrl;
                link.download = 'scarlett-screenshot.jpg';
                document.body.appendChild(link); // Append for compatibility
                link.click();
                document.body.removeChild(link); // Clean up
                console.log("JPG file download triggered.");

            })
            .catch(err => {
                console.error("Error generating canvas with html2canvas:", err);
                alert(`Gagal menyimpan sebagai JPG: ${err.message || 'Kesalahan tidak diketahui'}`);
            });
    }

    // Add listener if button exists
    if (saveJpgBtn) {
        saveJpgBtn.addEventListener('click', saveJpg);
    }

    console.log("Scarlett Editor V2 Initialized Successfully.");

}); // End DOMContentLoaded