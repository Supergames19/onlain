
        const imageUpload = document.getElementById('image-upload');
        const promoImage = document.getElementById('promo-image');
        const saveHtmlBtn = document.getElementById('save-html-btn');
        const saveJpgBtn = document.getElementById('save-jpg-btn');
        const promoContainer = document.getElementById('promo-container');
        const promoTitle = document.getElementById('promo-title');
        const promoDescription = document.getElementById('promo-description');
        const orderNowLink = document.getElementById('order-now-link'); // Referensi ke elemen <a>
        const orderNowText = document.getElementById('order-now-text'); // Referensi ke <span> di dalam <a>
        const buttonLinkInput = document.getElementById('button-link-input'); // Referensi ke input URL

        // --- Fungsi Ganti Gambar ---
        imageUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    promoImage.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });

        // --- Fungsi Update Link Tombol saat Input URL Berubah ---
        buttonLinkInput.addEventListener('input', function() {
            let url = this.value.trim();
            // Tambahkan http:// jika pengguna tidak menyertakannya (opsional tapi membantu)
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                 // Cek sederhana, mungkin perlu validasi lebih baik
                 // Tapi untuk input type="url", browser biasanya menangani prefix
                 // Kita atur href ke # jika kosong
                // url = 'http://' + url; // Bisa diaktifkan jika ingin memaksa http
            }
            orderNowLink.href = url || '#'; // Set href ke URL atau '#' jika kosong
        });

         // Setel nilai awal input link dari href tombol (jika ada)
         buttonLinkInput.value = orderNowLink.getAttribute('href') === '#' ? '' : orderNowLink.getAttribute('href');


        // --- Fungsi Simpan sebagai HTML ---
        saveHtmlBtn.addEventListener('click', function() {
            // Ambil konten yang sudah diedit
            const editedTitleHTML = promoTitle.innerHTML;
            const editedDescriptionHTML = promoDescription.innerHTML;
            const editedImageSrc = promoImage.src;
            const editedButtonTextHTML = orderNowText.innerHTML; // Ambil teks dari span
            const currentButtonLink = orderNowLink.getAttribute('href') || '#'; // Ambil href dari <a>

            // Buat HTML untuk tombol/link
            // Pastikan class dan href sesuai
            const orderButtonHTML = `<a href="${currentButtonLink}" class="order-now-link" style="display: inline-block; margin-top: 25px; background-color: var(--success-color); color: var(--light-text); border: none; border-radius: 5px; font-size: 1.1em; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 30px; /* Langsung set padding di <a> */ cursor: pointer;">${editedButtonTextHTML}</a>`;


            // Buat konten HTML baru
            const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promosi Tersimpan</title>
    <style>
        :root { /* Definisikan variabel warna di HTML tersimpan */
             --success-color: #28a745;
             --success-hover-color: #218838;
             --light-text: #ffffff;
        }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f9fa; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        .container { width: 90%; max-width: 450px; border: 1px solid #dee2e6; padding: 30px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center; }
        img { max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 6px; }
        h2 { font-size: 1.8em; font-weight: 700; margin-bottom: 15px; color: #007bff; text-align: center; }
        p { font-size: 1em; line-height: 1.6; color: #6c757d; text-align: center; margin-bottom: 20px; }
        p small { display: block; margin-top: 8px; font-size: 0.85em; color: #888;}
        /* Gaya untuk link tombol di HTML tersimpan (inline style di atas lebih prioritas) */
        .order-now-link { /* Sedikit redundan dengan inline, tapi bisa sbg fallback */
            display: inline-block;
            /* Style utama sudah di inline style */
        }
        .order-now-link:hover {
             background-color: var(--success-hover-color) !important; /* Paksa warna hover */
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>${editedTitleHTML}</h2>
        <img src="${editedImageSrc}" alt="Gambar Promosi">
        <p>${editedDescriptionHTML}</p>
        ${orderButtonHTML} <!-- Masukkan HTML link/tombol di sini -->
    </div>
</body>
</html>`;

            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'promosi_desain_saya.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('File HTML disimpan.');
            alert('File HTML berhasil dibuat dan diunduh!');
        });

        // --- Fungsi Simpan sebagai JPG (menggunakan html2canvas) ---
        saveJpgBtn.addEventListener('click', function() {
            const originalStyles = new Map();
            // Sertakan SEMUA elemen contenteditable untuk reset style
            const editables = promoContainer.querySelectorAll('[contenteditable="true"]');

             saveJpgBtn.textContent = 'Menyimpan JPG...';
             saveJpgBtn.disabled = true;

            // Hilangkan sementara border interaktif & shadow focus sebelum screenshot
             editables.forEach(el => {
                 // Simpan style spesifik yang diubah saat :focus/:hover
                 originalStyles.set(el, {
                     border: el.style.border,
                     boxShadow: el.style.boxShadow,
                     backgroundColor: el.style.backgroundColor // Simpan juga background jika berubah
                 });
                 // Reset ke tampilan non-edit
                 el.style.border = '1px dashed transparent'; // Atau sesuai state non-edit
                 el.style.boxShadow = 'none';
                 el.style.backgroundColor = 'transparent'; // Reset background jika diubah saat edit
                 // Khusus untuk span tombol, pastikan border benar2 hilang
                 if (el.id === 'order-now-text') {
                    el.style.border = '1px solid transparent'; // Pastikan solid transparan
                 }
             });

            // Pastikan border container utama tetap ada
            const originalContainerBorder = promoContainer.style.border;
            promoContainer.style.border = '1px solid var(--border-color)';

            // Hilangkan efek transform hover pada link sebelum capture
            let originalLinkTransform = orderNowLink.style.transform;
            orderNowLink.style.transform = 'none'; // Reset transform

            html2canvas(promoContainer, {
                 useCORS: true,
                 backgroundColor: '#ffffff',
                 scale: window.devicePixelRatio * 1.5,
                 logging: false,
                 onclone: (clonedDoc) => {
                     // Pastikan di dokumen kloningan, style focus/hover tidak aktif
                     const clonedEditables = clonedDoc.querySelectorAll('[contenteditable="true"]');
                     clonedEditables.forEach(el => {
                         el.style.border = '1px solid transparent'; // Pastikan transparan
                         el.style.boxShadow = 'none';
                         el.style.backgroundColor = 'transparent';
                     });
                      const clonedLink = clonedDoc.getElementById('order-now-link');
                       if (clonedLink) clonedLink.style.transform = 'none';
                       const clonedText = clonedDoc.getElementById('order-now-text');
                        if (clonedText) {
                            clonedText.style.border = '1px solid transparent';
                            clonedText.style.backgroundColor = 'transparent';
                        }

                 }
                })
                .then(canvas => {
                    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

                    const a = document.createElement('a');
                    a.href = imageDataUrl;
                    a.download = 'promosi_desain_saya.jpg';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    console.log('File JPG disimpan.');
                    alert('File JPG berhasil dibuat dan diunduh!');

                })
                .catch(error => {
                    console.error('Error saat membuat JPG:', error);
                    alert('Gagal membuat file JPG. Periksa konsol (F12) untuk detail error.');
                })
                .finally(() => {
                     // Kembalikan style asli elemen editable
                     editables.forEach(el => {
                        const styles = originalStyles.get(el);
                        if (styles) {
                            el.style.border = styles.border;
                            el.style.boxShadow = styles.boxShadow;
                            el.style.backgroundColor = styles.backgroundColor;
                        } else { // Fallback jika tidak tersimpan
                             el.style.border = '';
                             el.style.boxShadow = '';
                             el.style.backgroundColor = '';
                        }
                     });
                    // Kembalikan border container asli
                    promoContainer.style.border = originalContainerBorder;
                    // Kembalikan transform link asli
                    orderNowLink.style.transform = originalLinkTransform;

                     saveJpgBtn.textContent = 'Simpan sebagai JPG';
                     saveJpgBtn.disabled = false;
                });
        });

