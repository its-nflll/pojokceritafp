# App Starter Project with Webpack

Proyek ini adalah setup dasar untuk aplikasi web yang menggunakan webpack untuk proses bundling, Babel untuk transpile JavaScript, serta mendukung proses build dan serving aplikasi.

## Table of Contents

- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Mengakses Kamera di Development Mode](#mengakses-kamera-di-development-mode)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (disarankan versi 12 atau lebih tinggi)
- [npm](https://www.npmjs.com/) (Node package manager)

### Installation

1. Download starter project [di sini](https://raw.githubusercontent.com/dicodingacademy/a219-web-intermediate-labs/099-shared-files/starter-project-with-webpack.zip).
2. Lakukan unzip file.
3. Pasang seluruh dependencies dengan perintah berikut.
   ```shell
   npm install
   ```

## Scripts

- Build for Production:
  ```shell
  npm run build
  ```
  Script ini menjalankan webpack dalam mode production menggunakan konfigurasi `webpack.prod.js` dan menghasilkan sejumlah file build ke direktori `dist`.

- Start Development Server (dengan HTTPS):
  ```shell
  npm run start-dev
  ```
  Script ini menjalankan server pengembangan webpack dengan HTTPS dan fitur live reload. HTTPS diaktifkan secara default untuk mendukung akses kamera.

- Start Development Server (port alternatif):
  ```shell
  npm run start-alt
  ```
  Sama seperti `start-dev` tapi menggunakan port 8080 jika port 9000 sudah digunakan.

- Serve (untuk testing build production):
  ```shell
  npm run serve
  ```
  Script ini menggunakan [`http-server`](https://www.npmjs.com/package/http-server) untuk menyajikan konten dari direktori `dist`.

- Serve dengan HTTPS:
  ```shell
  npm run serve-https
  ```
  Menjalankan http-server dengan HTTPS untuk mendukung akses kamera di build production. Memerlukan sertifikat SSL di folder `cert/`.

## Project Structure

Proyek starter ini dirancang agar kode tetap modular dan terorganisir.

```text
starter-project/
├── dist/                   # Compiled files for production
├── src/                    # Source project files
│   ├── public/             # Public files
│   ├── scripts/            # Source JavaScript files
│   │   └── index.js        # Main JavaScript entry file
│   ├── styles/             # Source CSS files
│   │   └── styles.css      # Main CSS file
│   └── index.html/         # Main HTML file
├── package.json            # Project metadata and dependencies
├── package-lock.json       # Project metadata and dependencies
├── README.md               # Project documentation
├── STUDENT.txt             # Student information
├── webpack.common.js       # Webpack common configuration
├── webpack.dev.js          # Webpack development configuration
└── webpack.prod.js         # Webpack production configuration
```

## Mengakses Kamera di Development Mode

### Metode yang Disarankan

Server development sekarang **dikonfigurasi dengan HTTPS secara default**, yang harus memungkinkan akses kamera bekerja tanpa konfigurasi tambahan. Saat pertama kali mengakses, browser akan menampilkan peringatan tentang sertifikat self-signed - cukup klik "Proceed/Lanjutkan" untuk melanjutkan.

### Jika Masih Menghadapi Masalah

Jika kamera masih tidak berfungsi, coba salah satu dari opsi berikut:

1. **Gunakan browser desktop yang berbeda**: Chrome atau Firefox terbaru umumnya memiliki dukungan kamera terbaik.

2. **Akses dari URL yang berbeda**:
   - Coba dengan `localhost` daripada IP
   - Contoh: `https://localhost:9000` daripada `https://192.168.x.x:9000`

3. **Gunakan port alternatif**:
   ```shell
   npm run start-alt
   ```
   Ini menjalankan server di port 8080 sebagai alternatif.

4. **Konfigurasi Chrome untuk development**:
   - Buka `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   - Tambahkan URL development server Anda (mis: `http://localhost:9000` atau `http://192.168.x.x:9000`)
   - Aktifkan flag dan restart browser

### Alternatif Untuk Upload Gambar

Aplikasi menyediakan alternatif untuk menggunakan file upload jika kamera tidak tersedia. Lihat link "mengupload foto" yang tersedia di aplikasi.
