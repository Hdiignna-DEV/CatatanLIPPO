/** @type {import('tailwindcss').Config} */
module.exports = {
  // Pastikan Tailwind memindai file HTML dan JS Anda untuk kelas yang digunakan
  content: [
    "./public/**/*.html", // Pindai semua file HTML di folder public
    "./public/js/**/*.js", // Pindai semua file JS di folder public/js (jika ada kelas Tailwind di JS)
  ],
  theme: {
    extend: {
      // Tambahkan warna kustom sesuai bendera Indonesia
      colors: {
        'indonesia-red': '#CC0000', // Merah yang lebih gelap/dalam
        'indonesia-white': '#FFFFFF',
      },
      // Tambahkan animasi kustom dari CSS sebelumnya
      animation: {
        'flagWave': 'flagWave 3s ease-in-out infinite',
        'decorationFloat': 'decorationFloat 8s ease-in-out infinite',
        'logoSpin': 'logoSpin 6s linear infinite',
        'titleGlow': 'titleGlow 3s ease-in-out infinite alternate',
        'badgePulse': 'badgePulse 2s ease-in-out infinite',
        'iconBounce': 'iconBounce 3s ease-in-out infinite',
      },
      keyframes: {
        // Definisikan keyframes untuk animasi kustom
        flagWave: {
            '0%, 100%': { transform: 'scaleY(1)' },
            '50%': { transform: 'scaleY(1.3)' },
        },
        decorationFloat: {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-30px) rotate(5deg)' },
        },
        logoSpin: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
        },
        titleGlow: {
            '0%': { 'text-shadow': '3px 3px 6px rgba(0,0,0,0.1)' },
            '100%': { 'text-shadow': '3px 3px 25px rgba(255,68,68,0.4)' },
        },
        badgePulse: {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.08)' },
        },
        iconBounce: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};