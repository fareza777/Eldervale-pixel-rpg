import type { Discipline, EnemyDef, ItemDef, NpcDef, QuestDef, RegionDef, SkillDef } from './core/types';
import { EXTRA_ITEMS, EXTRA_REGIONS, HOUSES, WARD_GATES, wardIds } from './expansion';
import story from './story.json';
export const CLASSES: Record<Discipline, { name: string; title: string; description: string; skill: string; color: string; portrait: string; sprite: string }> = {
  warden: { name: 'Warden', title: 'Keeper of Dawn', description: 'A steady blade, strong armor, and a circle of protective light.', skill: 'Sunbreak — a sweeping burst of light', color: '#d8b875', portrait: '2', sprite: 'hero1' },
  ranger: { name: 'Ranger', title: 'Walker of the Wilds', description: 'A swift bow and quicker feet. Keep your distance; make every shot count.', skill: 'Thorn Volley — a storm of arrows', color: '#c0a47d', portrait: '4', sprite: 'hero3' },
  arcanist: { name: 'Arcanist', title: 'Weaver of Memory', description: 'Fragile but powerful. Turn forgotten memories into devastating magic.', skill: 'Memory Nova — an arcane shockwave', color: '#b1b9d7', portrait: '0', sprite: 'hero5' },
};
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(([
  { id: 'old_sword', name: 'Wanderer’s Blade', type: 'weapon', rarity: 'common', description: 'Lyra left it at your door. The hilt reads: come home.', icon: 'sheet:0', atk: 4, price: 25 },
  { id: 'old_bow', name: 'Hazel Bow', type: 'weapon', rarity: 'common', description: 'Made from the woods where you grew up together.', icon: 'sheet:1', atk: 4, price: 25 },
  { id: 'old_staff', name: 'Memory Staff', type: 'weapon', rarity: 'common', description: 'Its crystal holds a laugh you refuse to forget.', icon: 'sheet:2', atk: 5, price: 25 },
  { id: 'leather', name: 'Wanderer’s Mantle', type: 'armor', rarity: 'common', description: 'Warm, worn, and ready for another journey.', icon: 'sheet:5', def: 2, price: 20 },
  { id: 'sun_sword', name: 'Dawncleaver', type: 'weapon', rarity: 'rare', description: 'Forged from first light. Remind the darkness of morning.', icon: 'sheet:0', atk: 14, price: 220 },
  { id: 'verdant_bow', name: 'Verdant Oath', type: 'weapon', rarity: 'rare', description: 'An ancient guardian’s bow, bound with golden vines.', icon: 'sheet:1', atk: 14, price: 220 },
  { id: 'echo_staff', name: 'Echo of Ages', type: 'weapon', rarity: 'rare', description: 'A thousand recovered memories answer its call.', icon: 'sheet:2', atk: 16, price: 240 },
  { id: 'sun_plate', name: 'Sunforged Plate', type: 'armor', rarity: 'rare', description: 'Gilded steel that stays warm through the longest night.', icon: 'sheet:4', def: 9, hp: 35, price: 190 },
  { id: 'ranger_cloak', name: 'Ancient Forest Cloak', type: 'armor', rarity: 'uncommon', description: 'Woven with root-thread and a traveler’s promise.', icon: 'sheet:5', def: 6, price: 110 },
  { id: 'signet', name: 'Tidecross Signet', type: 'charm', rarity: 'rare', description: 'The names of the missing are etched inside.', icon: 'sheet:6', atk: 3, mana: 20, price: 150 },
  { id: 'sun_amulet', name: 'Heart of Dawn', type: 'charm', rarity: 'legendary', description: 'A fragment of sunlight that refuses to feed on memory.', icon: 'sheet:7', atk: 8, def: 4, hp: 30, price: 450 },
  { id: 'lantern', name: 'Lyra’s Lantern', type: 'charm', rarity: 'uncommon', description: 'It brightens whenever you choose to help.', icon: 'sheet:3', hp: 20, mana: 10, price: 85 },
  { id: 'potion', name: 'Healing Draught', type: 'consumable', rarity: 'common', description: 'Restores 65 HP. Use Heal during combat.', icon: 'sheet:8', heal: 65, price: 18 },
  { id: 'ether', name: 'Aether Dew', type: 'consumable', rarity: 'uncommon', description: 'Restores 45 mana.', icon: 'sheet:9', restore: 45, price: 22 },
  { id: 'crystal', name: 'Memory Crystal', type: 'material', rarity: 'rare', description: 'A human story, crystallized. Used in crafting.', icon: 'sheet:10', price: 20 },
  { id: 'feather', name: 'Sun Feather', type: 'material', rarity: 'legendary', description: 'Ownerless light, gifted by an ancient guardian.', icon: 'sheet:11', price: 50 },
  { id: 'herb', name: 'Moonbloom', type: 'material', rarity: 'common', description: 'A pale flower that blooms beneath the false sun.', icon: 'relic_herb_pouch', price: 4 },
  { id: 'ore', name: 'Stariron Ore', type: 'material', rarity: 'uncommon', description: 'Metal from a meteor older than recorded history.', icon: 'mat_iron_ore', price: 8 },
  { id: 'gel', name: 'Moss Gel', type: 'material', rarity: 'common', description: 'A useful base for healing draughts.', icon: 'mat_slime_gel', price: 3 },
  ...EXTRA_ITEMS,
] as ItemDef[]).map(i => [i.id, i]));
export const REGIONS: RegionDef[] = [
  { id: 'elderbrook', name: 'Elderbrook', subtitle: 'Where your story begins', type: 'town', theme: 'forest', level: 1, stage: 0, ambience: 'forest', exits: ['wilds'], x: 16, y: 68, color: '#c5b48e', lore: 'A sheltered village beneath old trees. This morning, a mother forgot her child’s name.' },
  { id: 'wilds', name: 'Whispering Wilds', subtitle: 'The forest remembers your name', type: 'wild', theme: 'forest', level: 1, stage: 1, ambience: 'forest', exits: ['elderbrook', 'sanctuary', 'tidecross'], x: 29, y: 58, color: '#b2a88c', lore: 'Roots carry stolen memories through the valley. Some memories have learned to hunt.' },
  { id: 'sanctuary', name: 'Rootbound Sanctuary', subtitle: 'The Root Seal', type: 'dungeon', theme: 'forest', level: 3, stage: 2, ambience: 'ruins', exits: ['wilds'], x: 27, y: 31, color: '#c0ad7d', boss: 'rootwarden', lore: 'Its guardian saved his village by sacrificing his daughter’s name. The roots remember what he cannot.' },
  { id: 'tidecross', name: 'Tidecross', subtitle: 'A city of bridges and lost names', type: 'town', theme: 'marsh', level: 4, stage: 3, ambience: 'water', exits: ['wilds', 'mire'], x: 47, y: 66, color: '#a2b0c0', lore: 'Families wear engraved bracelets, afraid the next dawn will make them strangers.' },
  { id: 'mire', name: 'Mire of Echoes', subtitle: 'Everything beneath the water still speaks', type: 'wild', theme: 'marsh', level: 4, stage: 4, ambience: 'water', exits: ['tidecross', 'archive', 'frosthaven'], x: 54, y: 50, color: '#9aa8ba', lore: 'The fog imitates voices you miss. Follow only the voice that remembers your name.' },
  { id: 'archive', name: 'Drowned Archive', subtitle: 'The Sea Seal', type: 'dungeon', theme: 'crypt', level: 5, stage: 4, ambience: 'ruins', exits: ['mire'], x: 48, y: 27, color: '#a5b1c9', boss: 'archivist', lore: 'The Dawn Council drowned every record of those who refused the sacrifice. The ink never washed away.' },
  { id: 'frosthaven', name: 'Frosthaven', subtitle: 'The last hearth in the north', type: 'town', theme: 'ice', level: 6, stage: 5, ambience: 'frost', exits: ['mire', 'pass'], x: 69, y: 57, color: '#c0cad6', lore: 'Exiles chose cold and darkness over forgetting the people they loved.' },
  { id: 'pass', name: 'Frostglass Pass', subtitle: 'A road frozen in time', type: 'wild', theme: 'ice', level: 6, stage: 6, ambience: 'frost', exits: ['frosthaven', 'vault', 'spire'], x: 78, y: 41, color: '#c7c9d7', lore: 'The ice holds the silhouettes of travelers. One wears your sister’s cloak.' },
  { id: 'vault', name: 'Frostglass Vault', subtitle: 'The Star Seal', type: 'dungeon', theme: 'ice', level: 7, stage: 6, ambience: 'frost', exits: ['pass'], x: 83, y: 20, color: '#c7c3dd', boss: 'glasskeeper', lore: 'Lyra sealed her last memory here: a quiet evening at home, before the sun learned to hunger.' },
  { id: 'spire', name: 'The Hollow Spire', subtitle: 'Where dawn demands its price', type: 'dungeon', theme: 'gold', level: 8, stage: 7, ambience: 'spire', exits: ['pass'], x: 65, y: 14, color: '#d9b776', boss: 'hollowking', lore: 'The sun is a door. The Council calls it salvation. Lyra calls it a cage.' },
  ...EXTRA_REGIONS,
];
for (const r of REGIONS) {
  r.cols ??= r.type === 'town' ? 62 : 72;
  r.rows ??= r.type === 'town' ? 56 : r.boss ? 70 : r.type === 'dungeon' ? 100 : 88;
  if (r.id === 'wilds') r.exits = ['elderbrook','oldroad','tidecross'];
  if (r.id === 'mire') r.exits = ['tidecross','causeway','frosthaven'];
  if (r.id === 'pass') r.exits = ['frosthaven','ridge','spire_approach'];
  if (r.id === 'oldroad') r.exits.push('cindertrail');
  if (r.id === 'causeway') r.exits.push('moonroad');
  if (r.id === 'ridge') r.exits.push('watchroad');
  if (WARD_GATES[r.id]) { r.requires = wardIds(WARD_GATES[r.id]); r.exits = [WARD_GATES[r.id]]; }
  if (r.type === 'town') r.exits.push(...HOUSES.filter(h=>h.parent===r.id).map(h=>h.id));
}
export const regionById = (id: string): RegionDef => REGIONS.find(r => r.id === id) ?? REGIONS[0];
const main = (id: string, name: string, description: string, objective: string, event: QuestDef['event'], target: string, xp: number, gold = 30, item?: string): QuestDef => ({ id, name, kind: 'main', giver: 'Chronicle of Dawn', description, objective, event, target, count: 1, xp, gold, item });
const side = (id: string, name: string, giver: string, description: string, objective: string, event: QuestDef['event'], target: string, count: number, xp: number, gold: number, item?: string): QuestDef => ({ id, name, kind: 'side', giver, description, objective, event, target, count, xp, gold, item });
export const MAIN_QUESTS: QuestDef[] = [
  main('m0', 'A Name Erased', 'Lyra vanished three dawns ago. Everyone says you never had a sister. One archivist knows otherwise.', 'Speak to Mara in Elderbrook.', 'talk', 'mara', 35, 25, 'lantern'),
  main('m1', 'A Trail of Roots', 'Lyra’s lantern pulls toward the forest. The old roots are hiding something the Council wants forgotten.', 'Enter Whispering Wilds through the north gate.', 'visit', 'wilds', 40),
  main('m2', 'The Father Who Forgot', 'Follow the Lantern Road and Silverleaf Glade into the first root’s halls. Three family lanterns open the sanctuary. The guardian traded his daughter’s name for dawn.', 'Restore the three Root Wards, then face the Rootwarden.', 'kill', 'rootwarden', 150, 95, 'feather'),
  main('m3', 'The City of Lost Names', 'The seal reveals Lyra in Tidecross. A lighthouse keeper still holds her final letter.', 'Find Orrin in Tidecross.', 'talk', 'orrin', 65, 50),
  main('m4', 'What the Water Keeps', 'Cross the broken causeway. Recover the witness records in the Inkbound Galleries, then descend into the archive the Council drowned.', 'Restore the Record Wards and release the Drowned Archivist.', 'kill', 'archivist', 220, 120, 'signet'),
  main('m5', 'Those Who Chose the Night', 'Northern exiles remember the sun’s creation. Elara knows why Lyra went willingly, and what the Council hid from you.', 'Speak to Elara in Frosthaven.', 'talk', 'elara', 90, 65),
  main('m6', 'A Memory in Glass', 'Climb Pilgrim’s Ridge into the Prism Descent. Beneath the ice waits Lyra’s last memory, and a promise in your own handwriting.', 'Restore the Reflection Wards, then defeat the Glasskeeper.', 'kill', 'glasskeeper', 300, 150, 'sun_amulet'),
  main('m7', 'The Door Behind the Dawn', 'Three seals open the Sunless Stair. Restore the abandoned oaths and reach the Spire. The sun once hid humanity from a star-eater. Now it has become one.', 'Climb the Sunless Stair. Restore its wards and enter the Spire.', 'visit', 'spire', 100, 80),
  main('m8', 'King of All We Have Lost', 'The Hollow King is every erased citizen holding the others together inside the cage. Release them before the Council takes one more dawn.', 'Defeat the Hollow King.', 'kill', 'hollowking', 500, 250, 'feather'),
  main('m9', 'The Price of Morning', 'Lyra remembers the plan you chose to forget. The sun’s door stands open. This time, you choose who carries the dawn.', 'Speak to Lyra at the altar. Choose Eldervale’s future.', 'choice', 'ending', 250, 0),
];
export const SIDE_QUESTS: QuestDef[] = [
  side('herbalist', 'Flowers for the Forgetful', 'Nessa', 'Nessa hopes Moonbloom tea will help her husband remember their first meeting.', 'Gather 3 Moonbloom in Whispering Wilds.', 'gather', 'herb', 3, 70, 40, 'potion'),
  side('cat', 'A Home for Miso', 'Tavi', 'Tavi tied a ribbon to her lost cat so she would never forget him.', 'Find Miso east of Elderbrook’s square.', 'interact', 'cat', 1, 45, 25, 'ether'),
  side('slimes', 'The Road Home', 'Garrick', 'A refugee caravan cannot return while creatures infest the road.', 'Defeat 6 Moss Slimes in Whispering Wilds.', 'kill', 'slime', 6, 90, 65, 'ranger_cloak'),
  side('letters', 'Letters for Tomorrow', 'Orrin', 'Three letters fell from the mailboat. Their writers deserve to be remembered.', 'Recover 3 letters in Mire of Echoes.', 'interact', 'letter', 3, 110, 75, 'crystal'),
  side('wraiths', 'Names Beneath the Water', 'Selene', 'These spirits were citizens erased from the archive. Release them from their grief.', 'Free 5 Echo Wraiths in the Mire or Archive.', 'kill', 'wraith', 5, 130, 90, 'ether'),
  side('bell', 'A Light Beneath the Waves', 'Selene', 'Selene’s father left a beacon in the archive. Rekindle it so she can say goodbye.', 'Light the old beacon in Drowned Archive.', 'interact', 'bell', 1, 120, 70, 'lantern'),
  side('ore', 'Steel for Winter', 'Brann', 'Frosthaven needs a furnace that does not burn its dwindling wood supply.', 'Mine 4 Stariron in Frostglass Pass.', 'gather', 'ore', 4, 150, 100, 'sun_plate'),
  side('wolves', 'Children Beyond the Mist', 'Elara', 'Crystal beasts follow the children’s tracks. Keep them away from the town.', 'Defeat 5 Frostfangs in Frostglass Pass.', 'kill', 'wolf', 5, 160, 110, 'crystal'),
  side('memory', 'The Pages That Remain', 'Mara', 'Mara hid the village’s memories in three pages. Bring them back before the ink fades.', 'Recover a memory page in each seal dungeon.', 'interact', 'memory', 3, 220, 120, 'sun_amulet'),
  side('stars', 'The Stargazer', 'Ivo', 'Ivo believes the stars still shine behind the false sun. Help him find the sky.', 'Activate the observatories in the Wilds, Mire, and Pass.', 'interact', 'observatory', 3, 240, 130, 'feather'),
  side('forge_wards','Names in Copper','Doran','The miners made nameplates for erased families. Bring light back to their abandoned workshops.','Restore 3 wards in the Ember Quarry.','interact','quarry',3,150,100,'copper_blade'),
  side('quarry_relic','The Last Delivery','Doran','A shipment for the refugee caravan never left the deepest quarry chamber.','Recover the relic at the end of the Ember Quarry.','interact','quarry_relic',1,160,110,'root_ring'),
  side('well_wards','A Record for Every Child','Aster','Three witness lamps protect a register of children the Council erased.','Restore 3 wards in the Moonwell.','interact','moonwell',3,200,135,'river_mail'),
  side('well_relic','The Lake Remembers','Aster','Aster’s sister hid one final page beneath the lake. Carry it back into daylight.','Recover the relic at the end of the Moonwell.','interact','moonwell_relic',1,220,150,'archive_sigil'),
  side('watch_wards','The Winter We Share','Rowan','The watchmen left three warded supply stores for whoever came after them.','Restore 3 wards in the Nightwatch Crypt.','interact','watchcrypt',3,260,180,'winter_mail'),
  side('watch_relic','A Hearth for the Missing','Rowan','A lantern in the deepest chamber holds the names of lost pilgrims.','Recover the relic at the end of the Nightwatch Crypt.','interact','watchcrypt_relic',1,280,190,'glass_pendant'),
];
export const QUESTS = [...MAIN_QUESTS, ...SIDE_QUESTS];
export const MEMORY_PAGES: Record<string, { title: string; author: string; text: string }> = {
  sanctuary: { title: 'The Lantern I Kept', author: 'A father’s final page', text: 'They told me a name was a small price for peace. When the sun took hers, I could still remember being a father. I just had no one left to love. Please tell her I kept the lantern lit.' },
  archive: { title: 'The First False Dawn', author: 'A record the Council drowned', text: 'The sun was built from a captive star-eater. We did not end its hunger; we taught it to eat memories instead of worlds. The Council erased the witnesses so no one could ask when enough would be enough.' },
  vault: { title: 'The Day We Found Home', author: 'Lyra’s unsent letter', text: 'I offered it the day we first found home. Then it asked for the next day, and the next. I am running out of mornings. If you find me, bring no grand sacrifice. Bring the people we would be leaving behind.' },
};
export const NPCS: NpcDef[] = [
  { id: 'mara', name: 'Mara', title: 'Keeper of Records', region: 'elderbrook', x: 17, y: 12, sprite: 'npc3', portrait: '0', text: ['Lyra was real. The Council ordered her name erased. I kept this page.', 'Take her lantern north. Recover the three seals, and the sun will have to answer you.'], quest: ['memory'] },
  { id: 'nessa', name: 'Nessa', title: 'Moonbloom Alchemist', region: 'elderbrook', x: 33, y: 21, sprite: 'npc10', portrait: '1', text: ['He still makes two cups of tea. He just cannot remember why. Will you help me find Moonbloom?'], service: 'alchemy', quest: ['herbalist'] },
  { id: 'garrick', name: 'Garrick', title: 'Gate Warden', region: 'elderbrook', x: 26, y: 10, sprite: 'npc11', portrait: '2', text: ['Watch the red marks. Dodge first, strike after. Clear the road and our people can come home.'], quest: ['slimes'] },
  { id: 'tavi', name: 'Tavi', title: 'A Child with a Red Ribbon', region: 'elderbrook', x: 38, y: 28, sprite: 'npc7', portrait: '4', text: ['Miso has a red ribbon on his tail. Please tell him I still remember.'], quest: ['cat'] },
  { id: 'pip', name: 'Pip', title: 'Traveling Merchant', region: 'elderbrook', x: 14, y: 27, sprite: 'npc22', portrait: '4', text: ['A good pack makes a long road shorter. What do you need?'], service: 'shop' },
  { id: 'brann', name: 'Brann', title: 'Stariron Smith', region: 'frosthaven', x: 17, y: 20, sprite: 'npc13', portrait: '3', text: ['Three ore, two crystals. I can forge a weapon fit for whatever waits in the Spire.'], service: 'smith', quest: ['ore'] },
  { id: 'orrin', name: 'Orrin', title: 'Lighthouse Keeper', region: 'tidecross', x: 28, y: 13, sprite: 'npc4', portrait: '2', text: ['Lyra left you a letter. She wanted a dawn that cost no one their memories.', 'The Council drowned the proof. Enter the Mire; find the archive beneath its waters.'], quest: ['letters'] },
  { id: 'selene', name: 'Selene', title: 'Keeper of Lost Names', region: 'tidecross', x: 15, y: 25, sprite: 'npc5', portrait: '5', text: ['My father’s beacon lies beneath the archive. One last light might guide him home.'], quest: ['wraiths', 'bell'] },
  { id: 'tide_merchant', name: 'Ludo', title: 'River Merchant', region: 'tidecross', x: 36, y: 24, sprite: 'npc22', portrait: '4', text: ['In Tidecross, name bracelets sell better than gold. I hope that changes.'], service: 'shop' },
  { id: 'ivo', name: 'Ivo', title: 'Stargazer', region: 'tidecross', x: 39, y: 13, sprite: 'npc3', portrait: '0', text: ['The stars are still there. Three observatories might prove it. Bring me a piece of the sky.'], quest: ['stars'] },
  { id: 'elara', name: 'Elara', title: 'Keeper of the Hearth', region: 'frosthaven', x: 29, y: 13, sprite: 'npc17', portrait: '5', text: ['Lyra came willingly. She offered the sun her memories so it would stop taking ours.', 'It accepted. Then it wanted more. Her final memory waits in Frostglass Vault.'], service: 'inn', quest: ['wolves'] },
  { id: 'north_merchant', name: 'Wren', title: 'Northern Trader', region: 'frosthaven', x: 37, y: 27, sprite: 'npc10', portrait: '4', text: ['Warm your hands. The road to the Spire rewards those who prepare.'], service: 'shop' },
  { id: 'lyra', name: 'Lyra', title: 'The Name You Remember', region: 'spire', x: 27, y: 6, sprite: 'npc5', portrait: '5', text: ['You always followed me. I should have known you would find me here.', 'We can break the cage, take its burden, or share its light. What kind of dawn do we deserve?'] },
  {id:'doran',name:'Doran',title:'Copperworks Foreman',region:'cinderwatch',x:27,y:24,sprite:'npc13',portrait:'3',text:['A nameplate is a promise made in copper. The miners kept making them, even when the Council ordered silence.','The Ember Quarry lies east of Copperleaf Trail. Restore their wards and finish the last delivery.'],service:'smith',quest:['forge_wards','quarry_relic']},
  {id:'aster',name:'Aster',title:'Keeper of the Moon Registry',region:'moonmere',x:30,y:23,sprite:'npc5',portrait:'5',text:['The Council’s records say these children never existed. Our lake keeps a different ledger.','Enter the Moonwell from Mistflower Banks. Its witness lamps still protect the last page.'],quest:['well_wards','well_relic']},
  {id:'rowan',name:'Rowan',title:'Warden of the Refuge',region:'starfall',x:28,y:24,sprite:'npc11',portrait:'2',text:['We take turns keeping the fire. No one is asked to surrender a name here.','Follow the Northern Watchroad east into the Nightwatch Crypt. The stores beneath it could carry us through winter.'],service:'inn',quest:['watch_wards','watch_relic']},
  ...HOUSES.filter(h=>['alchemy','smith','shop','inn'].includes(h.kind)).map((h):NpcDef=>{const role=h.kind==='alchemy'?'alchemist':h.kind==='shop'?'merchant':h.kind;return {id:'house_'+role+'_'+h.id,name:h.kind==='inn'?'Hearthkeeper':h.kind==='smith'?'Forgekeeper':h.kind==='shop'?'Shopkeeper':'Apothecary',title:h.name,region:h.id,x:h.kind==='alchemy'?9:h.kind==='smith'?22:h.kind==='inn'?23:16,y:h.kind==='inn'?20:h.kind==='shop'?16:17,sprite:h.kind==='smith'?'npc13':h.kind==='inn'?'npc17':'npc10',portrait:h.kind==='smith'?'3':h.kind==='inn'?'5':'1',service:(h.kind==='shop'?'shop':h.kind==='inn'?'inn':h.kind) as NpcDef['service'],text:[h.kind==='inn'?'A warm hearth and a place to rest. You are welcome here.':h.kind==='smith'?'Good equipment brings you home. Let us make something that lasts.':h.kind==='shop'?'Supplies for the next road. Take your time.':'A little care goes a long way. What shall we brew?']};}),
];
export const ENEMIES: Record<string, EnemyDef> = {
  slime: { id: 'slime', name: 'Moss Slime', sprite: 'm01_0', hp: 30, atk: 7, speed: 35, xp: 16, gold: 7, behavior: 'chase', icon: 'mat_slime_gel', lore: 'A memory of dew, lost in a shapeless shadow.' },
  imp: { id: 'imp', name: 'Thorn Imp', sprite: 'm04_0', hp: 45, atk: 10, speed: 48, xp: 22, gold: 9, behavior: 'ranged', icon: 'relic_herb_pouch', lore: 'A broken promise grown into thorns.' },
  wraith: { id: 'wraith', name: 'Echo Wraith', sprite: 'm02_6', hp: 58, atk: 12, speed: 42, xp: 28, gold: 12, behavior: 'ranged', icon: 'mat_wraith_silk', lore: 'An erased citizen, waiting for someone to remember.' },
  skeleton: { id: 'skeleton', name: 'Forgotten Sentinel', sprite: 'm05_0', hp: 75, atk: 13, speed: 40, xp: 30, gold: 13, behavior: 'chase', icon: 'mat_bone_dust', lore: 'A watchman who has forgotten what he guards.' },
  wolf: { id: 'wolf', name: 'Frostfang', sprite: 'm03_6', hp: 86, atk: 16, speed: 58, xp: 37, gold: 16, behavior: 'charge', icon: 'mat_frost_crystal', lore: 'A crystal shadow that hunts reflections in the ice.' },
  sentinel: { id: 'sentinel', name: 'Sunless Knight', sprite: 'm05_2', hp: 120, atk: 20, speed: 43, xp: 45, gold: 20, behavior: 'ranged', icon: 'mat_void_essence', lore: 'Empty armor carrying the memories of those who never returned.' },
  rootwarden: { id: 'rootwarden', name: 'The Rootwarden', sprite: 'm04_0', hp: 380, atk: 18, speed: 34, xp: 100, gold: 55, behavior: 'charge', icon: 'mat_trophy_gorehorn', boss: true, lore: 'The roots hold his daughter’s name. His grief guards the roots.' },
  archivist: { id: 'archivist', name: 'The Drowned Archivist', sprite: 'm02_6', hp: 620, atk: 21, speed: 37, xp: 150, gold: 80, behavior: 'ranged', icon: 'mat_trophy_lamia', boss: true, lore: 'He drowned with his books. Their names still ripple across the water.' },
  glasskeeper: { id: 'glasskeeper', name: 'The Glasskeeper', sprite: 'm03_6', hp: 820, atk: 25, speed: 42, xp: 200, gold: 110, behavior: 'charge', icon: 'mat_trophy_vesper', boss: true, lore: 'A guardian who mistook frozen time for an end to loss.' },
  hollowking: { id: 'hollowking', name: 'The Hollow King', sprite: 'm05_2', hp: 1150, atk: 28, speed: 40, xp: 300, gold: 180, behavior: 'ranged', icon: 'mat_trophy_malachar', boss: true, lore: 'A million forgotten lives. A king who cannot recall his own name.' },
};
export const SKILLS: SkillDef[] = [
  { id: 'vitality', name: 'Heart of the Vale', description: '+18 maximum HP per rank.', discipline: 'all', icon: 'relic_iron_heart', max: 5, stat: 'hp', value: 18 },
  { id: 'resolve', name: 'Unbroken Oath', description: '+2 defense per rank.', discipline: 'all', icon: 'relic_mirror_shield', max: 5, stat: 'def', value: 2 },
  { id: 'focus', name: 'Well of Memory', description: '+12 maximum mana per rank.', discipline: 'all', icon: 'relic_echo_bell', max: 5, stat: 'mana', value: 12 },
  { id: 'blade', name: 'Dawnblade', description: '+4 attack per rank. Warden discipline.', discipline: 'warden', icon: 'relic_assassin_blade', max: 5, stat: 'atk', value: 4 },
  { id: 'aim', name: 'Farseeing', description: '+4 attack per rank. Ranger discipline.', discipline: 'ranger', icon: 'sheet:1', max: 5, stat: 'atk', value: 4 },
  { id: 'arcana', name: 'Echo Mastery', description: '+5 attack per rank. Arcanist discipline.', discipline: 'arcanist', icon: 'relic_big_book', max: 5, stat: 'atk', value: 5 },
  { id: 'sunbreak', name: 'Awakened Light', description: '+20% skill power per rank.', discipline: 'all', icon: 'relic_sun_disk', max: 5, stat: 'power', value: 0.2 },
];
export const RECIPES = [
  { id: 'potion', name: 'Healing Draught', materials: { herb: 2, gel: 1 }, gold: 5, service: 'alchemy' },
  { id: 'ether', name: 'Aether Dew', materials: { herb: 2, crystal: 1 }, gold: 8, service: 'alchemy' },
  { id: 'sun_sword', name: 'Dawncleaver', materials: { ore: 3, crystal: 2 }, gold: 70, service: 'smith' },
  { id: 'verdant_bow', name: 'Verdant Oath', materials: { ore: 3, crystal: 2 }, gold: 70, service: 'smith' },
  { id: 'echo_staff', name: 'Echo of Ages', materials: { ore: 3, crystal: 2 }, gold: 70, service: 'smith' },
  { id: 'sun_plate', name: 'Sunforged Plate', materials: { ore: 4, crystal: 1 }, gold: 60, service: 'smith' },
  { id: 'greater_potion', name: 'Hearth Elixir', materials: { herb: 3, gel: 2, amber: 1 }, gold: 12, service: 'alchemy' },
  { id: 'greater_ether', name: 'Starlit Dew', materials: { herb: 3, crystal: 2 }, gold: 18, service: 'alchemy' },
  { id: 'winter_mail', name: 'Frostweave Armor', materials: { ore: 5, frost_shard: 3, silk: 2 }, gold: 110, service: 'smith' },
  { id: 'dawn_armor', name: 'Dawnwarden Regalia', materials: { feather: 2, void_ash: 4, ore: 6 }, gold: 200, service: 'smith' },
];
export const ENDINGS = {
  remember: { title: 'The Sky We Remember', subtitle: 'The Remembered Night', text: 'You shatter the false sun. Night falls, but no one loses a name when morning comes. Lyra takes your hand. Above Frosthaven, Ivo finds a thousand stars. Life will be harder. At last, it belongs to them.' },
  sacrifice: { title: 'The Last Name of Dawn', subtitle: 'The Keeper of Dawn', text: 'You take Lyra’s place. The light grows warm. No one forgets again, because you carry every loss. Lyra writes your name each morning. At Elderbrook’s gate, a lantern waits for someone who promised to come home.' },
  share: { title: 'A Dawn for Everyone', subtitle: 'A Thousand Little Suns', text: 'You divide the sun into a thousand lanterns. No one must surrender an entire life of memories. Every home keeps a light; every name is held together. Lyra returns. For the first time, dawn is given freely.' },
};
for (const [id,page] of Object.entries(story.memories)) MEMORY_PAGES[id]={title:page.title,author:page.author,text:page.lines.map(l=>l.text).join(' ')};
for (const id of Object.keys(ENDINGS) as (keyof typeof ENDINGS)[]) ENDINGS[id].text=story.endings[id][0].text;
