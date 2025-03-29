document.addEventListener('DOMContentLoaded', () => {

            const saveHtmlButton = document.getElementById('save-html-button');
            const saveJpgButton = document.getElementById('save-jpg-button');
            const contentToCapture = document.getElementById('editable-content'); // Target elemen untuk JPG

            // --- Fitur Edit Gambar (Kode dari sebelumnya tetap sama) ---
            const imageContainers = document.querySelectorAll('.editable-image-container');
            imageContainers.forEach(container => {
                const fileInput = container.querySelector('.hidden-file-input');
                const imageElement = container.querySelector('img');
                container.addEventListener('click', (e) => {
                    // Hanya trigger jika bukan klik pada link/button di dalam overlay (jika ada)
                    if (e.target.closest('a, button')) return;
                    fileInput.click();
                });
                fileInput.addEventListener('change', (event) => {
                     const file = event.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const dataUrl = e.target.result;
                            if (imageElement) {
                                imageElement.src = dataUrl;
                                container.dataset.imageDataUrl = dataUrl;
                            } else {
                                container.style.backgroundImage = `url('${dataUrl}')`;
                                container.dataset.imageDataUrl = dataUrl;
                            }
                        }
                        reader.readAsDataURL(file);
                    } else if (file) {
                         alert('Harap pilih file gambar yang valid (JPG, PNG, GIF, dll.).');
                    }
                });
            });

            // --- Fungsi Simpan Halaman HTML ---
            function savePageHtml() {
                // Set state loading
                saveHtmlButton.classList.add('loading');
                saveHtmlButton.disabled = true;
                saveHtmlButton.innerHTML = '<i class="fa-solid fa-spinner"></i> Menyimpan HTML...';

                try {
                    const clonedDoc = document.cloneNode(true);
                    const elementsToRemove = clonedDoc.querySelectorAll('.save-buttons-container, script'); // Hapus kontainer tombol
                    elementsToRemove.forEach(el => el.remove());
                    const editableElements = clonedDoc.querySelectorAll('[contenteditable="true"]');
                    editableElements.forEach(el => el.removeAttribute('contenteditable'));
                    const editedImages = clonedDoc.querySelectorAll('.editable-image-container[data-image-data-url]');
                     editedImages.forEach(container => {
                         const dataUrl = container.dataset.imageDataUrl;
                         const img = container.querySelector('img');
                         if(dataUrl){ // Pastikan dataUrl ada
                            if (img) { img.src = dataUrl; }
                            else { container.style.backgroundImage = `url('${dataUrl}')`; }
                         }
                    });
                    const finalHtml = clonedDoc.documentElement.outerHTML;
                    const blob = new Blob([finalHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const downloader = document.createElement('a');
                    downloader.href = url;
                    const pageTitle = clonedDoc.getElementById('page-title')?.textContent?.trim() || 'halaman-produk-diedit';
                    const filename = pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
                    downloader.download = filename;
                    document.body.appendChild(downloader);
                    downloader.click();
                    document.body.removeChild(downloader);
                    URL.revokeObjectURL(url);
                    // alert(`Halaman telah disimpan sebagai "${filename}".`); // Alert opsional
                } catch (error) {
                    console.error("Gagal menyimpan HTML:", error);
                    alert("Terjadi kesalahan saat menyimpan halaman HTML.");
                } finally {
                     // Reset state loading
                    saveHtmlButton.classList.remove('loading');
                    saveHtmlButton.disabled = false;
                    saveHtmlButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan HTML';
                }
            } // end savePageHtml

            // --- Fungsi Simpan Halaman JPG ---
            function savePageJpg() {
                 if (typeof html2canvas === 'undefined') {
                    alert('Library html2canvas tidak ditemukan. Gagal menyimpan JPG.');
                    return;
                 }

                 // Set state loading
                 saveJpgButton.classList.add('loading');
                 saveJpgButton.disabled = true;
                 saveJpgButton.innerHTML = '<i class="fa-solid fa-spinner"></i> Memproses JPG...';

                 // Opsi untuk html2canvas (opsional, bisa disesuaikan)
                 const options = {
                     allowTaint: false, // Coba cegah taint jika mungkin
                     useCORS: true,    // Coba muat gambar eksternal (jika server mengizinkan)
                     scale: window.devicePixelRatio || 1, // Gunakan skala DPI perangkat untuk kualitas lebih baik
                     backgroundColor: getComputedStyle(contentToCapture).backgroundColor || '#ffffff', // Gunakan background container
                     logging: false // Matikan log konsol html2canvas
                 };

                 html2canvas(contentToCapture, options).then(canvas => {
                     // Konversi canvas ke Data URL JPG
                     // Kualitas 0.9 (0-1), 1 = kualitas terbaik, 0 = terburuk
                     const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

                     // Trigger download
                     const downloader = document.createElement('a');
                     downloader.href = imageDataUrl;
                     const pageTitle = document.getElementById('page-title')?.textContent?.trim() || 'halaman-produk';
                     const filename = pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-capture.jpg';
                     downloader.download = filename;
                     document.body.appendChild(downloader);
                     downloader.click();
                     document.body.removeChild(downloader);
                     // alert(`Gambar JPG telah disimpan sebagai "${filename}".`); // Alert opsional

                 }).catch(error => {
                     console.error('Error saat menggunakan html2canvas:', error);
                     alert('Gagal membuat gambar JPG. Mungkin ada elemen yang tidak didukung.');
                 }).finally(() => {
                      // Reset state loading
                     saveJpgButton.classList.remove('loading');
                     saveJpgButton.disabled = false;
                     saveJpgButton.innerHTML = '<i class="fa-solid fa-file-image"></i> Simpan JPG';
                 });

            } // end savePageJpg


            // Tambahkan event listener ke tombol
            saveHtmlButton.addEventListener('click', savePageHtml);
            saveJpgButton.addEventListener('click', savePageJpg);

        }); // End DOMContentLoaded