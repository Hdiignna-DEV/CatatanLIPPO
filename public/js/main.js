document.addEventListener('DOMContentLoaded', function() {
    // URL dasar API backend Anda
    // PENTING: Ganti 'http://localhost:5000' dengan URL publik backend Anda setelah di-deploy ke Vercel Functions.
    // Jika frontend dan backend Anda di Vercel, Anda bisa pakai path relatif '/api'.
    const API_BASE_URL = 'https://catatanlippo.vercel.app/api'; // Ganti dengan URL Vercel Anda, atau cukup '/api'

    // Inisialisasi Lucide Icons
    lucide.createIcons();

    // Inisialisasi AOS (Animate On Scroll)
    AOS.init({
        duration: 1000, // Durasi animasi global (milidetik)
        once: true, // Hanya animasikan sekali saat elemen pertama kali terlihat
    });

    // =========================================================
    // Elemen DOM untuk Keuangan
    // =========================================================
    const financeForm = document.getElementById('financeForm');
    const financeIdInput = document.getElementById('financeId');
    const transactionTypeInput = document.getElementById('transactionType');
    const transactionDescriptionInput = document.getElementById('transactionDescription');
    const transactionAmountInput = document.getElementById('transactionAmount');
    const cancelEditFinanceBtn = document.getElementById('cancelEditBtn');
    const financeTransactionsTableBody = document.getElementById('financeTransactionsTableBody');

    // =========================================================
    // Elemen DOM untuk Lomba
    // =========================================================
    const contestForm = document.getElementById('contestForm');
    const contestIdInput = document.getElementById('contestId');
    const contestNameInput = document.getElementById('contestName');
    const contestDetailsInput = document.getElementById('contestDetails');
    const contestDateInput = document.getElementById('contestDate');
    const contestTimeInput = document.getElementById('contestTime');
    const contestPrizeInput = document.getElementById('contestPrize');
    const cancelEditContestBtn = document.getElementById('cancelEditContestBtn');
    const contestTransactionsTableBody = document.getElementById('contestTransactionsTableBody');
    const contestListDisplay = document.querySelector('#lomba .contest-list');

    // =========================================================
    // Elemen DOM untuk Doorprize
    // =========================================================
    const doorprizeForm = document.getElementById('doorprizeForm');
    const doorprizeIdInput = document.getElementById('doorprizeId');
    const doorprizeNumberInput = document.getElementById('doorprizeNumber');
    const doorprizeStatusInput = document.getElementById('doorprizeStatus');
    const doorprizeWinnerInput = document.getElementById('doorprizeWinner');
    const doorprizeDetailInput = document.getElementById('doorprizeDetail');
    const cancelEditDoorprizeBtn = document.getElementById('cancelEditDoorprizeBtn');
    const doorprizeTransactionsTableBody = document.getElementById('doorprizeTransactionsTableBody');
    const doorprizeGridDisplay = document.getElementById('doorprizeGridDisplay');
    const doorprizeStatusSummary = document.getElementById('doorprizeStatusSummary');

    // =========================================================
    // Elemen DOM untuk Jadwal
    // =========================================================
    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleIdInput = document.getElementById('scheduleId');
    const scheduleTitleInput = document.getElementById('scheduleTitle');
    const scheduleDescriptionInput = document.getElementById('scheduleDescription');
    const scheduleDateInput = document.getElementById('scheduleDate');
    const scheduleTimeInput = document.getElementById('scheduleTime');
    const scheduleLocationInput = document.getElementById('scheduleLocation');
    const cancelEditScheduleBtn = document.getElementById('cancelEditScheduleBtn');
    const scheduleTransactionsTableBody = document.getElementById('scheduleTransactionsTableBody');
    const activityTimelineDisplay = document.getElementById('activityTimelineDisplay');


    // =========================================================
    // Fungsi Utama: Ambil Semua Data dan Render Semua Bagian
    // =========================================================
    async function fetchDataAndRender() {
        try {
            // Keuangan
            const financeResponse = await fetch(`${API_BASE_URL}/finances`);
            const financeData = await financeResponse.json();
            renderFinanceSummary(financeData.summary, financeData.rincianPengeluaran);
            renderFinanceTransactionsTable(financeData.finances);

            // Lomba
            const contestResponse = await fetch(`${API_BASE_URL}/contests`);
            const contestData = await contestResponse.json();
            renderContestList(contestData.contests);
            renderContestTransactionsTable(contestData.contests);

            // Doorprize
            const doorprizeResponse = await fetch(`${API_BASE_URL}/doorprize`);
            const doorprizeData = await doorprizeResponse.json();
            renderDoorprizeSummary(doorprizeData.summary);
            renderDoorprizeGrid(doorprizeData.doorprizeItems);
            renderDoorprizeTransactionsTable(doorprizeData.doorprizeItems);

            // Jadwal
            const scheduleResponse = await fetch(`${API_BASE_URL}/schedule`);
            const scheduleData = await scheduleResponse.json();
            renderScheduleTimeline(scheduleData.scheduleItems);
            renderScheduleTransactionsTable(scheduleData.scheduleItems);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data dari server. Pastikan backend berjalan dan URL API sudah benar.');
            // Tampilkan pesan error di tabel/list masing-masing
            financeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-red-500 text-center">Gagal memuat transaksi keuangan.</td></tr>`;
            contestTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-red-500 text-center">Gagal memuat daftar lomba.</td></tr>`;
            doorprizeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-red-500 text-center">Gagal memuat daftar doorprize.</td></tr>`;
            scheduleTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-red-500 text-center">Gagal memuat daftar jadwal.</td></tr>`;
            contestListDisplay.innerHTML = `<li class="contest-item"><div class="text-red-500">Gagal memuat lomba.</div></li>`;
            doorprizeGridDisplay.innerHTML = `<div class="doorprize-item text-red-500">Gagal memuat.</div>`;
            activityTimelineDisplay.innerHTML = `<div class="timeline-item text-red-500">Gagal memuat jadwal.</div>`;
        }
    }

    // =========================================================
    // Fungsi Rendering UI untuk Keuangan
    // =========================================================

    function renderFinanceSummary(summary, expensesDetail) {
        document.querySelector('.finance-item:nth-child(1) .finance-amount').textContent = `Rp ${summary.totalPemasukan.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(2) .finance-amount').textContent = `Rp ${summary.totalPengeluaran.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(3) .finance-amount').textContent = `Rp ${summary.sisaDana.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(4) .finance-amount').textContent = `Rp ${summary.rataRataPerKK.toLocaleString('id-ID')}`;

        const rincianEl = document.querySelector('#keuangan div.mt-5 div.text-sm');
        rincianEl.innerHTML = `
            • Dekorasi & Perlengkapan: Rp ${expensesDetail.dekorasiPerlengkapan.toLocaleString('id-ID')}<br>
            • Hadiah Lomba: Rp ${expensesDetail.hadiahLomba.toLocaleString('id-ID')}<br>
            • Konsumsi: Rp ${expensesDetail.konsumsi.toLocaleString('id-ID')}<br>
            • Doorprize: Rp ${expensesDetail.doorprize.toLocaleString('id-ID')}
        `;

        const ctx = document.getElementById('financeChart');
        if (ctx) {
            if (Chart.getChart(ctx)) {
                Chart.getChart(ctx).destroy();
            }
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Pemasukan', 'Pengeluaran', 'Sisa Dana'],
                    datasets: [{
                        label: 'Jumlah (IDR)',
                        data: [summary.totalPemasukan, summary.totalPengeluaran, summary.sisaDana],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Rp ' + value.toLocaleString('id-ID');
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function renderFinanceTransactionsTable(finances) {
        financeTransactionsTableBody.innerHTML = '';
        if (finances.length === 0) {
            financeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Belum ada transaksi.</td></tr>`;
            return;
        }

        finances.forEach(finance => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${finance.type === 'pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${finance.type.charAt(0).toUpperCase() + finance.type.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${finance.description}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${finance.amount.toLocaleString('id-ID')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(finance.date).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${finance._id}" class="edit-finance-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button data-id="${finance._id}" class="delete-finance-btn text-red-600 hover:text-red-900">Hapus</button>
                </td>
            `;
            financeTransactionsTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-finance-btn').forEach(button => {
            button.addEventListener('click', onEditFinance);
        });
        document.querySelectorAll('.delete-finance-btn').forEach(button => {
            button.addEventListener('click', onDeleteFinance);
        });
    }

    // =========================================================
    // Fungsi Penanganan Form dan Aksi CRUD Keuangan
    // =========================================================

    financeForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const id = financeIdInput.value;
        const type = transactionTypeInput.value;
        const description = transactionDescriptionInput.value;
        const amount = parseFloat(transactionAmountInput.value);

        const transactionData = { type, description, amount };

        try {
            let response;
            if (id) {
                response = await fetch(`${API_BASE_URL}/finances/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/finances`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save transaction: ${response.statusText}`);
            }

            resetFinanceForm();
            await fetchDataAndRender();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Gagal menyimpan transaksi: ' + error.message);
        }
    });

    async function onEditFinance(event) {
        const id = event.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/finances/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch transaction for edit: ${response.statusText}`);
            }
            const finance = await response.json();

            financeIdInput.value = finance._id;
            transactionTypeInput.value = finance.type;
            transactionDescriptionInput.value = finance.description;
            transactionAmountInput.value = finance.amount;

            cancelEditFinanceBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading transaction for edit:', error);
            alert('Gagal memuat data transaksi untuk diedit.');
        }
    }

    async function onDeleteFinance(event) {
        const id = event.target.dataset.id;
        if (confirm('Anda yakin ingin menghapus transaksi ini?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/finances/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete transaction: ${response.statusText}`);
                }
                await fetchDataAndRender();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Gagal menghapus transaksi: ' + error.message);
            }
        }
    }

    function resetFinanceForm() {
        financeIdInput.value = '';
        financeForm.reset();
        cancelEditFinanceBtn.classList.add('hidden');
    }

    cancelEditFinanceBtn.addEventListener('click', resetFinanceForm);


    // =========================================================
    // Fungsi Rendering UI untuk Lomba (Contest)
    // =========================================================

    function renderContestList(contests) {
        contestListDisplay.innerHTML = ''; // Kosongkan daftar lomba utama
        if (contests.length === 0) {
            contestListDisplay.innerHTML = `<li class="contest-item"><div class="text-gray-500">Belum ada lomba terdaftar.</div></li>`;
            return;
        }

        contests.forEach(contest => {
            const li = document.createElement('li');
            li.className = 'contest-item';
            li.innerHTML = `
                <div>
                    <div class="contest-name">${contest.name}</div>
                    <div class="contest-details">${contest.details} • ${new Date(contest.date).toLocaleDateString('id-ID')}, ${contest.time}</div>
                </div>
                <div class="contest-prize">${contest.prize}</div>
            `;
            contestListDisplay.appendChild(li);
        });
    }

    function renderContestTransactionsTable(contests) {
        contestTransactionsTableBody.innerHTML = '';
        if (contests.length === 0) {
            contestTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-gray-500 text-center">Belum ada lomba.</td></tr>`;
            return;
        }

        contests.forEach(contest => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${contest.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${contest.details}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(contest.date).toLocaleDateString('id-ID')}, ${contest.time}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${contest.prize}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${contest._id}" class="edit-contest-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button data-id="${contest._id}" class="delete-contest-btn text-red-600 hover:text-red-900">Hapus</button>
                </td>
            `;
            contestTransactionsTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-contest-btn').forEach(button => {
            button.addEventListener('click', onEditContest);
        });
        document.querySelectorAll('.delete-contest-btn').forEach(button => {
            button.addEventListener('click', onDeleteContest);
        });
    }

    // =========================================================
    // Fungsi Penanganan Form dan Aksi CRUD Lomba
    // =========================================================

    contestForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const id = contestIdInput.value;
        const name = contestNameInput.value;
        const details = contestDetailsInput.value;
        const date = contestDateInput.value; // Format 'YYYY-MM-DD'
        const time = contestTimeInput.value; // Format 'HH:MM'
        const prize = contestPrizeInput.value;

        const contestData = { name, details, date, time, prize };

        try {
            let response;
            if (id) {
                response = await fetch(`${API_BASE_URL}/contests/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contestData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/contests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contestData)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save contest: ${response.statusText}`);
            }

            resetContestForm();
            await fetchDataAndRender();
        } catch (error) {
            console.error('Error saving contest:', error);
            alert('Gagal menyimpan lomba: ' + error.message);
        }
    });

    async function onEditContest(event) {
        const id = event.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/contests/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch contest for edit: ${response.statusText}`);
            }
            const contest = await response.json();

            contestIdInput.value = contest._id;
            contestNameInput.value = contest.name;
            contestDetailsInput.value = contest.details;
            contestDateInput.value = contest.date.substring(0, 10); // Format YYYY-MM-DD
            contestTimeInput.value = contest.time;
            contestPrizeInput.value = contest.prize;

            cancelEditContestBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading contest for edit:', error);
            alert('Gagal memuat data lomba untuk diedit.');
        }
    }

    async function onDeleteContest(event) {
        const id = event.target.dataset.id;
        if (confirm('Anda yakin ingin menghapus lomba ini?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/contests/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete contest: ${response.statusText}`);
                }
                await fetchDataAndRender();
            } catch (error) {
                console.error('Error deleting contest:', error);
                alert('Gagal menghapus lomba: ' + error.message);
            }
        }
    }

    function resetContestForm() {
        contestIdInput.value = '';
        contestForm.reset();
        cancelEditContestBtn.classList.add('hidden');
    }

    cancelEditContestBtn.addEventListener('click', resetContestForm);


    // =========================================================
    // Fungsi Rendering UI untuk Doorprize
    // =========================================================

    function renderDoorprizeSummary(summary) {
        doorprizeStatusSummary.textContent = `Tersedia: ${summary.available} | Terambil: ${summary.taken}`;
    }

    function renderDoorprizeGrid(doorprizeItems) {
        doorprizeGridDisplay.innerHTML = ''; // Kosongkan grid doorprize utama
        if (doorprizeItems.length === 0) {
            doorprizeGridDisplay.innerHTML = `<div class="doorprize-item"><div class="doorprize-number">N/A</div><div class="doorprize-status">Belum ada</div></div>`;
            return;
        }

        doorprizeItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'doorprize-item';
            div.innerHTML = `
                <div class="doorprize-number">${item.number}</div>
                <div class="doorprize-status ${item.status}">${item.status === 'taken' ? 'Terambil' : 'Tersedia'}</div>
            `;
            doorprizeGridDisplay.appendChild(div);
        });
    }

    function renderDoorprizeTransactionsTable(doorprizeItems) {
        doorprizeTransactionsTableBody.innerHTML = '';
        if (doorprizeItems.length === 0) {
            doorprizeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-gray-500 text-center">Belum ada doorprize.</td></tr>`;
            return;
        }

        doorprizeItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.number}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${item.status === 'taken' ? 'Terambil' : 'Tersedia'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.winner || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.prizeDetail || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${item._id}" class="edit-doorprize-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button data-id="${item._id}" class="delete-doorprize-btn text-red-600 hover:text-red-900">Hapus</button>
                </td>
            `;
            doorprizeTransactionsTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-doorprize-btn').forEach(button => {
            button.addEventListener('click', onEditDoorprize);
        });
        document.querySelectorAll('.delete-doorprize-btn').forEach(button => {
            button.addEventListener('click', onDeleteDoorprize);
        });
    }

    // =========================================================
    // Fungsi Penanganan Form dan Aksi CRUD Doorprize
    // =========================================================

    doorprizeForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const id = doorprizeIdInput.value;
        const number = doorprizeNumberInput.value;
        const status = doorprizeStatusInput.value;
        const winner = doorprizeWinnerInput.value;
        const prizeDetail = doorprizeDetailInput.value;

        const doorprizeData = { number, status, winner, prizeDetail };

        try {
            let response;
            if (id) {
                response = await fetch(`${API_BASE_URL}/doorprize/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(doorprizeData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/doorprize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(doorprizeData)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save doorprize: ${response.statusText}`);
            }

            resetDoorprizeForm();
            await fetchDataAndRender();
        } catch (error) {
            console.error('Error saving doorprize:', error);
            alert('Gagal menyimpan doorprize: ' + error.message);
        }
    });

    async function onEditDoorprize(event) {
        const id = event.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/doorprize/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch doorprize for edit: ${response.statusText}`);
            }
            const doorprize = await response.json();

            doorprizeIdInput.value = doorprize._id;
            doorprizeNumberInput.value = doorprize.number;
            doorprizeStatusInput.value = doorprize.status;
            doorprizeWinnerInput.value = doorprize.winner || '';
            doorprizeDetailInput.value = doorprize.prizeDetail || '';

            cancelEditDoorprizeBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading doorprize for edit:', error);
            alert('Gagal memuat data doorprize untuk diedit.');
        }
    }

    async function onDeleteDoorprize(event) {
        const id = event.target.dataset.id;
        if (confirm('Anda yakin ingin menghapus doorprize ini?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/doorprize/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete doorprize: ${response.statusText}`);
                }
                await fetchDataAndRender();
            } catch (error) {
                console.error('Error deleting doorprize:', error);
                alert('Gagal menghapus doorprize: ' + error.message);
            }
        }
    }

    function resetDoorprizeForm() {
        doorprizeIdInput.value = '';
        doorprizeForm.reset();
        cancelEditDoorprizeBtn.classList.add('hidden');
    }

    cancelEditDoorprizeBtn.addEventListener('click', resetDoorprizeForm);

    // =========================================================
    // Fungsi Rendering UI untuk Jadwal (Schedule)
    // =========================================================

    function renderScheduleTimeline(scheduleItems) {
        activityTimelineDisplay.innerHTML = ''; // Kosongkan timeline utama
        if (scheduleItems.length === 0) {
            activityTimelineDisplay.innerHTML = `<div class="timeline-item"><div class="timeline-time">N/A</div><div class="timeline-title">Belum ada jadwal.</div></div>`;
            return;
        }

        scheduleItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `
                <div class="timeline-time">${new Date(item.date).toLocaleDateString('id-ID')} - ${item.time}</div>
                <div class="timeline-title">${item.title}</div>
                <div class="timeline-desc">${item.description} ${item.location ? '• ' + item.location : ''}</div>
            `;
            activityTimelineDisplay.appendChild(div);
        });
    }

    function renderScheduleTransactionsTable(scheduleItems) {
        scheduleTransactionsTableBody.innerHTML = '';
        if (scheduleItems.length === 0) {
            scheduleTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-gray-500 text-center">Belum ada jadwal.</td></tr>`;
            return;
        }

        scheduleItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(item.date).toLocaleDateString('id-ID')}<br>${item.time}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.title}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.description}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.location || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${item._id}" class="edit-schedule-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button data-id="${item._id}" class="delete-schedule-btn text-red-600 hover:text-red-900">Hapus</button>
                </td>
            `;
            scheduleTransactionsTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-schedule-btn').forEach(button => {
            button.addEventListener('click', onEditSchedule);
        });
        document.querySelectorAll('.delete-schedule-btn').forEach(button => {
            button.addEventListener('click', onDeleteSchedule);
        });
    }

    // =========================================================
    // Fungsi Penanganan Form dan Aksi CRUD Jadwal
    // =========================================================

    scheduleForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const id = scheduleIdInput.value;
        const title = scheduleTitleInput.value;
        const description = scheduleDescriptionInput.value;
        const date = scheduleDateInput.value; // Format YYYY-MM-DD
        const time = scheduleTimeInput.value; // Format HH:MM
        const location = scheduleLocationInput.value;

        const scheduleData = { title, description, date, time, location };

        try {
            let response;
            if (id) {
                response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduleData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/schedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduleData)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save schedule item: ${response.statusText}`);
            }

            resetScheduleForm();
            await fetchDataAndRender();
        } catch (error) {
            console.error('Error saving schedule item:', error);
            alert('Gagal menyimpan jadwal: ' + error.message);
        }
    });

    async function onEditSchedule(event) {
        const id = event.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/schedule/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch schedule item for edit: ${response.statusText}`);
            }
            const item = await response.json();

            scheduleIdInput.value = item._id;
            scheduleTitleInput.value = item.title;
            scheduleDescriptionInput.value = item.description;
            scheduleDateInput.value = item.date.substring(0, 10); // Format YYYY-MM-DD
            scheduleTimeInput.value = item.time;
            scheduleLocationInput.value = item.location || '';

            cancelEditScheduleBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading schedule item for edit:', error);
            alert('Gagal memuat data jadwal untuk diedit.');
        }
    }

    async function onDeleteSchedule(event) {
        const id = event.target.dataset.id;
        if (confirm('Anda yakin ingin menghapus jadwal ini?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`Failed to delete schedule item: ${response.statusText}`);
                }
                await fetchDataAndRender();
            } catch (error) {
                console.error('Error deleting schedule item:', error);
                alert('Gagal menghapus jadwal: ' + error.message);
            }
        }
    }

    function resetScheduleForm() {
        scheduleIdInput.value = '';
        scheduleForm.reset();
        cancelEditScheduleBtn.classList.add('hidden');
    }

    cancelEditScheduleBtn.addEventListener('click', resetScheduleForm);

    // Panggil fungsi untuk memuat data saat DOM siap
    fetchDataAndRender();
});