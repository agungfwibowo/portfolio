// daftar tampilan (skin). Menambah tampilan baru: buat folder themes/<id>/ berisi body.html, style.css, main.js,
// lalu tambahkan satu entri di sini. Isi (teks, gambar, kontak) tetap satu sumber: js/data.js.
//   v      versi aset untuk cache; naikkan saat file di folder itu berubah
//   fonts  URL Google Fonts khusus tampilan ini (dimuat hanya bila tampilan aktif), boleh dikosongkan
//   loader true bila tampilan punya layar loader (kelas `loading` dipasang di kunjungan pertama per tab);
//          tampilan wajib memanggil `window.__rv = true` setelah siap, kalau tidak, konten ditampilkan paksa setelah 2,5 dtk
window.THEMES = [
  { id: 'neo', name: 'Neo-brutalist', v: 3, loader: true,
    fonts: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Geist+Mono:wght@400;500;600&display=swap' }
];
