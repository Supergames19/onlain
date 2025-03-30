document.addEventListener('DOMContentLoaded', () => {

                const saveHtmlButton = document.getElementById('save-html-button');
                const saveJpgButton = document.getElementById('save-jpg-button');
                const contentToCapture = document.documentElement; // Target full page for JPG
                const pageTitleElement = document.getElementById('page-title');
                const saveButtonsContainer = document.querySelector('.save-buttons-container'); // Ref to save buttons

                // --- Fitur Edit Gambar ---
                const imageContainers = document.querySelectorAll('.editable-image-container');
                imageContainers.forEach(container => {
                    const fileInput = container.querySelector('.hidden-file-input');
                    const imageElement = container.querySelector('img');

                    container.addEventListener('click', (e) => {
                        // Prevent if clicking overlay content, a link/button inside, or file input itself
                        if (e.target.closest('a, button, i, span') || e.target === fileInput || e.target.closest('.video-popup')) return;
                        fileInput.click();
                    });

                    fileInput.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const dataUrl = e.target.result;
                                container.dataset.imageDataUrl = dataUrl; // Store for saving HTML
                                if (imageElement) { imageElement.src = dataUrl; }
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
                        button.innerHTML = originalContent; // Restore original HTML
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
                            const elementsToRemove = clonedDoc.querySelectorAll('.save-buttons-container, script');
                            elementsToRemove.forEach(el => el.remove());
                            const editableElements = clonedDoc.querySelectorAll('[contenteditable="true"]');
                            editableElements.forEach(el => el.removeAttribute('contenteditable'));

                            // Handle Images
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
                                link.removeAttribute('onclick');
                                link.removeAttribute('title');
                                link.classList.remove('editable-link');
                                // Update href from live element if necessary (though prompt changes it directly)
                                const liveLink = document.getElementById(link.id); // Assumes links have IDs if needed
                                if (liveLink && link.id) {
                                     link.href = liveLink.href;
                                }
                            });

                            // Handle Favicon (if edited via JS, which isn't implemented here, but structure is ready)
                            const favLink = clonedDoc.getElementById('favicon-link');
                            // If you implement favicon editing, update its href here from dataset

                            const finalHtml = '<!DOCTYPE html>\n' + clonedDoc.documentElement.outerHTML;
                            const blob = new Blob([finalHtml], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const downloader = document.createElement('a');
                            downloader.href = url;
                            const pageTitleText = pageTitleElement?.textContent?.trim() || 'xman-portfolio-edited';
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

                    // Hide elements not needed in screenshot
                    const elementsToHide = [saveButtonsContainer];
                    const overlays = document.querySelectorAll('.edit-overlay'); // Also hide overlays
                    overlays.forEach(o => elementsToHide.push(o));
                    elementsToHide.forEach(el => { if (el) el.style.display = 'none'; });

                    const options = {
                        allowTaint: true, useCORS: true,
                        scale: window.devicePixelRatio || 2, // Higher scale
                        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
                        logging: false,
                        scrollX: -window.scrollX, scrollY: -window.scrollY,
                        windowWidth: document.documentElement.scrollWidth,
                        windowHeight: document.documentElement.scrollHeight
                    };

                    setTimeout(() => {
                        html2canvas(contentToCapture, options).then(canvas => {
                            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                            const downloader = document.createElement('a');
                            downloader.href = imageDataUrl;
                            const pageTitle = pageTitleElement?.textContent?.trim() || 'xman-portfolio';
                            const filename = sanitizeFilename(pageTitle) + '-capture.jpg';
                            downloader.download = filename;
                            document.body.appendChild(downloader);
                            downloader.click();
                            document.body.removeChild(downloader);
                        }).catch(error => {
                            console.error('Error html2canvas:', error);
                            alert('Gagal membuat gambar JPG. Periksa konsol.');
                        }).finally(() => {
                            // Restore hidden elements
                            elementsToHide.forEach(el => { if (el) el.style.display = ''; });
                            setButtonLoading(saveJpgButton, false, originalButtonContent);
                        });
                    }, 150);
                }

                // --- Event Listeners ---
                saveHtmlButton.addEventListener('click', savePageHtml);
                saveJpgButton.addEventListener('click', savePageJpg);

                 // Optional: Initialize WOW.js if you keep the animations
                 // if (typeof WOW !== 'undefined') {
                 //    new WOW().init();
                 // }
                 // Optional: Re-initialize Owl Carousel if structure changes affect it
                 // Maybe call $('.testimonial-slider').owlCarousel({...options...}); again after edits if needed

            }); // End DOMContentLoaded