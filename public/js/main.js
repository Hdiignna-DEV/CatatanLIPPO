document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi Chart.js
    const ctx = document.getElementById('financeChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar', // or 'pie', 'line', etc.
            data: {
                labels: ['Pemasukan', 'Pengeluaran', 'Sisa Dana'],
                datasets: [{
                    label: 'Jumlah (IDR)',
                    data: [12500000, 8200000, 4300000],
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Inisialisasi Lucide Icons
    lucide.createIcons();

    // Inisialisasi AOS (Animate On Scroll)
    AOS.init({
        duration: 1000, // Durasi animasi global
        once: true, // Hanya animasikan sekali
    });
});