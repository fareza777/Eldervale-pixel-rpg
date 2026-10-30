import type { ItemDef, RegionDef } from './core/types';

export const EXTRA_ITEMS: ItemDef[] = [
  { id:'copper_blade', name:'Wayfarer’s Edge', type:'weapon', rarity:'uncommon', icon:'relic_assassin_blade', atk:8, price:85, description:'A balanced blade carried by the old road wardens.' },
  { id:'river_bow', name:'Reedstring Bow', type:'weapon', rarity:'uncommon', icon:'sheet:1', atk:9, price:95, description:'Silent limbs and a river-silk string.' },
  { id:'amber_staff', name:'Amberbranch', type:'weapon', rarity:'uncommon', icon:'sheet:2', atk:10, mana:8, price:100, description:'A warm amber core holds a memory of summer.' },
  { id:'winter_blade', name:'Winter’s Promise', type:'weapon', rarity:'rare', icon:'relic_assassin_blade', atk:18, def:2, price:320, description:'Cold steel forged for the return journey.' },
  { id:'star_bow', name:'Starfall Bow', type:'weapon', rarity:'rare', icon:'sheet:1', atk:19, price:330, description:'Its arrows leave a brief trail of starlight.' },
  { id:'tide_staff', name:'Undertow', type:'weapon', rarity:'rare', icon:'sheet:2', atk:20, mana:15, price:340, description:'The drowned archive’s stories gather at its tip.' },
  { id:'last_blade', name:'The Last Horizon', type:'weapon', rarity:'legendary', icon:'sheet:0', atk:28, hp:20, price:650, description:'A guardian’s farewell, given the shape of a sword.' },
  { id:'sky_bow', name:'Night’s Witness', type:'weapon', rarity:'legendary', icon:'sheet:1', atk:28, mana:20, price:650, description:'For the first arrow beneath a true night sky.' },
  { id:'nova_staff', name:'A Thousand Names', type:'weapon', rarity:'legendary', icon:'sheet:2', atk:30, mana:25, price:690, description:'Every rescued name gives its light freely.' },
  { id:'road_coat', name:'Roadwarden Coat', type:'armor', rarity:'uncommon', icon:'sheet:5', def:4, hp:15, price:75, description:'Weatherproof wool reinforced at the shoulders.' },
  { id:'river_mail', name:'Riverkeeper Mail', type:'armor', rarity:'rare', icon:'sheet:4', def:7, mana:15, price:180, description:'Light links worn by Tidecross boat wardens.' },
  { id:'winter_mail', name:'Frostweave Armor', type:'armor', rarity:'rare', icon:'sheet:4', def:11, hp:45, price:300, description:'Stariron scales beneath an insulated mantle.' },
  { id:'dawn_armor', name:'Dawnwarden Regalia', type:'armor', rarity:'legendary', icon:'sheet:4', def:15, hp:60, mana:15, price:600, description:'Armor for a dawn that asks for no sacrifice.' },
  { id:'root_ring', name:'Rootbound Band', type:'charm', rarity:'uncommon', icon:'relic_iron_heart', hp:25, def:1, price:90, description:'The roots remember every hand that planted them.' },
  { id:'compass', name:'Homeward Compass', type:'charm', rarity:'uncommon', icon:'relic_sun_disk', atk:2, mana:10, price:95, description:'The needle points toward a promise kept.' },
  { id:'glass_pendant', name:'Glassheart Pendant', type:'charm', rarity:'rare', icon:'mat_frost_crystal', mana:35, def:3, price:230, description:'A quiet evening preserved in flawless crystal.' },
  { id:'archive_sigil', name:'Archivist’s Seal', type:'charm', rarity:'rare', icon:'relic_big_book', atk:5, mana:25, price:250, description:'A record that the Council could never erase.' },
  { id:'greater_potion', name:'Hearth Elixir', type:'consumable', rarity:'uncommon', icon:'sheet:8', heal:160, price:45, description:'Restores 160 HP. Brewed for dangerous roads.' },
  { id:'greater_ether', name:'Starlit Dew', type:'consumable', rarity:'rare', icon:'sheet:9', restore:100, price:55, description:'Restores 100 mana.' },
  { id:'silk', name:'Wraith Silk', type:'material', rarity:'uncommon', icon:'mat_wraith_silk', price:12, description:'Weightless thread left by a released echo.' },
  { id:'bone', name:'Pale Bone Dust', type:'material', rarity:'common', icon:'mat_bone_dust', price:6, description:'A useful stabilizer for protective armor.' },
  { id:'frost_shard', name:'Frostglass Shard', type:'material', rarity:'rare', icon:'mat_frost_crystal', price:18, description:'Prismatic ice used in northern craftsmanship.' },
  { id:'void_ash', name:'Sunless Ash', type:'material', rarity:'rare', icon:'mat_void_essence', price:24, description:'The last trace of a memory that learned to fight.' },
  { id:'amber', name:'Dawn Amber', type:'material', rarity:'uncommon', icon:'sheet:10', price:10, description:'Golden resin from the oldest trees in the Vale.' },
];

export interface HouseDef { id:string; parent:string; name:string; kind:'archive'|'alchemy'|'inn'|'smith'|'home'|'shop'; tx:number; ty:number; frame:string; }
export const HOUSES: HouseDef[] = [
  {id:'elder_records',parent:'elderbrook',name:'House of Records',kind:'archive',tx:15,ty:10,frame:'p/house_13'},
  {id:'elder_apothecary',parent:'elderbrook',name:'Moonbloom Apothecary',kind:'alchemy',tx:43,ty:18,frame:'p/house_14'},
  {id:'elder_inn',parent:'elderbrook',name:'The Copper Lantern',kind:'inn',tx:14,ty:36,frame:'p/house_10'},
  {id:'elder_home',parent:'elderbrook',name:'Ribbon Cottage',kind:'home',tx:45,ty:38,frame:'p/house_01'},
  {id:'elder_store',parent:'elderbrook',name:'Pip’s Supply House',kind:'shop',tx:12,ty:23,frame:'p/house_08'},
  {id:'tide_records',parent:'tidecross',name:'The Name Registry',kind:'archive',tx:13,ty:10,frame:'p/house_25'},
  {id:'tide_apothecary',parent:'tidecross',name:'Riverglass Atelier',kind:'alchemy',tx:45,ty:16,frame:'p/house_20'},
  {id:'tide_inn',parent:'tidecross',name:'The Quiet Mooring',kind:'inn',tx:14,ty:35,frame:'p/house_26'},
  {id:'tide_home',parent:'tidecross',name:'Boatkeeper’s House',kind:'home',tx:46,ty:39,frame:'p/house_21'},
  {id:'tide_store',parent:'tidecross',name:'Ludo’s River Goods',kind:'shop',tx:43,ty:29,frame:'p/house_22'},
  {id:'frost_records',parent:'frosthaven',name:'The Winter Library',kind:'archive',tx:14,ty:10,frame:'p/house_17'},
  {id:'frost_smith',parent:'frosthaven',name:'Stariron Forge',kind:'smith',tx:14,ty:26,frame:'p/house_16'},
  {id:'frost_inn',parent:'frosthaven',name:'The Last Hearth',kind:'inn',tx:30,ty:9,frame:'p/house_18'},
  {id:'frost_home',parent:'frosthaven',name:'Exile’s Rest',kind:'home',tx:46,ty:38,frame:'p/house_12'},
  {id:'frost_store',parent:'frosthaven',name:'Wren’s Winter Goods',kind:'shop',tx:46,ty:24,frame:'p/house_11'},
];

for (const [parent,prefix] of [['cinderwatch','cinder'],['moonmere','moon'],['starfall','star']]) {
  const names=parent==='cinderwatch'?['The Copper Ledger','Emberforge','The Coal & Lantern','Caravan Cottage','Copperworks Exchange']:parent==='moonmere'?['The Moon Registry','Mistflower Atelier','The Stillwater Inn','Lakekeeper’s Home','The Glass Market']:['The Refuge Library','The Nightforge','The Refuge Hearth','Pilgrim’s Home','The Northstar Store'];
  const kinds:HouseDef['kind'][]=['archive',parent==='moonmere'?'alchemy':'smith','inn','home','shop'];
  [[14,10],[14,26],[30,9],[46,38],[46,24]].forEach(([tx,ty],i)=>HOUSES.push({id:prefix+'_house_'+i,parent,name:names[i],kind:kinds[i],tx,ty,frame:parent==='starfall'?'p/house_'+[17,16,18,12,11][i]:parent==='moonmere'?'p/house_'+[25,20,26,21,22][i]:'p/house_'+String([13,16,10,1,8][i]).padStart(2,'0')}));
}
export const WARD_GATES: Record<string,string> = {sanctuary:'root_halls',archive:'archive_halls',vault:'vault_halls',spire:'spire_approach'};
export const wardIds = (region:string) => [0,1,2].map(i=>region+':ward:'+i);
export const EXTRA_REGIONS: RegionDef[] = [
  {id:'cinderwatch',name:'Cinderwatch',subtitle:'Where broken promises are reforged',type:'town',theme:'gold',level:3,stage:2,ambience:'wind',exits:['cindertrail'],x:8,y:54,color:'#d5a779',lore:'A caravan city built around copper furnaces. Its smiths make nameplates for those the Council erased.'},
  {id:'moonmere',name:'Moonmere',subtitle:'Lanterns on a still lake',type:'town',theme:'marsh',level:5,stage:4,ambience:'water',exits:['moonroad'],x:35,y:46,color:'#c4b6d9',lore:'Quiet lakekeepers shelter rescued witness records. Every house has a place for a traveler with nowhere left to go.'},
  {id:'starfall',name:'Starfall Refuge',subtitle:'A shelter beneath the hidden stars',type:'town',theme:'ice',level:7,stage:6,ambience:'frost',exits:['watchroad'],x:93,y:54,color:'#c5c9dd',lore:'Pilgrims built this refuge inside an abandoned watchtower. They share what little the winter leaves them.'},
  {id:'cindertrail',name:'Copperleaf Trail',subtitle:'The southern caravan loop',type:'wild',theme:'gold',level:2,stage:2,ambience:'wind',exits:['oldroad','cinderwatch','quarry'],x:12,y:43,color:'#cbb08a',lore:'The safe road is longer. Broken wagons, supply caches and the old quarry reward a careful detour.'},
  {id:'moonroad',name:'Mistflower Banks',subtitle:'Paths between river and lake',type:'wild',theme:'marsh',level:4,stage:4,ambience:'water',exits:['causeway','moonmere','moonwell'],x:33,y:35,color:'#b1bacb',lore:'A forgotten ferry route leads through flowers, flooded gardens and a well beneath the old chapel.'},
  {id:'watchroad',name:'The Northern Watchroad',subtitle:'A refuge beyond the switchbacks',type:'wild',theme:'ice',level:6,stage:6,ambience:'frost',exits:['ridge','starfall','watchcrypt'],x:95,y:43,color:'#c1d0e1',lore:'The old watchroad loops around the mountain. Supply shelters survive where the Council’s maps show nothing.'},
  {id:'quarry',name:'The Ember Quarry',subtitle:'An optional expedition beneath Cinderwatch',type:'dungeon',theme:'gold',level:3,stage:2,ambience:'ruins',exits:['cindertrail'],x:5,y:35,color:'#ceaa7d',lore:'Three abandoned forge wards guard a shipment of nameplates. Restore them and recover the miners’ last promise.'},
  {id:'moonwell',name:'The Moonwell',subtitle:'An optional expedition below the lake',type:'dungeon',theme:'crypt',level:5,stage:4,ambience:'ruins',exits:['moonroad'],x:27,y:24,color:'#b5b5ce',lore:'Witnesses hid their records beneath an old well. The chambers still hold the lamps they left burning.'},
  {id:'watchcrypt',name:'The Nightwatch Crypt',subtitle:'An optional expedition inside the mountain',type:'dungeon',theme:'ice',level:7,stage:6,ambience:'frost',exits:['watchroad'],x:97,y:24,color:'#c0bedc',lore:'The last watchmen preserved food and fuel here. Their wards still wait for someone to finish the delivery.'},
  {id:'oldroad',name:'The Lantern Road',subtitle:'Caravans beneath autumn branches',type:'wild',theme:'forest',level:2,stage:2,ambience:'forest',exits:['wilds','glade'],x:19,y:46,color:'#c9ac7c',lore:'Abandoned wagons mark a road the Council removed from its maps. Each lantern still holds a traveler’s promise.'},
  {id:'glade',name:'Silverleaf Glade',subtitle:'A lake, a ruined orchard, a hidden way',type:'wild',theme:'forest',level:2,stage:2,ambience:'water',exits:['oldroad','root_halls'],x:15,y:30,color:'#b7b8ca',lore:'Lyra passed through this orchard. Her ribbon hangs beside a path that doubles back through the ruined terraces.'},
  {id:'root_halls',name:'Halls of the First Root',subtitle:'Restore three lantern wards',type:'dungeon',theme:'forest',level:3,stage:2,ambience:'ruins',exits:['glade','sanctuary'],x:20,y:20,color:'#c9af79',lore:'Three family lanterns anchor the sanctuary. Rekindle the west nursery, east orchard and northern memorial to open the guardian’s door.'},
  {id:'causeway',name:'The Broken Causeway',subtitle:'Across the drowned rooftops',type:'wild',theme:'marsh',level:4,stage:4,ambience:'water',exits:['mire','archive_halls'],x:45,y:39,color:'#a4b9c8',lore:'The old city lies below these bridges. Letters and lanterns wash up where streets once met.'},
  {id:'archive_halls',name:'The Inkbound Galleries',subtitle:'Restore three record wards',type:'dungeon',theme:'crypt',level:5,stage:4,ambience:'ruins',exits:['causeway','archive'],x:40,y:24,color:'#afb4d2',lore:'Flooded reading rooms surround a dry central aisle. The unburned witness records unlock the sealed archive.'},
  {id:'ridge',name:'Pilgrim’s Ridge',subtitle:'A long climb above the frost',type:'wild',theme:'ice',level:6,stage:6,ambience:'frost',exits:['pass','vault_halls'],x:89,y:35,color:'#cad3e0',lore:'Stone shelters hide along the switchbacks. Exiles scratched their children’s names into the rock so winter could never take them.'},
  {id:'vault_halls',name:'The Prism Descent',subtitle:'Restore three reflection wards',type:'dungeon',theme:'ice',level:7,stage:6,ambience:'frost',exits:['ridge','vault'],x:90,y:15,color:'#bdbadd',lore:'Frozen gardens lead into a labyrinth of reflected light. Three memories still burn beneath the ice.'},
  {id:'spire_approach',name:'The Sunless Stair',subtitle:'The final ascent',type:'dungeon',theme:'gold',level:8,stage:7,ambience:'spire',exits:['pass','spire'],x:63,y:29,color:'#d1b980',lore:'The Council’s silent reception halls rise toward the false sun. Three abandoned oaths hold the last door shut.'},
  ...HOUSES.map((h):RegionDef=>({id:h.id,name:h.name,subtitle:h.kind==='home'?'A quiet home':h.kind==='inn'?'Shelter on the road':h.kind==='smith'?'Steel and hearthfire':h.kind==='archive'?'A place for every name':'Supplies for your journey',type:'interior',theme:['frosthaven','starfall'].includes(h.parent)?'ice':['tidecross','moonmere'].includes(h.parent)?'marsh':h.parent==='cinderwatch'?'gold':'forest',level:1,stage:({frosthaven:5,tidecross:3,cinderwatch:2,moonmere:4,starfall:6} as Record<string,number>)[h.parent]??0,ambience:'hearth',exits:[h.parent],x:0,y:0,color:'#c4a773',lore:'A warm room, carefully kept. Ordinary lives are the reason to bring the dawn home.',cols:32,rows:34,parent:h.parent,house:h.kind})),
];
