// daftar tampilan (skin). Menambah tampilan baru: buat folder themes/<id>/ berisi body.html, style.css, main.js,
// lalu tambahkan satu entri di sini. Isi (teks, gambar, kontak) tetap satu sumber: js/data.js.
//   dir    (opsional) pakai berkas folder tampilan lain; varian cukup menambah CSS di html[data-skin=<id>]
//   v      versi aset untuk cache; naikkan saat file di folder itu berubah
//   thumb  gambar pratinjau (480×300) untuk panel pemilih layout; thumbDark = versinya di mode gelap (opsional)
//   fonts  URL Google Fonts khusus tampilan ini (dimuat hanya bila tampilan aktif), boleh dikosongkan
//   loader true bila tampilan punya layar loader (kelas `loading` dipasang di kunjungan pertama per tab);
//          tampilan wajib memanggil `window.__rv = true` setelah siap, kalau tidak, konten ditampilkan paksa setelah 2,5 dtk
window.THEMES = [
  { id: 'neo', name: 'Neo-brutalist', v: 61, loader: true, thumb: 'assets/themes/neo.webp', thumbDark: 'assets/themes/neo-dark.webp',
    fonts: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Geist+Mono:wght@400;500;600&family=Red+Hat+Mono:wght@600&display=swap' },
  // varian neo: tiap panel jadi kartu kaca (CSS saja, di themes/neo/style.css); v harus sama dengan neo karena berkasnya sama
  { id: 'glass', name: 'Glass', dir: 'neo', v: 61, loader: true, thumb: 'assets/themes/glass.webp', thumbDark: 'assets/themes/glass-dark.webp',
    fonts: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Red+Hat+Mono:wght@600&display=swap' },
  // varian neo kedua: tata letak kartu sama dengan Glass, gaya datar (CSS saja, di themes/neo/style.css)
  { id: 'flat', name: 'Flat', dir: 'neo', v: 61, loader: true, thumb: 'assets/themes/flat.webp', thumbDark: 'assets/themes/flat-dark.webp',
    fonts: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Red+Hat+Mono:wght@600&display=swap' }
];
