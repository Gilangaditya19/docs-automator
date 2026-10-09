# Docs Automator

Aplikasi web untuk mengotomatisasi pengolahan dokumen Excel pengajuan barang.

## Deskripsi

Docs Automator memungkinkan pengguna untuk:
- Mengunggah file pengajuan Excel (satu file dengan banyak sheet, atau beberapa file sekaligus).
- Secara otomatis mendeteksi kolom serta baris data pada tabel.
- Mengatur konfigurasi kolom tambahan (seperti Dokumentasi, Harga Perolehan, Invoice, dll).
- Melihat pratinjau tabel dari setiap dokumen dan mengedit sel data secara langsung.
- Mengunduh hasilnya sebagai file Excel tunggal yang tergabung, dengan mempertahankan format visual dan gambar jika memungkinkan.

## Teknologi Utama

- **React.js** (Antarmuka Pengguna)
- **Tailwind CSS** (Pemformatan dan Gaya)
- **ExcelJS** & **xlsx-populate** (Pemrosesan dan Ekspor File Excel)
- **Framer Motion / Motion** (Animasi Antarmuka)
- **Lucide React** (Ikonografi)

## Struktur Folder Penting

- `src/App.jsx`: Komponen utama aplikasi, mengelola _state_ dokumen, antarmuka, dan logika _upload_ file.
- `src/utils/fileParser.js`: Logika untuk memproses/membaca file Excel dan mengekspor data kembali ke format Excel.
- `src/components/ui/how-it-works.jsx`: Komponen visual tutorial tata cara penggunaan aplikasi.

## Cara Menjalankan Proyek

1. Lakukan instalasi semua dependensi dengan menjalankan perintah:
   ```bash
   npm install
   ```
2. Jalankan _development server_ dengan perintah:
   ```bash
   npm run dev
   ```
   Atau jika menggunakan _script_ standar:
   ```bash
   npm start
   ```

Aplikasi siap untuk dikembangkan lebih lanjut.
