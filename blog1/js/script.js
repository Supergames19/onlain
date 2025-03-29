document.addEventListener('DOMContentLoaded', () => {

			const saveHtmlButton = document.getElementById('save-html-button');
			const saveJpgButton = document.getElementById('save-jpg-button');
			const contentToCapture = document.getElementById('capture-area'); // Target the wrapper div
			const pageTitleElement = document.getElementById('page-title');

			// --- Fitur Edit Gambar ---
            const imageContainers = document.querySelectorAll('.editable-image-container');
            imageContainers.forEach(container => {
                const fileInput = container.querySelector('.hidden-file-input');
                const imageElement = container.querySelector('img'); // Get the actual image element

                container.addEventListener('click', (e) => {
                    if (e.target.closest('a, button') || e.target === fileInput) return;
                    fileInput.click();
                });

                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const dataUrl = e.target.result;
                            container.dataset.imageDataUrl = dataUrl; // Store for saving HTML

                            if (imageElement) {
                                imageElement.src = dataUrl; // Update the visible image
                            }
                            // If using background-image instead, update style here
                            // container.style.backgroundImage = `url('${dataUrl}')`;
                        }
                        reader.readAsDataURL(file);
                    } else if (file) {
                        alert('Harap pilih file gambar yang valid (JPG, PNG, GIF, dll.).');
                        event.target.value = null; // Reset input
                    }
                });
            });


			// --- Fungsi Utilitas Tombol Loading ---
            function setButtonLoading(button, isLoading, originalContent) {
                 if (isLoading) {
                     button.classList.add('loading');
                     button.disabled = true;
					 // Extract text content only, remove existing icon
					 const textContent = originalContent.replace(/<i.*?<\/i>\s*/, '').trim();
                     button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${textContent}...`;
                 } else {
                     button.classList.remove('loading');
                     button.disabled = false;
                     button.innerHTML = originalContent;
                 }
            }

			 // --- Fungsi Membersihkan Nama File ---
             function sanitizeFilename(name) {
                 return name.replace(/<[^>]*>/g, '')
                           .trim()
                           .toLowerCase()
                           .replace(/\s+/g, '-')
                           .replace(/[^\w\-]+/g, '')
                           .replace(/\-\-+/g, '-')
                           .replace(/^-+|-+$/g, '') || "download"; // Fallback name
             }


			// --- Fungsi Simpan Halaman HTML ---
            function savePageHtml() {
                const originalButtonContent = saveHtmlButton.innerHTML;
                setButtonLoading(saveHtmlButton, true, originalButtonContent);

                setTimeout(() => {
                    try {
                        const clonedDoc = document.cloneNode(true);

                        // Remove unwanted elements from clone
                        const elementsToRemove = clonedDoc.querySelectorAll('.save-buttons-container, script');
                        elementsToRemove.forEach(el => el.remove());

                        // Remove contenteditable attribute from clone
                        const editableElements = clonedDoc.querySelectorAll('[contenteditable="true"]');
                        editableElements.forEach(el => el.removeAttribute('contenteditable'));

						// Remove editing artifacts (overlays, inputs) and update edited image sources in clone
                        const allImageContainers = clonedDoc.querySelectorAll('.editable-image-container');
                        allImageContainers.forEach(container => {
							// Update src if edited
							if (container.dataset.imageDataUrl) {
								const img = container.querySelector('img');
								if (img && container.dataset.imageDataUrl) {
									img.src = container.dataset.imageDataUrl;
								}
								delete container.dataset.imageDataUrl; // Clean up dataset
							}
							// Remove overlay and input
                            const overlay = container.querySelector('.edit-overlay');
                            if(overlay) overlay.remove();
							const fileInput = container.querySelector('.hidden-file-input');
                            if(fileInput) fileInput.remove();
                        });

                        const finalHtml = '<!DOCTYPE html>\n' + clonedDoc.documentElement.outerHTML;
                        const blob = new Blob([finalHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const downloader = document.createElement('a');
                        downloader.href = url;

                        // Use the *current* page title for the filename
                        const pageTitleText = pageTitleElement?.textContent?.trim() || 'watch-page-edited';
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
                    alert('Library html2canvas tidak ditemukan. Gagal menyimpan JPG.');
                    return;
                 }

                 const originalButtonContent = saveJpgButton.innerHTML;
                 setButtonLoading(saveJpgButton, true, originalButtonContent);

                 // Temporarily hide edit overlays and save buttons if they might overlap capture area
                 const overlays = contentToCapture.querySelectorAll('.edit-overlay');
                 overlays.forEach(o => o.style.visibility = 'hidden');
				 // If save buttons are position:fixed or sticky AND *might* overlap the #capture-area, hide them too.
				 // const saveBtnContainer = document.querySelector('.save-buttons-container');
				 // if (saveBtnContainer) saveBtnContainer.style.visibility = 'hidden';


                 const options = {
                     allowTaint: true,
                     useCORS: true,
                     scale: window.devicePixelRatio || 1.5, // Adjust scale for quality
                     backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff', // Use body bg or default
                     logging: false,
					 scrollX: 0, // Capture from top-left of the target element
					 scrollY: 0,
					 windowWidth: contentToCapture.scrollWidth, // Use element's scroll dimensions
					 windowHeight: contentToCapture.scrollHeight,
					 // Ignore specific elements during capture if needed
					 // ignoreElements: (element) => element.classList.contains('some-class-to-ignore')
                 };

                 setTimeout(() => {
                     html2canvas(contentToCapture, options).then(canvas => {
                         const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // JPG quality 90%
                         const downloader = document.createElement('a');
                         downloader.href = imageDataUrl;

                         const pageTitleText = pageTitleElement?.textContent?.trim() || 'watch-page-capture';
                         const filename = sanitizeFilename(pageTitleText) + '.jpg';
                         downloader.download = filename;

                         document.body.appendChild(downloader);
                         downloader.click();
                         document.body.removeChild(downloader);

                     }).catch(error => {
                         console.error('Error saat menggunakan html2canvas:', error);
                         alert('Gagal membuat gambar JPG. Mungkin ada elemen atau gambar eksternal yang tidak dapat diakses/diproses.');
                     }).finally(() => {
						 // Restore visibility
                         overlays.forEach(o => o.style.visibility = '');
						 // if (saveBtnContainer) saveBtnContainer.style.visibility = '';
                         // Reset state loading
                         setButtonLoading(saveJpgButton, false, originalButtonContent);
                     });
                 }, 150); // Slightly longer delay for rendering

            }


			// --- Event Listeners ---
            saveHtmlButton.addEventListener('click', savePageHtml);
            saveJpgButton.addEventListener('click', savePageJpg);

			// Optional: Prevent accidental file drops
            // document.body.addEventListener('dragover', (e) => { e.preventDefault(); });
            // document.body.addEventListener('drop', (e) => { e.preventDefault(); });


		}); // End DOMContentLoaded