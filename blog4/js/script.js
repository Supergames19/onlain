document.addEventListener('DOMContentLoaded', () => {

                const saveHtmlButton = document.getElementById('save-html-button');
                const saveJpgButton = document.getElementById('save-jpg-button');
                const contentToCapture = document.documentElement; // Target full page
                const pageTitleElement = document.getElementById('page-title');
                const saveButtonsContainer = document.querySelector('.save-buttons-container');
                const preloaderWrapper = document.getElementById('preloader-wrapper');

                // --- Fitur Edit Gambar ---
                const imageContainers = document.querySelectorAll('.editable-image-container');
                imageContainers.forEach(container => {
                    const fileInput = container.querySelector('.hidden-file-input');
                    const imageElement = container.querySelector('img');

                    container.addEventListener('click', (e) => {
                        // Prevent if clicking overlay content, a link/button inside, or file input itself
                        // Also prevent triggering if clicking inside a magnificPopup link
                        if (e.target.closest('a, button, i, span') || e.target === fileInput || e.target.closest('.image-popup')) return;
                        fileInput.click();
                    });

                    fileInput.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const dataUrl = e.target.result;
                                container.dataset.imageDataUrl = dataUrl;
                                if (imageElement) { imageElement.src = dataUrl; }

                                // Special handling for gallery: Re-init magnific popup if structure changes affect it
                                if(container.closest('.gallery-slider')) {
                                   // Destroy existing popup instance on the link if needed, then re-init
                                   const link = container.closest('.block').querySelector('.image-popup');
                                   if(link && $.fn.magnificPopup) {
                                        // Update the link's href to the new image if desired for popup
                                        // link.href = dataUrl; // Optional: update popup link immediately
                                        // Could potentially destroy and reinit the popup on the parent
                                        // $('.gallery-slider').magnificPopup('destroy');
                                        // $('.gallery-slider').magnificPopup({ delegate: '.image-popup', type:'image', gallery: {enabled: true} });
                                   }
                                }
                                // Special handling for owl carousel if images affect layout significantly
                                if(container.closest('.gallery-slider') && $.fn.owlCarousel) {
                                     // May need to trigger refresh, update, or destroy/reinit carousel
                                     // $('.gallery-slider').trigger('refresh.owl.carousel');
                                }
                            }
                            reader.readAsDataURL(file);
                        } else if (file) {
                            alert('Harap pilih file gambar yang valid (JPG, PNG, GIF, dll.).');
                            event.target.value = null;
                        }
                    });
                });

                // --- Fungsi Utilitas Tombol Loading ---
                function setButtonLoading(button, isLoading, originalContent) {
                    if (isLoading) {
                        button.classList.add('loading'); button.disabled = true;
                        const textContent = originalContent.replace(/<i.*?<\/i>\s*/, '').trim();
                        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${textContent}...`;
                    } else {
                        button.classList.remove('loading'); button.disabled = false;
                        button.innerHTML = originalContent;
                    }
                }

                // --- Fungsi Membersihkan Nama File ---
                function sanitizeFilename(name) {
                    return name.replace(/<[^>]*>/g, '').trim().toLowerCase()
                               .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                               .replace(/\-\-+/g, '-').replace(/^-+|-+$/g, '') || "download";
                }

                // --- Fungsi Simpan Halaman HTML ---
                function savePageHtml() {
                    const originalButtonContent = saveHtmlButton.innerHTML;
                    setButtonLoading(saveHtmlButton, true, originalButtonContent);

                    setTimeout(() => {
                        try {
                            const clonedDoc = document.cloneNode(true);

                             // --- Selectively remove elements ---
                             // 1. Remove save buttons container
                             const buttons = clonedDoc.querySelector('.save-buttons-container');
                             if (buttons) buttons.remove();
                             // 2. Remove the editing script itself
                             const editingScript = clonedDoc.querySelector('script#editing-script'); // Need to add id="editing-script" to our script tag
                             if (editingScript) editingScript.remove();
                             // 3. Remove html2canvas script (not needed in saved file)
                             const h2cScript = clonedDoc.querySelector('script[src*="html2canvas"]');
                             if(h2cScript) h2cScript.remove();

                            // Remove contenteditable attribute
                            const editableElements = clonedDoc.querySelectorAll('[contenteditable="true"]');
                            editableElements.forEach(el => el.removeAttribute('contenteditable'));

                            // Handle Images (update src, remove artifacts)
                            const allImageContainers = clonedDoc.querySelectorAll('.editable-image-container');
                            allImageContainers.forEach(container => {
                                if (container.dataset.imageDataUrl) {
                                    const img = container.querySelector('img');
                                    if (img) { img.src = container.dataset.imageDataUrl; }
                                    delete container.dataset.imageDataUrl;
                                }
                                const overlay = container.querySelector('.edit-overlay'); if(overlay) overlay.remove();
                                const fileInput = container.querySelector('.hidden-file-input'); if(fileInput) fileInput.remove();
                            });

                            // Handle Editable Links (Remove helpers)
                            const editableLinks = clonedDoc.querySelectorAll('.editable-link');
                            editableLinks.forEach(link => {
                                link.removeAttribute('onclick'); link.removeAttribute('title');
                                link.classList.remove('editable-link');
                                const liveLink = document.getElementById(link.id); // Requires IDs on links for accurate href update
                                if (liveLink && link.id) { link.href = liveLink.href; }
                            });

                            // Handle Favicon (if edited)
                             const favLink = clonedDoc.getElementById('favicon-link');
                             // If implementing favicon edit: if (favLink && favLink.dataset.imageDataUrl) { favLink.href = favLink.dataset.imageDataUrl; }

                            const finalHtml = '<!DOCTYPE html>\n' + clonedDoc.documentElement.outerHTML;
                            const blob = new Blob([finalHtml], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const downloader = document.createElement('a');
                            downloader.href = url;
                            const pageTitleText = pageTitleElement?.textContent?.trim() || 'vex-edited';
                            const filename = sanitizeFilename(pageTitleText) + '.html';
                            downloader.download = filename;
                            document.body.appendChild(downloader);
                            downloader.click();
                            document.body.removeChild(downloader);
                            URL.revokeObjectURL(url);

                        } catch (error) {
                            console.error("Gagal menyimpan HTML:", error);
                            alert("Terjadi kesalahan saat menyimpan halaman HTML.");
                        } finally {
                            setButtonLoading(saveHtmlButton, false, originalButtonContent);
                        }
                    }, 100);
                }


                // --- Fungsi Simpan Halaman JPG ---
                function savePageJpg() {
                    if (typeof html2canvas === 'undefined') {
                        alert('Library html2canvas tidak dimuat. Gagal menyimpan JPG.'); return;
                    }
                    if (!contentToCapture) {
                        alert('Elemen target capture (document.documentElement) tidak ditemukan.'); return;
                    }

                    const originalButtonContent = saveJpgButton.innerHTML;
                    setButtonLoading(saveJpgButton, true, originalButtonContent);

                    // Hide elements
                    const elementsToHide = [saveButtonsContainer, preloaderWrapper];
                    const overlays = document.querySelectorAll('.edit-overlay');
                    overlays.forEach(o => elementsToHide.push(o));
                    elementsToHide.forEach(el => { if (el) el.style.display = 'none'; });

                    const options = {
                        allowTaint: true, useCORS: true,
                        scale: window.devicePixelRatio || 2,
                        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
                        logging: false,
                        scrollX: -window.scrollX, scrollY: -window.scrollY,
                        windowWidth: document.documentElement.scrollWidth,
                        windowHeight: document.documentElement.scrollHeight,
                        // Explicitly ignore preloader by ID
                        ignoreElements: (element) => element.id === 'preloader-wrapper' || element.classList.contains('save-buttons-container')
                    };

                    setTimeout(() => {
                        html2canvas(contentToCapture, options).then(canvas => {
                            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                            const downloader = document.createElement('a');
                            downloader.href = imageDataUrl;
                            const pageTitle = pageTitleElement?.textContent?.trim() || 'vex-capture';
                            const filename = sanitizeFilename(pageTitle) + '.jpg';
                            downloader.download = filename;
                            document.body.appendChild(downloader);
                            downloader.click();
                            document.body.removeChild(downloader);
                        }).catch(error => {
                            console.error('Error html2canvas:', error);
                            alert('Gagal membuat gambar JPG. Periksa konsol.');
                        }).finally(() => {
                            elementsToHide.forEach(el => { if (el) el.style.display = ''; }); // Restore display
                            setButtonLoading(saveJpgButton, false, originalButtonContent);
                        });
                    }, 150);
                }

                // --- Event Listeners ---
                saveHtmlButton.addEventListener('click', savePageHtml);
                saveJpgButton.addEventListener('click', savePageJpg);

                // Initialize Owl Carousel if present (after DOM ready)
                if (typeof $.fn.owlCarousel !== 'undefined' && $('.gallery-slider').length > 0) {
                     $('.gallery-slider').owlCarousel({
                        items: 5, // Check original main.js for correct options
                        loop:true,
                        margin: 20,
                        dots: true,
                        autoplay:true,
                        responsive:{
                            0:{
                                items:1
                            },
                            480:{
                                items:3
                            },
                            768:{
                                items:3
                            },
                             992:{
                                items:5
                            }
                        }
                     });
                }

                // Initialize Magnific Popup if present
                if (typeof $.fn.magnificPopup !== 'undefined' && $('.image-popup').length > 0) {
                    $('.image-popup').magnificPopup({ // Use class selector
                        type: 'image',
                        gallery: { enabled: true } // Enable gallery mode if desired
                        // Add other options from main.js if necessary
                    });
                 }


            }); // End DOMContentLoaded