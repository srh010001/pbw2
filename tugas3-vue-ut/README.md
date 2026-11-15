# SITTA-UT — Tugas Praktik 3 (Vue Components & Templates)

Proyek ini mengadaptasi tampilan dan field aplikasi SITTA-UT pada tugas sebelumnya, lalu memindahkan halaman stok dan tracking ke dalam satu root Vue dengan tab `dashboard`, `stok`, `tracking`, dan `order`.

## Menjalankan aplikasi

1. Buka folder `tugas3-vue-ut` melalui Visual Studio Code.
2. Pastikan extension **Live Server** sudah terpasang.
3. Klik kanan `index.html`, lalu pilih **Open with Live Server**.
4. Aplikasi akan membaca `data/dataBahanAjar.json` dan file template di folder `templates`.

Jangan membuka `index.html` dengan double-click (`file://`), karena browser dapat memblokir `fetch()` untuk membaca file JSON dan template lokal.

## Struktur

```text
 tugas3-vue-ut/
 ├── index.html
 ├── assets/
 │   ├── css/style.css
 │   └── img/logo_ut.svg
 ├── data/dataBahanAjar.json
 ├── js/
 │   ├── app.js
 │   ├── components/
 │   │   ├── dashboard.js
 │   │   ├── stock-table.js
 │   │   ├── do-tracking.js
 │   │   ├── order-form.js
 │   │   ├── status-badge.js
 │   │   └── app-modal.js
 │   └── services/api.js
 └── templates/
     ├── dashboard.html
     ├── stock-table.html
     ├── do-tracking.html
     ├── order-form.html
     ├── status-badge.html
     └── app-modal.html
```

## Fitur tambahan

- **Dashboard:** ringkasan jumlah jenis dan kuantitas stok, stok tersedia/menipis/kosong, jumlah DO yang dibuat, status DO aktif/terkirim, daftar DO terbaru, perubahan tracking terakhir, serta daftar stok yang perlu diperhatikan.
- **Alamat pengiriman:** wajib diisi pada form pemesanan dan ditampilkan kembali pada detail tracking DO.
- **Pemesanan paket:** tetap tersedia dengan isi dan harga sesuai data paket pada JSON.
- **Pemesanan bahan ajar satuan:** pilih beberapa bahan ajar sekaligus, tentukan jumlah eksemplar per item, lihat subtotal tiap item dan total otomatis. Bahan yang sama tidak dapat dimasukkan dua kali pada baris berbeda.
- **Pembaruan tracking:** status dapat dipilih sebagai `Dalam Proses`, `Dalam Perjalanan`, `Terkirim`, atau `Kendala` saat menambahkan keterangan progress. Perubahan waktu dan status ditampilkan di dashboard.
- **Pengurangan stok:** ketika DO berhasil dibuat, stok bahan ajar berkurang sesuai jumlah item yang dipesan. Paket mengurangi satu eksemplar untuk setiap bahan ajar dalam isi paket.

## Waktu dan nomor DO

- Semua tanggal dan jam otomatis menggunakan zona waktu `Asia/Jakarta` (WIB).
- Nomor DO baru memakai tahun berjalan di WIB dan urutan empat digit, misalnya `DO2026-0001`.
- Data tanggal kirim ditampilkan dalam format Indonesia, misalnya `25 Agustus 2025`.

## Penyimpanan data

JSON menjadi sumber data awal. Browser tidak dapat menulis balik perubahan ke file JSON secara langsung, sehingga perubahan stok, DO, dan progress disimpan pada `localStorage` agar tetap ada ketika halaman di-refresh.

Untuk mengembalikan data ke kondisi awal JSON, buka Developer Tools > Console pada browser lalu jalankan:

```js
localStorage.removeItem("sitta_ut_tugas3_working_data_v1");
location.reload();
```

## Catatan format data terlampir

Field `tracking` pada JSON terlampir berbentuk array yang memuat nomor DO `DO2025-0001` dua kali dengan isi sama. `js/services/api.js` mengubah struktur tersebut menjadi object dengan nomor DO sebagai key, sehingga data tracking yang sama hanya dimuat satu kali. File JSON aslinya tidak diubah.

Data `pengirimanList` yang tersedia di JSON adalah `REG` (Reguler 3–5 hari) dan `EXP` (Ekspres 1–2 hari), bukan daftar UPBJJ. Form pemesanan menggunakan field `pengirimanList` tersebut sebagai pilihan ekspedisi dan menampilkannya sebagai JNE Reguler/JNE Express.

**Catatan:** penyimpanan saat ini menggunakan `localStorage` di browser yang digunakan. Untuk penggunaan multi-user atau sinkronisasi antarkomputer diperlukan backend/database, yang memang tidak ditambahkan agar struktur proyek tugas tetap ringan.


## Gambar sampul bahan ajar

Pilihan sampul tersedia saat menambah atau mengedit bahan ajar. Semua gambar disimpan di `assets/img/`, dipratinjau sebelum disimpan, dan thumbnail-nya ditampilkan pada tabel stok.

- Pengantar Manajemen — EKMA4116
- Pengantar Akuntansi — EKMA4115
- Biologi Umum (Praktikum) — BIOL4201
- Dasar-Dasar Sosiologi — FISIP4001
- Pengantar Ilmu Komunikasi — SKOM4101
- Mikrobiologi — BIOL4223
- Paud Perkembangan — PAUD4306
- Pemrograman Berbasis Web — MSIM4309
- Kepemimpinan — ADPU4334
- Manajemen Keuangan — EKMA4123

Empat stok awal dipasangkan otomatis dengan sampul yang sesuai. Jika browser sudah menyimpan data stok versi sebelumnya, aplikasi menambahkan sampul awal satu kali tanpa menimpa pilihan sampul yang sudah disimpan pengguna.
