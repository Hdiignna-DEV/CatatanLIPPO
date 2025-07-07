require('dotenv').config({ path: '../.env' }); // Path ke .env di root proyek

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
// Konfigurasi CORS untuk mengizinkan permintaan dari domain Vercel frontend Anda
// process.env.FRONTEND_URL harus diatur di Vercel Environment Variables
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Fallback untuk development lokal
}));
app.use(express.json()); // Parsing body permintaan JSON

// Koneksi ke MongoDB
// Pastikan MONGODB_URI diatur di Vercel Environment Variables
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Definisikan Skema dan Model
const financeSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});
const Finance = mongoose.model('Finance', financeSchema);

// TODO: Definisikan skema dan model untuk Lomba, Doorprize, Jadwal jika sudah ada di backend Anda

// Rute API
// PENTING: Path rute di sini adalah yang akan dicari oleh Express.js.
// Kita kembalikan '/api/finances' karena itu yang diterima oleh Express setelah routing Vercel.

// Rute untuk Keuangan
// Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => { // Dikembalikan ke '/api/finances'
    try {
        const finances = await Finance.find();

        // Hitung ringkasan dari data dinamis
        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        const rincianPengeluaran = {
            dekorasiPerlengkapan: 3500000,
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
                rataRataPerKK: 260000
            },
            rincianPengeluaran
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching finances.' });
    }
});

// Menambahkan transaksi keuangan baru
app.post('/api/finances', async (req, res) => { // Dikembalikan ke '/api/finances'
    const { type, description, amount } = req.body;

    const finance = new Finance({
        type,
        description,
        amount
    });
    try {
        const newFinance = await finance.save();
        res.status(201).json(newFinance);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding finance transaction.' });
    }
});

// TODO: Buat rute API untuk Lomba, Doorprize, Jadwal

// EXPORT Express app sebagai fungsi handler
module.exports = app;

// Baris app.listen() tidak diperlukan untuk Vercel Functions