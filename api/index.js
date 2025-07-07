require('dotenv').config({ path: '../.env' });

const express = require('express');
const sql = require('mssql'); // Mengganti mongoose dengan mssql
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());

// Konfigurasi Koneksi SQL Server
// Menggunakan variabel lingkungan yang akan diatur di Vercel
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., 'your_server_name.database.windows.net'
    database: process.env.DB_DATABASE, // e.g., 'catatanlippo-db'
    options: {
        encrypt: true, // Untuk Azure SQL Database
        trustServerCertificate: false // Ubah ke true untuk dev local tanpa SSL valid
    }
};

// Fungsi untuk membuat koneksi pool ke database SQL
async function connectDb() {
    try {
        if (!sql.globalConnectionPool || !sql.globalConnectionPool.connected) {
             console.log('Creating new SQL connection pool...');
             sql.globalConnectionPool = new sql.ConnectionPool(config);
             await sql.globalConnectionPool.connect();
             console.log('Connected to Azure SQL Database');
        }
        return sql.globalConnectionPool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err; // Lempar error agar ditangkap di route
    }
}

// =========================================================
// Rute API
// =========================================================

// Middleware untuk memastikan koneksi database aktif sebelum setiap route
app.use(async (req, res, next) => {
    try {
        await connectDb();
        next();
    } catch (error) {
        res.status(500).json({ message: 'Database connection error: ' + error.message });
    }
});


// =========================================================
// Rute API untuk Keuangan (Finance) - CRUD Penuh
// =========================================================

// CREATE: Menambahkan transaksi keuangan baru
app.post('/api/finances', async (req, res) => {
    const { type, description, amount } = req.body;
    try {
        const pool = await connectDb(); // Mendapatkan pool koneksi
        const result = await pool.request()
            .input('type', sql.NVarChar, type)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Decimal(18, 2), amount)
            .query(`INSERT INTO Finances (type, description, amount, date) VALUES (@type, @description, @amount, GETDATE()); SELECT SCOPE_IDENTITY() AS id`); // Menambah date otomatis & ambil ID

        const newId = result.recordset[0].id; // Ambil ID yang baru dibuat
        res.status(201).json({ _id: newId, type, description, amount, date: new Date() });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding finance transaction: ' + err.message });
    }
});

// READ All: Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request().query('SELECT * FROM Finances');
        const finances = result.recordset.map(row => ({
            _id: row.id, // Sesuaikan dengan nama kolom ID di tabel Anda (misal 'id')
            type: row.type,
            description: row.description,
            amount: parseFloat(row.amount), // Pastikan ini di-parse sebagai float
            date: row.date
        }));

        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        const rincianPengeluaran = { /* ... tetap statis untuk saat ini ... */
            dekorasiPerlengkapan: 3500000,
            hadiahLomba: 2800000,
            konsumsi: 1200000,
            doorprize: 700000
        };

        res.json({
            finances,
            summary: { totalPemasukan, totalPengeluaran, sisaDana, rataRataPerKK: 260000 },
            rincianPengeluaran
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching finances: ' + err.message });
    }
});

// READ One: Mendapatkan satu transaksi keuangan berdasarkan ID
app.get('/api/finances/:id', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id) // Asumsi ID adalah INT di SQL
            .query('SELECT * FROM Finances WHERE id = @id'); // Sesuaikan nama kolom ID

        const finance = result.recordset[0];
        if (!finance) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        res.json({
            _id: finance.id, // Pastikan ID dikembalikan sebagai _id untuk konsistensi frontend
            type: finance.type,
            description: finance.description,
            amount: parseFloat(finance.amount),
            date: finance.date
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching single finance transaction: ' + err.message });
    }
});

// UPDATE: Memperbarui transaksi keuangan berdasarkan ID
app.put('/api/finances/:id', async (req, res) => {
    const { type, description, amount } = req.body;
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('type', sql.NVarChar, type)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Decimal(18, 2), amount)
            .query('UPDATE Finances SET type = @type, description = @description, amount = @amount WHERE id = @id'); // Sesuaikan nama kolom ID

        if (result.rowsAffected[0] === 0) { // Periksa apakah ada baris yang terpengaruh
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        res.json({ _id: req.params.id, type, description, amount }); // Kirim kembali data yang diperbarui
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error updating finance transaction: ' + err.message });
    }
});

// DELETE: Menghapus transaksi keuangan berdasarkan ID
app.delete('/api/finances/:id', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Finances WHERE id = @id'); // Sesuaikan nama kolom ID

        if (result.rowsAffected[0] === 0) { // Periksa apakah ada baris yang terpengaruh
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting finance transaction: ' + err.message });
    }
});

// =========================================================
// TODO: Ulangi pola di atas untuk Contest, Doorprize, Schedule
// Ini akan jauh lebih banyak kode, karena Anda harus membuat query SQL yang sesuai
// =========================================================
// Contoh rute untuk Lomba (Contest)
// Anda perlu membuat tabel 'Contests' di Azure SQL
// app.post('/api/contests', async (req, res) => { /* ... SQL INSERT ... */ });
// app.get('/api/contests', async (req, res) => { /* ... SQL SELECT ALL ... */ });
// app.get('/api/contests/:id', async (req, res) => { /* ... SQL SELECT ONE ... */ });
// app.put('/api/contests/:id', async (req, res) => { /* ... SQL UPDATE ... */ });
// app.delete('/api/contests/:id', async (req, res) => { /* ... SQL DELETE ... */ });


// EXPORT Express app sebagai fungsi handler
module.exports = app;