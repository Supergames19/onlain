// --- Element References ---
        const imageUpload = document.getElementById('image-upload');
        const promoImage = document.getElementById('promo-image');
        const saveHtmlBtn = document.getElementById('save-html-btn');
        const saveJpgBtn = document.getElementById('save-jpg-btn');
        const promoContainer = document.getElementById('promo-container');
        const promoTitle = document.getElementById('promo-title');
        const promoDescription = document.getElementById('promo-description');
        const orderNowLink = document.getElementById('order-now-link'); // The <a> element
        const orderNowText = document.getElementById('order-now-text'); // The editable <span> inside <a>
        const buttonLinkInput = document.getElementById('button-link-input'); // URL input field

        // --- Image Upload Handling ---
        imageUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) { // Basic validation
                const reader = new FileReader();
                reader.onload = function(e) {
                    promoImage.src = e.target.result;
                }
                reader.onerror = function() {
                    alert('Gagal membaca file gambar.');
                }
                reader.readAsDataURL(file);
            } else if (file) {
                alert('Silakan pilih file gambar (JPG, PNG, GIF, dll).');
                imageUpload.value = ''; // Reset file input
            }
        });

        // --- Button Link Update Handling ---
        buttonLinkInput.addEventListener('input', function() {
            let url = this.value.trim();
            // Basic check: If URL exists, use it, otherwise use '#'
            // Input type="url" provides some browser-level validation
            orderNowLink.href = url || '#';
        });

         // Initialize input field with the link's current href (if not '#')
         const initialHref = orderNowLink.getAttribute('href');
         buttonLinkInput.value = (initialHref && initialHref !== '#') ? initialHref : '';


        // --- Save as HTML Function ---
        saveHtmlBtn.addEventListener('click', function() {
            saveHtmlBtn.textContent = 'Menyimpan HTML...';
            saveHtmlBtn.disabled = true;

            try {
                // Get current edited content
                const editedTitleHTML = promoTitle.innerHTML;
                const editedDescriptionHTML = promoDescription.innerHTML;
                const editedImageSrc = promoImage.src; // Use current src (could be data URL or original URL)
                const editedButtonTextHTML = orderNowText.innerHTML;
                const currentButtonLink = orderNowLink.getAttribute('href') || '#';

                // Create the HTML structure for the "Pesan Sekarang" button/link
                // Applying inline styles for better portability, using CSS variables defined in the saved HTML
                const orderButtonHTML = `<a href="${currentButtonLink}" class="order-now-link" style="display: inline-block; margin-top: 25px; background-color: var(--success-color); color: var(--light-text) !important; border: none; border-radius: 5px; font-size: 1.1em; font-weight: 600; text-decoration: none !important; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 30px; cursor: pointer; transition: background-color 0.3s ease;" onmouseover="this.style.backgroundColor='var(--success-hover-color)'" onmouseout="this.style.backgroundColor='var(--success-color)'">${editedButtonTextHTML}</a>`;

                // Construct the full HTML content for the saved file
                const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promosi Tersimpan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { /* Define CSS variables for the saved file */
             --primary-color: #007bff;
             --secondary-color: #6c757d;
             --light-bg: #f8f9fa;
             --dark-text: #343a40;
             --light-text: #ffffff;
             --border-color: #dee2e6;
             --success-color: #28a745;
             --success-hover-color: #218838; /* Needed for hover effect */
        }
        body {
            font-family: 'Poppins', sans-serif;
            background-color: var(--light-bg);
            color: var(--dark-text);
            line-height: 1.6;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start; /* Align top */
            min-height: 100vh;
            margin: 0;
        }
        .container {
            width: 90%;
            max-width: 450px;
            border: 1px solid var(--border-color);
            padding: 30px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
            margin-top: 20px; /* Add some margin from top */
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border-radius: 6px;
            object-fit: cover;
            background-color: #eee;
        }
        h2 {
            font-size: 1.8em;
            font-weight: 700;
            margin-bottom: 15px;
            color: var(--primary-color);
            text-align: center;
        }
        p {
            font-size: 1em;
            line-height: 1.6;
            color: var(--secondary-color);
            text-align: center;
            margin-bottom: 20px; /* Space before button */
        }
        p small {
             display: block;
             margin-top: 8px;
             font-size: 0.85em;
             color: #888;
        }
        /* Style for the link is primarily inline, but a class is good practice */
        .order-now-link {
             /* Basic styles handled inline for portability */
        }
         /* Hover effect handled by inline JS or this CSS rule if inline JS removed */
         /* .order-now-link:hover {
             background-color: var(--success-hover-color) !important;
        } */

         /* Basic responsiveness for the saved HTML */
         @media (max-width: 500px) {
            .container {
                padding: 20px;
            }
            h2 {
                font-size: 1.6em;
            }
            p {
                font-size: 0.95em;
            }
            .order-now-link {
                font-size: 1em;
                padding: 10px 20px;
            }
         }
    </style>
</head>
<body>
    <div class="container">
        <h2>${editedTitleHTML}</h2>
        <img src="${editedImageSrc}" alt="Gambar Promosi">
        <p>${editedDescriptionHTML}</p>
        ${orderButtonHTML} <!-- Inject the button/link HTML here -->
    </div>
</body>
</html>`;

                // Create a Blob and download link
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'promosi_desain_saya.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('File HTML disimpan.');
                alert('File HTML berhasil dibuat dan diunduh!');

            } catch (error) {
                console.error('Error saat menyimpan HTML:', error);
                alert('Gagal membuat file HTML. Periksa konsol (F12) untuk detail.');
            } finally {
                // Re-enable button and restore text
                saveHtmlBtn.textContent = 'Simpan sebagai HTML';
                saveHtmlBtn.disabled = false;
            }
        });

        // --- Save as JPG Function (using html2canvas) ---
        saveJpgBtn.addEventListener('click', function() {
            saveJpgBtn.textContent = 'Menyimpan JPG...';
            saveJpgBtn.disabled = true;
            saveHtmlBtn.disabled = true; // Disable HTML button too during JPG save

            const originalStyles = new Map();
            const editables = promoContainer.querySelectorAll('[contenteditable="true"]');

            // Temporarily remove interactive styles (borders, shadows) for clean screenshot
            editables.forEach(el => {
                originalStyles.set(el, {
                    border: el.style.border,
                    boxShadow: el.style.boxShadow,
                    backgroundColor: el.style.backgroundColor
                });
                // Reset styles to non-editing appearance
                el.style.border = '1px solid transparent'; // Use solid transparent for consistency
                el.style.boxShadow = 'none';
                el.style.backgroundColor = 'transparent'; // Assume default is transparent bg
            });

            // Ensure container border is visible if desired in the final image
            const originalContainerBorder = promoContainer.style.border;
             // promoContainer.style.border = '1px solid var(--border-color)'; // Keep border if needed
             // Or remove it for the screenshot if preferred:
             promoContainer.style.border = '1px solid var(--border-color)'; // Let's keep the container border

            // Reset any hover effects on the link/button
            let originalLinkTransform = orderNowLink.style.transform;
            orderNowLink.style.transform = 'none';
            // Also reset styles on the editable span if needed (already covered by editables loop)

            // Use html2canvas to capture the promo container
            html2canvas(promoContainer, {
                 useCORS: true, // Important if images are from external sources
                 backgroundColor: '#ffffff', // Set explicit white background
                 scale: 2, // Use a fixed scale for higher resolution (good for retina)
                 logging: false, // Disable html2canvas console logs
                 onclone: (clonedDoc) => {
                     // Ensure styles are definitely reset in the cloned document just before capture
                     const clonedEditables = clonedDoc.querySelectorAll('[contenteditable="true"]');
                     clonedEditables.forEach(el => {
                         el.style.border = '1px solid transparent';
                         el.style.boxShadow = 'none';
                         el.style.backgroundColor = 'transparent';
                     });
                     const clonedLink = clonedDoc.getElementById('order-now-link');
                     if (clonedLink) clonedLink.style.transform = 'none';
                     const clonedContainer = clonedDoc.getElementById('promo-container');
                     if(clonedContainer) clonedContainer.style.border = '1px solid var(--border-color)'; // Ensure border in clone
                 }
                })
                .then(canvas => {
                    // Convert canvas to JPG data URL
                    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92); // Quality 0.92

                    // Create download link
                    const a = document.createElement('a');
                    a.href = imageDataUrl;
                    a.download = 'promosi_desain_saya.jpg';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    console.log('File JPG disimpan.');
                    alert('File JPG berhasil dibuat dan diunduh!');

                })
                .catch(error => {
                    console.error('Error saat membuat JPG:', error);
                    alert('Gagal membuat file JPG. Periksa konsol (F12) untuk detail error.');
                })
                .finally(() => {
                     // Restore original styles to editable elements
                     editables.forEach(el => {
                        const styles = originalStyles.get(el);
                        if (styles) {
                            el.style.border = styles.border || ''; // Restore or default to empty
                            el.style.boxShadow = styles.boxShadow || '';
                            el.style.backgroundColor = styles.backgroundColor || '';
                        } else {
                            // Fallback if styles weren't captured (shouldn't happen often)
                             el.style.border = '';
                             el.style.boxShadow = '';
                             el.style.backgroundColor = '';
                        }
                     });
                    // Restore original container border and link transform
                    promoContainer.style.border = originalContainerBorder;
                    orderNowLink.style.transform = originalLinkTransform;

                    // Re-enable buttons and restore text
                     saveJpgBtn.textContent = 'Simpan sebagai JPG';
                     saveJpgBtn.disabled = false;
                     saveHtmlBtn.disabled = false; // Re-enable HTML button
                });
        });
