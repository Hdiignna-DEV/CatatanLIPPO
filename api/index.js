require('dotenv').config({ path: '../.env' }); // Perbarui path ke .env di root proyek

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Port tidak perlu didefinisikan untuk Vercel Functions, karena Vercel yang menanganinya
// const port = process.env.PORT || 5000;

// Middleware
// Penting: Konfigurasi CORS untuk mengizinkan permintaan dari domain Vercel frontend Anda
// process.env.FRONTEND_URL harus diatur di Vercel Environment Variables
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Sesuaikan dengan URL frontend Vercel Anda
}));
app.use(express.json());

// Koneksi ke MongoDB
// Pastikan MONGODB_URI diatur di Vercel Environment Variables
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Definisikan Skema dan Model (contoh untuk Keuangan)
const financeSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'pemasukan' atau 'pengeluaran'
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});
const Finance = mongoose.model('Finance', financeSchema);

// TODO: Definisikan skema dan model untuk Lomba, Doorprize, Jadwal
// Contoh:
// const contestSchema = new mongoose.Schema({
//     name: String,
//     details: String,
//     date: Date,
//     time: String,
//     prize: String
// });
// const Contest = mongoose.model('Contest', contestSchema);

// const doorprizeSchema = new mongoose.Schema({
//     number: String,
//     status: { type: String, enum: ['available', 'taken'], default: 'available' },
//     winner: String, // Opsional
//     prizeDetail: String // Opsional
// });
// const Doorprize = mongoose.model('Doorprize', doorprizeSchema);

// const scheduleSchema = new mongoose.Schema({
//     time: String,
//     title: String,
//     description: String,
//     location: String,
//     date: Date
// });
// const Schedule = mongoose.model('Schedule', scheduleSchema);


// Rute API (contoh untuk Keuangan)
// Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => {
    try {
        const finances = await Finance.find();

        // Hitung ringkasan dari data dinamis
        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        // Untuk rincian pengeluaran, idealnya Anda akan mengelompokkan transaksi dari DB berdasarkan kategori.
        // Untuk saat ini, kita bisa pertahankan data statis atau menambahkan logika kategori di skema Finance.
        const rincianPengeluaran = {
            dekorasiPerlengkapan: 3500000, // Placeholder statis untuk demo
            hadiahLomba: 2800000,
            konsumsi: 1200000,
            doorprize: 700000
        };

        res.json({
            finances,
            summary: {
                totalPemasukan,
                totalPengeluaran,
                sisaDana,
                rataRataPerKK: 260000 // Ini juga data statis untuk demo
            },
            rincianPengeluaran
        });
    } catch (err) {
        console.error(err); // Log error di server
        res.status(500).json({ message: 'Server error fetching finances.' });
    }
});

// Menambahkan transaksi keuangan baru
app.post('/api/finances', async (req, res) => {
    const { type, description, amount } = req.body; // Jika Anda menambahkan 'category', tambahkan di sini juga

    const finance = new Finance({
        type,
        description,
        amount
        // category // uncomment jika category ditambahkan ke skema
    });
    try {
        const newFinance = await finance.save();
        res.status(201).json(newFinance);
    } catch (err) {
        console.error(err); // Log error di server
        res.status(400).json({ message: 'Error adding finance transaction.' });
    }
});

// TODO: Buat rute API untuk Lomba, Doorprize, Jadwal (GET, POST, PUT, DELETE)
// Contoh rute untuk Lomba:
// app.get('/api/contests', async (req, res) => {
//     try {
//         const contests = await Contest.find();
//         res.json({ contests });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });
// app.post('/api/contests', async (req, res) => {
//     const contest = new Contest(req.body);
//     try {
//         const newContest = await contest.save();
//         res.status(201).json(newContest);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });


// EXPORT Express app sebagai fungsi handler
// Ini PENTING untuk Vercel Serverless Functions
module.exports = app;

// Hapus bagian app.listen() karena Vercel yang menanganinya
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });