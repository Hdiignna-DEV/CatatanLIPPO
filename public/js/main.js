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

    // Ambil elemen-elemen form
    const financeForm = document.getElementById('financeForm');
    const financeIdInput = document.getElementById('financeId');
    const transactionTypeInput = document.getElementById('transactionType');
    const transactionDescriptionInput = document.getElementById('transactionDescription');
    const transactionAmountInput = document.getElementById('transactionAmount');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const financeTransactionsTableBody = document.getElementById('financeTransactionsTableBody');

    // Fungsi untuk mengambil data dari backend dan merender UI
    async function fetchDataAndRender() {
        try {
            const response = await fetch(`${API_BASE_URL}/finances`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Render bagian ringkasan keuangan
            renderFinanceSummary(data.summary, data.rincianPengeluaran);

            // Render tabel daftar transaksi
            renderFinanceTransactionsTable(data.finances);

            // TODO: Ambil dan render data untuk Lomba, Doorprize, Jadwal dari API
            // const contestsResponse = await fetch(`${API_BASE_URL}/contests`);
            // const contestsData = await contestsResponse.json();
            // renderContestSection(contestsData.contests);

            // const doorprizeResponse = await fetch(`${API_BASE_URL}/doorprize`);
            // const doorprizeData = await doorprizeResponse.json();
            // renderDoorprizeSection(doorprizeData.doorprizeItems);

            // const scheduleResponse = await fetch(`${API_BASE_URL}/schedule`);
            // const scheduleData = await scheduleResponse.json();
            // renderScheduleSection(scheduleData.scheduleItems);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data dari server. Pastikan backend berjalan dan URL API sudah benar.');
            financeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-red-500 text-center">Gagal memuat transaksi.</td></tr>`;
        }
    }

    // --- Fungsi Rendering UI ---

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

    // Fungsi untuk merender tabel daftar transaksi keuangan
    function renderFinanceTransactionsTable(finances) {
        financeTransactionsTableBody.innerHTML = ''; // Kosongkan tabel
        if (finances.length === 0) {
            financeTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Belum ada transaksi.</td></tr>`;
            return;
        }

        finances.forEach(finance => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50'; // Efek hover pada baris
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
                    <button data-id="${finance._id}" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button data-id="${finance._id}" class="delete-btn text-red-600 hover:text-red-900">Hapus</button>
                </td>
            `;
            financeTransactionsTableBody.appendChild(row);
        });

        // Tambahkan event listener untuk tombol Edit dan Hapus setelah tabel dirender
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', onEditFinance);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', onDeleteFinance);
        });
    }

    // --- Fungsi Penanganan Form dan Aksi CRUD ---

    // Event listener untuk submit form (Tambah atau Edit)
    financeForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Mencegah reload halaman

        const id = financeIdInput.value;
        const type = transactionTypeInput.value;
        const description = transactionDescriptionInput.value;
        const amount = parseFloat(transactionAmountInput.value); // Pastikan angka

        const transactionData = { type, description, amount };

        try {
            let response;
            if (id) {
                // Mode Edit (PUT)
                response = await fetch(`${API_BASE_URL}/finances/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            } else {
                // Mode Tambah (POST)
                response = await fetch(`${API_BASE_URL}/finances`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save transaction: ${response.statusText}`);
            }

            // Reset form dan render ulang data
            resetFinanceForm();
            await fetchDataAndRender();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Gagal menyimpan transaksi: ' + error.message);
        }
    });

    // Fungsi untuk mengisi form saat tombol Edit diklik
    async function onEditFinance(event) {
        const id = event.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/finances/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch transaction for edit: ${response.statusText}`);
            }
            const finance = await response.json();

            // Isi form
            financeIdInput.value = finance._id;
            transactionTypeInput.value = finance.type;
            transactionDescriptionInput.value = finance.description;
            transactionAmountInput.value = finance.amount;

            // Tampilkan tombol batal edit
            cancelEditBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading transaction for edit:', error);
            alert('Gagal memuat data transaksi untuk diedit.');
        }
    }

    // Fungsi untuk menghapus transaksi saat tombol Hapus diklik
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
                await fetchDataAndRender(); // Render ulang tabel setelah dihapus
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Gagal menghapus transaksi: ' + error.message);
            }
        }
    }

    // Fungsi untuk mereset form dan menyembunyikan tombol batal
    function resetFinanceForm() {
        financeIdInput.value = '';
        financeForm.reset(); // Mereset semua field form
        cancelEditBtn.classList.add('hidden'); // Sembunyikan tombol batal
    }

    // Event listener untuk tombol Batal Edit
    cancelEditBtn.addEventListener('click', resetFinanceForm);

    // Panggil fungsi untuk memuat data saat DOM siap
    fetchDataAndRender();
});