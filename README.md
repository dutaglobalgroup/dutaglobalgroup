# Duta Global Group — Sistem Monitoring Proyek

Kode website berada di folder **website/** dan dapat diedit dengan Visual Studio Code.

## Status pemindahan

- Kode sumber versi 44 disalin dari commit `859c9272bfaf05b5af9b7a9fa5746c86243b7862`.
- Repository ini belum menjalankan website dan belum terhubung ke deployment otomatis.
- Database produksi, foto unggahan, akun, sesi login, dan kredensial hosting tidak disalin ke repository.
- Semua seed/data awal proyek dihapus dari salinan publik; database baru dimulai kosong. Data asli hanya boleh dipindahkan melalui jalur privat.
- Identitas hosting lama dihapus dari manifest salinan untuk mencegah publikasi tidak sengaja ke proyek lama.

## Mengedit dengan VS Code

1. Clone repository ini dan buka folder `website`.
2. Gunakan Node.js >=22.13.0 dan pnpm sesuai `packageManager` dalam `package.json`.
3. Jalankan `pnpm install --frozen-lockfile`.
4. Salin `.dev.vars.example` menjadi `.dev.vars` dan isi konfigurasi autentikasi milik perusahaan; jangan commit berkas tersebut.
5. Jalankan `pnpm dev` untuk pengembangan lokal. Lihat `PANDUAN-VSCODE.md` untuk struktur fitur.

## Hosting produksi

Konfigurasi deployment server disiapkan pada `.github/workflows/deploy-server.yml`.
Lihat [panduan aktivasi server](website/DEPLOY-SERVER.md) untuk sumber daya,
konfigurasi login, migrasi data, dan pemeriksaan sebelum mengganti halaman aktif.
Deployment belum aktif sampai konfigurasi akun hosting dipasang dan workflow dijalankan.

Aplikasi menggunakan Cloudflare Workers, D1, R2, dan Supabase Auth. GitHub Pages saja tidak menjalankan API, database, penyimpanan foto, atau sesi login aplikasi ini.

Untuk memindahkan sistem lengkap, diperlukan akun hosting perusahaan, binding database dan penyimpanan baru, pemindahan data dan foto produksi, konfigurasi autentikasi dan callback, serta validasi sebelum mengganti alamat publik. Jangan mengaktifkan deployment menggunakan database placeholder pada konfigurasi pengembangan.

Nama repository saat ini `dutaglobalgroup` juga merupakan repository profil GitHub. Alamat user Pages persis `dutaglobalgroup.github.io` membutuhkan repository `dutaglobalgroup.github.io`; repository ini dapat tetap menjadi sumber aplikasi server.

## Keamanan

Lihat `website/SECURITY_REVIEW.md` untuk cakupan pemeriksaan dan keterbatasannya. Jangan unggah password, token, `.env`, `.dev.vars`, ekspor akun, atau data sesi ke repository publik.
