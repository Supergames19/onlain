

        // --- DOM Elements ---
        const profilePicUploadInput = document.getElementById('profilePicUpload');
        const statusMediaUploadInput = document.getElementById('statusMediaUpload');
        const profilePicDisplay = document.getElementById('profilePicDisplay');
        const statusMediaDisplay = document.getElementById('statusMediaDisplay');
        const saveHtmlBtn = document.getElementById('saveHtmlBtn');
        const saveJpgBtn = document.getElementById('saveJpgBtn');
        const resetBtn = document.getElementById('resetBtn');
        const statusCard = document.getElementById('statusCard');
        const statusMessageEl = document.getElementById('statusMessage');
        const ctaLinkInput = document.getElementById('ctaLinkInput');
        const ctaLinkWrapper = document.getElementById('ctaLinkWrapper');
        const allActionButtons = document.querySelectorAll('.toolbar-container .toolbar-button, .toolbar-container label.toolbar-button');
        const editableElements = statusCard.querySelectorAll('[contenteditable="true"]');
        const allImageInputs = document.querySelectorAll('input[type="file"]');

        // --- Initial State Storage ---
        function storeInitialState() { /* ... (logic unchanged, relies on correct data-attributes) ... */
            [profilePicDisplay, statusMediaDisplay].forEach(imgEl => { if (imgEl) { const i = imgEl.dataset.initialSrc || imgEl.src; imgEl.src = i; if (!imgEl.dataset.initialSrc) imgEl.dataset.initialSrc = i; } });
            editableElements.forEach(el => { if (typeof el.dataset.initialHtml === 'undefined') el.dataset.initialHtml = el.innerHTML; el.innerHTML = el.dataset.initialHtml; });
            if (ctaLinkWrapper) { const i = ctaLinkWrapper.dataset.initialHref || ctaLinkWrapper.getAttribute('href') || '#'; if (!ctaLinkWrapper.dataset.initialHref) ctaLinkWrapper.dataset.initialHref = i; ctaLinkWrapper.setAttribute('href', i); if (ctaLinkInput) ctaLinkInput.value = i; }
            console.log("Initial WhatsApp Status state loaded/restored.");
        }

        // --- Status Message Function ---
        let statusTimeout;
        function showStatus(message, type = 'info', duration = 4000) { /* ... (logic unchanged) ... */
            clearTimeout(statusTimeout); let i = ''; switch (type) { case 'success': i = '✅ '; break; case 'error': i = '❌ '; break; case 'loading': i = '⏳ '; break; case 'info': i = 'ℹ️ '; break; } statusMessageEl.textContent = i + message; statusMessageEl.className = `status-message ${type} show`; if (duration > 0) statusTimeout = setTimeout(() => statusMessageEl.classList.remove('show'), duration);
        }

        // --- Button State Management ---
        function disableButtons(loadingButton = null) { /* ... (logic unchanged) ... */
            allActionButtons.forEach(b => { if (b.tagName === 'BUTTON') b.disabled = !0; else if (b.tagName === 'LABEL') { b.style.pointerEvents = 'none'; b.setAttribute('aria-disabled', 'true'); } b.style.opacity = b === loadingButton ? '1' : '0.6'; if (b === loadingButton) { b.dataset.originalText = b.innerHTML; b.innerHTML = '⏳ Proses...'; } }); allImageInputs.forEach(i => i.disabled = !0); if (ctaLinkInput) ctaLinkInput.disabled = !0;
        }
        function enableButtons() { /* ... (logic unchanged) ... */
            allActionButtons.forEach(b => { if (b.tagName === 'BUTTON') b.disabled = !1; else if (b.tagName === 'LABEL') { b.style.pointerEvents = 'auto'; b.removeAttribute('aria-disabled'); } if (b.dataset.originalText) { b.innerHTML = b.dataset.originalText; delete b.dataset.originalText; } b.style.opacity = '1'; }); allImageInputs.forEach(i => i.disabled = !1); if (ctaLinkInput) ctaLinkInput.disabled = !1;
        }

        // --- Generic Image Upload Handler ---
        function handleImageUpload(event, displayElement) { /* ... (logic unchanged) ... */
            const file = event.target.files[0]; if (file && (file.type.startsWith('image/'))) { const reader = new FileReader(); reader.onload = function (e) { if (displayElement) { if (displayElement.tagName === 'IMG') { displayElement.src = e.target.result; showStatus('Media berhasil diganti.', 'success'); } } }; reader.onerror = function () { showStatus('Gagal memuat pratinjau media.', 'error'); }; reader.readAsDataURL(file); } else if (file) { showStatus('Format file tidak valid.', 'error'); } event.target.value = null;
        }

        // --- Update CTA Link ---
        function updateCtaLink() { /* ... (logic unchanged) ... */
            if (ctaLinkWrapper && ctaLinkInput) { ctaLinkWrapper.setAttribute('href', ctaLinkInput.value || '#'); }
        }

        // --- Reset Functionality ---
        function resetContent() { /* ... (logic unchanged) ... */
            if (confirm('Yakin ingin reset semua perubahan ke template awal?')) { disableButtons(resetBtn); showStatus('Mereset...', 'loading', 0); setTimeout(() => { try { storeInitialState(); showStatus('Konten berhasil direset.', 'success'); } catch (e) { console.error("Reset Error:", e); showStatus('Gagal mereset.', 'error'); } finally { enableButtons(); } }, 50); }
        }

        // --- Generate Filename ---
        function generateFilename(extension) { /* ... (logic unchanged, uses .status-advertiser-name now if needed) ... */
            const pageNameEl = statusCard.querySelector('.status-advertiser-name'); let b = 'whatsapp_status'; if (pageNameEl && pageNameEl.textContent.trim()) { b = pageNameEl.textContent.trim(); } const s = b.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30); const t = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ''); return `${s || 'status'}_${t}.${extension}`;
        }

        // --- Save HTML Functionality ---
        function saveHtml() {
            disableButtons(saveHtmlBtn);
            showStatus('Menyiapkan file HTML...', 'loading', 0);
            setTimeout(() => {
                try {
                    const statusClone = statusCard.cloneNode(true);
                    statusClone.querySelectorAll('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-initial-html'); });
                    statusClone.querySelectorAll('[data-initial-src]').forEach(el => { el.removeAttribute('data-initial-src'); });
                    statusClone.querySelectorAll('[data-initial-href]').forEach(el => { el.removeAttribute('data-initial-href'); });
                    statusClone.querySelectorAll('.image-upload-overlay').forEach(el => el.remove());

                    // Embed more comprehensive CSS directly
                    const embeddedCSS = `
        :root{--wa-white:#fff;--wa-black:#000;--wa-text-primary:#f1f3f5;--wa-text-secondary:#adb5bd;--text-shadow-strong: 1px 1px 3px rgba(0,0,0,0.6);}
        body{margin:0;background-color:#111b21;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Roboto',sans-serif;}
        .whatsapp-status-container{background-color:#000;width:97%;max-width:400px;aspect-ratio:9 / 16;border-radius:8px;overflow:hidden;position:relative;display:flex;flex-direction:column;}
        .status-header{position:absolute;top:0;left:0;width:100%;padding:12px 14px;display:flex;align-items:center;z-index:3;background:linear-gradient(to bottom,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.3) 60%,transparent 100%);}
        .status-profile-pic{width:38px;height:38px;border-radius:50%;object-fit:cover;display:block;border:2px solid var(--wa-white);margin-right:10px;}
        .status-page-info .status-advertiser-name{font-weight:500;font-size:0.95rem;color:var(--wa-white);margin-bottom:2px;text-shadow:var(--text-shadow-strong);}
        .status-page-info .status-label{font-size:0.75rem;color:var(--wa-text-secondary);text-shadow:var(--text-shadow-strong);}
        .status-media{flex-grow:1;position:relative;background-color:#111;height:100%;overflow:hidden;}
        .status-media img{display:block;width:100%;height:75%;object-fit:contain;}
        .status-text-overlay{position:absolute;bottom:65px;left:0;width:100%;padding:18px 16px 15px 16px;z-index:4;background:linear-gradient(to top,rgba(0,0,0,0.75) 10%,transparent 90%);color:var(--wa-text-primary);font-size:1rem;line-height:1.45;text-shadow:var(--text-shadow-strong);}
        .status-text-overlay p{margin:0;}
        .status-cta-area{position:absolute;bottom:0;left:0;width:100%;padding:0;text-align:center;z-index:5;}
        .status-cta-area a{padding:12px 15px;text-decoration:none;color:var(--wa-white);display:flex;flex-direction:column;align-items:center;cursor:pointer;text-shadow:var(--text-shadow-strong);}
        .status-cta-icon svg{width:20px;height:20px;fill:var(--wa-white);display:block;margin-bottom:4px;}
        .status-cta-text{font-size:0.9rem;font-weight:500;display:inline-block;letter-spacing:0.5px;}
                    `;

                    const finalHtmlContent = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Status WhatsApp Ad</title><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style>${embeddedCSS}</style></head><body>${statusClone.outerHTML}</body></html>`;
                    const blob = new Blob([finalHtmlContent], { type: 'text/html;charset=utf-8' });
                    const filename = generateFilename('html');
                    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename;
                    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
                    showStatus(`File "${filename}" (HTML) berhasil diunduh!`, 'success');
                } catch (e) { console.error('Save HTML Error:', e); showStatus('Gagal menyimpan HTML.', 'error', 6000); }
                finally { enableButtons(); }
            }, 50);
        }

        // --- Save JPG Functionality ---
        function saveJpg() { /* ... (logic unchanged) ... */
            disableButtons(saveJpgBtn); showStatus('Memproses gambar JPG...', 'loading', 0); statusCard.classList.add('is-capturing');
            setTimeout(() => {
                html2canvas(statusCard, { useCORS: true, allowTaint: true, scale: 2, logging: false, backgroundColor: '#000000' })
                    .then(canvas => { const i = canvas.toDataURL('image/jpeg', 0.92); const f = generateFilename('jpg'); const l = document.createElement('a'); l.href = i; l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l); showStatus(`File "${f}" (JPG) berhasil diunduh!`, 'success'); })
                    .catch(e => { console.error('JPG Error:', e); showStatus(`Gagal membuat JPG: ${e.message}.`, 'error', 6000); })
                    .finally(() => { statusCard.classList.remove('is-capturing'); enableButtons(); });
            }, 150);
        }

        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => { storeInitialState(); console.log("WhatsApp Status Ad Editor Initialized (Enhanced)."); });
        profilePicUploadInput.addEventListener('change', (e) => handleImageUpload(e, profilePicDisplay));
        statusMediaUploadInput.addEventListener('change', (e) => handleImageUpload(e, statusMediaDisplay));
        saveHtmlBtn.addEventListener('click', saveHtml); saveJpgBtn.addEventListener('click', saveJpg); resetBtn.addEventListener('click', resetContent);
        if (ctaLinkInput) ctaLinkInput.addEventListener('input', updateCtaLink);
        editableElements.forEach(el => { /* ... (Focus/blur listeners unchanged) ... */ el.addEventListener('focus', () => el.classList.add('editable-focus')); el.addEventListener('blur', () => el.classList.remove('editable-focus')); });


