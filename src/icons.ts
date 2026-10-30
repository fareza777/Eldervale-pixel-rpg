const paths: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="m9 3-1 3-3 1v4l3 1 1 3h4l1-3 3-1V7l-3-1-1-3z"/><circle cx="11" cy="9" r="2"/><path d="M19 15v7m-3-4h6"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2m-4 4v5"/>',
  journal: '<path d="M6 3h13v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v18m4-12h5m-5 4h5"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  hero: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  volume: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm13 0 5 6m-5 0 5-6"/>',
  sword: '<path d="m4 20 4-4m-2-3 5 5m-3-3L19 3l2 2-12 11M4 20l-1 1"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  share: '<circle cx="18" cy="4" r="3"/><circle cx="5" cy="12" r="3"/><circle cx="18" cy="20" r="3"/><path d="m8 10 7-4m-7 8 7 4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  feather: '<path d="M3 21 17 7m-9 9h8c5-3 7-8 4-12-4-3-9-1-12 4v8Z"/>',
  save: '<path d="M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',
  hand: '<path d="M9 12V4a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v4m0-2a1.5 1.5 0 0 1 3 0v3m0-1a1.5 1.5 0 0 1 3 0v5c0 4-3 6-7 6-3 0-5-2-6-4l-4-5a2 2 0 0 1 3-2l2 2"/>',
};
export const icon = (name: string, size = 20) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] ?? paths.sun) + '</svg>';
export function itemIcon(name: string, extra = '') { if (name.startsWith('sheet:')) { const n = Number(name.split(':')[1]); return '<span class="item-art ' + extra + '" style="background-image:url(/assets/art/relics-transparent-v2.png);background-size:400% 300%;background-position:' + ((n % 4) * 100 / 3) + '% ' + (Math.floor(n / 4) * 50) + '%" aria-hidden="true"></span>'; } return '<img class="item-art ' + extra + '" src="/assets/legacy/icons/' + name + '.png" alt="" loading="lazy" onerror="this.src=\'/assets/legacy/icons/relic_sun_disk.png\';this.onerror=null" />'; }
export const escapeHtml = (text: unknown): string => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
