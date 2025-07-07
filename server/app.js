require('dotenv').config(); // Muat variabel lingkungan dari .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Izinkan permintaan lintas origin
app.use(express.json()); // Parsing body permintaan JSON

// Koneksi ke MongoDB
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

// Rute API (contoh untuk Keuangan)
// Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => {
    try {
        const finances = await Finance.find();

        // Hitung ringkasan
        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        // Rincian pengeluaran (contoh sederhana, bisa lebih kompleks dengan agregasi)
        const rincianPengeluaran = {
            dekorasiPerlengkapan: 0, // Ini harus dihitung dari kategori di DB
            hadiahLomba: 0,
            konsumsi: 0,
            doorprize: 0
        };
        // Logic untuk mengisi rincianPengeluaran dari data DB Anda akan di sini
        // Untuk demo, kita bisa gunakan angka statis dulu atau menambahkan kategori di skema Finance

        // Untuk demo, kita bisa menggunakan nilai statis untuk rincian pengeluaran,
        // atau Anda bisa menambahkannya sebagai dokumen pengeluaran dengan kategori
        res.json({
            finances,
            summary: {
                totalPemasukan,
                totalPengeluaran,
                sisaDana,
                rataRataPerKK: 260000 // Ini juga data statis, perlu logika jika dinamis
            },
            rincianPengeluaran: { // Ini harus konsisten dengan data yang Anda masukkan
                dekorasiPerlengkapan: 3500000,
                hadiahLomba: 2800000,
                konsumsi: 1200000,
                doorprize: 700000
            }
        });
    } catch (err) {
        console.error(err); // Log error di server
        res.status(500).json({ message: 'Server error fetching finances.' });
    }
});

// Menambahkan transaksi keuangan baru
app.post('/api/finances', async (req, res) => {
    const { type, description, amount, category } = req.body; // Tambahkan category jika Anda berencana menggunakannya

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

// Mulai Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Open your frontend at http://localhost:8080 (assuming you serve public folder there)`);
    console.log(`Access backend API at http://localhost:${port}/api/finances`);
});