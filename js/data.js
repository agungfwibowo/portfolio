// Semua teks & URL gambar situs ada di sini. Ubah konten cukup di file ini.
// `id` = konten lengkap (bahasa Indonesia). `en` hanya berisi teks yang diterjemahkan;
// field yang tidak ditulis (gambar, email, dll.) otomatis diambil dari `id`.
window.SITE = {};
window.SITE.id = {
  assets: 'assets/',

  meta: { title: 'Agung Fitrah Wibowo — Front-End Developer & UI/UX Designer' },

  // teks antarmuka
  ui: {
    lang: 'EN', langAria: 'Switch to English',
    exp: ['Pengalaman', 'profesional'], edu: 'Pendidikan', contact: 'Kontak', projects: 'Proyek pilihan',
    client: 'Klien', role: 'Peran', tools: 'Alat',
    play: 'Putar', pause: 'Jeda', ariaPlay: 'Putar rotasi otomatis', ariaPause: 'Jeda rotasi otomatis',
    color: 'Warna', mono: 'Mono', ariaColor: 'Tampilkan screenshot berwarna', ariaMono: 'Tampilkan screenshot hitam-putih',
    jobsList: 'Riwayat kerja', prosList: 'Daftar proyek', mainView: 'tampilan utama', view: 'tampilan',
    top: 'Kembali ke atas ↑',
    linkedin: 'LinkedIn ↗', photoLink: 'Buka profil LinkedIn Agung'
  },

  profile: {
    mark: 'AFW',
    name: 'Agung Fitrah Wibowo',
    location: 'Deli Serdang, Sumut',
    since: 'Berkarya sejak 2019',
    // judul utama: highlight (kotak hitam) + sisa baris pertama + baris kedua
    headline: { highlight: 'Front-End', rest: 'Developer', line2: '& UI/UX Designer' },
    roles: ['Programmer SIMRS', 'Web Front-End Developer', 'UI/UX Designer', 'WordPress Developer', 'AI-Assisted Developer'],
    years: '+7 tahun',
    tagline: 'Dari desain di Figma, sampai kode yang rapi.'
  },

  education: {
    period: 'Okt 2012 — Nov 2016',
    school: 'Universitas Potensi Utama, Medan',
    degree: 'Sarjana Komputer (S.Kom)'
  },

  contact: {
    email: 'agungf.wibowo@gmail.com',
    phone: '+62 822 8571 5959',
    address: 'Percut Sei Tuan, Deli Serdang',
    linkedin: 'https://www.linkedin.com/in/agungfwibowo/'
  },

  skills: {
    title: ['Keahlian & tools', 'yang dikuasai :'],
    badge: 'Desain + Kode',
    photo: { src: 'foto-agung.webp', alt: 'Agung Fitrah Wibowo duduk di kursi kerja', width: 600, height: 1094 },
    // stiker di sekitar foto: [pill putih, lingkaran hitam (2 baris), badge biru]
    stickers: ['Halo, saya Agung!', ['Tinggal di', 'Medan'], 'Figma → Kode'],
    // style: 'dark' | 'light' | 'ai'; icon = kunci di js/icons.js (boleh dikosongkan)
    groups: [
      { label: 'Mahir', style: 'dark', items: [
        { name: 'HTML', icon: 'html5' }, { name: 'CSS', icon: 'css' }, { name: 'Tailwind CSS', icon: 'tailwindcss' },
        { name: 'Bootstrap', icon: 'bootstrap' }, { name: 'Figma', icon: 'figma' }
      ] },
      { label: 'Menengah', style: 'light', items: [
        { name: 'JavaScript', icon: 'javascript' }, { name: 'React', icon: 'react' }, { name: 'Vue.js', icon: 'vuedotjs' },
        { name: 'PHP · Yii2', icon: 'php' }, { name: 'Laravel', icon: 'laravel' }, { name: 'SCSS / Sass', icon: 'sass' },
        { name: 'WordPress (Divi)', icon: 'wordpress' }, { name: 'Git', icon: 'git' }
      ] },
      { label: 'AI-Assisted Development', style: 'ai', items: [
        { name: 'Claude', icon: 'claude' }, { name: 'ChatGPT', icon: 'chat' }, { name: 'Claude Code (agen AI)', icon: 'terminal' }
      ] }
    ]
  },

  jobs: [
    { period: 'Mei 2021 — Sekarang', company: 'RSUP H. Adam Malik Medan', role: 'Programmer / Developer · Unit SIMRS', desc: 'Mendesain UI modul SIMRS, membangun front-end aplikasi, mengembangkan backend dengan PHP (Yii2), dan membuat layout print formulir & laporan — dibantu AI (Claude, ChatGPT, Claude Code).' },
    { period: 'Feb 2022 — Okt 2024', company: 'Faria Edu', role: 'WordPress Developer (Freelance)', desc: 'Slicing desain ke Svelte + Tailwind CSS sekaligus mengerjakan logic animasi untuk situs produk Faria Education Group — ManageBac, SchoolsBuddy, OpenApply, dan lainnya. Membangun dan memelihara situs WordPress, mengembangkan komponen React & Vue.js, serta menangani perbaikan dan update fitur.' },
    { period: 'Okt 2019 — Mei 2021', company: 'Freelancer', role: 'Web Front-End Developer / UI/UX Designer', desc: 'Merancang dan membangun 9 website & web app untuk klien ritel, interior, gaming, industri, edukasi, energi, dan kesehatan.' },
    { period: 'Jun 2019 — Okt 2019', company: 'Xtend Indonesia', role: 'Web Front-End Developer / UI/UX Designer', desc: 'Komp. Setia Budi, Medan. Front-end website, mobile UI/UX design, dan WordPress dengan Divi Builder.' }
  ],

  // nomor proyek (01, 02, ...) dibuat otomatis dari urutan
  projects: [
    { name: 'Faria Education Group', cat: 'Website Produk', client: 'Faria Education Group', role: 'Slicing desain ke Svelte + Tailwind CSS sekaligus mengerjakan logic animasinya untuk situs ManageBac, SchoolsBuddy, OpenApply, dan lainnya', tools: 'Svelte · Tailwind CSS · JavaScript', imgs: ['faria-managebac.webp', 'faria-schoolsbuddy.webp', 'faria-openapply.webp'] },
    { name: 'STARS Mandiri', cat: 'Sistem Informasi', client: 'RSUP H. Adam Malik Medan', role: 'Membuat layout print, mendesain informasi tempat tidur pasien, dan backend dengan framework Yii2', tools: 'UI Design · Layout Print · Yii2', imgs: ['stars-1.webp', 'stars-2.webp', 'stars-3.webp'] },
    { name: 'Kimy Kuky Cookies', cat: 'Website E-Commerce', client: 'Kimy Kuky', role: 'Mendesain UI website & membangunnya dengan WordPress + Divi Builder', tools: 'UI Design · WordPress · Divi Builder', imgs: ['kimy-1.webp', 'kimy-2.webp', 'kimy-3.webp'] },
    { name: 'Barik.id', cat: 'Company Profile', client: 'Barik Home & Interior', role: 'Mendesain UI website & membangunnya dengan WordPress + Divi Builder', tools: 'UI Design · WordPress · Divi Builder', imgs: ['barik-1.webp', 'barik-2.webp', 'barik-3.webp'] },
    { name: 'Clarias Gaming Shop', cat: 'Website Top Up', client: 'Clarias Gaming Shop', role: 'Mendesain UI website dengan Figma & slicing ke HTML', tools: 'Figma · UI Design · HTML/CSS', imgs: ['clarias-1.webp', 'clarias-2.webp', 'clarias-3.webp'] },
    { name: 'Kuala Tanjung Industrial Estate', cat: 'Company Profile', client: 'KIKT', role: 'Membangun website dengan WordPress', tools: 'WordPress', imgs: ['kikt-1.webp', 'kikt-2.webp'] },
    { name: 'Air Mineral Amoz', cat: 'Company Profile', client: 'PT. Tirta Alpin Makmur', role: 'Mendesain UI website menggunakan Adobe XD', tools: 'Adobe XD · UI Design', imgs: ['amoz-1.webp', 'amoz-2.webp', 'amoz-3.webp'] },
    { name: 'Skill Factory', cat: 'Website', client: 'Skill Factory', role: 'Mendesain UI website dengan Figma & membangunnya dengan WordPress + Divi Builder', tools: 'Figma · WordPress · Divi Builder', imgs: ['sf-1.webp', 'sf-2.webp', 'sf-3.webp'] },
    { name: 'Yuk Belajar', cat: 'Website Edukasi', client: 'Indonesiabelajar.org', role: 'Mendesain UI website dengan Adobe XD & slicing ke HTML', tools: 'Adobe XD · UI Design · HTML/CSS', imgs: ['yb-1.webp', 'yb-2.webp', 'yb-3.webp'] },
    { name: 'Project TV', cat: 'Web App', client: 'Salah satu rumah sakit di China', role: 'Slicing desain ke Vue.js', tools: 'Vue.js · Front-End', imgs: ['tv-1.webp', 'tv-2.webp', 'tv-3.webp'] },
    { name: 'PROBIS UPHK Medan', cat: 'Web App', client: 'PLN UPHK Medan', role: 'Mendesain UI website dengan Adobe XD & slicing dengan Vue.js', tools: 'Adobe XD · UI Design · Vue.js', imgs: ['probis-1.webp'] }
  ],

  footer: '© 2026 Agung Fitrah Wibowo'
};

window.SITE.en = {
  meta: { title: 'Agung Fitrah Wibowo — Front-End Developer & UI/UX Designer' },

  ui: {
    lang: 'ID', langAria: 'Ganti ke Bahasa Indonesia',
    exp: ['Professional', 'experience'], edu: 'Education', contact: 'Contact', projects: 'Selected projects',
    client: 'Client', role: 'Role', tools: 'Tools',
    play: 'Play', pause: 'Pause', ariaPlay: 'Play autoplay', ariaPause: 'Pause autoplay',
    color: 'Color', mono: 'Mono', ariaColor: 'Show screenshots in color', ariaMono: 'Show screenshots in black & white',
    jobsList: 'Work history', prosList: 'Project list', mainView: 'main view', view: 'view',
    top: 'Back to top ↑',
    photoLink: 'Open Agung\'s LinkedIn profile'
  },

  profile: {
    since: 'Creating since 2019',
    roles: ['Hospital Information System', 'Web Front-End Developer', 'UI/UX Designer', 'WordPress Developer', 'AI-Assisted Developer'],
    years: '7+ years',
    tagline: 'From design in Figma to clean, tidy code.'
  },

  education: {
    period: 'Oct 2012 — Nov 2016',
    degree: 'Bachelor of Computer Science (S.Kom)'
  },

  skills: {
    title: ['Skills & tools', 'I work with:'],
    badge: 'Design + Code',
    photo: { alt: 'Agung Fitrah Wibowo sitting in an office chair' },
    stickers: ["Hi, I'm Agung!", ['Based in', 'Medan'], 'Figma → Code'],
    groups: [
      { label: 'Advanced' },
      { label: 'Intermediate' },
      { items: [{}, {}, { name: 'Claude Code (AI agent)' }] }
    ]
  },

  jobs: [
    { period: 'May 2021 — Present', role: 'Programmer / Developer · SIMRS Unit', desc: 'Designing UI for hospital information system (SIMRS) modules, building application front-ends, developing the backend with PHP (Yii2), and creating print layouts for forms & reports — assisted by AI (Claude, ChatGPT, Claude Code).' },
    { period: 'Feb 2022 — Oct 2024', desc: 'Sliced designs into Svelte + Tailwind CSS and built the animation logic for Faria Education Group product sites — ManageBac, SchoolsBuddy, OpenApply, and more. Built and maintained WordPress sites, developed React & Vue.js components, and handled fixes and feature updates.' },
    { period: 'Oct 2019 — May 2021', desc: 'Designed and built 9 websites & web apps for clients in retail, interior design, gaming, industry, education, energy, and healthcare.' },
    { period: 'Jun 2019 — Oct 2019', desc: 'Setia Budi Complex, Medan. Website front-end, mobile UI/UX design, and WordPress with Divi Builder.' }
  ],

  projects: [
    { cat: 'Product Websites', role: 'Sliced designs into Svelte + Tailwind CSS and built the animation logic for the ManageBac, SchoolsBuddy, OpenApply sites, and more' },
    { cat: 'Information System', role: 'Built print layouts, designed the patient bed information display, and developed the backend with the Yii2 framework' },
    { cat: 'E-Commerce Website', role: 'Designed the website UI & built it with WordPress + Divi Builder' },
    { role: 'Designed the website UI & built it with WordPress + Divi Builder' },
    { cat: 'Game Top-Up Website', role: 'Designed the website UI in Figma & sliced it into HTML' },
    { role: 'Built the website with WordPress' },
    { role: 'Designed the website UI using Adobe XD' },
    { role: 'Designed the website UI in Figma & built it with WordPress + Divi Builder' },
    { cat: 'Education Website', role: 'Designed the website UI in Adobe XD & sliced it into HTML' },
    { client: 'A hospital in China', role: 'Sliced the design into Vue.js' },
    { role: 'Designed the website UI in Adobe XD & sliced it with Vue.js' }
  ]
};
