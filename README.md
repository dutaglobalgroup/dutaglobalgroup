# Duta Global Group — Sistem Monitoring Proyek

Website Cloudflare: https://dutaglobalgroup.pages.dev/

Kode terbaru berada di `website/`, dapat diedit dengan Visual Studio Code. Aplikasi menjalankan dashboard, monitoring konstruksi, supervisi, perencanaan, peta, foto, dan login email/password dengan persetujuan admin. Data disimpan di Cloudflare D1 dan foto di R2; keduanya tidak dimasukkan ke repository publik ini.

## Pengembangan

1. Buka folder `website` dengan Node.js >=22.13 dan pnpm sesuai `packageManager`.
2. Jalankan `pnpm install --frozen-lockfile`.
3. Isi konfigurasi lokal dalam `.dev.vars` sesuai `.dev.vars.example`. Jangan commit kredensial.
4. Jalankan `pnpm dev`.
5. Edit `ui/dashboard.html` untuk struktur dashboard, `public/*.css` untuk tampilan, `public/*.js` untuk interaksi, dan `app/api` untuk API. Build menyinkronkan HTML ke aplikasi secara otomatis.

## Build dan deployment Cloudflare

- Root directory: `website`
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Deploy command: `pnpm run deploy`
- Branch produksi: `main`
- Worker: `dutaglobalgroup`
- D1 binding `DB`: `dutaglobalgroup-db`
- R2 binding `BUCKET`: `dutaglobalgroup-photos`
- Secrets Worker: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.

Koneksi GitHub–Cloudflare telah diotorisasi dan build produksi berhasil pada 28 Oktober 2026. Commit pada cabang `main` memicu build dan deployment Worker `dutaglobalgroup` secara otomatis. Alamat publik tetap https://dutaglobalgroup.pages.dev/. Periksa status build di Cloudflare sebelum menganggap perubahan telah terbit. Deployment manual juga dapat dilakukan oleh pemilik akun dengan `pnpm run deploy` setelah login Wrangler.

Perubahan data melalui website tersimpan langsung di D1/R2. Perubahan kode dilakukan melalui repository lalu deployment. Jangan menjalankan migrasi database lama secara membabi buta terhadap produksi. Data contoh/seed dinonaktifkan agar data yang sudah dihapus tidak muncul kembali.

## Keamanan

HTTPS dan header keamanan aktif. API perubahan memerlukan akun yang disetujui admin, sesi yang valid, pemeriksaan origin dan batas permintaan. Pengujian login dan sesi menggunakan provider tiruan; keberhasilan login akun pengguna perlu diverifikasi pengguna sendiri. Jangan unggah kata sandi, token, ekspor akun, sesi, atau data produksi ke repository.

## Alamat publik singkat

`dutaglobalgroup.pages.dev` adalah proyek Pages yang meneruskan permintaan ke Worker `dutaglobalgroup` melalui Service binding `APP`. Kode pintu masuk berada di `pages-address/_worker.js`. Database dan foto tetap menggunakan penyimpanan produksi yang sama. Pembaruan Worker langsung digunakan oleh alamat Pages ini; tidak perlu menyalin data atau melakukan deployment ulang Pages untuk setiap perubahan aplikasi. Konfigurasi GitHub Builds tetap dipasang pada Worker, bukan proyek Pages ini.
