
        // --- DOM Elements ---
        const productImageUploadInput = document.getElementById('productImageUpload');
        const productImageDisplay = document.getElementById('productImageDisplay');
        const saveHtmlBtn = document.getElementById('saveHtmlBtn');
        const saveJpgBtn = document.getElementById('saveJpgBtn');
        const resetBtn = document.getElementById('resetBtn');
        const lazadaAdCard = document.getElementById('lazadaAdCard'); // Target card by NEW ID
        const statusMessageEl = document.getElementById('statusMessage');
        const allActionButtons = document.querySelectorAll('.toolbar-container .toolbar-button, .toolbar-container label.toolbar-button');
        // Update selector for ALL editable elements in the Lazada card
        const editableElements = lazadaAdCard.querySelectorAll('[contenteditable="true"]');
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
                // Ensure initial empty badges are hidden
                if (el.classList.contains('laz-badge') && el.innerHTML.trim() === '') {
                    el.style.display = 'none';
                } else if (el.classList.contains('laz-badge')) {
                    el.style.display = ''; // Reset display if it has content
                }
            });
            console.log("Initial Lazada Ad state loaded/restored.");
        }

        // --- Status Message --- (No changes needed)
        let statusTimeout; function showStatus(m, t = 'info', d = 4000) { clearTimeout(statusTimeout); let i = ''; switch (t) { case 'success': i = '✅ '; break; case 'error': i = '❌ '; break; case 'loading': i = '⏳ '; break; case 'info': i = 'ℹ️ '; break; }statusMessageEl.textContent = i + m; statusMessageEl.className = `status-message ${t} show`; if (d > 0) statusTimeout = setTimeout(() => statusMessageEl.classList.remove('show'), d); }

        // --- Button State --- (No changes needed)
        function disableButtons(l = null) { allActionButtons.forEach(b => { let isLabel = b.tagName === 'LABEL'; if (!isLabel) b.disabled = !0; else { b.style.pointerEvents = 'none'; b.setAttribute('aria-disabled', 'true'); } b.style.opacity = b === l ? '1' : '0.6'; if (b === l && !isLabel) { b.dataset.originalText = b.textContent; b.textContent = '⏳ Proses...'; } else if (b === l && isLabel) { b.dataset.originalText = b.innerHTML; b.innerHTML = '⏳ Proses...'; } }); allImageInputs.forEach(i => i.disabled = !0); }
        function enableButtons() { allActionButtons.forEach(b => { let isLabel = b.tagName === 'LABEL'; if (!isLabel) b.disabled = !1; else { b.style.pointerEvents = 'auto'; b.removeAttribute('aria-disabled'); } if (b.dataset.originalText) { if (!isLabel) b.textContent = b.dataset.originalText; else b.innerHTML = b.dataset.originalText; delete b.dataset.originalText; } b.style.opacity = '1'; }); allImageInputs.forEach(i => i.disabled = !1); }

        // --- Image Upload --- (No changes needed)
        function handleImageUpload(event, displayElement) { const f = event.target.files[0]; if (f && f.type.startsWith('image/')) { const r = new FileReader(); r.onload = function (e) { if (displayElement && displayElement.tagName === 'IMG') { displayElement.src = e.target.result; showStatus('Gambar produk diganti.', 'success'); } }; r.onerror = function () { showStatus('Gagal memuat pratinjau.', 'error'); }; r.readAsDataURL(f); } else if (f) { showStatus('Format file tidak valid.', 'error'); } event.target.value = null; }

        // --- Reset --- (No changes needed, relies on storeInitialState)
        function resetContent() { if (confirm('Yakin reset semua ke template awal?')) { disableButtons(resetBtn); showStatus('Mereset...', 'loading', 0); setTimeout(() => { try { storeInitialState(); showStatus('Konten direset.', 'success'); } catch (e) { console.error("Reset Error:", e); showStatus('Gagal mereset.', 'error'); } finally { enableButtons(); } }, 50); } }

        // --- Filename ---
        function generateFilename(ext) { const n = lazadaAdCard.querySelector('.lazada-ad-name'); let b = 'lazada_product'; if (n && n.textContent.trim()) { b = n.textContent.trim().substring(0, 50); } const s = b.replace(/[^a-z0-9]/gi, '_').toLowerCase(); const t = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ''); return `${s || 'produk'}_${t}.${ext}`; }

        // --- Save HTML ---
        function saveHtml() {
            disableButtons(saveHtmlBtn); showStatus('Menyiapkan file HTML...', 'loading', 0);
            setTimeout(() => {
                try {
                    const cardClone = lazadaAdCard.cloneNode(true);
                    // Clean the clone
                    cardClone.querySelectorAll('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-initial-html'); });
                    cardClone.querySelectorAll('[data-initial-src]').forEach(el => { el.removeAttribute('data-initial-src'); });
                    cardClone.querySelectorAll('.image-upload-overlay').forEach(el => el.remove());
                    cardClone.classList.remove('is-capturing');
                    // Remove empty badges from final HTML
                    cardClone.querySelectorAll('.laz-badge:empty').forEach(badge => badge.remove());

                    // --- CRITICAL: Embed ALL necessary Lazada CSS ---
                    const embeddedCSS = `
        /* --- Copy ALL relevant styles from <style> tag here --- */
        /* --- Include: :root vars, body, .lazada-ad-container, .lazada-ad-media, */
        /* .laz-badge (all types), .lazada-ad-content, .lazada-ad-name, */
        /* .lazada-ad-price-row, .current-price, .price-details, .original-price, */
        /* .discount-text, .lazada-ad-info-row, .rating-section, .star-icon, */
        /* .rating-count, .shop-info, .units-sold, .shop-location */
        /* --- Example Snippet (REPLACE WITH FULL STYLES) --- */
        :root{--lazada-blue:#0F146D;--lazada-orange:#F57224;--lazada-red:#D32F2F;--lazada-lazmall-purple:#9E1A84;--lazada-free-shipping-green:#1DB954;--lazada-gold-star:#FFC107;--lazada-bg:#f5f5f5;--lazada-card-bg:#fff;--lazada-border:#e0e0e0;--lazada-text-primary:#212121;--lazada-text-secondary:#757575;--lazada-text-light:#bdbdbd;--lazada-text-white:#fff;--lazada-discount-bg:#ffebee;--lazada-discount-text:var(--lazada-red);}
        body{margin:0;background-color:var(--lazada-bg);padding:20px;display:flex;justify-content:center;align-items:flex-start;font-family:'Roboto',sans-serif; font-size: 12px;}
        .lazada-ad-container{background-color:var(--lazada-card-bg);border:1px solid var(--lazada-border);border-radius:4px;width:100%;max-width:200px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,0.05);}
        .lazada-ad-media{position:relative;width:100%;aspect-ratio:1 / 1;background-color:#fafafa;overflow:hidden;}
        .lazada-ad-media img{display:block;width:100%;height:100%;object-fit: contain;}
        .laz-badge{position:absolute;font-size:9px;font-weight:500;color:var(--lazada-text-white);padding:2px 5px;border-radius:2px;line-height:1.2;z-index:2;text-align:center;}
        .laz-badge:empty{display:none;}
        .laz-badge.lazmall{top:8px;left:8px;background-color:var(--lazada-lazmall-purple);}
        .laz-badge.discount-perc{top:8px;right:8px;background-color:var(--lazada-orange);min-width:30px;}
        .laz-badge.free-shipping{bottom:8px;left:8px;background-color:var(--lazada-free-shipping-green);}
        .lazada-ad-content{padding:8px;flex-grow:1;display:flex;flex-direction:column;}
        .lazada-ad-name{font-size:12px;color:var(--lazada-text-primary);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;margin-bottom:6px;min-height:calc(1.4em * 2);}
        .lazada-ad-price-row{margin-bottom:6px;}
        .current-price{color:var(--lazada-orange);font-size:16px;font-weight:500;line-height:1;display:inline-flex;align-items:baseline;}
        .current-price .currency{font-size:11px;font-weight:400;margin-right:2px;vertical-align:baseline;}
        .price-details{display:flex;align-items:baseline;gap:5px;margin-top:2px;}
        .original-price{color:var(--lazada-text-light);font-size:11px;text-decoration:line-through;line-height:1;display:inline-flex;align-items:baseline;}
        .original-price .currency{font-size:9px;margin-right:1px;}
        .discount-text{font-size:11px;color:var(--lazada-discount-text);font-weight:500;}
        .lazada-ad-info-row{display:flex;align-items:center;margin-top:auto;color:var(--lazada-text-secondary);font-size:10px;gap:6px;flex-wrap:wrap;}
        .rating-section{display:flex;align-items:center;gap:3px;}
        .star-icon{width:11px;height:11px;display:inline-block;vertical-align:middle;margin-bottom:1px;fill:var(--lazada-gold-star);}
        .rating-count{color:var(--lazada-text-light);}
        .shop-info{display:flex;align-items:center;gap:4px;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;min-width:0;}
        .units-sold{color:var(--lazada-text-secondary);}
        .shop-location{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* --- End of necessary styles --- */
                    `;
                    const titleProductName = cardClone.querySelector('.lazada-ad-name')?.textContent?.substring(0, 30) || 'Produk';
                    const finalHtml = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Iklan Lazada - ${titleProductName}</title><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style>${embeddedCSS}</style></head><body>${cardClone.outerHTML}</body></html>`;
                    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' }); const f = generateFilename('html'); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l); URL.revokeObjectURL(l.href); showStatus(`File "${f}" (HTML) berhasil diunduh!`, 'success');
                } catch (e) { console.error('Save HTML Error:', e); showStatus('Gagal menyimpan HTML.', 'error', 6000); }
                finally { enableButtons(); }
            }, 50);
        }

        // --- Save JPG --- (Logic remains similar, ensure target and classes are right)
        function saveJpg() {
            disableButtons(saveJpgBtn); showStatus('Memproses gambar JPG...', 'loading', 0);
            // Blur active element
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            lazadaAdCard.classList.add('is-capturing'); // Use the correct card element

            setTimeout(() => {
                html2canvas(lazadaAdCard, { // Target the correct card element
                    useCORS: true, allowTaint: true, scale: 3,
                    logging: false, backgroundColor: null, // Keep transparent bg for canvas stage
                    removeContainer: true
                })
                    .then(canvas => {
                        // Draw onto white background canvas
                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = canvas.width;
                        finalCanvas.height = canvas.height;
                        const ctx = finalCanvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                        ctx.drawImage(canvas, 0, 0);

                        const i = finalCanvas.toDataURL('image/jpeg', 0.95);
                        const f = generateFilename('jpg');
                        const l = document.createElement('a');
                        l.href = i; l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l);
                        showStatus(`File "${f}" (JPG) berhasil diunduh!`, 'success');
                    })
                    .catch(e => { console.error('JPG Error:', e); showStatus(`Gagal membuat JPG: ${e.message}.`, 'error', 6000); })
                    .finally(() => {
                        lazadaAdCard.classList.remove('is-capturing'); // Use the correct card element
                        enableButtons();
                    });
            }, 200);
        }

        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            storeInitialState(); // Call initial state setup
            console.log("Lazada Ad Editor Initialized.");
            // Add input listener to hide empty badges dynamically
            editableElements.forEach(el => {
                if (el.classList.contains('laz-badge')) { // Target Lazada badges
                    el.addEventListener('input', () => {
                        if (el.textContent.trim() === '') {
                            el.style.display = 'none';
                        } else {
                            el.style.display = ''; // Reset display style
                        }
                    });
                    // Initial check done in storeInitialState now
                }
            });
        });
        productImageUploadInput.addEventListener('change', (e) => handleImageUpload(e, productImageDisplay));
        saveHtmlBtn.addEventListener('click', saveHtml);
        saveJpgBtn.addEventListener('click', saveJpg);
        resetBtn.addEventListener('click', resetContent);
        // Add focus/blur and paste listeners to NEW editable elements
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

    
