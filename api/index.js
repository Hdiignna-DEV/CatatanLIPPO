require('dotenv').config({ path: '../.env' }); // Path ke .env di root proyek

const express = require('express');
const sql = require('mssql'); // Menggunakan mssql untuk Azure SQL
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Fallback untuk development lokal
}));
app.use(express.json()); // Parsing body permintaan JSON

// Konfigurasi Koneksi Azure SQL Server
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., 'your_server_name.database.windows.net'
    database: process.env.DB_DATABASE, // e.g., 'catatanlippo-db'
    options: {
        encrypt: true, // WAJIB untuk Azure SQL Database
        trustServerCertificate: false // Atur ke true untuk dev local jika ada masalah SSL, tapi false lebih aman untuk produksi
    }
};

// Global Connection Pool untuk reuse koneksi
let pool; // Variabel untuk menyimpan pool koneksi

async function connectDb() {
    try {
        if (!pool || !pool.connected) {
            console.log('Creating new SQL connection pool...');
            pool = new sql.ConnectionPool(config);
            await pool.connect();
            console.log('Connected to Azure SQL Database');
        }
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err.message); // Log pesan error spesifik
        throw err; // Lempar error agar ditangkap di route
    }
}

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
        const request = await pool.request();
        const result = await request
            .input('type', sql.NVarChar, type)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Decimal(18, 2), amount)
            .query(`INSERT INTO Finances (type, description, amount, date) VALUES (@type, @description, @amount, GETDATE()); SELECT SCOPE_IDENTITY() AS id`);

        const newId = result.recordset[0].id;
        res.status(201).json({ _id: newId, type, description, amount, date: new Date() });
    } catch (err) {
        console.error('Error adding finance transaction:', err.message);
        res.status(400).json({ message: 'Error adding finance transaction: ' + err.message });
    }
});

// READ All: Mendapatkan semua transaksi keuangan
app.get('/api/finances', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request.query('SELECT id, type, description, amount, date FROM Finances');
        const finances = result.recordset.map(row => ({
            _id: row.id, // Sesuaikan dengan nama kolom ID di tabel Anda (id)
            type: row.type,
            description: row.description,
            amount: parseFloat(row.amount),
            date: row.date
        }));

        const totalPemasukan = finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPengeluaran = finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
        const sisaDana = totalPemasukan - totalPengeluaran;

        const rincianPengeluaran = { /* Statis */
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
        console.error('Server error fetching finances:', err.message);
        res.status(500).json({ message: 'Server error fetching finances: ' + err.message });
    }
});

// READ One: Mendapatkan satu transaksi keuangan berdasarkan ID
app.get('/api/finances/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('SELECT id, type, description, amount, date FROM Finances WHERE id = @id');

        const finance = result.recordset[0];
        if (!finance) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        res.json({
            _id: finance.id,
            type: finance.type,
            description: finance.description,
            amount: parseFloat(finance.amount),
            date: finance.date
        });
    } catch (err) {
        console.error('Error fetching single finance transaction:', err.message);
        res.status(500).json({ message: 'Error fetching single finance transaction: ' + err.message });
    }
});

// UPDATE: Memperbarui transaksi keuangan berdasarkan ID
app.put('/api/finances/:id', async (req, res) => {
    const { type, description, amount } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .input('type', sql.NVarChar, type)
            .input('description', sql.NVarChar, description)
            .input('amount', sql.Decimal(18, 2), amount)
            .query('UPDATE Finances SET type = @type, description = @description, amount = @amount WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        res.json({ _id: parseInt(req.params.id), type, description, amount }); // Kirim kembali data yang diperbarui
    } catch (err) {
        console.error('Error updating finance transaction:', err.message);
        res.status(400).json({ message: 'Error updating finance transaction: ' + err.message });
    }
});

// DELETE: Menghapus transaksi keuangan berdasarkan ID
app.delete('/api/finances/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Finances WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting finance transaction:', err.message);
        res.status(500).json({ message: 'Error deleting finance transaction: ' + err.message });
    }
});


// =========================================================
// Rute API untuk Lomba (Contest) - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/contests', async (req, res) => {
    const { name, details, date, time, prize } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('name', sql.NVarChar, name)
            .input('details', sql.NVarChar, details)
            .input('date', sql.Date, new Date(date)) // Pastikan tanggal dalam format Date
            .input('time', sql.NVarChar, time)
            .input('prize', sql.NVarChar, prize)
            .query(`INSERT INTO Contests (name, details, date, time, prize) VALUES (@name, @details, @date, @time, @prize); SELECT SCOPE_IDENTITY() AS id`);

        const newId = result.recordset[0].id;
        res.status(201).json({ _id: newId, name, details, date, time, prize });
    } catch (err) {
        console.error('Error adding contest:', err.message);
        res.status(400).json({ message: 'Error adding contest: ' + err.message });
    }
});

// READ All
app.get('/api/contests', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request.query('SELECT id, name, details, date, time, prize FROM Contests ORDER BY date ASC, time ASC');
        const contests = result.recordset.map(row => ({
            _id: row.id,
            name: row.name,
            details: row.details,
            date: row.date,
            time: row.time,
            prize: row.prize
        }));
        res.json({ contests });
    }
    catch (err) {
        console.error('Server error fetching contests:', err.message);
        res.status(500).json({ message: 'Server error fetching contests: ' + err.message });
    }
});

// READ One
app.get('/api/contests/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('SELECT id, name, details, date, time, prize FROM Contests WHERE id = @id');

        const contest = result.recordset[0];
        if (!contest) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json({
            _id: contest.id,
            name: contest.name,
            details: contest.details,
            date: contest.date,
            time: contest.time,
            prize: contest.prize
        });
    } catch (err) {
        console.error('Error fetching single contest:', err.message);
        res.status(500).json({ message: 'Error fetching single contest: ' + err.message });
    }
});

// UPDATE
app.put('/api/contests/:id', async (req, res) => {
    const { name, details, date, time, prize } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .input('name', sql.NVarChar, name)
            .input('details', sql.NVarChar, details)
            .input('date', sql.Date, new Date(date))
            .input('time', sql.NVarChar, time)
            .input('prize', sql.NVarChar, prize)
            .query('UPDATE Contests SET name = @name, details = @details, date = @date, time = @time, prize = @prize WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json({ _id: parseInt(req.params.id), name, details, date, time, prize });
    } catch (err) {
        console.error('Error updating contest:', err.message);
        res.status(400).json({ message: 'Error updating contest: ' + err.message });
    }
});

// DELETE
app.delete('/api/contests/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Contests WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Lomba tidak ditemukan' });
        res.json({ message: 'Lomba berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting contest:', err.message);
        res.status(500).json({ message: 'Error deleting contest: ' + err.message });
    }
});

// =========================================================
// Rute API untuk Doorprize - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/doorprize', async (req, res) => {
    const { number, status, winner, prizeDetail } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('number', sql.NVarChar, number)
            .input('status', sql.NVarChar, status)
            .input('winner', sql.NVarChar, winner || null)
            .input('prizeDetail', sql.NVarChar, prizeDetail || null)
            .query(`INSERT INTO DoorprizeItems (number, status, winner, prizeDetail) VALUES (@number, @status, @winner, @prizeDetail); SELECT SCOPE_IDENTITY() AS id`);

        const newId = result.recordset[0].id;
        res.status(201).json({ _id: newId, number, status, winner, prizeDetail });
    } catch (err) {
        console.error('Error adding doorprize:', err.message);
        res.status(400).json({ message: 'Error adding doorprize: ' + err.message });
    }
});

// READ All
app.get('/api/doorprize', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request.query('SELECT id, number, status, winner, prizeDetail FROM DoorprizeItems ORDER BY number ASC');
        const doorprizeItems = result.recordset.map(row => ({
            _id: row.id,
            number: row.number,
            status: row.status,
            winner: row.winner,
            prizeDetail: row.prizeDetail
        }));
        const availableCount = doorprizeItems.filter(item => item.status === 'available').length;
        const takenCount = doorprizeItems.filter(item => item.status === 'taken').length;
        res.json({ doorprizeItems, summary: { available: availableCount, taken: takenCount } });
    } catch (err) {
        console.error('Server error fetching doorprize:', err.message);
        res.status(500).json({ message: 'Server error fetching doorprize: ' + err.message });
    }
});

// READ One
app.get('/api/doorprize/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('SELECT id, number, status, winner, prizeDetail FROM DoorprizeItems WHERE id = @id');

        const doorprize = result.recordset[0];
        if (!doorprize) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json({
            _id: doorprize.id,
            number: doorprize.number,
            status: doorprize.status,
            winner: doorprize.winner,
            prizeDetail: doorprize.prizeDetail
        });
    } catch (err) {
        console.error('Error fetching single doorprize:', err.message);
        res.status(500).json({ message: 'Error fetching single doorprize: ' + err.message });
    }
});

// UPDATE
app.put('/api/doorprize/:id', async (req, res) => {
    const { number, status, winner, prizeDetail } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .input('number', sql.NVarChar, number)
            .input('status', sql.NVarChar, status)
            .input('winner', sql.NVarChar, winner || null)
            .input('prizeDetail', sql.NVarChar, prizeDetail || null)
            .query('UPDATE DoorprizeItems SET number = @number, status = @status, winner = @winner, prizeDetail = @prizeDetail WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json({ _id: parseInt(req.params.id), number, status, winner, prizeDetail });
    } catch (err) {
        console.error('Error updating doorprize:', err.message);
        res.status(400).json({ message: 'Error updating doorprize: ' + err.message });
    }
});

// DELETE
app.delete('/api/doorprize/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM DoorprizeItems WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Doorprize tidak ditemukan' });
        res.json({ message: 'Doorprize berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting doorprize:', err.message);
        res.status(500).json({ message: 'Error deleting doorprize: ' + err.message });
    }
});

// =========================================================
// Rute API untuk Jadwal (Schedule) - CRUD Penuh
// =========================================================

// CREATE
app.post('/api/schedule', async (req, res) => {
    const { time, title, description, location, date } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('time', sql.NVarChar, time)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description)
            .input('location', sql.NVarChar, location || null)
            .input('date', sql.Date, new Date(date))
            .query(`INSERT INTO Schedules (time, title, description, location, date) VALUES (@time, @title, @description, @location, @date); SELECT SCOPE_IDENTITY() AS id`);

        const newId = result.recordset[0].id;
        res.status(201).json({ _id: newId, time, title, description, location, date });
    } catch (err) {
        console.error('Error adding schedule item:', err.message);
        res.status(400).json({ message: 'Error adding schedule item: ' + err.message });
    }
});

// READ All
app.get('/api/schedule', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request.query('SELECT id, time, title, description, location, date FROM Schedules ORDER BY date ASC, time ASC');
        const scheduleItems = result.recordset.map(row => ({
            _id: row.id,
            time: row.time,
            title: row.title,
            description: row.description,
            location: row.location,
            date: row.date
        }));
        res.json({ scheduleItems });
    } catch (err) {
        console.error('Server error fetching schedule:', err.message);
        res.status(500).json({ message: 'Server error fetching schedule: ' + err.message });
    }
});

// READ One
app.get('/api/schedule/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('SELECT id, time, title, description, location, date FROM Schedules WHERE id = @id');

        const schedule = result.recordset[0];
        if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json({
            _id: schedule.id,
            time: schedule.time,
            title: schedule.title,
            description: schedule.description,
            location: schedule.location,
            date: schedule.date
        });
    } catch (err) {
        console.error('Error fetching single schedule item:', err.message);
        res.status(500).json({ message: 'Error fetching single schedule item: ' + err.message });
    }
});

// UPDATE
app.put('/api/schedule/:id', async (req, res) => {
    const { time, title, description, location, date } = req.body;
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .input('time', sql.NVarChar, time)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description)
            .input('location', sql.NVarChar, location || null)
            .input('date', sql.Date, new Date(date))
            .query('UPDATE Schedules SET time = @time, title = @title, description = @description, location = @location, date = @date WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json({ _id: parseInt(req.params.id), time, title, description, location, date });
    } catch (err) {
        console.error('Error updating schedule item:', err.message);
        res.status(400).json({ message: 'Error updating schedule item: ' + err.message });
    }
});

// DELETE
app.delete('/api/schedule/:id', async (req, res) => {
    try {
        const request = await pool.request();
        const result = await request
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM Schedules WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting schedule item:', err.message);
        res.status(500).json({ message: 'Error deleting schedule item: ' + err.message });
    }
});


// EXPORT Express app sebagai fungsi handler
module.exports = app;