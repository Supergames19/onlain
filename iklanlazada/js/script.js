// --- DOM Elements ---
const productImageUploadInput = document.getElementById('productImageUpload');
const productImageDisplay = document.getElementById('productImageDisplay');
const saveHtmlBtn = document.getElementById('saveHtmlBtn');
const saveJpgBtn = document.getElementById('saveJpgBtn');
const resetBtn = document.getElementById('resetBtn');
const lazadaAdCard = document.getElementById('lazadaAdCard'); // Target card by ID
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

        // Handle display of badges based on restored content
        if (el.classList.contains('laz-badge')) {
            if (el.innerHTML.trim() === '') {
                el.style.display = 'none'; // Hide if empty
            } else {
                el.style.display = ''; // Reset display if it has content (block/inline-block set by CSS)
            }
        }
    });
    console.log("Initial Lazada Ad state loaded/restored.");
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
            // Remove empty badges from final HTML just before saving
            cardClone.querySelectorAll('.laz-badge:empty').forEach(badge => badge.remove());

            // --- Embed ALL necessary Lazada CSS ---
            // **IMPORTANT**: Keep this CSS block synchronized with the relevant parts of style.css
            const embeddedCSS = `
        :root{--lazada-blue:#0F146D;--lazada-orange:#F57224;--lazada-red:#D32F2F;--lazada-lazmall-purple:#9E1A84;--lazada-free-shipping-green:#1DB954;--lazada-gold-star:#FFC107;--lazada-bg:#f5f5f5;--lazada-card-bg:#fff;--lazada-border:#e0e0e0;--lazada-text-primary:#212121;--lazada-text-secondary:#757575;--lazada-text-light:#bdbdbd;--lazada-text-white:#fff;--lazada-discount-text:var(--lazada-red);}
        body{margin:0;background-color:var(--lazada-bg);padding:20px;display:flex;justify-content:center;align-items:flex-start;font-family:'Roboto',sans-serif;font-size:12px;}
        .lazada-ad-container{background-color:var(--lazada-card-bg);border:1px solid var(--lazada-border);border-radius:4px;width:100%;max-width:200px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,0.05);font-size:12px;}
        .lazada-ad-media{position:relative;width:100%;aspect-ratio:1 / 1;background-color:#fafafa;overflow:hidden;}
        .lazada-ad-media img{display:block;width:100%;height:100%;object-fit:contain;}
        .laz-badge{position:absolute;font-size:9px;font-weight:500;color:var(--lazada-text-white);padding:2px 5px;border-radius:2px;line-height:1.2;z-index:2;text-align:center;background-clip:padding-box;}
        .laz-badge:empty{display:none !important;}
        .laz-badge.lazmall{top:8px;left:8px;background-color:var(--lazada-lazmall-purple);}
        .laz-badge.discount-perc{top:8px;right:8px;background-color:var(--lazada-orange);min-width:30px;}
        .laz-badge.free-shipping{bottom:8px;left:8px;background-color:var(--lazada-free-shipping-green);}
        .lazada-ad-content{padding:8px;flex-grow:1;display:flex;flex-direction:column;gap:6px;}
        .lazada-ad-name{font-size:12px;color:var(--lazada-text-primary);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;min-height:calc(12px * 1.4 * 2);}
        .lazada-ad-price-row{line-height:1;}
        .current-price{color:var(--lazada-orange);font-size:16px;font-weight:500;display:inline-flex;align-items:baseline;}
        .current-price .currency{font-size:11px;font-weight:400;margin-right:2px;align-self:baseline;}
        .price-details{display:flex;align-items:baseline;gap:5px;margin-top:2px;flex-wrap:wrap;}
        .original-price{color:var(--lazada-text-light);font-size:11px;text-decoration:line-through;display:inline-flex;align-items:baseline;}
        .original-price .currency{font-size:9px;margin-right:1px;}
        .discount-text{font-size:11px;color:var(--lazada-discount-text);font-weight:500;}
        .lazada-ad-info-row{display:flex;justify-content:space-between;align-items:center;margin-top:auto;color:var(--lazada-text-secondary);font-size:10px;gap:4px;flex-wrap:wrap;line-height:1.2;}
        .rating-section{display:flex;align-items:center;gap:2px;flex-shrink:0;}
        .star-icon{width:11px;height:11px;display:inline-block;vertical-align:middle;fill:var(--lazada-gold-star);}
        .rating-count{color:var(--lazada-text-light);margin-left:2px;}
        .shop-info{display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex-shrink:1;}
        .units-sold{color:var(--lazada-text-secondary);}
        .shop-location{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* Basic SVG fill if needed, though handled inline/via class better */
        svg path { fill: currentColor; }
            `;
            const titleProductName = cardClone.querySelector('.lazada-ad-name')?.textContent?.substring(0, 30).trim() || 'Produk';
            const finalHtml = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Iklan Lazada - ${titleProductName}</title><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style>${embeddedCSS.replace(/\s+/g, ' ').trim()}</style></head><body>${cardClone.outerHTML}</body></html>`; // Minify CSS slightly
            const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' }); const f = generateFilename('html'); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l); URL.revokeObjectURL(l.href); showStatus(`File "${f}" (HTML) berhasil diunduh!`, 'success');
        } catch (e) { console.error('Save HTML Error:', e); showStatus('Gagal menyimpan HTML.', 'error', 6000); }
        finally { enableButtons(); }
    }, 50);
}

// --- Save JPG ---
function saveJpg() {
    disableButtons(saveJpgBtn); showStatus('Memproses gambar JPG...', 'loading', 0);

    // Blur active element to prevent focus styles in capture
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }

    lazadaAdCard.classList.add('is-capturing'); // Add capture class

    setTimeout(() => { // Delay allows styles to apply
        html2canvas(lazadaAdCard, { // Target the correct card element
            useCORS: true,
            allowTaint: true,
            scale: 3, // Increase scale for higher resolution
            logging: false,
            backgroundColor: null, // Capture with transparency first
            removeContainer: true // Clean up temporary container used by html2canvas
        })
            .then(canvas => {
                // Create a new canvas with a white background
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = canvas.width;
                finalCanvas.height = canvas.height;
                const ctx = finalCanvas.getContext('2d');

                // Fill the background with white
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                // Draw the captured canvas onto the white background
                ctx.drawImage(canvas, 0, 0);

                // Convert the final canvas to JPG
                const image = finalCanvas.toDataURL('image/jpeg', 0.95); // Quality 0.95
                const filename = generateFilename('jpg');
                const link = document.createElement('a');
                link.href = image;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showStatus(`File "${filename}" (JPG) berhasil diunduh!`, 'success');
            })
            .catch(e => {
                console.error('JPG Capture Error:', e);
                showStatus(`Gagal membuat JPG: ${e.message}. Coba refresh.`, 'error', 6000);
            })
            .finally(() => {
                lazadaAdCard.classList.remove('is-capturing'); // Remove capture class
                enableButtons();
            });
    }, 200); // Increased delay slightly
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    storeInitialState(); // Call initial state setup
    console.log("Lazada Ad Editor Initialized.");

    // Add input listener to hide/show empty badges dynamically
    editableElements.forEach(el => {
        if (el.classList.contains('laz-badge')) {
            el.addEventListener('input', () => {
                // Check content after potential spaces are trimmed
                if (el.textContent.trim() === '') {
                    el.style.display = 'none'; // Hide if effectively empty
                } else {
                    el.style.display = ''; // Reset display style (CSS handles block/inline-block)
                }
            });
        }
    });
});

productImageUploadInput.addEventListener('change', (e) => handleImageUpload(e, productImageDisplay));
saveHtmlBtn.addEventListener('click', saveHtml);
saveJpgBtn.addEventListener('click', saveJpg);
resetBtn.addEventListener('click', resetContent);

// Add focus/blur and paste listeners to ALL editable elements
editableElements.forEach(el => {
    el.addEventListener('focus', () => el.classList.add('editable-focus')); // Optional: class for styling focus state
    el.addEventListener('blur', () => el.classList.remove('editable-focus'));
    // Prevent pasting rich text, insert plain text instead
    el.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    });
});
