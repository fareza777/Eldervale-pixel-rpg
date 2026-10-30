import { CLASSES, ENDINGS, ITEMS, MAIN_QUESTS, QUESTS, RECIPES, REGIONS, SIDE_QUESTS, SKILLS, regionById } from '../content';
import type { Discipline, EventKind, GameState, Settings, Stats } from './types';

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
const SAVE_KEY = 'eldervale.save.v1';
export const DEFAULT_SETTINGS: Settings = { ambience: 0.45, sfx: 0.6, voice: 0.85, difficulty: 'normal', reducedMotion: false, screenShake: true, haptics: true, language: 'en',joystickMode:'floating',controlSize:'standard',controlOpacity:1,attackStyle:'classic',hitEffects:'full',aimAssist:true,autoRun:true };
export const xpForLevel = (level: number): number => Math.round(70 + 35 * Math.pow(level, 1.45));
export function statsFor(s: GameState): Stats {
  const stats: Stats = { maxHp: s.discipline === 'warden' ? 125 : s.discipline === 'ranger' ? 105 : 95, maxMana: s.discipline === 'arcanist' ? 100 : 65, atk: s.discipline === 'arcanist' ? 14 : 12, def: s.discipline === 'warden' ? 4 : 2, speed: s.discipline === 'ranger' ? 54 : 48, power: 1 };
  stats.maxHp += (s.level - 1) * 13; stats.maxMana += (s.level - 1) * 5; stats.atk += (s.level - 1) * 3; stats.def += Math.floor((s.level - 1) / 2);
  for (const id of Object.values(s.equipment)) { const i = ITEMS[id]; if (!i) continue; stats.atk += i.atk ?? 0; stats.def += i.def ?? 0; stats.maxHp += i.hp ?? 0; stats.maxMana += i.mana ?? 0; }
  for (const skill of SKILLS) { const n = s.talents[skill.id] ?? 0; const field = skill.stat === 'hp' ? 'maxHp' : skill.stat === 'mana' ? 'maxMana' : skill.stat; stats[field] += n * skill.value; }
  return stats;
}

function isRecord(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function integer(v: unknown, min = 0, max = 1000000): v is number { return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max; }
export function validateSave(raw: unknown): GameState | null {
  if (!isRecord(raw) || raw.version !== 1 || typeof raw.name !== 'string' || raw.name.length < 1 || raw.name.length > 24 || !['warden', 'ranger', 'arcanist'].includes(raw.discipline as string)) return null;
  if (!integer(raw.level, 1, 99) || !integer(raw.xp) || !integer(raw.gold) || !integer(raw.points, 0, 500) || !integer(raw.kills) || typeof raw.hp !== 'number' || !Number.isFinite(raw.hp) || raw.hp < 0 || typeof raw.mana !== 'number' || !Number.isFinite(raw.mana) || raw.mana < 0) return null;
  if (!REGIONS.some(r => r.id === raw.region) || !REGIONS.some(r => r.id === raw.checkpoint && r.type === 'town') || !isRecord(raw.position) || typeof raw.position.x !== 'number' || typeof raw.position.y !== 'number' || !Number.isFinite(raw.position.x) || !Number.isFinite(raw.position.y)) return null;
  if (!isRecord(raw.items) || !isRecord(raw.equipment) || !isRecord(raw.talents) || !isRecord(raw.quests) || !isRecord(raw.choices)) return null;
  for (const [key, value] of Object.entries(raw.items)) if (!ITEMS[key] || !integer(value, 0, 9999)) return null;
  for (const slot of ['weapon', 'armor', 'charm']) { const id = raw.equipment[slot]; if (typeof id !== 'string' || (id && (!ITEMS[id] || ITEMS[id].type !== slot || !(Number(raw.items[id]) > 0)))) return null; }
  for (const [key, value] of Object.entries(raw.talents)) { const def = SKILLS.find(s => s.id === key); if (!def || !integer(value, 0, def.max) || (def.discipline !== 'all' && def.discipline !== raw.discipline)) return null; }
  for (const [key, value] of Object.entries(raw.quests)) { const def = QUESTS.find(q => q.id === key); if (!def || !isRecord(value) || !['active', 'ready', 'completed'].includes(value.status as string) || !integer(value.count, 0, def.count) || (value.status !== 'active' && value.count !== def.count)) return null; }
  let incomplete = false;
  for (const q of MAIN_QUESTS) { const p = raw.quests[q.id]; if (!incomplete && isRecord(p) && p.status === 'completed') continue; if (incomplete && p) return null; incomplete = true; }
  for (const field of ['visited', 'collected', 'defeated']) if (!Array.isArray(raw[field]) || (raw[field] as unknown[]).length > 10000 || !(raw[field] as unknown[]).every(v => typeof v === 'string' && v.length < 150)) return null;
  if (!(raw.visited as string[]).every(id => REGIONS.some(r => r.id === id))) return null;
  if (![null, ...Object.keys(ENDINGS)].includes(raw.ending as null | string)) return null;
  if (typeof raw.playtime !== 'number' || !Number.isFinite(raw.playtime) || raw.playtime < 0 || typeof raw.created !== 'number' || !Number.isFinite(raw.created) || typeof raw.updated !== 'number' || !Number.isFinite(raw.updated)) return null;
  if (!Object.values(raw.choices).every(v => typeof v === 'string' && v.length < 120)) return null;
  const s = structuredClone(raw) as unknown as GameState;
  const region=regionById(s.region);
  s.position.x = Math.max(24, Math.min(region.cols!*16-24, s.position.x)); s.position.y = Math.max(32, Math.min(region.rows!*16-24, s.position.y));
  const stats = statsFor(s); s.hp = Math.min(stats.maxHp, s.hp); s.mana = Math.min(stats.maxMana, s.mana);
  return s;
}

export class GameStore {
  state: GameState | null = null;
  settings: Settings = { ...DEFAULT_SETTINGS };
  paused = false;
  private listeners = new Set<() => void>();
  private notices = new Set<(message: string) => void>();
  constructor(private storage: StorageLike = localStorage) {
    try { const raw = JSON.parse(storage.getItem('eldervale.settings') ?? '{}'); if (isRecord(raw)) { for (const key of ['ambience', 'sfx', 'voice'] as const) if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) this.settings[key] = Math.max(0, Math.min(1, raw[key])); if (['story', 'normal', 'heroic'].includes(raw.difficulty as string)) this.settings.difficulty = raw.difficulty as Settings['difficulty']; if (raw.language === 'en') this.settings.language = 'en'; for (const key of ['reducedMotion', 'screenShake', 'haptics'] as const) if (typeof raw[key] === 'boolean') this.settings[key] = raw[key]; } } catch { /* Defaults keep the title usable. */ }
    try{
      const raw=JSON.parse(storage.getItem('eldervale.settings')??'{}');
      if(isRecord(raw)){
        if(['floating','fixed'].includes(raw.joystickMode as string))this.settings.joystickMode=raw.joystickMode as Settings['joystickMode'];
        if(['compact','standard','large'].includes(raw.controlSize as string))this.settings.controlSize=raw.controlSize as Settings['controlSize'];
        if(['classic','whirl'].includes(raw.attackStyle as string))this.settings.attackStyle=raw.attackStyle as Settings['attackStyle'];
        if(['subtle','full'].includes(raw.hitEffects as string))this.settings.hitEffects=raw.hitEffects as Settings['hitEffects'];
        if(typeof raw.controlOpacity==='number'&&Number.isFinite(raw.controlOpacity))this.settings.controlOpacity=Math.max(.65,Math.min(1,raw.controlOpacity));
        for(const key of ['aimAssist','autoRun']as const)if(typeof raw[key]==='boolean')this.settings[key]=raw[key];
      }
    }catch{/* Older settings inherit comfortable defaults. */}
  }
  get s(): GameState { if (!this.state) throw new Error('Start or load a game first'); return this.state; }
  get mainIndex(): number { if (!this.state) return 0; const i = MAIN_QUESTS.findIndex(q => this.s.quests[q.id]?.status !== 'completed'); return i < 0 ? MAIN_QUESTS.length : i; }
  get mainQuest() { return MAIN_QUESTS[this.mainIndex]; }
  get completedSideCount(): number { return this.state ? SIDE_QUESTS.filter(q => this.s.quests[q.id]?.status === 'completed').length : 0; }
  get canShareDawn(): boolean { return this.completedSideCount >= 4; }
  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  onNotice(fn: (message: string) => void) { this.notices.add(fn); return () => this.notices.delete(fn); }
  notice(message: string) { for (const fn of this.notices) fn(message); }
  changed() { for (const fn of this.listeners) fn(); }
  newGame(name: string, discipline: Discipline) {
    if (!CLASSES[discipline]) discipline = 'warden';
    this.backup();
    const weapon = discipline === 'warden' ? 'old_sword' : discipline === 'ranger' ? 'old_bow' : 'old_staff';
    this.state = { version: 1, name: name.trim().slice(0, 24) || 'Arin', discipline, level: 1, xp: 0, gold: 80, hp: 1, mana: 1, points: 1, talents: {}, items: { [weapon]: 1, leather: 1, potion: 5, ether: 3 }, equipment: { weapon, armor: 'leather', charm: '' }, quests: { m0: { status: 'active', count: 0 } }, region: 'elderbrook', position: { x: 432, y: 440 }, visited: ['elderbrook'], collected: [], defeated: [], kills: 0, choices: {}, ending: null, playtime: 0, created: Date.now(), updated: Date.now(), checkpoint: 'elderbrook' };
    const stats = statsFor(this.s); this.s.hp = stats.maxHp; this.s.mana = stats.maxMana; this.save(); this.changed();
  }
  addXp(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.s.xp += Math.floor(amount);
    while (this.s.level < 99 && this.s.xp >= xpForLevel(this.s.level)) { this.s.xp -= xpForLevel(this.s.level); this.s.level++; this.s.points += 2; const stats = statsFor(this.s); this.s.hp = stats.maxHp; this.s.mana = stats.maxMana; this.notice('LEVEL ' + this.s.level + ' · +2 talent points'); }
    this.changed();
  }
  addItem(id: string, count = 1) { if (!ITEMS[id] || !integer(count, 1, 9999)) return; this.s.items[id] = Math.min(9999, (this.s.items[id] ?? 0) + count); this.changed(); }
  acceptQuest(id: string): boolean {
    const q = SIDE_QUESTS.find(q => q.id === id); if (!q || this.s.quests[id]) return false;
    const previouslyCollected = Math.max(Number(this.s.choices['history:'+q.event+':'+q.target]??0),new Set(this.s.collected.filter(key => key.includes(':' + q.target + ':'))).size);
    const count = q.event === 'gather' ? Math.min(Math.max(this.s.items[q.target] ?? 0, previouslyCollected), q.count) : q.event === 'interact' ? Math.min(previouslyCollected, q.count) : 0;
    this.s.quests[id] = { status: count >= q.count ? 'ready' : 'active', count }; this.notice('Quest accepted · ' + q.name); this.save(); this.changed(); return true;
  }
  emit(event: EventKind, target: string) {
    const history='history:'+event+':'+target;this.s.choices[history]=String(Math.min(9999,Number(this.s.choices[history]??0)+1));
    if (event === 'kill') this.s.kills++;
    const active = QUESTS.filter(q => this.s.quests[q.id]?.status === 'active');
    for (const q of active) { if (q.event !== event || q.target !== target) continue; const p = this.s.quests[q.id]; p.count = Math.min(q.count, p.count + 1); if (p.count === q.count) { p.status = 'ready'; if (q.kind === 'main') this.claimQuest(q.id); else this.notice('Quest complete · ' + q.name + ' · claim in journal'); } }
    this.save(); this.changed();
  }
  claimQuest(id: string): boolean {
    const q = QUESTS.find(q => q.id === id), p = this.s.quests[id]; if (!q || !p || p.status !== 'ready') return false;
    p.status = 'completed'; this.s.gold += q.gold; if (q.item) this.s.items[q.item] = (this.s.items[q.item] ?? 0) + 1;
    this.addXp(q.xp);
    if (q.kind === 'main') { const next = MAIN_QUESTS[MAIN_QUESTS.findIndex(q => q.id === id) + 1]; if (next) this.s.quests[next.id] = { status: 'active', count: 0 }; }
    this.notice(q.name + ' · +' + q.xp + ' XP · +' + q.gold + ' gold'); this.save(); this.changed(); return true;
  }
  travel(id: string, position?: {x:number;y:number}): boolean {
    const r = REGIONS.find(r => r.id === id); if (!r || r.stage > this.mainIndex) { this.notice('Follow the main quest to open this road.'); return false; }
    if(r.requires?.some(key=>!this.s.collected.includes(key))&&!this.s.defeated.includes(r.boss??'')){this.notice('Restore the three wards in '+regionById(this.s.region).name+'.');return false;}
    const current=regionById(this.s.region);
    if(r.parent===current.id)this.s.choices['return:'+r.id]=JSON.stringify(this.s.position);
    if(current.parent===r.id){try{const saved:unknown=JSON.parse(this.s.choices['return:'+current.id]??'null');if(isRecord(saved)&&typeof saved.x==='number'&&Number.isFinite(saved.x)&&typeof saved.y==='number'&&Number.isFinite(saved.y))position={x:Math.max(24,Math.min(r.cols!*16-24,saved.x)),y:Math.max(32,Math.min(r.rows!*16-24,saved.y))};}catch{/* Use the entry point. */}}
    this.s.region = id; this.s.position = position??{ x:r.type==='town'?456:r.cols!*8+8,y:r.type==='town'?472:(r.rows!-7)*16+8 }; if (!this.s.visited.includes(id)) this.s.visited.push(id);
    if (r.type === 'town') this.s.checkpoint = id;
    this.emit('visit', id); this.save(); this.changed(); return true;
  }
  buy(id: string): boolean { const i = ITEMS[id]; if (!i || this.s.gold < i.price) { this.notice('Not enough gold.'); return false; } this.s.gold -= i.price; this.addItem(id); this.save(); return true; }
  sell(id: string): boolean { const i = ITEMS[id], n = this.s.items[id] ?? 0; if (!i || n < 1 || (Object.values(this.s.equipment).includes(id) && n === 1)) { this.notice('Keep one copy of your equipped item.'); return false; } this.s.items[id]--; this.s.gold += Math.max(1, Math.floor(i.price * 0.4)); this.save(); this.changed(); return true; }
  equip(id: string): boolean { const i = ITEMS[id]; if (!i || !(this.s.items[id] > 0) || !['weapon', 'armor', 'charm'].includes(i.type)) return false; this.s.equipment[i.type as 'weapon' | 'armor' | 'charm'] = id; const stats = statsFor(this.s); this.s.hp = Math.min(this.s.hp, stats.maxHp); this.s.mana = Math.min(this.s.mana, stats.maxMana); this.notice(i.name + ' equipped'); this.save(); this.changed(); return true; }
  use(id: string): boolean { const i = ITEMS[id]; if (!i || i.type !== 'consumable' || !(this.s.items[id] > 0)) { this.notice('No potions left.'); return false; } const stats = statsFor(this.s); if ((i.heal && this.s.hp >= stats.maxHp) || (i.restore && this.s.mana >= stats.maxMana)) { this.notice('Already full.'); return false; } this.s.items[id]--; this.s.hp = Math.min(stats.maxHp, this.s.hp + (i.heal ?? 0)); this.s.mana = Math.min(stats.maxMana, this.s.mana + (i.restore ?? 0)); this.notice(i.name + ' used'); this.save(); this.changed(); return true; }
  learn(id: string): boolean { const skill = SKILLS.find(s => s.id === id); if (!skill || this.s.points < 1 || (this.s.talents[id] ?? 0) >= skill.max || (skill.discipline !== 'all' && skill.discipline !== this.s.discipline)) return false; this.s.points--; this.s.talents[id] = (this.s.talents[id] ?? 0) + 1; this.notice(skill.name + ' upgraded'); this.save(); this.changed(); return true; }
  craft(id: string): boolean { const recipe = RECIPES.find(r => r.id === id); if (!recipe || this.s.gold < recipe.gold || !Object.entries(recipe.materials).every(([m, n]) => (this.s.items[m] ?? 0) >= Number(n))) { this.notice('More materials or gold needed.'); return false; } for (const [m, n] of Object.entries(recipe.materials)) this.s.items[m] -= Number(n); this.s.gold -= recipe.gold; this.addItem(id); this.notice(ITEMS[id].name + ' crafted'); this.save(); return true; }
  rest(): boolean { if (!['town','interior'].includes(regionById(this.s.region).type)) return false; const stats = statsFor(this.s); this.s.hp = stats.maxHp; this.s.mana = stats.maxMana; this.notice('Rested · health and mana restored'); this.save(); this.changed(); return true; }
  die() { this.s.gold = Math.max(0, this.s.gold - Math.min(40, Math.floor(this.s.gold * 0.1))); this.s.region = this.s.checkpoint; this.s.position = { x: 432, y: 440 }; const stats = statsFor(this.s); this.s.hp = stats.maxHp; this.s.mana = stats.maxMana; this.notice('Returned to your hearth. Your progress is safe.'); this.save(); this.changed(); }
  chooseEnding(id: keyof typeof ENDINGS): boolean { if (!ENDINGS[id] || this.mainIndex !== 9 || (id === 'share' && !this.canShareDawn)) return false; this.s.ending = id; this.s.choices.ending = id; this.emit('choice', 'ending'); this.save(); this.changed(); return true; }
  updateSettings(patch: Partial<Settings>) { this.settings = { ...this.settings, ...patch }; try { this.storage.setItem('eldervale.settings', JSON.stringify(this.settings)); } catch { this.notice('Settings could not be saved.'); } this.changed(); }
  save(): boolean { if (!this.state) return false; this.s.updated = Date.now(); try { this.storage.setItem(SAVE_KEY, JSON.stringify(this.s)); return true; } catch { this.notice('Storage is full. Export your save from the pause menu.'); return false; } }
  load(): boolean { try { const raw = this.storage.getItem(SAVE_KEY); if (!raw) return false; const s = validateSave(JSON.parse(raw)); if (!s) { this.notice('Invalid save. Begin a new journey or import a backup.'); return false; } this.state = s; this.changed(); return true; } catch { return false; } }
  backup() { try { const prev = this.storage.getItem(SAVE_KEY); if (prev) this.storage.setItem('eldervale.backup.v1', prev); } catch { /* Export remains available if storage is full. */ } }
  importSave(text: string): boolean { try { const s = validateSave(JSON.parse(text)); if (!s) { this.notice('Invalid save format.'); return false; } this.backup(); this.state = s; this.save(); this.changed(); return true; } catch { this.notice('Could not read this save.'); return false; } }
}
