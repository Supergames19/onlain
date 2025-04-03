
        // --- DOM Elements ---
        const productImageUploadInput = document.getElementById('productImageUpload');
        const productImageDisplay = document.getElementById('productImageDisplay');
        const saveHtmlBtn = document.getElementById('saveHtmlBtn');
        const saveJpgBtn = document.getElementById('saveJpgBtn');
        const resetBtn = document.getElementById('resetBtn');
        const shopeeAdCard = document.getElementById('shopeeAdCard'); // Target card
        const statusMessageEl = document.getElementById('statusMessage');
        const allActionButtons = document.querySelectorAll('.toolbar-container .toolbar-button, .toolbar-container label.toolbar-button');
        // Update selector to include new editable elements
        const editableElements = shopeeAdCard.querySelectorAll('[contenteditable="true"]');
        const allImageInputs = document.querySelectorAll('input[type="file"]');

        // --- Initial State Storage ---
        function storeInitialState() {
            // Store/Restore Image
            if (productImageDisplay) { const i = productImageDisplay.dataset.initialSrc || productImageDisplay.src; productImageDisplay.src = i; if (!productImageDisplay.dataset.initialSrc) productImageDisplay.dataset.initialSrc = i; }
            // Store/Restore all contenteditable HTML
            editableElements.forEach(el => {
                if (typeof el.dataset.initialHtml === 'undefined') {
                    el.dataset.initialHtml = el.innerHTML; // Store initial HTML only once
                }
                el.innerHTML = el.dataset.initialHtml; // Restore from stored initial HTML
            });
            console.log("Initial Shopee Ad state loaded/restored.");
        }

        // --- Status Message ---
        let statusTimeout; function showStatus(m, t = 'info', d = 4000) { clearTimeout(statusTimeout); let i = ''; switch (t) { case 'success': i = '✅ '; break; case 'error': i = '❌ '; break; case 'loading': i = '⏳ '; break; case 'info': i = 'ℹ️ '; break; }statusMessageEl.textContent = i + m; statusMessageEl.className = `status-message ${t} show`; if (d > 0) statusTimeout = setTimeout(() => statusMessageEl.classList.remove('show'), d); }

        // --- Button State ---
        function disableButtons(l = null) { allActionButtons.forEach(b => { let isLabel = b.tagName === 'LABEL'; if (!isLabel) b.disabled = !0; else { b.style.pointerEvents = 'none'; b.setAttribute('aria-disabled', 'true'); } b.style.opacity = b === l ? '1' : '0.6'; if (b === l && !isLabel) { b.dataset.originalText = b.textContent; b.textContent = '⏳ Proses...'; } else if (b === l && isLabel) { b.dataset.originalText = b.innerHTML; b.innerHTML = '⏳ Proses...'; } }); allImageInputs.forEach(i => i.disabled = !0); }
        function enableButtons() { allActionButtons.forEach(b => { let isLabel = b.tagName === 'LABEL'; if (!isLabel) b.disabled = !1; else { b.style.pointerEvents = 'auto'; b.removeAttribute('aria-disabled'); } if (b.dataset.originalText) { if (!isLabel) b.textContent = b.dataset.originalText; else b.innerHTML = b.dataset.originalText; delete b.dataset.originalText; } b.style.opacity = '1'; }); allImageInputs.forEach(i => i.disabled = !1); }

        // --- Image Upload ---
        function handleImageUpload(event, displayElement) { const f = event.target.files[0]; if (f && f.type.startsWith('image/')) { const r = new FileReader(); r.onload = function (e) { if (displayElement && displayElement.tagName === 'IMG') { displayElement.src = e.target.result; showStatus('Gambar produk diganti.', 'success'); } }; r.onerror = function () { showStatus('Gagal memuat pratinjau.', 'error'); }; r.readAsDataURL(f); } else if (f) { showStatus('Format file tidak valid.', 'error'); } event.target.value = null; }

        // --- Reset ---
        function resetContent() { if (confirm('Yakin reset semua ke template awal?')) { disableButtons(resetBtn); showStatus('Mereset...', 'loading', 0); setTimeout(() => { try { storeInitialState(); showStatus('Konten direset.', 'success'); } catch (e) { console.error("Reset Error:", e); showStatus('Gagal mereset.', 'error'); } finally { enableButtons(); } }, 50); } }

        // --- Filename ---
        function generateFilename(ext) { const n = shopeeAdCard.querySelector('.shopee-ad-name'); let b = 'shopee_produk'; if (n && n.textContent.trim()) { b = n.textContent.trim().substring(0, 50); } /* Limit length */ const s = b.replace(/[^a-z0-9]/gi, '_').toLowerCase(); const t = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ''); return `${s || 'produk'}_${t}.${ext}`; }

        // --- Save HTML ---
        function saveHtml() {
            disableButtons(saveHtmlBtn); showStatus('Menyiapkan file HTML...', 'loading', 0);
            setTimeout(() => {
                try {
                    const cardClone = shopeeAdCard.cloneNode(true);
                    // Clean the clone
                    cardClone.querySelectorAll('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-initial-html'); });
                    cardClone.querySelectorAll('[data-initial-src]').forEach(el => { el.removeAttribute('data-initial-src'); });
                    cardClone.querySelectorAll('.image-upload-overlay').forEach(el => el.remove());
                    cardClone.classList.remove('is-capturing'); // Ensure this class is removed if somehow present
                    // Remove empty badges from final HTML
                    cardClone.querySelectorAll('.seller-badge:empty').forEach(badge => badge.remove());

                    // Embed necessary CSS (including new styles) - Simplified example, copy relevant styles
                    const embeddedCSS = `
        /* --- Copy ALL relevant styles from <style> tag here --- */
        /* --- Make sure to include styles for: --- */
        /* :root variables, body basic, .shopee-ad-container, .shopee-ad-media, */
        /* .sponsored-tag, .discount-tag, .seller-badges, .seller-badge, */
        /* .shopee-ad-content, .shopee-ad-name, .shopee-ad-price-row, */
        /* .current-price, .currency, .original-price, .shopee-ad-info-row, */
        /* .rating-section, .star-icon, .rating-text, .count, .units-sold, .shop-location */
        /* --- Example Snippet (REPLACE WITH FULL STYLES) --- */
        :root{--shopee-orange:#EE4D2D;--shopee-red-discount:#f04c59;--shopee-red-mall:#d0011b;--shopee-gold-star:#FFCE3D;--shopee-orange-star-seller:#f57c0f;--shopee-card-bg:#fff;--shopee-border:#e8e8e8;--shopee-text-primary:rgba(0,0,0,0.87);--shopee-text-secondary:rgba(0,0,0,0.54);--shopee-text-light:rgba(0,0,0,0.4);--shopee-text-white:#fff;}
        body{margin:0;background-color:#f5f5f5;padding:20px;display:flex;justify-content:center;align-items:flex-start;font-family:'Roboto',sans-serif;}
        .shopee-ad-container{background-color:var(--shopee-card-bg);border:1px solid var(--shopee-border);border-radius:4px;width:100%;max-width:200px;font-size:12px;overflow:hidden;display:flex;flex-direction:column;position:relative;}
        .shopee-ad-media{position:relative;width:100%;aspect-ratio:1 / 1;background-color:#f9f9f9;overflow:hidden;}
        .shopee-ad-media img{display:block;width:100%;height:100%;object-fit: contain;}
        .sponsored-tag{position:absolute;top:6px;left:6px;background-color:rgba(0,0,0,0.25);color:white;font-size:9px;font-weight:500;padding:2px 4px;border-radius:2px;z-index:2;text-transform:capitalize;}
        .discount-tag{position:absolute;top:0;right:0;background-color:var(--shopee-red-discount);color:white;font-size:10px;font-weight:700;padding:3px 4px 2px 4px;text-align:center;z-index:2;min-width:38px;border-bottom-left-radius:3px;}
        .discount-tag .percent{font-size:11px;display:block;line-height:1;font-weight:700;} .discount-tag .off{font-size:8px;display:block;line-height:1;text-transform:uppercase;}
        .seller-badges{position:absolute;top:8px;left:8px;z-index:3;display:flex;gap:4px;}
        .seller-badge{color:var(--shopee-text-white);font-size:9px;font-weight:500;padding:1px 4px;border-radius:2px;line-height:1.2;display:inline-block;}
        .seller-badge.mall{background-color:var(--shopee-red-mall);} .seller-badge.star{background-color:var(--shopee-orange-star-seller);}
        .seller-badge:empty{display:none;}
        .shopee-ad-content{padding:8px;flex-grow:1;display:flex;flex-direction:column;}
        .shopee-ad-name{font-size:12px;color:var(--shopee-text-primary);line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;margin-bottom:4px;min-height:calc(1.35em * 2);}
        .shopee-ad-price-row{display:flex;align-items:baseline;gap:5px;margin-bottom:5px;}
        .current-price{color:var(--shopee-orange);font-size:14px;font-weight:500;line-height:1;display:inline-flex;align-items:baseline;}
        .current-price .currency{font-size:10px;font-weight:400;margin-right:1px;vertical-align:baseline;}
        .original-price{color:var(--shopee-text-light);font-size:10px;text-decoration:line-through;line-height:1;display:inline-flex;align-items:baseline;}
        .original-price .currency{font-size:9px;margin-right:1px;}
        .shopee-ad-info-row{display:flex;justify-content:space-between;align-items:center;margin-top:auto;margin-bottom:4px;color:var(--shopee-text-secondary);font-size:10px;gap:5px;}
        .rating-section{display:flex;align-items:center;gap:2px;}
        .star-icon{width:10px;height:10px;display:inline-block;vertical-align:middle;margin-bottom:1px;fill:var(--shopee-gold-star);}
        .rating-text{display:inline-flex;align-items:center;gap:2px;}
        .rating-text .count{color:var(--shopee-text-light);}
        .units-sold{white-space:nowrap;}
        .shop-location{color:var(--shopee-text-secondary);font-size:10px;}
        /* --- End of necessary styles --- */
                    `;
                    const finalHtml = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Iklan Shopee - ${cardClone.querySelector('.shopee-ad-name')?.textContent?.substring(0, 30) || 'Produk'}</title><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style>${embeddedCSS}</style></head><body>${cardClone.outerHTML}</body></html>`;
                    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' }); const f = generateFilename('html'); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l); URL.revokeObjectURL(l.href); showStatus(`File "${f}" (HTML) berhasil diunduh!`, 'success');
                } catch (e) { console.error('Save HTML Error:', e); showStatus('Gagal menyimpan HTML.', 'error', 6000); }
                finally { enableButtons(); }
            }, 50);
        }

        // --- Save JPG ---
        function saveJpg() {
            disableButtons(saveJpgBtn); showStatus('Memproses gambar JPG...', 'loading', 0);
            // Ensure any focused element is blurred to remove focus styles before capture
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            shopeeAdCard.classList.add('is-capturing');

            setTimeout(() => {
                html2canvas(shopeeAdCard, {
                    useCORS: true, allowTaint: true, scale: 3, // Increased scale for sharpness
                    logging: false, backgroundColor: null, // Use transparent bg for canvas stage
                    removeContainer: true // Try to cleanup temporary container
                })
                    .then(canvas => {
                        // Create a new canvas to draw with white background if needed
                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = canvas.width;
                        finalCanvas.height = canvas.height;
                        const ctx = finalCanvas.getContext('2d');
                        ctx.fillStyle = '#ffffff'; // Set white background
                        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                        ctx.drawImage(canvas, 0, 0); // Draw the captured canvas onto the white background

                        const i = finalCanvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
                        const f = generateFilename('jpg');
                        const l = document.createElement('a');
                        l.href = i; l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l);
                        showStatus(`File "${f}" (JPG) berhasil diunduh!`, 'success');
                    })
                    .catch(e => { console.error('JPG Error:', e); showStatus(`Gagal membuat JPG: ${e.message}.`, 'error', 6000); })
                    .finally(() => {
                        shopeeAdCard.classList.remove('is-capturing');
                        enableButtons();
                    });
            }, 200); // Slightly increased delay for complex DOM/CSS render
        }

        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            storeInitialState();
            console.log("Shopee Ad Editor (Pro) Initialized.");
            // Add input listener to hide empty badges dynamically
            editableElements.forEach(el => {
                if (el.classList.contains('seller-badge')) {
                    el.addEventListener('input', () => {
                        if (el.textContent.trim() === '') {
                            el.style.display = 'none';
                        } else {
                            el.style.display = 'inline-block'; // Or original display type
                        }
                    });
                    // Initial check
                    if (el.textContent.trim() === '') el.style.display = 'none';
                }
            });
        });
        productImageUploadInput.addEventListener('change', (e) => handleImageUpload(e, productImageDisplay));
        saveHtmlBtn.addEventListener('click', saveHtml);
        saveJpgBtn.addEventListener('click', saveJpg);
        resetBtn.addEventListener('click', resetContent);
        editableElements.forEach(el => {
            el.addEventListener('focus', () => el.classList.add('editable-focus'));
            el.addEventListener('blur', () => el.classList.remove('editable-focus'));
            // Prevent pasting rich text
            el.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        });

