import { readFileSync, writeFileSync } from 'node:fs';
let css = readFileSync('src/style.css', 'utf8');
css = css.replace(/#([0-9a-f]{6})([0-9a-f]{2})?\b/gi, (all, rgb, alpha = '') => {
  const r = parseInt(rgb.slice(0,2),16), g = parseInt(rgb.slice(2,4),16), b = parseInt(rgb.slice(4,6),16);
  if (r < 90 && g > r && b > r) return '#' + [Math.round(r*.85+4), Math.round(r*.85+6), Math.round(Math.max(b*.75,r+15))].map(n=>n.toString(16).padStart(2,'0')).join('') + alpha;
  if (g >= r+2 && g >= b-5) return '#' + [Math.round((r+b)/2), Math.round((r+b)/2+2), Math.min(255,Math.max(b,g)+8)].map(n=>n.toString(16).padStart(2,'0')).join('') + alpha;
  return all;
});
css = css.replace(/rgba\((\d+),(\d+),(\d+),/g, (all, rs, gs, bs) => {
  const r=Number(rs),g=Number(gs),b=Number(bs);
  return r<60 && g>r && b>r ? 'rgba('+Math.round(r*.8+3)+','+Math.round(r*.8+5)+','+Math.round(Math.max(b*.75,r+14))+',' : all;
});
writeFileSync('src/style.css', css);
let ui = readFileSync('src/ui.ts','utf8').replace("state = progress?.status ?? 'locked'", "state: string = progress?.status ?? 'locked'");
ui = ui.replace('if (this.world?.ready) this.world.loadRegion(); this.store.save(); this.store.notice(help', 'if (this.world?.ready) this.world.dismissObject(id); this.store.save(); this.store.notice(help');
writeFileSync('src/ui.ts',ui);
