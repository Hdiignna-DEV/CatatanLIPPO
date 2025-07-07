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

// =========================================================
// Definisikan Skema dan Model Mongoose
// =========================================================

// Skema untuk Keuangan (Finance)
const financeSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'pemasukan' atau 'pengeluaran'
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});
const Finance = mongoose.model('Finance', financeSchema);

// Skema untuk Lomba (Contest)
const contestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    details: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    prize: { type: String, required: true }
});
const Contest = mongoose.model('Contest', contestSchema);

// Skema untuk Doorprize
const doorprizeSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true }, // Nomor kupon harus unik
    status: { type: String, enum: ['available', 'taken'], default: 'available' },
    winner: { type: String }, // Nama pemenang, opsional
    prizeDetail: { type: String } // Deskripsi hadiah, opsional
});
const Doorprize = mongoose.model('Doorprize', doorprizeSchema);

// Skema untuk Jadwal (Schedule)
const scheduleSchema = new mongoose.Schema({
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String }, // Opsional
    date: { type: Date, required: true }
});
const Schedule = mongoose.model('Schedule', scheduleSchema);


// =========================================================
// Rute API untuk Keuangan (Finance) - CRUD Penuh
// =========================================================

// CREATE: Menambahkan transaksi keuangan baru
app.post('/api/finances', async (req, res) => {
    const { type, description, amount } = req.body;
    const finance = new Finance({ type, description, amount });
    try {
        const newFinance = await finance.save();
        res.status(201).json(newFinance);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding finance transaction: ' + err.message });
    }
});

// READ All: Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => {
    try {
        const finances = await Finance.find(); // Mengambil semua transaksi

        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        const rincianPengeluaran = { // Ini masih statis, bisa diperluas di masa depan dengan kategori transaksi
            dekorasiPerlengkapan: 3500000, // Placeholder statis untuk demo
            hadiahLomba: 2800000,
            konsumsi: 1200000,
            doorprize: 700000
        };

        res.json({
            finances, // Mengirimkan detail setiap transaksi
            summary: {
                totalPemasukan,
                totalPengeluaran,
                sisaDana,
                rataRataPerKK: 260000 // Statis untuk demo
            },
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
        const finance = await Finance.findById(req.params.id);
        if (!finance) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        res.json(finance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching single finance transaction: ' + err.message });
    }
});

// UPDATE: Memperbarui transaksi keuangan berdasarkan ID
app.put('/api/finances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, amount } = req.body;

        const updatedFinance = await Finance.findByIdAndUpdate(
            id,
            { type, description, amount },
            { new: true, runValidators: true } // `new: true` mengembalikan dokumen yang sudah diupdate
                                               // `runValidators: true` menjalankan validasi skema
        );

        if (!updatedFinance) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        res.json(updatedFinance);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error updating finance transaction: ' + err.message });
    }
});

// DELETE: Menghapus transaksi keuangan berdasarkan ID
app.delete('/api/finances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFinance = await Finance.findByIdAndDelete(id);

        if (!deletedFinance) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting finance transaction: ' + err.message });
    }
});


// =========================================================
// Rute API untuk Lomba (Contest) - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/contests', async (req, res) => {
    const contest = new Contest(req.body);
    try {
        const newContest = await contest.save();
        res.status(201).json(newContest);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding contest: ' + err.message });
    }
});

// READ All
app.get('/api/contests', async (req, res) => {
    try {
        const contests = await Contest.find();
        res.json({ contests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching contests: ' + err.message });
    }
});

// READ One
app.get('/api/contests/:id', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json(contest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching single contest: ' + err.message });
    }
});

// UPDATE
app.put('/api/contests/:id', async (req, res) => {
    try {
        const updatedContest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedContest) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json(updatedContest);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error updating contest: ' + err.message });
    }
});

// DELETE
app.delete('/api/contests/:id', async (req, res) => {
    try {
        const deletedContest = await Contest.findByIdAndDelete(req.params.id);
        if (!deletedContest) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json({ message: 'Lomba berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting contest: ' + err.message });
    }
});

// =========================================================
// Rute API untuk Doorprize - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/doorprize', async (req, res) => {
    const doorprize = new Doorprize(req.body);
    try {
        const newDoorprize = await doorprize.save();
        res.status(201).json(newDoorprize);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding doorprize: ' + err.message });
    }
});

// READ All
app.get('/api/doorprize', async (req, res) => {
    try {
        const doorprizeItems = await Doorprize.find();
        const availableCount = doorprizeItems.filter(item => item.status === 'available').length;
        const takenCount = doorprizeItems.filter(item => item.status === 'taken').length;
        res.json({ doorprizeItems, summary: { available: availableCount, taken: takenCount } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching doorprize: ' + err.message });
    }
});

// READ One
app.get('/api/doorprize/:id', async (req, res) => {
    try {
        const doorprize = await Doorprize.findById(req.params.id);
        if (!doorprize) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json(doorprize);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching single doorprize: ' + err.message });
    }
});

// UPDATE
app.put('/api/doorprize/:id', async (req, res) => {
    try {
        const updatedDoorprize = await Doorprize.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedDoorprize) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json(updatedDoorprize);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error updating doorprize: ' + err.message });
    }
});

// DELETE
app.delete('/api/doorprize/:id', async (req, res) => {
    try {
        const deletedDoorprize = await Doorprize.findByIdAndDelete(req.params.id);
        if (!deletedDoorprize) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json({ message: 'Doorprize berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting doorprize: ' + err.message });
    }
});

// =========================================================
// Rute API untuk Jadwal (Schedule) - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/schedule', async (req, res) => {
    const schedule = new Schedule(req.body);
    try {
        const newSchedule = await schedule.save();
        res.status(201).json(newSchedule);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error adding schedule item: ' + err.message });
    }
});

// READ All
app.get('/api/schedule', async (req, res) => {
    try {
        const scheduleItems = await Schedule.find().sort({ date: 1, time: 1 }); // Urutkan berdasarkan tanggal dan waktu
        res.json({ scheduleItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching schedule: ' + err.message });
    }
});

// READ One
app.get('/api/schedule/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json(schedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching single schedule item: ' + err.message });
    }
});

// UPDATE
app.put('/api/schedule/:id', async (req, res) => {
    try {
        const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedSchedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json(updatedSchedule);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error updating schedule item: ' + err.message });
    }
});

// DELETE
app.delete('/api/schedule/:id', async (req, res) => {
    try {
        const deletedSchedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!deletedSchedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting schedule item: ' + err.message });
    }
});


// EXPORT Express app sebagai fungsi handler
module.exports = app;

// Baris app.listen() tidak diperlukan untuk Vercel Functions