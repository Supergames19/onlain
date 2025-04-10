
        // --- DOM Elements ---
        const profilePicUploadInput = document.getElementById('profilePicUpload');
        const adImageUploadInput = document.getElementById('adImageUpload');
        const profilePicDisplay = document.getElementById('profilePicDisplay');
        const adImageDisplay = document.getElementById('adImageDisplay');
        const saveHtmlBtn = document.getElementById('saveHtmlBtn');
        const saveJpgBtn = document.getElementById('saveJpgBtn');
        const resetBtn = document.getElementById('resetBtn');
        const adCard = document.getElementById('adCard'); // Target for saving
        const statusMessageEl = document.getElementById('statusMessage');
        const ctaLinkInput = document.getElementById('ctaLinkInput'); // New Input
        const ctaButton = document.getElementById('ctaButton');     // Target CTA button
        const allActionButtons = document.querySelectorAll('.toolbar-container .toolbar-button, .toolbar-container label.toolbar-button');
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        const allImageInputs = document.querySelectorAll('input[type="file"]');

        // --- Initial State Storage ---
        function storeInitialState() {
            // Images
            [profilePicDisplay, adImageDisplay].forEach(imgEl => {
                if (imgEl) {
                    const initialSrc = imgEl.dataset.initialSrc || imgEl.src;
                    imgEl.src = initialSrc;
                    if (!imgEl.dataset.initialSrc) imgEl.dataset.initialSrc = initialSrc;
                }
            });

            // Editable Text/HTML
            editableElements.forEach(el => {
                if (typeof el.dataset.initialHtml === 'undefined') {
                    el.dataset.initialHtml = el.innerHTML;
                }
                el.innerHTML = el.dataset.initialHtml;
            });

            // CTA Button Link
            if (ctaButton) {
                const initialHref = ctaButton.dataset.initialHref || ctaButton.getAttribute('href') || '#'; // Fallback
                if (!ctaButton.dataset.initialHref) ctaButton.dataset.initialHref = initialHref; // Set data-attr if missing
                ctaButton.setAttribute('href', initialHref);
                if (ctaLinkInput) ctaLinkInput.value = initialHref;
            }

            console.log("Initial Ad state loaded/restored.");
        }

        // --- Status Message Function ---
        let statusTimeout;
        function showStatus(message, type = 'info', duration = 4000) {
            clearTimeout(statusTimeout);
            let icon = '';
            switch (type) {
                case 'success': icon = '✅ '; break; case 'error': icon = '❌ '; break;
                case 'loading': icon = '⏳ '; break; case 'info': icon = 'ℹ️ '; break;
            }
            statusMessageEl.textContent = icon + message;
            statusMessageEl.className = `status-message ${type} show`;
            if (duration > 0) statusTimeout = setTimeout(() => statusMessageEl.classList.remove('show'), duration);
        }

        // --- Button State Management ---
        function disableButtons(loadingButton = null) {
            allActionButtons.forEach(btn => {
                if (btn.tagName === 'BUTTON') btn.disabled = true;
                else if (btn.tagName === 'LABEL') { btn.style.pointerEvents = 'none'; btn.setAttribute('aria-disabled', 'true'); }
                btn.style.opacity = (btn === loadingButton) ? '1' : '0.6';
                if (btn === loadingButton) { btn.dataset.originalText = btn.innerHTML; btn.innerHTML = '⏳ Proses...'; }
            });
            allImageInputs.forEach(input => input.disabled = true);
            if (ctaLinkInput) ctaLinkInput.disabled = true; // Disable link input too
        }

        function enableButtons() {
            allActionButtons.forEach(btn => {
                if (btn.tagName === 'BUTTON') btn.disabled = false;
                else if (btn.tagName === 'LABEL') { btn.style.pointerEvents = 'auto'; btn.removeAttribute('aria-disabled'); }
                if (btn.dataset.originalText) { btn.innerHTML = btn.dataset.originalText; delete btn.dataset.originalText; }
                btn.style.opacity = '1';
            });
            allImageInputs.forEach(input => input.disabled = false);
            if (ctaLinkInput) ctaLinkInput.disabled = false; // Enable link input too
        }

        // --- Generic Image Upload Handler ---
        function handleImageUpload(event, displayElement) { /* ... (no changes needed here) ... */
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (displayElement) {
                        displayElement.src = e.target.result;
                        showStatus('Gambar berhasil diganti.', 'success');
                    }
                }
                reader.onerror = function () { showStatus('Gagal memuat pratinjau gambar.', 'error'); }
                reader.readAsDataURL(file);
            } else if (file) { showStatus('Format file tidak valid. Pilih file gambar.', 'error'); }
            event.target.value = null;
        }

        // --- Update CTA Link ---
        function updateCtaLink() {
            if (ctaButton && ctaLinkInput) {
                ctaButton.setAttribute('href', ctaLinkInput.value || '#'); // Update href, fallback to '#' if empty
            }
        }

        // --- Reset Functionality ---
        function resetContent() {
            if (confirm('Yakin ingin reset semua perubahan ke template awal?')) {
                disableButtons(resetBtn);
                showStatus('Mereset...', 'loading', 0);
                setTimeout(() => {
                    try {
                        storeInitialState(); // This now handles text, images, AND the CTA link/input value
                        showStatus('Konten berhasil direset.', 'success');
                    } catch (error) {
                        console.error("Error during reset:", error);
                        showStatus('Gagal mereset konten.', 'error');
                    } finally {
                        enableButtons();
                    }
                }, 50);
            }
        }

        // --- Generate Filename ---
        function generateFilename(extension) { /* ... (no changes needed here) ... */
            const headlineEl = adCard.querySelector('.link-headline');
            const pageNameEl = adCard.querySelector('.page-name');
            let baseName = 'iklan_facebook';
            if (headlineEl && headlineEl.textContent.trim()) { baseName = headlineEl.textContent.trim(); }
            else if (pageNameEl && pageNameEl.textContent.trim()) { baseName = pageNameEl.textContent.trim(); }
            const sanitizedName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
            return `${sanitizedName || 'iklan'}_${timestamp}.${extension}`;
        }

        // --- Save HTML Functionality ---
        function saveHtml() {
            disableButtons(saveHtmlBtn);
            showStatus('Menyiapkan file HTML...', 'loading', 0);
            setTimeout(() => {
                try {
                    const clone = document.documentElement.cloneNode(true);
                    // Clean up clone
                    const elementsToRemoveSelectors = ['.toolbar-container', 'script', '#statusMessage'];
                    elementsToRemoveSelectors.forEach(selector => { const el = clone.querySelector(selector); if (el) el.remove(); });

                    clone.querySelectorAll('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-initial-html'); });
                    clone.querySelectorAll('[data-initial-src]').forEach(el => { el.removeAttribute('data-initial-src'); });
                    clone.querySelectorAll('[data-initial-href]').forEach(el => { el.removeAttribute('data-initial-href'); }); // Remove initial href data
                    clone.querySelectorAll('.image-upload-overlay').forEach(el => el.remove());
                    clone.querySelector('body').style.paddingTop = '';

                    const finalHtmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
                    const blob = new Blob([finalHtmlContent], { type: 'text/html;charset=utf-8' });
                    const filename = generateFilename('html');
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob); link.download = filename;
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                    showStatus(`File "${filename}" (HTML) berhasil diunduh!`, 'success');
                } catch (error) { console.error('Error saving HTML:', error); showStatus('Gagal menyimpan HTML.', 'error', 6000); }
                finally { enableButtons(); }
            }, 50);
        }

        // --- Save JPG Functionality ---
        function saveJpg() { /* ... (no changes needed here) ... */
            disableButtons(saveJpgBtn);
            showStatus('Memproses gambar JPG...', 'loading', 0);
            adCard.classList.add('is-capturing');
            setTimeout(() => {
                html2canvas(adCard, { useCORS: true, allowTaint: true, scale: 2, logging: false, backgroundColor: getComputedStyle(adCard).backgroundColor || '#ffffff', })
                    .then(canvas => {
                        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                        const filename = generateFilename('jpg');
                        const link = document.createElement('a');
                        link.href = imageDataUrl; link.download = filename;
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        showStatus(`File "${filename}" (JPG) berhasil diunduh!`, 'success');
                    }).catch(error => { console.error('Error creating JPG:', error); showStatus(`Gagal membuat JPG: ${error.message}.`, 'error', 6000); })
                    .finally(() => { adCard.classList.remove('is-capturing'); enableButtons(); });
            }, 150);
        }

        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            storeInitialState();
            console.log("Facebook Ad Editor Initialized (Link Editable).");
        });

        profilePicUploadInput.addEventListener('change', (e) => handleImageUpload(e, profilePicDisplay));
        adImageUploadInput.addEventListener('change', (e) => handleImageUpload(e, adImageDisplay));
        saveHtmlBtn.addEventListener('click', saveHtml);
        saveJpgBtn.addEventListener('click', saveJpg);
        resetBtn.addEventListener('click', resetContent);
        if (ctaLinkInput) ctaLinkInput.addEventListener('input', updateCtaLink); // Listen to link input changes

        // Optional: Add focus/blur classes for CSS styling hooks
        editableElements.forEach(el => { /* ... (no changes needed here) ... */
            el.addEventListener('focus', () => el.classList.add('editable-focus'));
            el.addEventListener('blur', () => el.classList.remove('editable-focus'));
        });

   