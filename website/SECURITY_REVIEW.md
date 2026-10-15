# Pemeriksaan keamanan — 14 Oktober 2026

Lingkup: review source autentikasi/otorisasi, sesi, header keamanan, validasi titik/foto, serta pemeriksaan konfigurasi Supabase. Bukan pentest atau sertifikasi keamanan. QA browser dan login Google ujung-ke-ujung belum dilakukan.

## Perbaikan yang diterapkan
- Admin persetujuan adalah zakikhaliq31@gmail.com; alamat kontak perusahaan tetap dutaglobalgroup2000@gmail.com.
- Email terverifikasi diperlukan sebelum registrasi akses; pengguna selain admin berstatus pending sampai disetujui.
- Persetujuan otomatis lama tidak lagi memberikan hak edit. Persetujuan sah dari admin tetap berlaku.
- Perubahan email meminta persetujuan ulang, blokir tetap berlaku, revisi akun dan pencabutan sesi menghentikan akses lama.
- Persetujuan/pemblokiran tetap dicatat oleh trigger audit database; antrean admin disegarkan berkala.
- Pembatasan login OAuth tidak lagi menggunakan satu kuota global untuk seluruh pengguna.
- ID proyek pada atribut HTML di-escape.
- Tampilan login menjelaskan tahapan verifikasi dan persetujuan; hasil OAuth pending/blocked ditampilkan secara eksplisit.

## Proteksi yang sudah ada
Cookie sesi Secure/HttpOnly/SameSite=Lax dan prefiks __Host; token sesi acak disimpan sebagai hash; token Supabase di sisi server. Pengguna diverifikasi melalui layanan Auth. Permintaan tulis memerlukan sesi, origin yang sesuai, tipe konten, validasi input, pembatasan permintaan dan revision guard. Halaman menggunakan CSP, HSTS, anti-frame dan nosniff. Upload foto membatasi ukuran/format dan memeriksa signature file.

## Batas dan tindak lanjut
- Website dan API baca proyek/foto tetap publik sesuai pengaturan sebelumnya. Jangan menganggap data di dalamnya rahasia. Akses tulis dibatasi.
- Google provider masih false pada pemeriksaan. Aktifkan provider dengan Client ID/Secret Google Cloud, callback Supabase dan redirect aplikasi yang benar. Jangan memasukkan client secret ke HTML atau GitHub.
- Supabase security advisor melaporkan leaked password protection disabled. Aktifkan melalui pengaturan Auth jika tersedia pada paket akun. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- private.site_admins memiliki RLS tanpa policy (INFO); tidak dibuka karena bukan tabel aplikasi yang perlu akses klien. https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Persetujuan dilakukan melalui /admin setelah admin login. Tidak ada email persetujuan otomatis yang dikirim; integrasi layanan email belum tersedia.
- Token akses/refresh tersimpan dalam database sisi server: pengamanan akun infrastruktur dan backup tetap penting. Tidak dilakukan uji pemulihan backup, MFA admin, atau pentest independen.
- index.html edisi lokal/GitHub bukan sistem autentikasi server dan tidak mewarisi kontrol akses website online.

## Pengujian
Tes SQLite menjalankan query kebijakan aktual: admin, pending, pencabutan akses/sesi lama, pelestarian persetujuan, perubahan email dan blokir. Tes regresi dashboard, koordinat/foto/progres, pembuatan monitoring, penghapusan item dan revision guards lulus.


## Pembaruan dan audit 14 Oktober 2026
- Batas ukuran body API dihitung dalam byte saat stream dibaca, sehingga request tanpa Content-Length juga dihentikan saat melampaui batas. Berlaku pada proyek, monitoring, koordinat, admin, login/OAuth, serta multipart foto (6 MB total; foto 5 MB).
- JSON rusak menghasilkan 400 tanpa membocorkan detail parsing; body terlalu besar menghasilkan 413. Signature PNG diperiksa delapan byte, bukan empat byte.
- Login/OAuth juga menolak Sec-Fetch-Site cross-site; origin tetap wajib cocok. Kebijakan persetujuan admin dan verifikasi email dipertahankan.
- Pemindaian pola kredensial pada source dan aset publik tidak menemukan private key, sb_secret, token GitHub, atau literal service-role yang cocok dengan pola pemeriksaan. Ini bukan bukti bahwa setiap jenis rahasia pasti terdeteksi.
- Next 16.3.8, React/React DOM/RSC 19.2.8, Vite 8.0.16 dan dependensi transitif terkait diperbarui. Lockfile dan overrides versi perbaikan disimpan; kebijakan umur minimum paket tetap dipertahankan.
- `pnpm audit --prod --json`: 0 advisory pada dependensi produksi saat pemeriksaan.
- `pnpm audit --json` (termasuk alat pengembangan): tersisa 2 advisory, 1 moderate dan 1 high, tanpa critical. Esbuild lama berasal dari loader Drizzle Kit dan berkaitan dengan server development; website ini tidak membuka server tersebut. Tidak dipaksa lintas versi mayor API karena risiko merusak migrasi. Braces 3.0.3 dipakai oleh alat pencarian file/build, belum memiliki rilis perbaikan. Jangan memasukkan pola glob tak tepercaya ke alat build. Temuan tidak disembunyikan dari audit.
  - https://github.com/advisories/GHSA-67mh-4wv8-2f99
  - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- Supabase advisor tetap: leaked-password protection disabled (WARN), private.site_admins RLS tanpa policy (INFO, akses tetap ditutup). Pengaturan provider Google dan layanan Auth tidak diubah pada pembaruan ini.
- Tes otomatis mencakup kontrol origin/login/rate limit, kebijakan persetujuan, body chunked, malformed JSON, penyimpanan wilayah per titik, dan regresi dashboard/penghapusan. Tidak ada data proyek produksi yang dimodifikasi sebagai uji.

## Lokasi administratif
Editor proyek dan setiap titik kini menyediakan 514 kabupaten/kota dan 7.285 kecamatan. Data diambil dari cahyadsn/wilayah (MIT), db/wilayah.sql pada 14 Oktober 2026 dan dibundel agar pilihan tidak bergantung pada API eksternal. Kecamatan mengikuti kabupaten/kota; perubahan induk mengosongkan pilihan kecamatan. Nilai lama yang tidak cocok daftar tetap ditampilkan sebagai tersimpan. Nama wilayah ditampilkan melalui escaping HTML.
