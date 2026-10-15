# Website Monitoring Proyek — Duta Global Group

Seluruh antarmuka, logika dashboard, API, skema basis data, dan aset website tersedia sebagai kode yang dapat diedit di Visual Studio Code. Paket ini memuat data awal; perubahan terbaru di database online, akun, sesi, dan foto unggahan tidak termasuk dalam ZIP. Jangan mengganti database produksi dengan data awal.

## Menjalankan secara lokal

1. Instal Node.js versi 22.13 atau lebih baru dan VS Code. Ekstrak ZIP, lalu gunakan **File → Open Folder**.
2. Buka terminal di direktori proyek. Jalankan `corepack enable`, kemudian `corepack pnpm install --frozen-lockfile`.
3. Jalankan `npm run build` untuk menghasilkan konfigurasi Worker lokal, kemudian `npm run db:local` untuk menyiapkan database lokal. Skrip mencatat migrasi yang sudah dijalankan; jangan menghapus catatannya tanpa menghapus database lokal yang terkait.
4. Salin `.dev.vars.example` menjadi `.dev.vars` dan isi konfigurasi Supabase milik Anda. Jangan memasukkan service-role key. Login membutuhkan Supabase aktif dan URL callback yang diizinkan; data lokal terpisah dari produksi.
5. Jalankan `npm run dev` dan buka alamat yang dicetak terminal. Task VS Code **Jalankan website** tersedia melalui Terminal → Run Task. Gunakan localhost atau HTTPS untuk cookie sesi Secure.
6. Setelah perubahan, jalankan `npm run test:dashboard` dan `npm run build`.

Website ini memiliki backend Cloudflare Workers, D1, dan R2. Jangan membuka HTML dengan klik ganda atau memakai Live Server saja: penyimpanan dan login membutuhkan backend.

## Bagian yang dapat diedit

| File / direktori | Kegunaan |
| --- | --- |
| `ui/dashboard.html` | Struktur halaman, dialog, menu, dan teks utama |
| `public/professional-theme.css` | Warna pada `:root`, tipografi, login, tabel, responsivitas |
| `public/professional-dashboard.js` | Isi dashboard, agenda, detail proyek, popup peta |
| `public/location-groups.js` | Penggabungan lokasi konstruksi dan supervisi |
| `public/schedule.js` | Perhitungan jadwal dan sisa hari kalender WIB |
| `public/progress-monitoring.js` | Tabel progres konstruksi dan produk pelaksana |
| `public/imported-monitoring.js` | Laporan konsultan supervisi dan perencanaan |
| `public/auth.js` | Interaksi login dan pendaftaran |
| `app/api/` | Validasi dan penyimpanan server, autentikasi, foto |
| `lib/security-headers.ts` | Kebijakan browser dan Content Security Policy |
| `lib/project-store.ts` | Pemeriksaan izin, origin, format permintaan, batas perubahan |
| `db/schema.ts`, `drizzle/` | Skema dan riwayat migrasi database |

`app/dashboard-html.ts` dihasilkan otomatis dari `ui/dashboard.html` saat dev/build. Edit sumber HTML, bukan berkas hasil generator. Modul browser menggunakan fungsi bersama dan dimuat sesuai urutan pada HTML; pertahankan urutan tersebut. Untuk menambah kolom, sesuaikan tampilan, formulir, payload, dan validasi API terkait.

## Perilaku dashboard

- Ikhtisar Dashboard dan Kelengkapan Informasi dihapus. Dashboard tetap menjadi halaman utama dan membuka menu monitoring.
- Agenda menampilkan seluruh paket dalam kelompok konstruksi, supervisi, dan perencanaan; paket yang periode kontraknya belum berakhir berada di atas.
- Durasi mencakup tanggal mulai dan akhir. Sisa waktu menghitung jarak tanggal menuju akhir; pada tanggal akhir atau sesudahnya menjadi 0 dan periode ditandai selesai. Angka progres fisik/produk tidak otomatis diubah menjadi 100%.
- Lokasi konstruksi dan supervisi dengan koordinat numerik identik memakai satu marker. Detail, jadwal, dan aksi tetap dimiliki masing-masing paket. Menghapus titik satu paket tidak menghapus titik paket lain yang masih ada pada koordinat sama. Koordinat kosong tidak diperkirakan.
- Data disinkronkan berkala dan langsung diperbarui setelah penyimpanan.

## Keamanan dan login

JavaScript hanya dimuat dari origin website; iframe dan plugin diblokir. Tile peta eksternal hanya diizinkan dari penyedia yang digunakan. Cookie sesi Secure/HttpOnly, pemeriksaan akun server, validasi payload, pemeriksaan revisi data, dan konfirmasi hapus tetap dipakai. Mutasi data menolak origin lain, memeriksa jenis konten, dan dibatasi 60 permintaan per akun per menit. Pembatasan login terpisah tetap berlaku.

Website saat ini tetap dapat dibaca publik; akun terverifikasi dapat mengelola data sesuai kebijakan yang telah ada. Pemilik dapat memblokir akun dari halaman admin. Penguatan ini bukan audit penetrasi penuh.

Google dan Apple menggunakan OAuth dengan PKCE; tombol baru aktif ketika provider dikonfigurasi pada proyek Supabase. Atur kredensial provider pada Supabase, Site URL dan redirect allowlist untuk `/api/auth/callback` pada domain website. Jangan menaruh client secret pada frontend. Pendaftaran tetap mengikuti konfirmasi email dari layanan identitas.

## Publikasi dan pemeliharaan

Build lokal tidak mengubah website online. Publikasi melalui proyek Sites yang sudah ada harus menggunakan versi kode dan arsip build yang sama; `.openai/hosting.json` menyimpan identitas proyek dan binding DB/BUCKET. Untuk hosting mandiri, siapkan Worker, D1, R2, migrasi, environment variables, dan domain sendiri. Jangan menjalankan migrasi produksi tanpa cadangan database dan foto.

Paket tidak memuat `.env`, `.dev.vars`, token, database runtime, `node_modules`, atau riwayat Git. Instal dependensi sebelum menjalankan. Periksa pembaruan dependensi secara berkala dan uji sebelum publikasi.

## Pembaruan pengaturan dan index.html

Menu Pengaturan menyediakan identitas sesi, nama tampilan dan notifikasi dashboard (preferensi browser lokal), informasi keamanan, akses administrasi bagi pemilik, bantuan, dan keluar. Akun utama aplikasi adalah dutaglobalgroup2000@gmail.com; ini tidak memindahkan kepemilikan hosting ChatGPT Sites dari akun Zaki.

Login menggunakan Email + Password dan Continue with Google. Provider Google belum aktif saat pemeriksaan; perlu konfigurasi OAuth Google pada Supabase. Apple tidak ditampilkan.

Status progres: selesai jika realisasi >=100%; terlambat jika realisasi < rencana atau belum selesai setelah tanggal akhir; selain itu sedang berjalan. Nilai kosong ditampilkan sebagai belum ada progres. Periode kontrak dan status progres adalah dua informasi berbeda. Ikon lokasi terpadu memakai prioritas terlambat, berjalan, belum ada progres, lalu selesai; popup tetap memuat status setiap paket.

`index.html` pada paket unduhan adalah versi antarmuka satu file (CSS, JavaScript, logo, pustaka ekspor, dan snapshot data disematkan). Buka dengan VS Code untuk mengubah tampilan atau data pada bagian `SNAPSHOT_DATA`. Dapat dibuka langsung sebagai pratinjau baca-saja; tile peta tetap membutuhkan internet. Login dan simpan online memerlukan backend pada origin yang sama. Jangan mengunggah file ini untuk menimpa backend produksi tanpa konfigurasi. Kode backend lengkap tersedia pada direktori proyek.

## Tema dan status manual terbaru

Warna hitam, ungu, dan biru dapat diedit pada `public/midnight-theme.css`. Tombol **Ubah status** pada agenda, jadwal konstruksi, dan popup peta menyimpan pilihan status per paket melalui backend. Pilih **Otomatis berdasarkan progres** untuk kembali ke perhitungan awal. Status manual tidak mengubah angka realisasi atau jadwal kontrak. Nama desa dapat diedit melalui **Edit data** pada laporan konsultan dan muncul pada detail serta peta. Penanda peta menggunakan lingkaran kecil berwarna.

Google OAuth belum aktif: diperlukan Client ID dan Client Secret dari proyek Google Cloud pemilik serta konfigurasi provider dan callback di Supabase. Jangan membagikan secret di kode frontend. Email admin aplikasi bukan pemilik hosting: pemindahan hosting ChatGPT harus dilakukan lewat fasilitas akun/platform yang mendukung transfer, atau publikasi ulang dari akun tujuan. Kode ini tidak memindahkan kepemilikan hosting secara otomatis.
