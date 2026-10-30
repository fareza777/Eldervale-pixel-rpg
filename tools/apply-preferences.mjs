import { readFileSync, writeFileSync } from 'node:fs';
const replace = (file, replacements) => {
  let text = readFileSync(file, 'utf8');
  for (const [before, after] of replacements) text = text.replaceAll(before, after);
  writeFileSync(file, text);
};
replace('src/core/store.ts', [
  ['music', 'ambience'], ["language: 'id'", "language: 'en'"],
  ['Quest diterima · ', 'Quest accepted · '],
  ['Quest selesai · ', 'Quest complete · '], [' · klaim di Jurnal', ' · claim in journal'],
  ['Selesaikan main quest untuk membuka jalan ini.', 'Follow the main quest to open this road.'],
  ['Gold tidak cukup.', 'Not enough gold.'],
  ['Item terpakai tidak bisa dijual.', 'Keep one copy of your equipped item.'],
  [' dipakai', ' equipped'], ['Ramuan habis.', 'No potions left.'],
  ['Sudah penuh.', 'Already full.'], [' digunakan', ' used'],
  [' meningkat', ' upgraded'], ['Bahan atau gold belum cukup.', 'More materials or gold needed.'],
  [' berhasil dibuat', ' crafted'], ['Beristirahat · HP dan mana penuh', 'Rested · health and mana restored'],
  ['Kamu dibawa pulang. Ingatan dan levelmu tetap tersimpan.', 'Returned to your hearth. Your progress is safe.'],
  ['Pengaturan tidak dapat disimpan di browser ini.', 'Settings could not be saved.'],
  ['Penyimpanan penuh. Ekspor save dari menu jeda.', 'Storage is full. Export your save from the pause menu.'],
  ['Save tidak valid. Mulai perjalanan baru atau impor backup.', 'Invalid save. Begin a new journey or import a backup.'],
  ['Format save tidak valid.', 'Invalid save format.'], ['File save tidak dapat dibaca.', 'Could not read this save.'],
]);
replace('src/ui.ts', [
  ['music', 'ambience'], ["'m_title'", "'wind'"], ["'m_victory'", "'forest'"],
  ['title="Layar penuh"', 'title="Full screen"'], ['aria-label="Buka peta dunia"', 'aria-label="Open world map"'],
  ["'Jurnal'", "'Journal'"], ['Pengelana Eldervale', 'Masked wanderer of Eldervale'],
  ['Klaim: ', 'Claim: '], ["'selesai'", "'complete'"], ['<b>3</b>Ending', '<b>3</b>Endings'],
]);
replace('src/world/WorldScene.ts', [
  ['this.audio.music(r.music)', 'this.audio.ambience(r.ambience)'],
  ['Asset gagal dimuat: ', 'Could not load asset: '],
  ['Kalahkan Raja Hampa sebelum mencapai Lyra.', 'Defeat the Hollow King to reach Lyra.'],
  ['Peti ditemukan · gold, 2 ramuan, 2 kristal', 'Chest opened · gold, 2 potions, 2 crystals'],
  [', senjata rare', ', rare weapon'], ['Miso berlari pulang. Tavi tak akan lupa lagi.', 'Miso returns home. Tavi will remember.'],
  ['Sebuah halaman kembali. Nama-nama mulai terbaca.', 'A lost page returns. The names become clear.'],
  ['Lonceng berbunyi. Sebuah suara menjawab: terima kasih.', 'The beacon glows. A lost soul finds the shore.'],
  ['Satu bintang muncul di balik tirai matahari.', 'A star appears beyond the veil of sunlight.'],
  ['Surat diselamatkan dari air.', 'A letter rescued from the water.'],
  ['Mana kurang. Gunakan Embun Aether.', 'Low mana. Use an Aether Dew.'],
  [' dibebaskan · segel dipulihkan', ' released · seal restored'], [' · fase kedua!', ' · second phase'],
  ['0xb7c8b2', '0x899bb0'], ['0xb3d9d0', '0x8da6bd'], ['0x9bb87d', '0xbaa16d'],
  ["backgroundColor: '#23392b'", "backgroundColor: '#131923'"],
]);
replace('src/world/layout.ts', [
  ['Perapian · istirahat', 'Hearth · rest'], ['Miso · kucing berpita merah', 'Miso · red ribbon'],
  ['Peti pengelana', 'Traveler’s chest'], ['Halaman ingatan', 'Memory page'],
  ['Lonceng yang tenggelam', 'Drowned beacon'], ['Peti kuno', 'Ancient chest'], ['Peti tersembunyi', 'Hidden chest'],
  ['Observatorium tua', 'Old observatory'], ['Pengelana yang tersesat', 'Lost traveler'], ['Surat di tepian', 'Letter on the shore'],
  ["prop('p/statue_01'", "prop('crystal/cristal_0/0'"],
]);
replace('index.html', [['lang="id"', 'lang="en"'], ['#101d22', '#11121c'], ['Sebuah RPG tentang cahaya, ingatan, dan harga sebuah fajar.', 'An original RPG about light, memory, and the price of an endless dawn.']]);
replace('public/manifest.webmanifest', [['1024x1024', '1254x1254'], ['#101d22', '#11121c'], ['#0b151b', '#10111b']]);
replace('tools/verify.mjs', [["includes('Terkunci')", "includes('Story locked')"], ["await action('dialogue-next'); await action('dialogue-next');", "await action('dialogue-next');"]]);
