document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi Lucide Icons
    lucide.createIcons();

    // Inisialisasi AOS (Animate On Scroll)
    AOS.init({
        duration: 1000, // Durasi animasi global (milidetik)
        once: true, // Hanya animasikan sekali saat elemen pertama kali terlihat
    });

    // Fungsi untuk mengambil data dari backend dan merender UI
    async function fetchDataAndRender() {
        try {
            // URL API backend Anda.
            // PENTING: Ganti 'http://localhost:5000' dengan URL publik backend Anda setelah di-deploy (misalnya Render/Railway).
            // Contoh: const financeResponse = await fetch('https://api-catatanlippo.render.com/api/finances');
            const financeResponse = await fetch('https://catatanlippo.vercel.app/api/finances');
            const financeData = await financeResponse.json();

            // Render bagian keuangan dengan data dari API
            renderFinanceSection(financeData.summary, financeData.rincianPengeluaran);

            // TODO: Ambil dan render data untuk Lomba, Doorprize, Jadwal dari API
            // Contoh:
            // const contestsResponse = await fetch('http://localhost:5000/api/contests');
            // const contestsData = await contestsResponse.json();
            // renderContestSection(contestsData.contests); // Anda perlu membuat fungsi ini

            // const doorprizeResponse = await fetch('http://localhost:5000/api/doorprize');
            // const doorprizeData = await doorprizeResponse.json();
            // renderDoorprizeSection(doorprizeData.doorprizeItems); // Anda perlu membuat fungsi ini

            // const scheduleResponse = await fetch('http://localhost:5000/api/schedule');
            // const scheduleData = await scheduleResponse.json();
            // renderScheduleSection(scheduleData.scheduleItems); // Anda perlu membuat fungsi ini

        } catch (error) {
            console.error('Error fetching data:', error);
            // Tampilkan pesan error di UI jika perlu
            alert('Gagal memuat data dari server. Pastikan backend berjalan dan URL API sudah benar.');
        }
    }

    // --- Fungsi Rendering UI ---

    function renderFinanceSection(summary, expensesDetail) {
        // Memperbarui elemen HTML dengan data keuangan
        document.querySelector('.finance-item:nth-child(1) .finance-amount').textContent = `Rp ${summary.totalPemasukan.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(2) .finance-amount').textContent = `Rp ${summary.totalPengeluaran.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(3) .finance-amount').textContent = `Rp ${summary.sisaDana.toLocaleString('id-ID')}`;
        document.querySelector('.finance-item:nth-child(4) .finance-amount').textContent = `Rp ${summary.rataRataPerKK.toLocaleString('id-ID')}`;

        // Memperbarui rincian pengeluaran
        const rincianEl = document.querySelector('#keuangan div.mt-5 div.text-sm');
        rincianEl.innerHTML = `
            • Dekorasi & Perlengkapan: Rp ${expensesDetail.dekorasiPerlengkapan.toLocaleString('id-ID')}<br>
            • Hadiah Lomba: Rp ${expensesDetail.hadiahLomba.toLocaleString('id-ID')}<br>
            • Konsumsi: Rp ${expensesDetail.konsumsi.toLocaleString('id-ID')}<br>
            • Doorprize: Rp ${expensesDetail.doorprize.toLocaleString('id-ID')}
        `;

        // Update Chart.js dengan data dinamis
        const ctx = document.getElementById('financeChart');
        if (ctx) {
            // Hancurkan chart lama jika ada untuk mencegah duplikasi (penting jika fungsi dipanggil ulang)
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
                                callback: function(value, index, values) {
                                    return 'Rp ' + value.toLocaleString('id-ID'); // Format mata uang
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

    // TODO: Buat fungsi render untuk lomba, doorprize, jadwal
    // Contoh struktur:
    // function renderContestSection(contests) {
    //     const contestListEl = document.querySelector('.contest-list');
    //     contestListEl.innerHTML = ''; // Kosongkan daftar lama
    //     contests.forEach(contest => {
    //         const li = document.createElement('li');
    //         li.className = 'contest-item';
    //         li.innerHTML = `
    //             <div>
    //                 <div class="contest-name">${contest.name}</div>
    //                 <div class="contest-details">${contest.details}</div>
    //             </div>
    //             <div class="contest-prize">${contest.prize}</div>
    //         `;
    //         contestListEl.appendChild(li);
    //     });
    // }

    // function renderDoorprizeSection(doorprizeItems) {
    //     const doorprizeGridEl = document.querySelector('.doorprize-grid');
    //     doorprizeGridEl.innerHTML = '';
    //     doorprizeItems.forEach(item => {
    //         const div = document.createElement('div');
    //         div.className = 'doorprize-item';
    //         div.innerHTML = `
    //             <div class="doorprize-number">${item.number}</div>
    //             <div class="doorprize-status ${item.status === 'taken' ? 'taken' : ''}">${item.status === 'taken' ? 'Terambil' : 'Tersedia'}</div>
    //         `;
    //         doorprizeGridEl.appendChild(div);
    //     });
    //     // Anda juga bisa memperbarui teks status kupon: Tersedia/Terambil
    //     // const availableCount = doorprizeItems.filter(item => item.status === 'available').length;
    //     // const takenCount = doorprizeItems.filter(item => item.status === 'taken').length;
    //     // document.querySelector('.flex.justify-between.items-center.mb-4 span:nth-child(2)').textContent = `Tersedia: ${availableCount} | Terambil: ${takenCount}`;
    // }

    // function renderScheduleSection(scheduleItems) {
    //     const timelineEl = document.querySelector('.activity-timeline');
    //     timelineEl.innerHTML = '';
    //     scheduleItems.forEach(item => {
    //         const div = document.createElement('div');
    //         div.className = 'timeline-item';
    //         div.innerHTML = `
    //             <div class="timeline-time">${item.time}</div>
    //             <div class="timeline-title">${item.title}</div>
    //             <div class="timeline-desc">${item.description}</div>
    //         `;
    //         timelineEl.appendChild(div);
    //     });
    // }


    // Panggil fungsi untuk memuat data saat DOM siap
    fetchDataAndRender();
});