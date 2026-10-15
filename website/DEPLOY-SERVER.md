# Mengaktifkan server dan login Duta Global Group

Status: konfigurasi deployment disiapkan. Ini belum berarti server, database,
foto, atau akun telah dipindahkan. `index.html` pada GitHub Pages masih merupakan
salinan lokal; halaman tersebut tidak otomatis memakai API di folder `website/`.

## Infrastruktur

Kode yang sudah ada memakai Cloudflare Workers untuk API, D1 untuk data dan sesi,
R2 untuk foto, serta Supabase Auth untuk memverifikasi akun. Gunakan database dan
bucket milik perusahaan. Jangan memakai ID contoh yang ada dalam konfigurasi lokal.

1. Buat database D1 baru dan bucket R2 privat di akun Cloudflare. Jangan membuka
   akses publik bucket; foto dilayani melalui API aplikasi. Catat nama dan ID D1.
2. Siapkan proyek Supabase Auth. Aktifkan konfirmasi email dan konfigurasi pengiriman
   email produksi. Siapkan email pemilik `zakikhaliq31@gmail.com`; alamat ini sudah
   menjadi admin pada kode sebelumnya. Akun lain memerlukan persetujuan admin.
3. Di GitHub, buat environment `production` melalui Settings → Environments.
   Batasi deployment ke branch `main`. Tambahkan konfigurasi di bawah ini.

| Jenis | Nama | Isi |
| --- | --- | --- |
| Variable | DGG_WORKER_NAME | Nama Worker produksi |
| Variable | DGG_D1_DATABASE_ID | UUID database D1 baru |
| Variable | DGG_D1_DATABASE_NAME | Nama database D1 |
| Variable | DGG_R2_BUCKET_NAME | Nama bucket R2 privat |
| Secret | CLOUDFLARE_ACCOUNT_ID | ID akun Cloudflare pemilik sumber daya |
| Secret | CLOUDFLARE_API_TOKEN | Token khusus deployment untuk akun tersebut; izin Workers Scripts, D1, R2 sesuai kebutuhan deployment |
| Secret | SUPABASE_URL | URL proyek Supabase |
| Secret | SUPABASE_PUBLISHABLE_KEY | Publishable key atau anon key; bukan service-role key |

Nilai autentikasi dikirim melalui stdin ke penyimpanan secret Worker. Jangan
menaruh kata sandi atau token dalam repository, HTML, issue, atau chat.

## Deployment pertama

Setelah perubahan digabung ke `main`, buka Actions → Deploy server Duta Global
Group → Run workflow. Workflow memeriksa konfigurasi, menjalankan pengujian,
membangun Worker, menerapkan migrasi SQL yang belum tercatat, memasang konfigurasi
autentikasi, lalu menerbitkan aplikasi. Hasil build harus menunjuk database dan
bucket yang dipilih; ID database lokal ditolak. Workflow ini tidak berjalan
otomatis pada push dan tidak mengganti halaman GitHub Pages.

Migrasi ini ditujukan untuk D1 baru. Untuk database lama yang sudah mempunyai
skema tetapi belum mempunyai catatan migrasi Wrangler, cocokkan riwayat migrasi
terlebih dahulu. Jangan menjalankan ulang SQL secara manual pada database lama.

Sesudah alamat HTTPS Worker diketahui, tetapkan Site URL dan redirect URL
`https://ALAMAT-WORKER/api/auth/callback` di Supabase. Jika memakai Google,
konfigurasikan provider Google di Supabase juga; tombol Google tidak cukup tanpa
konfigurasi provider. Periksa alur daftar, konfirmasi email, masuk, persetujuan
admin, keluar, serta penolakan perubahan tanpa sesi yang sah.

## Memindahkan data sebelum mengganti alamat utama

Database baru dimulai kosong. Klik **Unduh cadangan JSON** pada browser yang
menyimpan perubahan terbaru di situs GitHub Pages. Simpan cadangan tersebut
secara privat. Snapshot yang tertanam pada HTML publik belum tentu memuat edit
terbaru dari browser Anda. Pemindahan data/foto masih perlu dilakukan melalui
jalur admin yang tervalidasi; workflow ini tidak mengimpor cadangan tersebut.

Setelah impor, cocokkan jumlah proyek, detail, riwayat, koordinat, dan foto.
Uji penyimpanan dari satu perangkat lalu baca hasilnya pada perangkat lain.
Jangan mengganti `index.html` menjadi pengalihan sampai data lengkap dan pengujian
login serta penyimpanan server berhasil. Pertahankan cadangan lokal selama transisi.

## Operasional

Sebelum migrasi berikutnya, buat ekspor D1 privat dan cadangan objek R2 melalui
akun hosting; jangan menyimpan dump sesi autentikasi sebagai artifact publik.
Konfigurasi ini belum menyediakan pencadangan otomatis. Tentukan retensi dan
uji pemulihan sebelum digunakan sebagai satu-satunya penyimpanan perusahaan.

Pemeriksaan lokal yang tersedia:

```sh
node --test tests/production-config.test.mjs
node tests/access-policy.test.mjs
node tests/mutation-security.test.mjs
```

Build produksi memakai `DGG_DEPLOY_TARGET=cloudflare` dan empat variable DGG di
atas. Preview lokal tidak menerima mode produksi, agar pengembangan tidak memakai
penyimpanan perusahaan. `node scripts/check-production.mjs --built` memeriksa
binding hasil build sebelum deployment.

Rujukan: https://developers.cloudflare.com/workers/vite-plugin/get-started/
dan https://developers.cloudflare.com/workers/wrangler/configuration/.

## Pembatasan akses dan tampilan

Halaman utama sekarang memeriksa sesi di server sebelum menampilkan dashboard.
Tanpa sesi yang disetujui, pengunjung hanya menerima halaman masuk. API proyek,
monitoring, progres, dan foto juga memeriksa sesi secara terpisah. Foto tidak lagi
menggunakan cache publik. Keluar mengembalikan pengguna ke halaman masuk.
Tampilan diperbarui dengan identitas navy, formulir login responsif, tombol tampilkan
kata sandi, status error, dan keadaan memproses.

Jalankan `node tests/read-access.test.mjs` untuk memeriksa bahwa sesi kosong, pending,
blocked, dan layanan sesi gagal tidak dapat membaca data. Perubahan ini berlaku
setelah server diterbitkan, bukan pada salinan HTML publik GitHub Pages yang lama.
Data yang sudah pernah diterbitkan di repository publik tidak menjadi rahasia
hanya karena akses pada server baru diperketat.
