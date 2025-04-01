
        document.addEventListener('DOMContentLoaded', () => {
            // --- Referensi Elemen ---
            const imageUpload = document.getElementById('image-upload'); // Added back
            const devicePhoto = document.getElementById('device-photo'); // Added back
            const saveHtmlBtn = document.getElementById('save-html-btn');
            const saveJpgBtn = document.getElementById('save-jpg-btn');
            const savePngBtn = document.getElementById('save-png-btn');
            const receiptContainer = document.getElementById('receipt-container');
            const providerCanvas = document.getElementById('provider-signature-pad');
            const customerCanvas = document.getElementById('customer-signature-pad');
            const clearProviderBtn = document.getElementById('clear-provider-sig');
            const clearCustomerBtn = document.getElementById('clear-customer-sig');
            const allSaveButtons = [saveHtmlBtn, saveJpgBtn, savePngBtn];

            let providerSignaturePad, customerSignaturePad;

            // --- Inisialisasi Signature Pad ---
            // (resizeCanvas and initializeSignaturePads functions are the same as previous version)
            function resizeCanvas(canvas) { if (!canvas) return; const ratio = Math.max(window.devicePixelRatio || 1, 1); const context = canvas.getContext("2d"); canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio; context.scale(ratio, ratio); context.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio); }
            function initializeSignaturePads() { if (typeof SignaturePad === 'undefined') { console.error("Signature Pad library not loaded!"); alert("Gagal memuat fitur tanda tangan."); clearProviderBtn.disabled = true; clearCustomerBtn.disabled = true; return; } try { resizeCanvas(providerCanvas); resizeCanvas(customerCanvas); providerSignaturePad = new SignaturePad(providerCanvas, { backgroundColor: 'rgba(255, 255, 255, 0)', penColor: "rgb(0, 0, 100)" }); customerSignaturePad = new SignaturePad(customerCanvas, { backgroundColor: 'rgba(255, 255, 255, 0)', penColor: "rgb(0, 0, 0)" }); clearProviderBtn.addEventListener('click', () => providerSignaturePad?.clear()); clearCustomerBtn.addEventListener('click', () => customerSignaturePad?.clear()); let resizeTimeout; window.addEventListener("resize", () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { const providerData = providerSignaturePad?.toData(); const customerData = customerSignaturePad?.toData(); resizeCanvas(providerCanvas); resizeCanvas(customerCanvas); if (providerSignaturePad && providerData?.length > 0) providerSignaturePad.fromData(providerData); else providerSignaturePad?.clear(); if (customerSignaturePad && customerData?.length > 0) customerSignaturePad.fromData(customerData); else customerSignaturePad?.clear(); }, 250); }); } catch (error) { console.error("Gagal menginisialisasi Signature Pad:", error); alert("Gagal memuat fitur tanda tangan: " + error.message); clearProviderBtn.disabled = true; clearCustomerBtn.disabled = true; } }
            setTimeout(initializeSignaturePads, 150);

            // --- Ganti Gambar Logic (Added Back) ---
            imageUpload.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        devicePhoto.src = e.target.result;
                        devicePhoto.style.minHeight = 'auto'; // Adjust min-height after loading
                    };
                    reader.onerror = function (e) {
                        console.error("Error reading file:", e);
                        alert("Gagal membaca file gambar.");
                    };
                    reader.readAsDataURL(file);
                }
            });

            // --- Helper: Get Clean HTML (Updated: Re-added image handling) ---
            function getCleanedHtmlForSave(element, providerSigDataUrl, customerSigDataUrl) {
                const clonedElement = element.cloneNode(true);
                const editables = clonedElement.querySelectorAll('[contenteditable="true"]');
                editables.forEach(el => {
                    el.removeAttribute('contenteditable');
                    el.style.removeProperty('border'); el.style.removeProperty('box-shadow');
                    el.style.removeProperty('background-color'); el.style.removeProperty('outline');
                    el.style.removeProperty('cursor');
                });

                // Signature handling (same as before)
                const providerWrapper = clonedElement.querySelector('#provider-signature-pad')?.closest('.signature-wrapper');
                if (providerWrapper) { if (providerSigDataUrl) { const img = document.createElement('img'); img.src = providerSigDataUrl; img.alt = "Tanda Tangan Penyedia Jasa"; img.className = "signature-image"; img.style.cssText = "max-width:100%;height:auto;display:block;margin:0 auto;"; providerWrapper.parentNode.replaceChild(img, providerWrapper); } else { const p = document.createElement('div'); p.className = 'signature-placeholder'; p.textContent = '( Belum ditandatangani )'; providerWrapper.parentNode.replaceChild(p, providerWrapper); } clonedElement.querySelector('#clear-provider-sig')?.remove(); }
                const customerWrapper = clonedElement.querySelector('#customer-signature-pad')?.closest('.signature-wrapper');
                if (customerWrapper) { if (customerSigDataUrl) { const img = document.createElement('img'); img.src = customerSigDataUrl; img.alt = "Tanda Terima Konsumen"; img.className = "signature-image"; img.style.cssText = "max-width:100%;height:auto;display:block;margin:0 auto;"; customerWrapper.parentNode.replaceChild(img, customerWrapper); } else { const p = document.createElement('div'); p.className = 'signature-placeholder'; p.textContent = '( Belum ditandatangani )'; customerWrapper.parentNode.replaceChild(p, customerWrapper); } clonedElement.querySelector('#clear-customer-sig')?.remove(); }

                // Image handling (ensure src is correct in clone)
                const imgElement = clonedElement.querySelector('#device-photo');
                if (imgElement) {
                    imgElement.src = devicePhoto.src; // Use the current live src
                    // Optionally remove border/padding added for display if not desired in final HTML
                    // imgElement.style.removeProperty('border');
                    // imgElement.style.removeProperty('padding');
                }

                clonedElement.style.removeProperty('box-shadow');
                return clonedElement.innerHTML;
            }

            // --- Fungsi Simpan sebagai HTML (Updated: Re-added image CSS reference) ---
            saveHtmlBtn.addEventListener('click', function () {
                const buttonElement = this; const originalButtonText = buttonElement.textContent;
                buttonElement.disabled = true; buttonElement.textContent = 'Menyimpan HTML...';
                try {
                    const providerSigDataUrl = providerSignaturePad && !providerSignaturePad.isEmpty() ? providerSignaturePad.toDataURL('image/png') : null;
                    const customerSigDataUrl = customerSignaturePad && !customerSignaturePad.isEmpty() ? customerSignaturePad.toDataURL('image/png') : null;
                    const cleanHtmlContent = getCleanedHtmlForSave(receiptContainer, providerSigDataUrl, customerSigDataUrl);
                    const currentImageSrc = devicePhoto.src; // Get current image source

                    let pageCSS = "";
                    try { /* Extract CSS (same logic) */
                        for (let sheet of document.styleSheets) { if (sheet.href === null || sheet.href.startsWith(window.location.origin)) { try { Array.from(sheet.cssRules).forEach(rule => pageCSS += rule.cssText + '\n'); } catch (e) { console.warn("Could not read CSS rules:", sheet.href, e); } } else if (sheet.href && sheet.href.includes('fonts.googleapis.com')) { pageCSS += `@import url('${sheet.href}');\n`; } }
                    } catch (e) { /* Fallback CSS (add basic image style) */
                        console.error("Error extracting CSS:", e);
                        pageCSS = `body{font-family:Roboto,sans-serif;padding:20px;} .container{max-width:650px;margin:auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);} h2{color:#28a745;text-align:center;} img#device-photo{max-width:80%;display:block;margin:15px auto;border:1px solid #eee;} .footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:15px;border-top:1px solid #eee;} .signature-column{flex:1;text-align:center;} .signature-column img{max-width:180px;height:auto;display:block;margin:auto;} .signature-placeholder{border:1px dashed #ccc;padding:20px;text-align:center;color:#999;min-height:60px;} .payment-status{text-align:center;margin:15px 0;padding:10px;background:#e9f7ef;border:1px solid #28a745;border-radius:5px;font-weight:bold;}`;
                    }

                    const fileContent = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bukti Pengambilan Servis</title>
<style>
    ${pageCSS}
    /* Ensure image src is set correctly in saved HTML */
    img#device-photo { content: url("${currentImageSrc}"); }
    .signature-image { max-width: 90%; height: auto; display: block; margin: 0 auto 10px auto; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .signature-placeholder { display: flex; justify-content: center; align-items: center; min-height: 80px; border: 1px dashed #ccc; border-radius: 4px; font-style: italic; color: #999; font-size: 0.9em; padding: 10px; box-sizing: border-box; text-align: center; margin-bottom: 10px; background-color: #f9f9f9; }
</style>
</head>
<body><div class="container" id="receipt-container">${cleanHtmlContent}</div></body></html>`;

                    let filename = 'bukti_pengambilan_servis.html';
                    try { /* Filename generation (same) */
                        const nameElement = receiptContainer.querySelector('p > strong'); if (nameElement) { const customerName = nameElement.textContent.trim(); if (customerName && customerName !== '[Nama Pelanggan]') { const sanitizedName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); filename = `bukti_${sanitizedName}.html`; } }
                    } catch (e) { console.warn("Could not generate filename:", e); }

                    const blob = new Blob([fileContent], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    console.log('HTML file saved.'); alert('File HTML berhasil dibuat!');
                } catch (error) {
                    console.error("Error saving HTML:", error); alert("Gagal menyimpan file HTML: " + error.message);
                } finally {
                    buttonElement.disabled = false; buttonElement.textContent = originalButtonText;
                }
            });

            // --- Fungsi Simpan sebagai Gambar (JPG/PNG) (Updated: Re-added image handling in onclone) ---
            async function saveAsImage(format, buttonElement) {
                const formatUpper = format.toUpperCase(); const originalButtonText = buttonElement.textContent;
                allSaveButtons.forEach(btn => btn.disabled = true); buttonElement.textContent = `Menyimpan ${formatUpper}...`;
                if (document.activeElement && document.activeElement.hasAttribute('contenteditable')) { document.activeElement.blur(); }
                await new Promise(resolve => setTimeout(resolve, 50));

                try {
                    const canvas = await html2canvas(receiptContainer, {
                        useCORS: true, backgroundColor: '#ffffff', scale: window.devicePixelRatio * 1.5, logging: false,
                        onclone: (clonedDoc) => {
                            const clonedContainer = clonedDoc.getElementById('receipt-container'); if (!clonedContainer) return;
                            // Clean contenteditable (same)
                            clonedContainer.querySelectorAll('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.style.border = 'none'; el.style.boxShadow = 'none'; el.style.backgroundColor = 'transparent'; el.style.outline = 'none'; el.style.cursor = 'default'; });
                            // Hide clear buttons (same)
                            clonedContainer.querySelectorAll('.clear-sig-button').forEach(btn => { btn.style.display = 'none'; });
                            // Clean signature wrappers (same)
                            clonedContainer.querySelectorAll('.signature-wrapper').forEach(wrapper => { wrapper.style.border = '1px solid transparent'; });
                            // Clean container style (same)
                            clonedContainer.style.boxShadow = 'none';
                            // Ensure correct image src in clone (Added back)
                            const imgClone = clonedContainer.querySelector('#device-photo');
                            if (imgClone && devicePhoto.src) {
                                imgClone.src = devicePhoto.src;
                            }
                        }
                    });

                    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                    const quality = format === 'jpeg' ? 0.93 : undefined;
                    const imageDataUrl = canvas.toDataURL(mimeType, quality);

                    let filename = `bukti_pengambilan_servis.${format}`;
                    try { /* Filename generation (same) */
                        const nameElement = receiptContainer.querySelector('p > strong'); if (nameElement) { const customerName = nameElement.textContent.trim(); if (customerName && customerName !== '[Nama Pelanggan]') { const sanitizedName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); filename = `bukti_${sanitizedName}.${format}`; } }
                    } catch (e) { console.warn("Could not generate filename:", e); }

                    const a = document.createElement('a'); a.href = imageDataUrl; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    console.log(`File ${formatUpper} saved.`); alert(`File ${formatUpper} berhasil dibuat dan diunduh!`);
                } catch (error) {
                    console.error(`Error saat membuat ${formatUpper}:`, error); alert(`Gagal membuat file ${formatUpper}. Kesalahan: ${error.message}`);
                } finally {
                    allSaveButtons.forEach(btn => btn.disabled = false); buttonElement.textContent = originalButtonText;
                    console.log(`${formatUpper} generation process finished.`);
                }
            }

            // --- Event Listeners for Image Save Buttons ---
            saveJpgBtn.addEventListener('click', function () { saveAsImage('jpeg', this); });
            savePngBtn.addEventListener('click', function () { saveAsImage('png', this); });

        }); // End DOMContentLoaded

