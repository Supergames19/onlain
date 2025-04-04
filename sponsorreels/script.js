document.addEventListener('DOMContentLoaded', () => {
    // Referensi Elemen
    const imageUploader = document.getElementById('imageUploader');
    const mainImage = document.getElementById('mainImage');
    const profilePicUploader = document.getElementById('profilePicUploader');
    const profilePic = document.getElementById('profilePic');
    const audioUserPicUploader = document.getElementById('audioUserPicUploader'); // Baru
    const audioUserPic = document.getElementById('audioUserPic');             // Baru
    const spinningAudioIcon = document.getElementById('spinningAudioIcon');   // Opsional: Jika ingin ganti icon spin
    const saveHtmlBtn = document.getElementById('saveHtmlBtn');
    const saveJpgBtn = document.getElementById('saveJpgBtn');
    const reelContainer = document.getElementById('reelToCapture');

    console.log("Script loaded. Enhanced version.");

    // --- 1. Ganti Gambar Utama ---
    mainImage.addEventListener('click', () => imageUploader.click());
    imageUploader.addEventListener('change', (event) => handleImageUpload(event, mainImage));

    // --- 2. Ganti Gambar Profil ---
    profilePic.addEventListener('click', () => profilePicUploader.click());
    profilePicUploader.addEventListener('change', (event) => handleImageUpload(event, profilePic));

    // --- 3. Ganti Gambar User Audio --- (BARU)
    audioUserPic.addEventListener('click', () => audioUserPicUploader.click());
    audioUserPicUploader.addEventListener('change', (event) => handleImageUpload(event, audioUserPic));

    // --- Opsional: Ganti Gambar Icon Audio Berputar ---
    // Jika Anda ingin user bisa mengganti icon yang berputar juga
    // spinningAudioIcon.addEventListener('click', () => { /* Picu input file lain */ });
    // // Tambahkan event listener change untuk input file tersebut

    // --- Fungsi Helper Upload Gambar ---
    function handleImageUpload(event, targetImageElement) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            console.log(`Processing file: ${file.name} for element ID: ${targetImageElement.id}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                targetImageElement.src = e.target.result;
                console.log(`Image updated for: ${targetImageElement.id}`);
            }
            reader.onerror = (e) => console.error("FileReader error:", e);
            reader.readAsDataURL(file);
        } else {
            console.warn("Invalid file selected or no file chosen.");
            event.target.value = null;
        }
    }

    // --- 4. Simpan HTML ---
    saveHtmlBtn.addEventListener('click', () => {
        console.log("Save HTML clicked.");
        try {
            const editables = reelContainer.querySelectorAll('.editable');
            editables.forEach(el => el.style.outline = 'none');

            // Penting: Dapatkan HTML *setelah* outline dihilangkan
            const currentHtml = reelContainer.outerHTML;

            editables.forEach(el => el.style.outline = ''); // Kembalikan outline

            const blob = new Blob([/* ... (konten blob sama seperti sebelumnya) ... */
                 '<!DOCTYPE html>\n',
                 '<html lang="id">\n<head>\n',
                 '  <meta charset="UTF-8">\n',
                 '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n',
                 '  <link rel="stylesheet" href="style.css">\n',
                 '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A==" crossorigin="anonymous" referrerpolicy="no-referrer" />\n',
                 '  <title>Hasil Edit Reel</title>\n',
                 '  <style>.editable[contenteditable="true"] { outline: none !important; }</style>\n',
                 '</head>\n<body>\n',
                 '<div class="controls" style="display:none;"></div>\n', // Sembunyikan kontrol
                 currentHtml,
                 '\n<script src="script.js"></script>\n', // Opsional: sertakan script jika ingin tetap interaktif
                 '</body>\n</html>'
             ], { type: 'text/html' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reel_edit_enhanced.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("HTML saved.");
        } catch (error) {
            console.error("Error saving HTML:", error);
            // Kembalikan outline jika error
             const editables = reelContainer.querySelectorAll('.editable');
             editables.forEach(el => el.style.outline = '');
        }
    });

    // --- 5. Simpan JPG ---
    saveJpgBtn.addEventListener('click', () => {
        console.log("Save JPG clicked.");
        const editables = reelContainer.querySelectorAll('.editable');
        try {
            editables.forEach(el => el.style.outline = 'none'); // Sembunyikan outline
            console.log("Editable outlines hidden for JPG.");

            html2canvas(reelContainer, {
                useCORS: true,
                allowTaint: true, // Mungkin tidak perlu jika semua gambar DataURL
                backgroundColor: '#111', // Sesuaikan dengan background container
                logging: true,
                scale: window.devicePixelRatio || 1.5, // Tingkatkan skala untuk kualitas
                 removeContainer: false, // Coba false jika ada masalah aneh
                onclone: (clonedDoc, originalDoc) => {
                    console.log("Cloning DOM for JPG...");
                    // Salin src untuk semua gambar yang mungkin diubah
                    const imagesToClone = ['#mainImage', '#profilePic', '#audioUserPic', '#spinningAudioIcon'];
                    imagesToClone.forEach(selector => {
                        const originalImg = originalDoc.querySelector(selector);
                        const clonedImg = clonedDoc.querySelector(selector);
                        if (clonedImg && originalImg && originalImg.src.startsWith('data:image')) {
                            console.log(`Copying DataURL for ${selector}`);
                            clonedImg.src = originalImg.src;
                        } else if(clonedImg) {
                             console.warn(`Source for ${selector} in clone might be missing or not DataURL.`);
                        } else {
                             console.error(`Element ${selector} not found in cloned document!`);
                        }
                    });
                     // Pastikan animasi tidak berjalan saat screenshot (opsional)
                     const spinningIconClone = clonedDoc.querySelector('.spinning-audio-icon-container');
                     if (spinningIconClone) spinningIconClone.style.animation = 'none';
                }
            })
            .then(canvas => {
                console.log("Canvas created for JPG.");
                 if (!canvas || canvas.width === 0 || canvas.height === 0) {
                     console.error("Canvas creation failed or canvas is empty!");
                     throw new Error("Generated canvas is invalid.");
                 }
                const imageURL = canvas.toDataURL('image/jpeg', 0.92); // Kualitas sedikit lebih tinggi
                console.log("Converted canvas to JPG DataURL, length:", imageURL.length);
                 if (!imageURL || imageURL === "data:,") {
                     console.error("Generated DataURL is empty!");
                     throw new Error("Failed to generate valid DataURL.");
                 }

                const a = document.createElement('a');
                a.href = imageURL;
                a.download = 'reel_screenshot_enhanced.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                console.log("JPG saved.");
                editables.forEach(el => el.style.outline = ''); // Kembalikan outline

            })
            .catch(error => {
                console.error("Error processing or saving JPG:", error);
                alert("Gagal menyimpan JPG. Cek console (F12) untuk detail.");
                editables.forEach(el => el.style.outline = ''); // Kembalikan outline
            });

        } catch (error) {
            console.error("Error before calling html2canvas:", error);
            alert("Terjadi kesalahan sebelum memproses gambar. Cek console (F12).");
            editables.forEach(el => el.style.outline = ''); // Kembalikan outline
        }
    });

    // --- 6. Pencegahan Paste ---
    const editableElements = document.querySelectorAll('.editable[contenteditable="true"]');
    editableElements.forEach(element => {
        element.addEventListener('paste', (event) => {
            event.preventDefault();
            const text = (event.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    });

});