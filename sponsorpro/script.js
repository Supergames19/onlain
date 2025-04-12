document.addEventListener('DOMContentLoaded', () => {

    // --- Image Editing Functionality ---
    const editableImages = document.querySelectorAll('.editable-image');

    editableImages.forEach(img => {
        const inputId = img.id + 'Input'; // Assumes input has ID like 'imageIdInput'
        const fileInput = document.getElementById(inputId);

        if (!fileInput) {
            console.warn(`No file input found for image with ID: ${img.id}`);
            return; // Skip if no corresponding input found
        }

        // 1. Clicking the image triggers the hidden file input
        img.addEventListener('click', () => {
            fileInput.click();
        });

        // 2. When a file is selected in the input
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    // Update the src attribute of the clicked image
                    img.src = e.target.result;
                }

                reader.readAsDataURL(file); // Read the file as Data URL
            } else {
                console.log("No valid image file selected.");
            }
        });
    });

    // --- Save HTML Functionality ---
    const saveHtmlBtn = document.getElementById('saveHtmlBtn');
    const mobileContainer = document.querySelector('.mobile-container');

    saveHtmlBtn.addEventListener('click', () => {
        // Clone the container to modify without affecting the live page
        const containerClone = mobileContainer.cloneNode(true);

        // Remove contenteditable attributes from the clone
        containerClone.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.removeAttribute('contenteditable');
            // Optionally remove helper styles added by browser during edit
            el.style.outline = '';
            el.style.backgroundColor = '';
        });
        // Remove image editing indicators from the clone
         containerClone.querySelectorAll('.editable-image').forEach(img => {
            img.style.cursor = '';
            img.style.opacity = '';
            img.style.outline = '';
        });
         // Remove hidden file inputs from the clone
         containerClone.querySelectorAll('.hidden-file-input').forEach(input => {
            input.remove();
         });


        // Get the cleaned HTML
        const htmlContent = containerClone.innerHTML; // Use innerHTML to get content without the container itself if preferred
        // Or use outerHTML if you want the <div class="mobile-container"> tag included:
        // const htmlContent = containerClone.outerHTML;

        // Add basic HTML structure for standalone viewing
        const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edited Scarlett Page</title>
    <!-- Link the original CSS or embed styles -->
    <link rel="stylesheet" href="https://supergames19.github.io/onlain/sponsorpro/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        /* Add any critical styles directly if style.css isn't guaranteed */
        body { margin: 0; padding: 20px; display: flex; justify-content: center; background-color: #f0f2f5; }
        .mobile-container { /* Add essential container styles */
             max-width: 500px; /* Match the original */
             width: 100%;
             background-color: #fff;
             overflow: hidden;
             border-radius: 10px;
             box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="mobile-container">
        ${htmlContent}
    </div>
</body>
</html>`;


        // Create a Blob and download link
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'edited-scarlett-page.html';
        document.body.appendChild(link); // Append to body for Firefox compatibility
        link.click();
        document.body.removeChild(link); // Clean up
        URL.revokeObjectURL(link.href); // Free up memory
    });

    // --- Save JPG Functionality ---
    const saveJpgBtn = document.getElementById('saveJpgBtn');

    saveJpgBtn.addEventListener('click', () => {
        console.log("Save JPG clicked. Capturing:", mobileContainer);

        // Options for html2canvas (optional, but can improve quality)
        const options = {
             scale: 2, // Increase resolution (might increase file size)
             useCORS: true, // Important if images are from external sources
             logging: true, // Show logs in console for debugging
             backgroundColor: null, // Use element's background, or set one like '#ffffff'
             onclone: (document) => {
                // Remove editing outlines/styles before capture
                document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                    el.style.outline = 'none';
                    el.style.backgroundColor = 'transparent';
                });
                document.querySelectorAll('.editable-image').forEach(img => {
                    img.style.cursor = '';
                    img.style.opacity = '';
                    img.style.outline = '';
                });
             }
        };


        html2canvas(mobileContainer, options).then(canvas => {
            console.log("Canvas generated:", canvas);
            // Convert canvas to JPG data URL
            // Use quality 0.9 (90%) for good balance
            const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // Create a download link
            const link = document.createElement('a');
            link.href = jpgDataUrl;
            link.download = 'scarlett-screenshot.jpg';
            document.body.appendChild(link); // Append to body
            link.click();
            document.body.removeChild(link); // Clean up
            console.log("JPG download triggered.");

        }).catch(err => {
            console.error("Error generating canvas:", err);
            alert("Gagal menyimpan sebagai JPG. Lihat konsol untuk detail.");
        });
    });

}); // End DOMContentLoaded
