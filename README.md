# Stuney Tracker — Versi Multi-User

Ini versi Stuney Tracker yang sudah pakai **backend beneran** (Node.js + Express + PostgreSQL) dan **login akun**, jadi bisa dipakai banyak pelajar sekaligus dan datanya aman tersimpan di server — bukan cuma di browser satu orang seperti versi demo sebelumnya.

## Isi folder ini

```
stuney-project/
  backend/     -> server API (Node.js + Express + PostgreSQL)
  frontend/    -> web app (satu file index.html, HTML+CSS+JS biasa)
  README.md    -> panduan ini
```

## Cara kerja singkat

- **backend** = "otak" yang nyimpen semua data (transaksi, target tabungan, anggaran, akun user) di database PostgreSQL. Semua request harus lewat login (token).
- **frontend** = tampilan yang dibuka pelajar di browser. Dia manggil backend lewat internet (fetch API), bukan nyimpen data sendiri lagi.
- Keduanya **dijalankan/di-hosting terpisah**. Frontend bisa di GitHub Pages / Vercel / subdomain founderku, backend butuh tempat hosting yang bisa jalanin Node.js + database.

---

## 1. Menjalankan di komputer sendiri (buat testing)

### Siapkan database
1. Install PostgreSQL (kalau belum ada).
2. Buat database baru, misal `stuney_tracker`.
3. Jalankan isi file `backend/db/schema.sql` ke database itu (bikin tabel users, transactions, goals, budgets).
   ```
   psql -U postgres -d stuney_tracker -f backend/db/schema.sql
   ```

### Jalankan backend
```
cd backend
npm install
cp .env.example .env
```
Buka file `.env`, isi:
- `DATABASE_URL` — alamat koneksi ke database PostgreSQL kamu
- `JWT_SECRET` — string acak panjang buat keamanan token login (jangan dibagikan ke siapa pun)
- `PORT` — boleh dibiarkan 4000
- `CORS_ORIGIN` — alamat frontend yang boleh akses (untuk lokal, isi `http://localhost:5500`)

Lalu jalankan:
```
npm start
```
Kalau berhasil akan muncul `Stuney Tracker backend jalan di port 4000`.

### Jalankan frontend
Buka file `frontend/index.html` langsung di browser, **atau** jalankan server statis kecil supaya lebih stabil:
```
cd frontend
python3 -m http.server 5500
```
Buka `http://localhost:5500` di browser. Secara default frontend ini nyari backend di `http://localhost:4000/api` (lihat variabel `API_BASE` di bagian atas `<script>` pada `index.html`).

---

## 2. Deploy ke internet (biar bisa dipakai banyak orang)

Ada 2 bagian yang perlu di-deploy terpisah:

### A. Backend + Database

Backend butuh tempat yang bisa menjalankan Node.js terus-menerus (bukan cuma file statis). GitHub Pages **tidak bisa** dipakai untuk ini. Pilihan yang umum dan gampang buat tim kecil:

| Layanan | Gratisan? | Catatan |
|---|---|---|
| **Railway** | Ada free tier | Paling gampang: connect repo GitHub, otomatis deploy, sudah nyediain PostgreSQL juga |
| **Render** | Ada free tier | Mirip Railway, ada Web Service + PostgreSQL managed |
| VPS sendiri (misal DigitalOcean, kalau founderku sudah punya) | Berbayar | Lebih ribet (install Node, PostgreSQL, pm2, nginx manual), tapi paling fleksibel & murah jangka panjang |

Langkah umum di Railway/Render:
1. Push folder `backend/` ini ke repo GitHub.
2. Buat "Web Service" baru, hubungkan ke repo itu, root directory `backend`.
3. Tambahkan PostgreSQL database dari layanan yang sama, lalu isi `DATABASE_URL` di environment variables sesuai yang diberikan.
4. Isi environment variable lain: `JWT_SECRET` (generate random string), `CORS_ORIGIN` (isi dengan alamat frontend yang nanti dipakai, misal `https://stuney.founderku.com`).
5. Jalankan `backend/db/schema.sql` ke database production itu sekali di awal (lewat psql atau tab "Query" yang biasanya disediakan layanan tsb).
6. Setelah deploy jalan, kamu akan dapat alamat seperti `https://stuney-backend-production.up.railway.app`. Alamat inilah yang dipakai frontend.

### B. Frontend

Karena cuma satu file HTML statis, ini bisa naik ke GitHub Pages seperti rencana awal, atau ke Vercel/Netlify.

Sebelum upload, **ubah dulu** baris ini di `frontend/index.html` (dekat bagian atas `<script>`):
```js
var API_BASE = (window.STUNEY_API_BASE) || "http://localhost:4000/api";
```
Ganti `http://localhost:4000/api` dengan alamat backend production dari langkah A di atas, misal:
```js
var API_BASE = (window.STUNEY_API_BASE) || "https://stuney-backend-production.up.railway.app/api";
```

Lalu upload `frontend/index.html` (boleh direname jadi `index.html` di root repo) ke GitHub Pages seperti biasa.

### C. Sambungkan ke subdomain founderku

Setelah frontend live (misal di GitHub Pages dengan alamat bawaan `namaakun.github.io/repo`), tinggal:
1. Di pengaturan domain founderku.com, tambahkan **CNAME record** — misal `stuney` mengarah ke alamat GitHub Pages tadi.
2. Di pengaturan repo GitHub Pages, isi "Custom domain" dengan `stuney.founderku.com`.
3. Tunggu propagasi DNS (biasanya beberapa menit sampai beberapa jam).

Backend-nya sendiri boleh tetap di alamat Railway/Render bawaan, tidak wajib ikut disubdomainkan — yang penting `CORS_ORIGIN` di backend mengizinkan `https://stuney.founderku.com`.

---

## 3. Soal keamanan yang perlu diperhatikan

- **`JWT_SECRET`** di file `.env` itu rahasia — jangan sampai ke-commit ke GitHub publik. File `.env` sudah otomatis diabaikan kalau kamu pakai `.gitignore` standar Node.js (tambahkan baris `.env` ke `.gitignore` kalau belum ada).
- Password user disimpan dalam bentuk **hash** (bcrypt), bukan teks biasa — jadi walaupun database bocor, password asli tidak langsung ketahuan.
- Setiap request ke data (transaksi, target, budget) selalu dicek dulu **milik user yang login**, jadi user A tidak bisa lihat/ubah data user B. Ini sudah diuji.

## 4. Kalau nanti mau menambah fitur dari saran intern (reminder, integrasi e-wallet, dll)

Struktur backend ini sudah modular per fitur (`routes/auth.js`, `routes/transactions.js`, `routes/goals.js`, `routes/budget.js`) — tinggal tambah file route baru dan tabel baru di `schema.sql` kalau nanti mau kembangkan lagi, tanpa perlu bongkar semua yang sudah ada.
