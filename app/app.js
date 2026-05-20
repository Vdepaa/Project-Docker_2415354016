const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

// Debugging untuk memastikan file .env terbaca di log Docker
console.log("Nilai DB_HOST yang dibaca backend:", process.env.DB_HOST);

const app = express();
app.use(express.json());

// Konfigurasi koneksi database menggunakan Pool sesuai template latihan
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306 // Tambahan aman agar port dibaca sebagai angka
});

// Fungsi inisialisasi database otomatis saat container menyala
const initDatabase = () => {
    connection.query('SELECT 1', (err) => {
        if (err) {
            console.log('Database belum ready, retry 3 detik lagi...', err.message);
            setTimeout(initDatabase, 3000); // Melakukan retry otomatis jika MySQL masih booting
            return;
        }
        
        console.log('Database connected');
        // Membuat tabel 'users' minimalis (hanya id dan name) sesuai modul latihan
        connection.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        )`);
    });
};

// Jalankan fungsi inisialisasi
initDatabase();

// [GET] / - Halaman utama penanda backend berjalan
app.get('/', (req, res) => {
    res.send('Depa 2415354016 Docker Running');
});

// [GET] /users - Ambil semua user (hanya kolom id dan name)
app.get('/users', (req, res) => {
    connection.query('SELECT id, name FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// [POST] /users - Tambah user baru (hanya mengirimkan name)
app.post('/users', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Nama wajib diisi" });
    }

    connection.query(
        'INSERT INTO users (name) VALUES (?)',
        [name],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: results.insertId, name });
        }
    );
});

// Menggunakan port dinamis dari .env (default ke 3000) dan mengikat ke host '0.0.0.0' agar bisa diakses luar container
const port = process.env.APP_PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});