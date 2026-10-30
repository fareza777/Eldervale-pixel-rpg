export type Discipline = 'warden' | 'ranger' | 'arcanist';
export type ItemType = 'weapon' | 'armor' | 'charm' | 'consumable' | 'material';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type EventKind = 'talk' | 'visit' | 'kill' | 'gather' | 'interact' | 'choice';
export interface ItemDef { id: string; name: string; type: ItemType; rarity: Rarity; description: string; icon: string; price: number; atk?: number; def?: number; hp?: number; mana?: number; heal?: number; restore?: number; }
export interface QuestDef { id: string; name: string; kind: 'main' | 'side'; giver: string; description: string; objective: string; event: EventKind; target: string; count: number; xp: number; gold: number; item?: string; }
export interface QuestProgress { status: 'active' | 'ready' | 'completed'; count: number; }
export interface RegionDef { id: string; name: string; subtitle: string; type: 'town' | 'wild' | 'dungeon' | 'interior'; theme: 'forest' | 'marsh' | 'ice' | 'crypt' | 'gold'; level: number; stage: number; ambience: string; exits: string[]; x: number; y: number; color: string; lore: string; boss?: string; cols?: number; rows?: number; parent?: string; house?: string; requires?: string[]; }
export interface NpcDef { id: string; name: string; title: string; region: string; x: number; y: number; sprite: string; portrait: string; text: string[]; service?: 'shop' | 'smith' | 'alchemy' | 'inn'; quest?: string[]; }
export interface EnemyDef { id: string; name: string; sprite: string; hp: number; atk: number; speed: number; xp: number; gold: number; behavior: 'chase' | 'ranged' | 'charge'; lore: string; icon: string; boss?: boolean; }
export interface SkillDef { id: string; name: string; description: string; discipline: Discipline | 'all'; icon: string; max: number; stat: 'atk' | 'def' | 'hp' | 'mana' | 'power'; value: number; }
export interface GameState { version: 1; name: string; discipline: Discipline; level: number; xp: number; gold: number; hp: number; mana: number; points: number; talents: Record<string, number>; items: Record<string, number>; equipment: { weapon: string; armor: string; charm: string }; quests: Record<string, QuestProgress>; region: string; position: { x: number; y: number }; visited: string[]; collected: string[]; defeated: string[]; kills: number; choices: Record<string, string>; ending: string | null; playtime: number; created: number; updated: number; checkpoint: string; }
export interface Settings { ambience: number; sfx: number; voice: number; difficulty: 'story' | 'normal' | 'heroic'; reducedMotion: boolean; screenShake: boolean; haptics: boolean; language: 'id' | 'en'; joystickMode:'floating'|'fixed'; controlSize:'compact'|'standard'|'large'; controlOpacity:number; attackStyle:'classic'|'whirl'; hitEffects:'subtle'|'full'; aimAssist:boolean; autoRun:boolean; }
export interface Stats { maxHp: number; maxMana: number; atk: number; def: number; speed: number; power: number; }

