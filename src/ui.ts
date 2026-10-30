import { gsap } from 'gsap';
import { CLASSES, ENEMIES, ENDINGS, ITEMS, MAIN_QUESTS, MEMORY_PAGES, NPCS, QUESTS, RECIPES, REGIONS, SIDE_QUESTS, SKILLS, regionById } from './content';
import { DEFAULT_SETTINGS,GameStore, statsFor, xpForLevel } from './core/store';
import type { Discipline, NpcDef,Settings } from './core/types';
import { AudioManager } from './audio';
import { escapeHtml as esc, icon, itemIcon } from './icons';
import { createWorld, type WorldHud, type WorldScene } from './world/WorldScene';
import type Phaser from 'phaser';
import { nativeAndroid, nativeExportSave, nativeReview, nativeShare, saveDeviceReview, tactile, setGameplayFullscreen } from './platform';
import { worldDisplay } from './world/display';
import { FloatingJoystick } from './world/floatingJoystick';
import { ENEMY_DROPS, chestTable, dropPercent, itemSources } from './core/loot';
import { currentTrackedQuest, questGoal, regionRoute } from './world/navigation';
import { ROAD_EVENTS } from './events';
import { PROLOGUE, CHRONICLE, STORY_MEMORY, ENDING_VOICES, dialogueLines, type VoiceLine } from './narrative';
import type { Monetization } from './monetization';

export class GameUI {
  world: WorldScene | null = null;
  private game: Phaser.Game | null = null;
  private mode = 'title';
  private modalName = '';
  private selectedClass: Discipline = 'warden';
  private characterView = 'overview';
  private selectedItem = '';
  private inventoryFilter = 'all';
  private inventoryPage = 0;
  private inventoryDetail = false;
  private questFilter = 'main';
  private questPage = 0;
  private selectedQuest = 'm0';
  private questDetail = false;
  private mapPage = 0;
  private lootKey = '';
  private codexPage = 0;
  private shopPage = 0;
  private shopService = 'shop';
  private selectedRegion = 'elderbrook';
  private dialogueStep = 0;
  private dialogueNpc: NpcDef | null = null;
  private onboardingStep = 0;
  private cinematicStep = 0;
  private cinematicTimer = 0;
  private cinematicEnter = false;
  private chroniclePage = 0;
  private memoryId = '';
  private memoryStep = 0;
  private dialoguePlayed = '';
  private replayLine: VoiceLine | null = null;
  private settingsPage = 'audio';
  private rating = 0;
  private reviewDraft = '';
  private previousFocus: HTMLElement | null = null;
  private toastTimer = 0;
  private hudData: WorldHud | null = null;
  private trackerKey = '';
  private adShowing=false;
  private supportBusy=false;
  constructor(readonly store: GameStore, readonly audio: AudioManager,readonly monetization:Monetization) {
    document.querySelector('#app')!.innerHTML = `
      <main class="app-frame">
        <section id="title-screen" class="title-screen" aria-label="Main menu">
          <div class="title-art"></div><div class="title-shade"></div><div class="film-grain"></div>
          <header class="title-header"><span class="studio-mark">${icon('sun', 23)} <span>ELDERVALE<span class="studio-sub">A WORLD TO REMEMBER</span></span></span>
            <div class="title-tools"><button data-action="sound" class="icon-button" aria-label="Ambience" title="Ambience">${icon('volume')}</button><button data-action="settings" class="icon-button" aria-label="Settings" title="Settings">${icon('settings')}</button></div></header>
          <div class="title-content">
            <div class="title-prelude"><span></span> AN ORIGINAL FANTASY RPG</div>
            <h1>ELDERVALE</h1><div class="title-subtitle"><span></span> THE HOLLOW SUN <span></span></div>
            <p class="title-story">Every dawn takes a memory.<br>Some names are worth fighting for.</p>
            <nav class="title-menu" id="title-menu" aria-label="Journey"></nav>
            <div class="title-links"><button data-action="about">About</button><span>·</span><button data-action="share">Share ${icon('share', 13)}</button><span>·</span><button data-action="rate">Rate ${icon('star', 13)}</button></div>
          </div>
          <aside class="title-whisper"><span class="whisper-line"></span><p>“We may forget the way home.<br>Home will never forget us.”</p><span>— LYRA’S LAST LETTER</span></aside>
          <footer class="title-footer"><span>${icon('feather', 14)} Crafted for the wanderer in you.</span><span>v1.6.0 <i></i> SINGLE PLAYER <i></i> <span id="offline-status">LOCAL SAVE</span></span></footer>
          <div class="embers"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </section>
        <section id="game-screen" class="game-screen" hidden>
          <div id="world" class="world-canvas" aria-label="Game world. Move with the left joystick and use the right action buttons."></div>
          <header class="game-header">
            <button class="hero-status" data-action="character" title="Character"><img src="/assets/art/hero.png" alt="Character" class="hud-portrait"/><span id="hud-level" class="level-badge">1</span><span class="hero-info"><strong id="hud-name"></strong><span class="vital-row"><span class="vital-label">HP</span><span class="vital-bar"><i id="hp-fill"></i></span><span id="hp-value"></span></span><span class="vital-row"><span class="vital-label mana-label">MP</span><span class="vital-bar mana-bar"><i id="mp-fill"></i></span><span id="mp-value"></span></span></span></button>
            <div class="hud-right"><button class="game-menu-toggle" data-action="hud-menu" aria-label="Open game menus" aria-expanded="false" aria-controls="world-menus">${icon('menu',24)}</button><span class="gold-count">${icon('coin', 15)} <b id="hud-gold">80</b></span><div class="location-status"><span><strong id="hud-location">Elderbrook</strong><small id="hud-subtitle">Where your story begins</small></span></div></div>
          </header>
          <button class="quest-compass" id="quest-compass" data-action="tracked-journal" aria-label="Open tracked quest" hidden><span id="guide-arrow">${icon('arrow', 19)}</span><span id="guide-label"></span><small id="guide-distance"></small></button>
          <button class="minimap-wrap" data-action="map" aria-label="Open world map"><span class="minimap-heading">N <span>◇</span></span><canvas id="minimap" width="160" height="118"></canvas><span id="minimap-label">ELDERBROOK</span></button>
          <div class="boss-hud" id="boss-hud" hidden><span id="boss-name"></span><div class="boss-bar"><i id="boss-fill"></i></div><small id="boss-value"></small></div>
          <div class="loot-receipt" id="loot-receipt" role="status" hidden></div><div class="boss-reveal" id="boss-reveal" hidden><span>AN UNFORGOTTEN MEMORY</span><h2 id="reveal-title"></h2><p id="reveal-line"></p></div>
          <footer class="game-footer" id="world-menus" hidden>
            <nav class="game-nav" aria-label="Game menus"><button data-action="inventory" aria-label="Inventory">${icon('bag', 22)}<span>Bag</span></button><button data-action="quests" aria-label="Quest journal">${icon('journal', 22)}<span>Journal</span></button><button data-action="map" aria-label="World map">${icon('map', 22)}<span>Map</span></button><button data-action="pause" aria-label="Pause menu">${icon('pause', 22)}<span>Menu</span></button></nav>
          </footer>
          <div class="action-bar" aria-label="Combat controls">
            <button class="context-action" data-action="interact" id="interaction-prompt" hidden aria-label="Interact"><i id="interaction-icon">${icon('hand', 26)}</i><span id="interaction-name">Talk</span></button>
            <button data-action="attack" aria-label="Attack. Hold to keep attacking." class="attack-control">${itemIcon('sheet:0')}<span>Attack</span></button>
            <button data-action="skill" id="skill-button" aria-label="Signature skill" class="skill-control">${itemIcon('sheet:3')}<span>Skill</span><b id="skill-cooldown"></b></button>
            <button data-action="dodge" id="dodge-button" aria-label="Dodge danger" class="dodge-control">${icon('feather', 27)}<span>Dodge</span><b id="dodge-cooldown"></b></button>
            <button data-action="potion" aria-label="Drink a healing potion" class="potion-control">${itemIcon('sheet:8')}<span>Heal <em id="potion-count">5</em></span></button>
          </div>
          <div class="movement-zone" id="movement-zone" role="group" aria-label="Movement area. Touch anywhere here and drag to move."></div>
          <div class="touch-joystick" id="joystick" aria-hidden="true"><div id="joystick-knob"></div><span>Move</span></div>
        </section>
        <div id="modal-root"></div><div class="toast" id="toast" role="status" aria-live="polite"></div>
        <div id="splash" class="splash"><div class="splash-orbit">${icon('sun', 58)}</div><span class="splash-wordmark">ELDERVALE</span><span class="splash-subtitle">THE HOLLOW SUN</span><div class="splash-line"></div><p>A journey to remember</p><button data-action="skip-splash">SKIP ${icon('arrow', 13)}</button></div>
      </main>`;
    store.load(); this.renderTitleMenu();
    document.addEventListener('click', e => { const node = (e.target as HTMLElement).closest<HTMLElement>('[data-action]'); if (node && !(node as HTMLButtonElement).disabled) { if(node.dataset.action==='attack'&&e.detail>0)return; audio.unlock(); if (node.dataset.action !== 'attack') tactile(store.settings.haptics); if (!['attack', 'skill', 'dodge', 'potion', 'interact', 'sound'].includes(node.dataset.action!)) audio.sfx('ui_page'); this.action(node.dataset.action!, node.dataset.id, node); } });
    document.addEventListener('keydown', e => this.keydown(e));
    document.addEventListener('input', e => { const node = e.target as HTMLInputElement; if (node.id === 'review-note') this.reviewDraft = node.value; if (['ambience', 'sfx', 'voice','controlOpacity'].includes(node.dataset.setting ?? '')) { store.updateSettings({ [node.dataset.setting!]: Number(node.value) / 100 }); const label = node.parentElement?.querySelector('output'); if (label) label.textContent = node.value + '%'; } });
    document.addEventListener('change', e => { const node = e.target as HTMLInputElement; if (node.id === 'import-save' && node.files?.[0]) void node.files[0].text().then(text => { if (store.importSave(text)) { this.closeModal(); this.enterGame(true); store.notice('Save imported.'); } }); });
    store.subscribe(() => {this.syncControlAppearance();this.updateHud();}); store.onNotice(message => this.toast(message));
    this.audio.ambience('wind');
    setTimeout(() => this.dismissSplash(), 1800);
    setInterval(() => { if (this.mode === 'game' && store.state) store.save(); }, 5000);
    window.addEventListener('beforeunload', () => store.save());
    this.setupJoystick(); this.setupCombatControls();this.syncControlAppearance();
    monetization.subscribe(()=>this.monetizationChanged());this.syncAdSurface();
    setInterval(()=>this.updateSupportCooldown(),1000);
    window.addEventListener('resize',()=>this.syncAdSurface());
    const links=document.querySelector('.title-links');links?.insertAdjacentHTML('beforeend','<button data-action="support">Support</button>');
  }
  private t(_id: string, en: string) { return en; }
  private dismissSplash() { const splash = document.querySelector<HTMLElement>('#splash')!; if (splash.hidden) return; gsap.to(splash, { opacity: 0, duration: this.store.settings.reducedMotion ? 0 : 0.6, onComplete: () => { splash.hidden = true; } }); gsap.from('.title-content', { y: 20, opacity: 0, duration: this.store.settings.reducedMotion ? 0 : 1.1, ease: 'power2.out' }); }
  private renderTitleMenu() {
    const s = this.store.state;
    document.querySelector('#title-menu')!.innerHTML = `${s ? `<button class="menu-primary" data-action="continue"><span>${icon('compass', 19)}${this.t('Continue journey', 'Continue journey')}<small>${esc(s.name)} · Lv. ${s.level} · ${esc(regionById(s.region).name)}</small></span>${icon('arrow')}</button>` : ''}<button data-action="new" class="${s ? 'menu-secondary' : 'menu-primary'}"><span>${icon('sun', 19)} ${this.t('New journey', 'Begin a new journey')}</span>${icon('arrow')}</button><button class="menu-secondary" data-action="settings"><span>${icon('settings', 19)} ${this.t('Settings', 'Settings')}</span><small>Sound & comfort</small></button>`;
  }
  private toast(message: string) { const el = document.querySelector<HTMLElement>('#toast')!; el.textContent = message; el.classList.add('visible'); window.clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => el.classList.remove('visible'), 2600); }
  private openModal(name: string, html: string, wide = false) {
    this.setHudMenu(false);
    this.releaseControls(); this.world?.cancelAction(); this.audio.stopVoice(); window.clearTimeout(this.cinematicTimer);
    if (!this.modalName) this.previousFocus = document.activeElement as HTMLElement;
    this.modalName = name; this.store.paused = true; document.body.classList.add('modal-open');
    this.game?.loop.sleep();
    document.querySelector('#modal-root')!.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''} modal-${name}" role="dialog" aria-modal="true" aria-label="${esc(name)}"><button class="modal-close icon-button" data-action="close" aria-label="Close">${icon('close')}</button>${html}</section></div>`;
    document.querySelector<HTMLElement>('.modal-close')?.focus({ preventScroll: true });
    this.syncAdSurface();
    if (!this.store.settings.reducedMotion) gsap.fromTo('.modal', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
  }
  closeModal() { if(this.adShowing)return;this.audio.stopVoice(); window.clearTimeout(this.cinematicTimer); this.replayLine=null; this.modalName = ''; document.querySelector('#modal-root')!.innerHTML = ''; document.body.classList.remove('modal-open'); this.store.paused = this.mode !== 'game'; if (!this.store.paused) this.game?.loop.wake(); this.previousFocus?.isConnected && this.previousFocus.focus({ preventScroll: true });this.syncAdSurface(); }
  private modalHeading(eyebrow: string, title: string, description = '') { return `<header class="modal-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</header>`; }
  private portrait(index: string, label = '') { const i = Math.max(0, Math.min(5, Number(index))); return `<span class="veiled-portrait" role="img" aria-label="${esc(label || 'Masked character')}" style="background-position:${i % 3 * 50}% ${Math.floor(i / 3) * 100}%"></span>`; }
  private pages(action: string, page: number, count: number) { return count <= 1 ? '' : `<nav class="pagination" aria-label="Pages"><button data-action="${action}" data-id="${page - 1}" ${page <= 0 ? 'disabled' : ''} aria-label="Previous page">${icon('chevron', 16)}</button><span>${page + 1} / ${count}</span><button data-action="${action}" data-id="${page + 1}" ${page >= count - 1 ? 'disabled' : ''} aria-label="Next page">${icon('chevron', 16)}</button></nav>`; }
  private panelNav(active: string) { return `<nav class="panel-nav">${[['inventory', 'bag', 'Bag'], ['character', 'hero', 'Hero'], ['quests', 'journal', 'Journal'], ['map', 'map', 'Map'], ['codex', 'feather', 'Codex']].map(([id, image, label]) => `<button class="${id === active ? 'active' : ''}" data-action="${id}">${icon(image, 20)}<span>${label}</span></button>`).join('')}</nav>`; }
  private action(action: string, id?: string, node?: HTMLElement) {
    if(action!=='hud-menu')this.setHudMenu(false);
    switch (action) {
      case 'hud-menu': this.setHudMenu(document.querySelector<HTMLElement>('#world-menus')!.hidden); break;
      case 'skip-splash': this.dismissSplash(); break;
      case 'new': this.creation(); break;
      case 'continue': this.enterGame(); break;
      case 'select-class': this.selectedClass = id as Discipline; this.creation((document.querySelector('#hero-name') as HTMLInputElement)?.value); break;
      case 'create': { const name = (document.querySelector('#hero-name') as HTMLInputElement).value; this.store.newGame(name, this.selectedClass); this.onboardingStep = 0; this.onboarding(); break; }
      case 'onboard-next': this.onboardingStep++; if (this.onboardingStep >= 3) this.prologue(true); else this.onboarding(); break;
      case 'onboard-skip': this.enterGame(true); break;
      case 'prologue': this.prologue(false); break;
      case 'cinematic-next': this.cinematicStep++; this.cinematicView(); break;
      case 'cinematic-skip': this.finishCinematic(); break;
      case 'voice-replay': if(this.modalName==='cinematic')this.cinematicView();else if(this.replayLine)this.audio.voice(this.replayLine.id); break;
      case 'memory-next': this.memoryStep++; this.memoryView(); break;
      case 'chronicle': this.chroniclePage=Math.max(0,CHRONICLE.filter(c=>c.unlockedAt<=this.store.mainIndex).length-1);this.chronicle();break;
      case 'chronicle-page': this.chroniclePage=Number(id);this.chronicle();break;
      case 'settings-page': this.settingsPage=id!;this.settings();break;
      case 'close': this.closeModal(); break;
      case 'inventory': if (this.store.state) {this.inventoryDetail=false;this.inventory();} break;
      case 'inventory-filter': this.inventoryFilter = id!; this.selectedItem = ''; this.inventoryPage = 0; this.inventory(); break;
      case 'inventory-page': this.inventoryPage = Number(id); this.inventory(); break;
      case 'item': this.selectedItem = id!; this.inventoryDetail=true;this.inventory(); break;
      case 'item-back': this.inventoryDetail=false;this.inventory();break;
      case 'equip': this.store.equip(id!); this.inventory(); break;
      case 'use': this.store.use(id!); this.inventory(); break;
      case 'sell': this.store.sell(id!); this.inventory(); break;
      case 'character': if (this.store.state) this.character(); break;
      case 'character-view': this.characterView = id!; this.character(); break;
      case 'learn': this.store.learn(id!); this.character(); break;
      case 'quests': if (this.store.state) { this.questFilter = 'main'; this.questDetail=false;this.selectedQuest = this.store.mainQuest?.id ?? 'm9'; this.questPage = Math.floor(Math.min(9, this.store.mainIndex) / this.journalPageSize()); this.quests(); } break;
      case 'quest-filter': this.questDetail=false;this.questFilter = id!; this.questPage = id === 'main' ? Math.floor(Math.min(9, this.store.mainIndex) / this.journalPageSize()) : 0; this.selectedQuest = id === 'main' ? this.store.mainQuest?.id ?? 'm9' : ''; this.quests(); break;
      case 'quest-page': this.questDetail=false;this.questPage = Number(id); this.selectedQuest = ''; this.quests(); break;
      case 'quest': this.selectedQuest = id!; this.questDetail = true; if(this.store.s.quests[id!]?.status!=='completed'){this.store.s.choices.trackedQuest=id!;this.store.save();} this.quests(); break;
      case 'quest-back': this.questDetail=false;this.quests();break;
      case 'follow': this.store.s.choices.trackedQuest=id!;this.store.save();this.closeModal();break;
      case 'tracked-journal': {const qid=currentTrackedQuest(this.store.s),q=QUESTS.find(q=>q.id===qid);if(q){this.questFilter=q.kind;this.selectedQuest=qid;this.questPage=Math.floor((q.kind==='main'?MAIN_QUESTS:SIDE_QUESTS).findIndex(q=>q.id===qid)/this.journalPageSize());this.questDetail=true;this.quests();}break;}
      case 'claim': this.store.claimQuest(id!); this.quests(); break;
      case 'accept': this.store.acceptQuest(id!); if (this.dialogueNpc) this.dialogueView(); break;
      case 'map': if (this.store.state) {this.selectedRegion=regionById(this.store.s.region).parent??this.store.s.region;this.mapPage=Math.floor(REGIONS.filter(r=>r.type!=='interior').findIndex(r=>r.id===this.selectedRegion)/4);this.map();} break;
      case 'region': this.selectedRegion = id!; this.map(); break;
      case 'map-page': this.mapPage=Number(id);this.selectedRegion='';this.map();break;
      case 'travel': if (this.store.s.visited.includes(id!) && regionById(id!).type === 'town' && this.store.travel(id!)) { this.closeModal(); this.audio.sfx('door'); } break;
      case 'codex': if (this.store.state) this.codex(); break;
      case 'codex-page': this.codexPage = Number(id); this.codex(); break;
      case 'drops': this.dropRates(id!);break;
      case 'settings': this.settings(); break;
      case 'support': this.support();void this.monetization.refresh().catch(()=>{});break;
      case 'ad-supplies': void this.supportAction(()=>this.monetization.supplies());break;
      case 'remove-ads': void this.supportAction(()=>this.monetization.purchase());break;
      case 'restore-purchases': void this.supportAction(()=>this.monetization.restore());break;
      case 'ad-test-interstitial': void this.supportAction(async()=>{await this.monetization.testInterstitial();return 'Test interstitial closed.';});break;
      case 'ad-refresh': void this.monetization.refresh().catch(()=>this.toast('Ads are unavailable. You can keep playing.'));break;
      case 'ad-privacy': void this.monetization.privacy().catch(()=>this.toast('Privacy options are unavailable.'));break;
      case 'setting-toggle': this.store.updateSettings({ [id!]: !this.store.settings[id as 'reducedMotion' | 'screenShake' | 'haptics'|'autoRun'|'aimAssist'] }); this.settings(); break;
      case 'setting-choice': {
        const key=node?.dataset.setting;
        if(key&&['joystickMode','controlSize','attackStyle','hitEffects'].includes(key))this.store.updateSettings({[key]:id});
        this.releaseControls();this.settings();break;
      }
      case 'settings-reset':this.store.updateSettings({...DEFAULT_SETTINGS});this.releaseControls();this.settings();break;
      case 'difficulty': this.store.updateSettings({ difficulty: id as 'story' | 'normal' | 'heroic' }); this.settings(); break;
      case 'sound': this.store.updateSettings({ ambience: this.store.settings.ambience > 0 ? 0 : 0.45 }); this.toast(this.store.settings.ambience > 0 ? 'Ambience enabled' : 'Ambience muted'); break;
      case 'pause': this.pause(); break;
      case 'resume': this.closeModal(); break;
      case 'title': this.returnTitle(); break;
      case 'save': if (this.store.save()) this.toast('Journey saved.'); break;
      case 'export': void this.exportSave(); break;
      case 'import': document.querySelector<HTMLInputElement>('#import-save')?.click(); break;
      case 'about': this.about(); break;
      case 'share': void this.share(); break;
      case 'rate': void nativeReview().then(requested => { if (!requested) this.review(); }); break;
      case 'rating': this.rating = Number(id); this.review(); break;
      case 'submit-rating': { const note = (document.querySelector('#review-note') as HTMLTextAreaElement)?.value ?? ''; try { saveDeviceReview(JSON.stringify({ rating: this.rating, note, date: Date.now() })); this.toast('Review saved on this device. Thank you for exploring.'); this.closeModal(); } catch { this.toast('Could not save the review.'); } break; }
      case 'dialogue-next': this.dialogueStep++; this.dialogueView(); break;
      case 'service': this.shopPage = 0; this.shop(id!); break;
      case 'shop-page': this.shopPage = Number(id); this.shop(this.shopService); break;
      case 'buy': this.store.buy(id!); this.shop('shop'); break;
      case 'craft': this.store.craft(id!); this.shop(node?.dataset.service ?? 'smith'); break;
      case 'rest': this.store.rest(); this.closeModal(); break;
      case 'interact': this.world?.interact(); break;
      case 'attack': this.world?.attack(); break;
      case 'skill': this.world?.skill(); break;
      case 'dodge': this.world?.dodge(); break;
      case 'potion': if (this.mode === 'game' && !this.store.paused && this.store.use('potion')) this.audio.sfx('potion'); break;
      case 'ending': if (this.store.chooseEnding(id as keyof typeof ENDINGS)) this.ending(); break;
      case 'view-ending': this.ending(); break;
      case 'event-help': this.resolveEvent(id!, true); break;
      case 'event-leave': this.resolveEvent(id!, false); break;
      case 'fullscreen': if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => this.toast('Fullscreen is unavailable.')); else void document.exitFullscreen(); break;
    }
  }
  private keydown(e: KeyboardEvent) {
    const input = document.activeElement?.tagName; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(input ?? '') && e.key !== 'Escape') return;
    if (e.key === 'Tab' && this.modalName) { const nodes = [...document.querySelectorAll<HTMLElement>('.modal button:not(:disabled), .modal input, .modal textarea, .modal select, .modal a[href]')].filter(n => n.offsetParent !== null); const first = nodes[0], last = nodes[nodes.length - 1]; if (e.shiftKey && document.activeElement === first) { last?.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first?.focus(); e.preventDefault(); } return; }
    if (e.key === 'Escape') { if (this.modalName) this.closeModal(); else if (this.mode === 'game') this.pause(); this.dismissSplash(); return; }
    if (this.mode !== 'game') return;
    const shortcuts: Record<string, string> = { i: 'inventory', j: 'quests', m: 'map', c: 'character', p: 'pause' };
    const target = shortcuts[e.key.toLowerCase()]; if (target) { e.preventDefault(); if (this.modalName === target) this.closeModal(); else this.action(target); }
  }
  private creation(name = 'Arin') {
    const c = CLASSES[this.selectedClass];
    this.openModal('creation', `${this.modalHeading('A NAME TO REMEMBER', 'Choose your path', 'Three disciplines. One unforgettable journey.')}
      <div class="creation-layout"><div class="creation-options"><label class="name-field">Your name<input id="hero-name" maxlength="24" value="${esc(name)}" placeholder="Your name" autocomplete="off"/></label>
        <div class="class-list">${Object.entries(CLASSES).map(([id, d]) => `<button data-action="select-class" data-id="${id}" class="class-option ${id === this.selectedClass ? 'selected' : ''}">${this.portrait(d.portrait, d.name)}<span><strong>${d.name}</strong><small>${d.title}</small></span><i>${icon(id === this.selectedClass ? 'check' : 'chevron', 18)}</i></button>`).join('')}</div>
        <h3>${c.title}</h3><p class="class-description">${c.description}</p><div class="signature-skill">${icon('sun', 19)}<span>${c.skill}</span></div>
        <button class="primary-button" data-action="create">Begin my story ${icon('arrow')}</button><small class="creation-note">Your progress is saved automatically.</small></div><div class="creation-art"><img src="/assets/art/hero.png" alt="Masked wanderer of Eldervale"/><div><span>YOUR STORY BEGINS</span><h3>Remember who you are.<br>Find what was lost.</h3></div></div></div>`, true);
  }
  private onboarding() {
    const steps = [
      { label: 'BEYOND THE FALSE SUN', title: 'One dawn.<br>One memory.', body: 'For a hundred years, Eldervale’s sun has never set. Every dawn takes a memory. Three mornings ago, it took your sister’s name.', detail: 'Find Mara in Elderbrook. She still remembers Lyra.' },
      { label: 'THE WANDERER’S WAY', title: 'Explore.<br>Leave a light.', body: 'Find towns, enter homes, follow side roads. Small choices change the ending.', detail: 'Touch anywhere on the left to summon your joystick. Drag gently to walk, or farther to run. Face someone and use the right Talk button. Follow roads to their ends to travel. Walk to a house door and use Enter. Select a quest in your Journal to follow its compass.' },
      { label: 'THE LIGHT YOU CARRY', title: 'Read the danger.<br>Keep your light.', body: 'Dodge as enemies prepare to strike. Skills use mana. Equipment and talents make you stronger. Rest at a town hearth to recover.', detail: 'Hold Attack with your right thumb. Tap Skill, Dodge or Heal when you need them. Tap your portrait to improve your talents.' },
    ], s = steps[this.onboardingStep];
    this.openModal('onboarding', `<div class="onboarding-art"></div><div class="onboarding-copy"><span class="eyebrow">${s.label}</span><h2>${s.title}</h2><p>${s.body}</p><div class="onboarding-detail">${s.detail}</div><div class="onboarding-dots">${steps.map((_, i) => `<i class="${i === this.onboardingStep ? 'active' : ''}"></i>`).join('')}</div><button class="primary-button" data-action="onboard-next">${this.onboardingStep === 2 ? 'Enter Eldervale' : 'Continue'} ${icon('arrow')}</button><button class="quiet-button" data-action="onboard-skip">Skip to game</button></div>`, true);
  }
  private voiceLine(line: VoiceLine, kind='dialogue') {
    this.replayLine=line; this.audio.voice(line.id,kind);
  }
  private storyArt(scene: number) {
    return 'background-image:url(/assets/art/story-'+scene+'.webp);background-position:50% 50%';
  }
  private prologue(enter: boolean) {
    this.cinematicStep=0;this.cinematicEnter=enter;this.cinematicView();
  }
  private finishCinematic() {
    const enter=this.cinematicEnter;this.cinematicEnter=false;
    this.closeModal();if(enter)this.enterGame(true);else this.renderTitleMenu();
  }
  private cinematicView() {
    const frame=PROLOGUE[this.cinematicStep];if(!frame){this.finishCinematic();return;}
    const index=this.cinematicStep,started=performance.now();
    this.openModal('cinematic',`<div class="cinematic-art" style="${this.storyArt(frame.scene)}"></div><div class="cinematic-shade"></div>
      <header class="cinematic-header"><span>PROLOGUE <small>${index+1} / ${PROLOGUE.length}</small></span><button class="quiet-button" data-action="cinematic-skip">Skip ${icon('arrow',16)}</button></header>
      <div class="cinematic-caption"><span class="eyebrow">${frame.title}</span><p>${esc(frame.text)}</p><div class="cinematic-progress">${PROLOGUE.map((_,i)=>`<i class="${i<=index?'active':''}"></i>`).join('')}</div>
        <div class="cinematic-actions"><button class="icon-button" data-action="voice-replay" aria-label="Replay voice">${icon('volume',21)}</button><button class="primary-button" data-action="cinematic-next">${index===PROLOGUE.length-1?(this.cinematicEnter?'Enter Eldervale':'Finish prologue'):'Continue'} ${icon('arrow',18)}</button></div>
      </div>`,true);
    document.querySelector<HTMLElement>('.modal-cinematic .modal-close')!.hidden=true;
    document.querySelector<HTMLElement>('[data-action="cinematic-next"]')?.focus({preventScroll:true});
    this.replayLine=frame;
    const advance=()=>{
      const wait=Math.max(1300,frame.text.length*36-(performance.now()-started));
      this.cinematicTimer=window.setTimeout(()=>{
        if(this.modalName!=='cinematic'||this.cinematicStep!==index)return;
        if(document.hidden){advance();return;}
        this.cinematicStep++;this.cinematicView();
      },wait);
    };
    if(!this.audio.voice(frame.id,'cinematic',advance))advance();
  }
  private memoryView() {
    const page=STORY_MEMORY[this.memoryId as keyof typeof STORY_MEMORY];if(!page)return;
    const line=page.lines[Math.min(this.memoryStep,page.lines.length-1)],last=this.memoryStep>=page.lines.length-1;
    this.openModal('memory',`${this.modalHeading(page.author.toUpperCase(),page.title)}
      <div class="memory-seal">${icon('feather',32)}<span>A MEMORY RECOVERED</span></div><p class="memory-text">${esc(line.text)}</p>
      <div class="story-line-tools"><span>${this.memoryStep+1} / ${page.lines.length}</span><button class="icon-button" data-action="voice-replay" aria-label="Replay voice">${icon('volume',21)}</button></div>
      <button class="primary-button" data-action="${last?'close':'memory-next'}">${last?'Carry the memory':'Read on'} ${icon('arrow',17)}</button>`);
    this.voiceLine(line);
  }
  private chronicle() {
    const unlocked=CHRONICLE.filter(c=>c.unlockedAt<=this.store.mainIndex);if(!unlocked.length){this.store.notice('Your chronicle begins with Mara.');return;}
    this.chroniclePage=Math.max(0,Math.min(unlocked.length-1,this.chroniclePage));
    const chapter=unlocked[this.chroniclePage],line=chapter.lines[0];
    this.openModal('chronicle',`<div class="chronicle-art" style="${this.storyArt(chapter.scene)}"></div>
      ${this.modalHeading('YOUR CHRONICLE',chapter.title)}<p class="memory-text">${esc(line.text)}</p>
      <div class="story-line-tools"><span>Chapter ${this.chroniclePage+1}</span><button class="icon-button" data-action="voice-replay" aria-label="Replay voice">${icon('volume',21)}</button></div>
      ${this.pages('chronicle-page',this.chroniclePage,unlocked.length)}<button class="quiet-button" data-action="quests">Return to Journal ${icon('journal',18)}</button>`);
    this.voiceLine(line);
  }
  private enterGame(reset = false) {
    if (!this.store.state) return;
    this.mode = 'game'; this.closeModal(); this.dismissSplash();
    document.querySelector<HTMLElement>('#title-screen')!.hidden = true; document.querySelector<HTMLElement>('#game-screen')!.hidden = false;
    if (!this.game) { const result = createWorld('world', this.store, this.audio, target => this.talk(target), data => this.worldHud(data)); this.game = result.game; this.world = result.scene; }
    else { const parent = document.querySelector<HTMLElement>('#world')!,d=worldDisplay(parent.clientWidth,parent.clientHeight,window.devicePixelRatio); this.game.scale.setZoom(d.cssZoom);this.game.scale.resize(d.width,d.height); if (reset && this.world?.ready) this.world.loadRegion(); }
    this.store.paused = false; this.audio.ambience(regionById(this.store.s.region).ambience); this.updateHud();
    this.syncAdSurface();
    if (this.store.s.ending) this.toast('Your story is complete. The world still has tales to discover.');
  }
  private returnTitle() { this.store.save(); this.closeModal(); this.mode = 'title'; this.store.paused = true; this.game?.loop.sleep(); document.querySelector<HTMLElement>('#game-screen')!.hidden = true; document.querySelector<HTMLElement>('#title-screen')!.hidden = false; this.renderTitleMenu(); this.audio.setCombat(false); this.audio.ambience('wind');this.syncAdSurface();void this.monetization.naturalBreak().catch(()=>{}); }
  private updateHud() {
    document.body.classList.toggle('reduced-motion', this.store.settings.reducedMotion);
    if (!this.store.state) return; const s = this.store.s, stats = statsFor(s), r = regionById(s.region);
    const text = (id: string, value: string) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    text('hud-name', s.name); text('hud-level', String(s.level)); text('hp-value', Math.ceil(s.hp) + ' / ' + stats.maxHp); text('mp-value', Math.floor(s.mana) + ' / ' + stats.maxMana); text('hud-gold', s.gold.toLocaleString()); text('hud-location', r.name); text('hud-subtitle', r.subtitle); text('minimap-label', r.name.toUpperCase()); text('potion-count', String(s.items.potion ?? 0)); text('hud-xp', s.xp + ' / ' + xpForLevel(s.level) + ' XP · Level ' + s.level);
    document.getElementById('hp-fill')!.style.width = s.hp / stats.maxHp * 100 + '%'; document.getElementById('mp-fill')!.style.width = s.mana / stats.maxMana * 100 + '%';
    document.querySelector('#skill-button')!.setAttribute('aria-label', s.discipline === 'warden' ? 'Sunbreak skill' : s.discipline === 'ranger' ? 'Thorn Volley skill' : 'Memory Nova skill');
    document.querySelector('[data-action="quests"]')?.classList.toggle('reward-ready',SIDE_QUESTS.some(q=>s.quests[q.id]?.status==='ready'));
  }
  private worldHud(data: WorldHud) {
    if(this.store.state)this.monetization.policy.visit(this.store.s.region);
    this.hudData=data;this.updateHud();
    const interaction=document.querySelector<HTMLElement>('#interaction-prompt')!,o=data.nearby;
    interaction.hidden=!o;
    if(o){
      const actions:Record<string,[string,string]>={npc:['Talk','hand'],chest:['Open','bag'],house:['Enter','arrow'],ward:['Restore','sun'],camp:['Rest','sun'],lore:['Read','journal'],event:['Help','hand'],ore:['Mine','shield'],herb:['Gather','feather'],memory:['Take','journal'],letter:['Take','journal'],cat:['Guide','hand'],bell:['Light','sun'],observatory:['Awaken','star']};
      const [label,image]=actions[o.kind]??['Use','hand'];document.querySelector('#interaction-name')!.textContent=label;document.querySelector('#interaction-icon')!.innerHTML=icon(image,26);interaction.setAttribute('aria-label',label+' '+o.name);interaction.dataset.kind=o.kind;
    }
    const boss=document.querySelector<HTMLElement>('#boss-hud')!;boss.hidden=!data.boss;
    if(data.boss){document.querySelector('#boss-name')!.textContent=data.boss.name;document.getElementById('boss-fill')!.style.width=data.boss.hp/data.boss.max*100+'%';document.querySelector('#boss-value')!.textContent=Math.ceil(data.boss.hp)+' / '+data.boss.max;}
    const guide=document.querySelector<HTMLElement>('#quest-compass')!;guide.hidden=!data.guidance||!!data.boss||!!data.reveal;
    if(data.guidance){document.querySelector('#guide-label')!.textContent=data.guidance.label;document.querySelector('#guide-distance')!.textContent=data.guidance.distance+'m';document.querySelector<HTMLElement>('#guide-arrow')!.style.transform='rotate('+data.guidance.angle+'deg)';guide.setAttribute('aria-label',data.guidance.quest+': '+data.guidance.label);}
    const key=JSON.stringify(data.loot),receipt=document.querySelector<HTMLElement>('#loot-receipt')!;
    receipt.hidden=!data.loot;
    if(key!==this.lootKey){this.lootKey=key;if(data.loot){const loot=data.loot,best=[...loot.items].sort((a,b)=>['common','uncommon','rare','legendary'].indexOf(ITEMS[b.item].rarity)-['common','uncommon','rare','legendary'].indexOf(ITEMS[a.item].rarity))[0];receipt.innerHTML='<small>'+(loot.gold?'+'+loot.gold+' gold · ':'')+loot.items.reduce((n,d)=>n+d.count,0)+' items</small>'+(best?'<span>'+itemIcon(ITEMS[best.item].icon)+'<b>'+ITEMS[best.item].name+(best.count>1?' ×'+best.count:'')+'</b></span>':'');}}
    const reveal=document.querySelector<HTMLElement>('#boss-reveal')!;reveal.hidden=!data.reveal;
    if(data.reveal){document.querySelector('#reveal-title')!.textContent=data.reveal.title;document.querySelector('#reveal-line')!.textContent=data.reveal.line;}
    document.querySelector('#skill-cooldown')!.textContent=data.skill>0?Math.ceil(data.skill)+'s':'';document.querySelector('#dodge-cooldown')!.textContent=data.dodge>0?Math.ceil(data.dodge)+'s':'';
    document.querySelector('#joystick')!.classList.toggle('running',data.running);document.querySelector('#joystick > span')!.textContent=data.running?'Run':'Move';
    this.drawMinimap(data.x,data.y);
  }
  private drawMinimap(x: number, y: number) {
    if (!this.world?.layout) return; const canvas = document.querySelector<HTMLCanvasElement>('#minimap')!, ctx = canvas.getContext('2d')!, l = this.world.layout;
    const sx = 160 / l.width, sy = 118 / l.height; ctx.fillStyle = '#20212e'; ctx.fillRect(0, 0, 160, 118); ctx.fillStyle = '#5d5b6a';
    for (const k of l.paths) ctx.fillRect((k % l.cols) * 16 * sx, Math.floor(k / l.cols) * 16 * sy, 16 * sx + 0.5, 16 * sy + 0.5);
    ctx.fillStyle = '#4b5b85'; for (const k of l.water) ctx.fillRect((k % l.cols) * 16 * sx, Math.floor(k / l.cols) * 16 * sy, 16 * sx, 16 * sy);
    for (const p of l.props) { ctx.fillStyle = p.frame.includes('house') ? '#99886a' : '#333544'; ctx.fillRect(p.x * sx - 2, p.y * sy - 2, p.frame.includes('house') ? 8 : 3, p.frame.includes('house') ? 5 : 3); }
    for (const o of l.objects) { if (o.kind !== 'npc' && o.kind !== 'exit' && o.kind !== 'house' && o.kind !== 'ward') continue; ctx.fillStyle = o.kind === 'npc' ? '#b8b9d0' : '#d2b67b'; ctx.beginPath(); ctx.arc(o.x * sx, o.y * sy, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#fff2c4'; ctx.fillStyle = '#efd099'; ctx.beginPath(); ctx.arc(x * sx, y * sy, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  private setupJoystick() {
    const zone=document.querySelector<HTMLElement>('#movement-zone')!,joy=document.querySelector<HTMLElement>('#joystick')!,knob=document.querySelector<HTMLElement>('#joystick-knob')!,frame=document.querySelector<HTMLElement>('.app-frame')!;
    const control=new FloatingJoystick();let pointer=-1;
    const draw=()=>{const r=frame.getBoundingClientRect(),half=joy.offsetWidth/2;joy.style.left=control.x-r.left-half+'px';joy.style.top=control.y-r.top-half+'px';knob.style.transform=`translate(${control.dx}px,${control.dy}px)`;if(this.world)this.world.mobile={...control.input};};
    zone.addEventListener('pointerdown',e=>{
      if(pointer!==-1||!this.world||this.store.paused)return;
      const fixed=this.store.settings.joystickMode==='fixed',r=joy.getBoundingClientRect(),x=fixed?r.left+r.width/2:e.clientX,y=fixed?r.top+r.height/2:e.clientY;
      if(fixed&&Math.hypot(e.clientX-x,e.clientY-y)>r.width/2+12)return;
      this.setHudMenu(false);e.preventDefault();pointer=e.pointerId;control.floating=!fixed;control.radius=joy.offsetWidth*.3;
      control.press(x,y).move(e.clientX,e.clientY);joy.classList.add('engaged');draw();
      if(e.isTrusted)zone.setPointerCapture(pointer);this.audio.unlock();
    });
    zone.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||!this.world||this.store.paused)return;e.preventDefault();control.move(e.clientX,e.clientY);draw();});
    const release=(e?:Event)=>{
      if(e instanceof PointerEvent&&e.pointerId!==pointer)return;
      const owned=pointer;pointer=-1;control.reset();joy.classList.remove('engaged','running');knob.style.transform='';joy.style.left='';joy.style.top='';
      if(this.world)this.world.mobile={x:0,y:0};
      if(owned!==-1&&zone.hasPointerCapture(owned))zone.releasePointerCapture(owned);
    };
    for(const event of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(event,release);
    for(const event of ['blur','resize','eldervale:release-controls'])window.addEventListener(event,release);
  }
  private syncControlAppearance(){
    const frame=document.querySelector<HTMLElement>('.app-frame');if(!frame)return;
    frame.dataset.joystick=this.store.settings.joystickMode;
    frame.style.setProperty('--joystick-size',({compact:96,standard:108,large:120}[this.store.settings.controlSize])+'px');
    frame.style.setProperty('--controls-opacity',String(this.store.settings.controlOpacity));
  }
  private setupCombatControls() {
    const button = document.querySelector<HTMLElement>('.attack-control')!; let pointer = -1;
    button.addEventListener('pointerdown', e => { if (pointer !== -1 || !this.world || this.store.paused) return;this.setHudMenu(false); e.preventDefault(); pointer = e.pointerId; if (e.isTrusted) button.setPointerCapture(pointer); this.audio.unlock(); this.world.attackHeld = true; this.world.attack(); tactile(this.store.settings.haptics); });
    const release = (e?: Event) => { if (e instanceof PointerEvent && e.pointerId !== pointer) return; pointer = -1; if (this.world) this.world.attackHeld = false; };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
    window.addEventListener('blur', release); window.addEventListener('eldervale:release-controls', release);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseControls(); });
  }
  private releaseControls() { window.dispatchEvent(new Event('eldervale:release-controls'));this.world?.stopMovement(); }
  androidBack(): boolean {
    if(this.adShowing)return true;
    this.releaseControls();
    const editing = document.activeElement;
    if (editing instanceof HTMLTextAreaElement || editing instanceof HTMLInputElement && ['text', 'search', 'email', 'password', 'url', 'tel', 'number'].includes(editing.type)) { editing.blur(); return true; }
    if (this.modalName) { if (this.modalName === 'cinematic') {this.finishCinematic();return true;} if (this.modalName === 'onboarding') this.returnTitle(); else this.closeModal(); return true; }
    if (this.mode === 'game') {if(!document.querySelector<HTMLElement>('#world-menus')!.hidden){this.setHudMenu(false);return true;}this.pause(); return true; }
    return false;
  }
  appBackground() {
    this.store.save(); this.releaseControls(); this.audio.setAppActive(false);
    if (this.mode === 'game' && !this.modalName) this.pause();
  }
  private inventory() {
    const s = this.store.s;
    const available = Object.entries(s.items).filter(([id, count]) => count > 0 && (this.inventoryFilter === 'all' || this.inventoryFilter === 'gear' && ['weapon', 'armor', 'charm'].includes(ITEMS[id].type) || ITEMS[id].type === this.inventoryFilter));
    if (!available.some(([id]) => id === this.selectedItem)) this.selectedItem = available[0]?.[0] ?? '';
    this.inventoryPage = Math.max(0, Math.min(Math.ceil(available.length / 8) - 1, this.inventoryPage));
    const visible = available.slice(this.inventoryPage * 8, this.inventoryPage * 8 + 8);
    const item = ITEMS[this.selectedItem], equipped = Object.values(s.equipment).includes(this.selectedItem);
    this.openModal('inventory', `${this.panelNav('inventory')}${this.modalHeading('YOUR INVENTORY', 'Your belongings', 'Select an item to inspect or equip.')}
      <div class="inventory-layout" data-view="${this.inventoryDetail?'detail':'list'}"><div class="inventory-main"><div class="filter-tabs">${[['all', 'All'], ['gear', 'Equipment'], ['consumable', 'Potions'], ['material', 'Materials']].map(([id, name]) => `<button data-action="inventory-filter" data-id="${id}" class="${this.inventoryFilter === id ? 'active' : ''}">${name}</button>`).join('')}</div>
        <div class="item-grid">${visible.map(([id, count]) => { const i = ITEMS[id]; return `<button class="item-card rarity-${i.rarity} ${id === this.selectedItem ? 'selected' : ''}" data-action="item" data-id="${id}">${itemIcon(i.icon)}<span>${i.name}</span><b>×${count}</b>${Object.values(s.equipment).includes(id) ? '<i class="equipped-dot"></i>' : ''}</button>`; }).join('') || '<p class="empty-state">No items in this category.</p>'}</div>
        ${this.pages('inventory-page', this.inventoryPage, Math.ceil(available.length / 8))}<div class="inventory-summary"><span>${icon('bag', 16)} ${Object.values(s.items).filter(n => n > 0).length} item types</span><span>${icon('coin', 16)} ${s.gold} gold</span></div>
      </div><aside class="item-detail"><button class="quiet-button item-back" data-action="item-back">${icon('arrow',16)} All items</button>${item ? `<div class="item-detail-art rarity-${item.rarity}">${itemIcon(item.icon)}</div><span class="rarity-label rarity-${item.rarity}">${item.rarity.toUpperCase()} ${equipped ? '· EQUIPPED' : ''}</span><h3>${item.name}</h3><p>${item.description}</p><p class="item-sources">Found in: ${itemSources(item.id).slice(0,2).join(' · ')}</p><div class="item-stats">${[['ATK', item.atk], ['DEF', item.def], ['MAX HP', item.hp], ['MAX MP', item.mana], ['RESTORE HP', item.heal], ['RESTORE MP', item.restore]].filter(([, n]) => !!n).map(([label, n]) => `<span>${label}<b>+${n}</b></span>`).join('')}</div>${['weapon', 'armor', 'charm'].includes(item.type) ? `<button data-action="equip" data-id="${item.id}" class="primary-button" ${equipped ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip'} ${icon('shield', 17)}</button>` : item.type === 'consumable' ? `<button class="primary-button" data-action="use" data-id="${item.id}">Use potion ${icon('sun', 17)}</button>` : '<div class="item-note">Use materials at an alchemist or smith.</div>'}<button class="quiet-button sell-button" data-action="sell" data-id="${item.id}" ${equipped && s.items[item.id] === 1 ? 'disabled' : ''}>Sell one · ${Math.floor(item.price * 0.4)} gold</button>` : '<h3>Your journey awaits.</h3><p>Explore to discover new items.</p>'}</aside></div>`, true);
  }
  private character() {
    const s = this.store.s, stats = statsFor(s), c = CLASSES[s.discipline];
    const skills = SKILLS.filter(k => k.discipline === 'all' || k.discipline === s.discipline);
    this.openModal('character', `${this.panelNav('character')}${this.modalHeading('YOUR CHARACTER', esc(s.name), c.title + ' · Level ' + s.level)}
      <nav class="character-mobile-tabs filter-tabs"><button data-action="character-view" data-id="overview" class="${this.characterView === 'overview' ? 'active' : ''}">Overview</button><button data-action="character-view" data-id="talents" class="${this.characterView === 'talents' ? 'active' : ''}">Talents <b>${s.points}</b></button></nav><div class="character-layout" data-view="${this.characterView}"><aside class="character-profile"><img class="character-portrait" src="/assets/art/hero.png" alt="Portrait ${esc(s.name)}"/><div class="character-level"><strong>${s.level}</strong><span>LEVEL<span>${s.xp} / ${xpForLevel(s.level)} XP</span></span></div><div class="xp-track"><i style="width:${s.xp / xpForLevel(s.level) * 100}%"></i></div>
        <div class="stat-grid">${[['Attack', stats.atk, 'sword'], ['Defense', stats.def, 'shield'], ['Max HP', stats.maxHp, 'sun'], ['Max mana', stats.maxMana, 'star']].map(([name, value, image]) => `<div>${icon(String(image), 16)}<span>${name}</span><b>${value}</b></div>`).join('')}</div>
        <div class="equipped-list">${Object.entries(s.equipment).map(([slot, id]) => `<div>${id ? itemIcon(ITEMS[id].icon) : icon('star', 23)}<span><small>${slot.toUpperCase()}</small>${id ? ITEMS[id].name : 'No charm equipped'}</span></div>`).join('')}</div></aside>
      <div class="talent-panel"><div class="talent-title"><div><span class="eyebrow">TALENTS</span><h3>Strength through memory</h3></div><span class="point-counter">${s.points}<small>POINTS</small></span></div><p class="talent-description">Earn 2 points per level. Choose your strengths.</p>
        <div class="talent-list">${skills.map(k => { const rank = s.talents[k.id] ?? 0; return `<div class="talent-row">${itemIcon(k.icon)}<div><strong>${k.name}</strong><p>${k.description}</p><span class="rank-dots">${Array.from({ length: k.max }, (_, i) => `<i class="${i < rank ? 'filled' : ''}"></i>`).join('')}</span></div><button data-action="learn" data-id="${k.id}" ${s.points === 0 || rank >= k.max ? 'disabled' : ''} aria-label="Upgrade ${k.name}">+<small>${rank}/${k.max}</small></button></div>`; }).join('')}</div><div class="signature-skill">${icon('sun', 19)} ${c.skill} · 20 mana · 6s cooldown</div></div></div>`, true);
  }
  private journalPageSize() {
    const frame = document.querySelector<HTMLElement>('.app-frame')!;
    const insets = getComputedStyle(document.documentElement);
    const usableHeight = frame.clientHeight - (parseFloat(insets.getPropertyValue('--safe-area-inset-top')) || 0) - (parseFloat(insets.getPropertyValue('--safe-area-inset-bottom')) || 0);
    return usableHeight < 800 ? 4 : 5;
  }
  private quests() {
    const s=this.store.s,list=this.questFilter==='main'?MAIN_QUESTS:SIDE_QUESTS,pageSize=this.journalPageSize(),pageCount=Math.ceil(list.length/pageSize);
    this.questPage=Math.max(0,Math.min(pageCount-1,this.questPage));
    const visible=list.slice(this.questPage*pageSize,this.questPage*pageSize+pageSize);
    if(!visible.some(q=>q.id===this.selectedQuest))this.selectedQuest=visible.find(q=>s.quests[q.id]?.status==='active'||s.quests[q.id]?.status==='ready')?.id??visible[0].id;
    const q=list.find(q=>q.id===this.selectedQuest)!,p=s.quests[q.id],status=p?.status??'locked',goal=this.world?.layout?questGoal(s,q.id,this.world.layout):null;
    this.openModal('quests',`${this.panelNav('quests')}${this.modalHeading('QUEST JOURNAL','Your journey')}
      <div class="journal-top"><div class="filter-tabs"><button class="${this.questFilter==='main'?'active':''}" data-action="quest-filter" data-id="main">Main <b>${this.store.mainIndex}/${MAIN_QUESTS.length}</b></button><button class="${this.questFilter==='side'?'active':''}" data-action="quest-filter" data-id="side">Side <b>${this.store.completedSideCount}/${SIDE_QUESTS.length}</b></button></div></div>
      <div class="journal-layout" data-view="${this.questDetail?'detail':'list'}"><div class="journal-list-view"><div class="quest-list">${visible.map(entry=>{const progress=s.quests[entry.id],state: string=progress?.status??'locked';return `<button class="quest-entry quest-${state} ${entry.id===q.id?'selected':''}" data-action="quest" data-id="${entry.id}"><span class="quest-symbol">${icon(state==='completed'?'check':state==='locked'?'lock':'sun',18)}</span><span>${entry.name}<small>${state==='ready'?'REWARD READY':state==='completed'?'COMPLETE':state==='active'?'IN PROGRESS':entry.kind==='main'?'UNDISCOVERED':entry.giver}</small></span>${icon('chevron',16)}</button>`;}).join('')}</div>${this.pages('quest-page',this.questPage,pageCount)}<button class="quiet-button chronicle-link" data-action="chronicle">${icon('feather',18)} Read your chronicle</button></div>
      <article class="quest-detail"><button class="quiet-button quest-back" data-action="quest-back">${icon('arrow',16)} All quests</button><span class="eyebrow">${status==='completed'?'COMPLETE':status==='ready'?'REWARD READY':p?'IN PROGRESS':q.kind==='main'?'UNDISCOVERED CHAPTER':'FIND '+q.giver.toUpperCase()}</span><h3>${q.name}</h3><p>${!p&&q.kind==='main'?'Follow the current chapter to uncover this story.':q.description}</p>${p?`<div class="quest-objective">${icon('compass',18)}<span>${q.objective}</span><b>${p.count}/${q.count}</b></div>`:q.kind==='side'?`<div class="quest-objective">${icon('compass',18)} Speak to ${q.giver}.</div>`:''}
      ${goal?`<div class="quest-next"><small>NEXT STEP</small><strong>${goal.label}</strong><span>${regionById(goal.region).name}</span></div>`:''}
      <div class="quest-rewards"><span>+${q.xp} XP</span><span>${icon('coin',15)} ${q.gold}</span>${q.item?`<span>${itemIcon(ITEMS[q.item].icon)} ${ITEMS[q.item].name}</span>`:''}</div>
      ${status==='ready'?`<button class="primary-button" data-action="claim" data-id="${q.id}">Claim reward ${icon('check',17)}</button>`:goal?`<button class="primary-button" data-action="follow" data-id="${q.id}">Follow this quest ${icon('compass',18)}</button>`:''}</article></div>`,true);
  }
  private map() {
    const s=this.store.s,areas=REGIONS.filter(r=>r.type!=='interior'),count=Math.ceil(areas.length/4);
    this.mapPage=Math.max(0,Math.min(count-1,this.mapPage));const visible=areas.slice(this.mapPage*4,this.mapPage*4+4);
    if(!visible.some(r=>r.id===this.selectedRegion))this.selectedRegion=visible.find(r=>r.id===(regionById(s.region).parent??s.region))?.id??visible[0].id;
    const selected=regionById(this.selectedRegion),unlocked=this.store.mainIndex>=selected.stage,visited=s.visited.includes(selected.id),route=regionRoute(regionById(s.region).parent??s.region,selected.id);
    this.openModal('map',`${this.panelNav('map')}${this.modalHeading('ATLAS OF ELDERVALE','The road ahead')}
      <div class="atlas-regions">${visible.map(r=>`<button class="atlas-region ${r.id===selected.id?'selected':''}" data-action="region" data-id="${r.id}">${icon(r.type==='town'?'hero':r.boss?'sun':'compass',22)}<strong>${r.name}</strong><small>${r.id===s.region?'YOU ARE HERE':s.visited.includes(r.id)?'DISCOVERED':this.store.mainIndex<r.stage?'STORY LOCKED':r.type.toUpperCase()+' · LV. '+r.level}</small></button>`).join('')}</div>
      ${this.pages('map-page',this.mapPage,count)}<aside class="atlas-detail"><span class="eyebrow">${selected.type.toUpperCase()} · LV. ${selected.level}</span><h3>${selected.name}</h3><p>${unlocked?selected.lore:'Follow the main quest to open this road.'}</p>${unlocked&&route[1]?`<div class="atlas-route">${icon('compass',18)} Next road: ${regionById(route[1]).name}</div>`:''}
      ${selected.type==='town'&&visited&&selected.id!==s.region?`<button class="primary-button" data-action="travel" data-id="${selected.id}">Travel to town ${icon('arrow',17)}</button>`:'<small class="map-help">Walk through a golden waymark to change areas. Every house door can be entered.</small>'}</aside>`,true);
  }
  private codex() {
    const entries=Object.values(ENEMIES),pageSize=this.journalPageSize()===4?2:4,pageCount=Math.ceil(entries.length/pageSize);this.codexPage=Math.max(0,Math.min(pageCount-1,this.codexPage));
    this.openModal('codex',`${this.panelNav('codex')}${this.modalHeading('THE UNFORGOTTEN','Memories of the Vale')}
      <div class="codex-grid">${entries.slice(this.codexPage*pageSize,this.codexPage*pageSize+pageSize).map(e=>`<article class="codex-entry">${itemIcon(e.icon)}<span class="eyebrow">${e.boss?'GUARDIAN':'ECHO'}</span><h3>${e.name}</h3><p>${e.lore}</p><div><span>HP ${e.hp}</span><span>ATK ${e.atk}</span><span>${e.xp} XP</span></div><button class="quiet-button" data-action="drops" data-id="${e.id}">Loot & rates ${icon('bag',16)}</button></article>`).join('')}</div>${this.pages('codex-page',this.codexPage,pageCount)}<button class="quiet-button chest-rates-link" data-action="drops" data-id="chest-1">Chest drop rates ${icon('bag',17)}</button>`,true);
  }
  private dropRates(id:string) {
    const chest=id.startsWith('chest-'),level=chest?Number(id.slice(6)):0,drops=chest?chestTable(level):ENEMY_DROPS[id]??[],enemy=ENEMIES[id];
    this.openModal('drops',`${this.modalHeading('LOOT TABLE',chest?(level===1?'Roadside caches':level===4?'Midland caches':'Northern caches'):enemy?.name??'Loot')}
      ${chest?`<div class="filter-tabs">${[1,4,6].map(n=>`<button data-action="drops" data-id="chest-${n}" class="${level===n?'active':''}">${n===1?'Road':n===4?'Midland':'North'}</button>`).join('')}</div><p class="loot-basis">Every chest: 20 + 12 × area level gold, 2 ${level>=6?'Hearth Elixirs':'Healing Draughts'}, 2 ${level>=4?'Memory Crystals':'Dawn Amber'}, and one equipment roll below.</p>`:`<p class="drop-lore">${enemy?.lore??''}</p><p class="loot-basis">${enemy?.gold??0} gold and ${enemy?.xp??0} XP guaranteed. Each item below rolls independently per defeat.</p>`}
      <div class="drop-list">${drops.map(d=>`<div class="drop-row">${itemIcon(ITEMS[d.item].icon)}<span><strong>${ITEMS[d.item].name}</strong><small>${ITEMS[d.item].rarity}${d.count?' · ×'+d.count:''}</small></span><b>${dropPercent(d.chance)}</b></div>`).join('')}</div>
      <button class="quiet-button" data-action="codex">${icon('arrow',16)} Back to Codex</button>`);
  }
  private talk(target: string) {
    if (target.startsWith('event:')) { this.event(target.slice(6)); return; }
    if (target.startsWith('memory:')) { this.memoryId=target.slice(7);this.memoryStep=0;this.memoryView();return; }
    const n = NPCS.find(n => n.id === target); if (!n) return; this.dialogueNpc = n; this.dialogueStep = 0; this.dialoguePlayed=''; this.dialogueView();
  }
  private dialogueView() {
    const n=this.dialogueNpc;if(!n)return;
    const lines=dialogueLines(n,this.store.s,this.store.mainIndex),line=lines[Math.min(this.dialogueStep,lines.length-1)];
    const finale=n.id==='lyra'&&this.store.mainIndex===9,decision=finale&&this.dialogueStep>=lines.length,last=this.dialogueStep>=lines.length-1;
    const quests=(n.quest??[]).map(id=>{
      const q=QUESTS.find(q=>q.id===id)!,p=this.store.s.quests[id];
      if(p?.status==='ready')return `<button class="dialogue-choice" data-action="claim" data-id="${id}">${icon('check',18)}<span>Claim: ${q.name}</span>${icon('arrow',18)}</button>`;
      if(!p)return `<button class="dialogue-choice" data-action="accept" data-id="${id}">${icon('journal',18)}<span>${q.name}<small>Side quest</small></span>${icon('arrow',18)}</button>`;
      return `<div class="dialogue-quest-status">${icon(p.status==='completed'?'check':'journal',16)}<span>${q.name} · ${p.status==='completed'?'complete':p.count+'/'+q.count}</span></div>`;
    }).join('');
    const service=n.service?`<button class="dialogue-choice" data-action="${n.service==='inn'?'rest':'service'}" data-id="${n.service}">${icon(n.service==='shop'?'bag':'sun',18)}<span>${n.service==='shop'?'Browse wares':n.service==='smith'?'Forge equipment':n.service==='alchemy'?'Brew potions':'Rest at the hearth'}</span>${icon('arrow',18)}</button>`:'';
    this.openModal('dialogue',`<div class="dialogue-scene" style="${this.storyArt(regionById(n.region).type==='interior'?0:n.id==='lyra'?3:1)}"></div>
      <header class="dialogue-header"><div class="dialogue-portrait">${this.portrait(n.portrait,n.name)}</div><div class="dialogue-nameplate"><span class="eyebrow">${n.title}</span><h2>${n.name}</h2></div></header>
      <div class="dialogue-copy" data-phase="${decision?'decision':'speech'}">${!decision?`<p class="spoken-text">${esc(line.text)}</p><div class="story-line-tools"><div class="dialogue-progress" aria-label="Line ${Math.min(this.dialogueStep+1,lines.length)} of ${lines.length}">${lines.map((_,i)=>`<i class="${i<=this.dialogueStep?'active':''}"></i>`).join('')}</div><button class="icon-button" data-action="voice-replay" aria-label="Replay voice">${icon('volume',21)}</button></div>`:''}
      ${!last||finale&&!decision?`<button class="primary-button" data-action="dialogue-next">${finale&&last?'Choose the dawn':'Continue'} ${icon('arrow',18)}</button>`:`<div class="dialogue-choices">${decision?this.endingChoices():quests+service}<button class="quiet-button" data-action="close">Farewell ${icon('arrow',16)}</button></div>`}</div>`);
    if(!decision){this.replayLine=line;if(this.dialoguePlayed!==line.id){this.dialoguePlayed=line.id;this.audio.voice(line.id);}}
  }
  private shop(service: string) {
    this.shopService = service;
    const s = this.store.s, recipes = RECIPES.filter(r => r.service === service);
    const offers = ['potion', 'ether', 'greater_potion', 'greater_ether', 'copper_blade', 'river_bow', 'amber_staff', 'root_ring', 'road_coat', s.discipline === 'warden' ? 'sun_sword' : s.discipline === 'ranger' ? 'verdant_bow' : 'echo_staff', 'ranger_cloak', 'sun_plate', 'signet'];
    const pageCount = Math.ceil((service === 'shop' ? offers : recipes).length / 3);
    this.shopPage = Math.max(0, Math.min(pageCount - 1, this.shopPage));
    this.openModal('shop', `${this.modalHeading(service === 'shop' ? 'TRAVELER’S WARES' : service === 'smith' ? 'FORGE OF STARIRON' : 'MOONBLOOM APOTHECARY', service === 'shop' ? 'Prepare for tomorrow' : service === 'smith' ? 'Steel that remembers light' : 'A little warmth. A little hope.', 'Your gold: ' + s.gold)}
      <div class="shop-list">${service === 'shop' ? offers.slice(this.shopPage * 3, this.shopPage * 3 + 3).map(id => { const i = ITEMS[id]; return `<article class="shop-row">${itemIcon(i.icon)}<div><span class="rarity-label rarity-${i.rarity}">${i.rarity}</span><h3>${i.name}</h3><p>${i.description}</p><small>Owned: ${s.items[id] ?? 0}${i.atk ? ' · ATK +' + i.atk : ''}${i.def ? ' · DEF +' + i.def : ''}</small></div><button data-action="buy" data-id="${id}" ${s.gold < i.price ? 'disabled' : ''}>${icon('coin', 15)} ${i.price}<small>Buy</small></button></article>`; }).join('') : recipes.slice(this.shopPage * 3, this.shopPage * 3 + 3).map(r => { const i = ITEMS[r.id], enough = s.gold >= r.gold && Object.entries(r.materials).every(([id, n]) => (s.items[id] ?? 0) >= Number(n)); return `<article class="shop-row">${itemIcon(i.icon)}<div><h3>${i.name}</h3><p>${i.description}</p><div class="craft-materials">${Object.entries(r.materials).map(([id, n]) => `<span class="${(s.items[id] ?? 0) >= Number(n) ? 'enough' : ''}">${ITEMS[id].name} ${s.items[id] ?? 0}/${n}</span>`).join('')}</div></div><button data-action="craft" data-id="${r.id}" data-service="${service}" ${enough ? '' : 'disabled'}>${icon('coin', 15)} ${r.gold}<small>Craft</small></button></article>`; }).join('')}</div>${this.pages('shop-page', this.shopPage, pageCount)}<button class="quiet-button" data-action="inventory">Open inventory ${icon('bag', 15)}</button>`);
  }
  private event(id: string) {
    const object=this.world?.layout.objects.find(o=>o.id===id),event=ROAD_EVENTS[object?.target??'traveler']??ROAD_EVENTS.traveler,cost=event.cost;
    const enough=this.store.s.gold>=event.gold&&(!cost||(this.store.s.items[cost.item]??0)>=cost.count);
    this.openModal('event',`${this.modalHeading('A CHANCE ENCOUNTER',event.title)}<div class="event-art">${icon('feather',48)}</div><p class="event-story">${event.text}</p><div class="event-reward">+${event.xp} XP · ${ITEMS[event.reward.item].name} ×${event.reward.count}</div><div class="event-choices"><button class="primary-button" data-action="event-help" data-id="${esc(id)}" ${enough?'':'disabled'}>${event.help}<small>${cost?cost.count+' '+ITEMS[cost.item].name:event.gold+' gold'}</small></button><button class="quiet-button" data-action="event-leave" data-id="${esc(id)}">${event.leave}</button></div>`);
  }
  private resolveEvent(id:string,help:boolean) {
    const o=this.world?.layout.objects.find(o=>o.id===id);if(!o||this.store.s.collected.includes(id))return;
    const event=ROAD_EVENTS[o.target]??ROAD_EVENTS.traveler,cost=event.cost;
    if(help&&(this.store.s.gold<event.gold||cost&&(this.store.s.items[cost.item]??0)<cost.count))return;
    this.store.s.collected.push(id);this.store.s.choices[id]=help?'help':'guide';
    if(help){this.store.s.gold-=event.gold;if(cost)this.store.s.items[cost.item]-=cost.count;this.store.addXp(event.xp);this.store.addItem(event.reward.item,event.reward.count);}else this.store.addXp(15);
    this.closeModal();this.world?.dismissObject(id);this.store.save();this.store.changed();this.store.notice(help?event.result:'A safe road has been marked.');
  }
  private endingChoices() { return `<button class="ending-choice" data-action="ending" data-id="remember"><strong>Break the sun. Return the memories.</strong><span>Face the night together. Dawn will take no more names.</span></button><button class="ending-choice" data-action="ending" data-id="sacrifice"><strong>Take Lyra’s place.</strong><span>Keep the dawn. Let your sister come home.</span></button><button class="ending-choice" data-action="ending" data-id="share" ${this.store.canShareDawn ? '' : 'disabled'}><strong>Share the light.</strong><span>${this.store.canShareDawn ? 'The people you helped become a thousand little suns.' : 'Complete and claim 4 side quests to unlock this path. (' + this.store.completedSideCount + '/4)'}</span></button>`; }
  private ending() {
    const id = this.store.s.ending as keyof typeof ENDINGS; if (!id || !ENDINGS[id]) return; const end = ENDINGS[id], helped = Object.values(this.store.s.choices).filter(v => v === 'help').length;
    this.audio.ambience('forest');
    this.openModal('ending', `<div class="ending-art"></div><div class="ending-copy"><span class="eyebrow">${end.subtitle}</span><h2>${end.title}</h2><div class="ending-ornament">${icon('sun', 30)}</div><p>${end.text}</p>${helped ? `<p class="ending-small">Across the Vale, ${helped} travelers you helped light a lantern in your name.</p>` : ''}<div class="ending-stats"><span><b>${this.store.s.level}</b>Level</span><span><b>${this.store.completedSideCount}/${SIDE_QUESTS.length}</b>Stories saved</span><span><b>${Math.floor(this.store.s.playtime / 60)}m</b>Journey</span></div><button class="primary-button" data-action="resume">Explore the world ${icon('arrow', 17)}</button><button class="quiet-button" data-action="title">Main menu</button><span class="ending-dedication">FOR EVERY NAME WE REFUSE TO FORGET</span></div>`, true);
    this.voiceLine(ENDING_VOICES[id][0],'ending');
  }
  private settings() {
    const s=this.store.settings,tab=this.settingsPage;
    const audio=`${[['ambience','Natural ambience'],['sfx','Sound effects'],['voice','Voice performances']].map(([id,label])=>`<label class="range-setting"><span>${label}<output>${Math.round(s[id as 'ambience'|'sfx'|'voice']*100)}%</output></span><input type="range" data-setting="${id}" min="0" max="100" value="${Math.round(s[id as 'ambience'|'sfx'|'voice']*100)}" aria-label="${label}"/></label>`).join('')}<p class="settings-note">Spoken performances, nature and Foley.</p>`;
    const toggle=(id:keyof Settings,label:string,desc:string)=>`<div class="toggle-setting"><span><strong>${label}</strong><small>${desc}</small></span><button class="toggle ${s[id]?'on':''}" data-action="setting-toggle" data-id="${id}" role="switch" aria-checked="${s[id]}" aria-label="${label}"><i></i></button></div>`;
    const choice=(key:keyof Settings,label:string,options:string[][])=>`<fieldset class="preference-choice"><legend>${label}</legend><div>${options.map(([id,text])=>`<button data-action="setting-choice" data-setting="${key}" data-id="${id}" aria-pressed="${s[key]===id}" class="${s[key]===id?'selected':''}">${text}</button>`).join('')}</div></fieldset>`;
    const comfort=toggle('reducedMotion','Reduce motion','Less camera motion and fewer particles.')+toggle('screenShake','Camera shake','Brief impact feedback in combat.')+toggle('haptics','Touch feedback','Gentle vibration on Android.');
    const controls=choice('joystickMode','Joystick',[['floating','Floating'],['fixed','Fixed']])+choice('controlSize','Joystick size',[['compact','Compact'],['standard','Standard'],['large','Large']])+toggle('autoRun','Run at full drag','A gentle drag still walks.')+`<label class="range-setting control-opacity"><span>Control visibility<output>${Math.round(s.controlOpacity*100)}%</output></span><input type="range" data-setting="controlOpacity" min="65" max="100" step="5" value="${Math.round(s.controlOpacity*100)}" aria-label="Control visibility"/></label>`;
    const difficulty=`<div class="difficulty-options">${[['story','Story','Gentle combat'],['normal','Adventure','Balanced challenge'],['heroic','Heroic','Dangerous foes']].map(([id,label,desc])=>`<button data-action="difficulty" data-id="${id}" class="${s.difficulty===id?'selected':''}"><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div>`;
    const combat=choice('attackStyle','Sword combo',[['classic','Classic strikes'],['whirl','Whirl finisher']])+choice('hitEffects','Hit effects',[['subtle','Subtle'],['full','Full']])+toggle('aimAssist','Aim assistance','Face a nearby foe when attacking.')+`<span class="setting-label">Challenge</span>${difficulty}`;
    this.openModal('settings',`${this.modalHeading('YOUR EXPERIENCE','Settings')}<div class="filter-tabs settings-tabs">${[['audio','Audio'],['controls','Controls'],['combat','Combat'],['comfort','Comfort']].map(([id,label])=>`<button data-action="settings-page" data-id="${id}" class="${tab===id?'active':''}">${label}</button>`).join('')}</div><div class="settings-body">${tab==='audio'?audio:tab==='controls'?controls:tab==='combat'?combat:tab==='comfort'?comfort:difficulty}</div><button class="quiet-button settings-reset" data-action="settings-reset">Reset preferences</button>`);
  }
  private pause() {
    if (!this.store.state) return;
    this.openModal('pause', `${this.modalHeading('TAKE A BREATH', 'Your light can wait.', esc(this.store.s.name) + ' · Level ' + this.store.s.level + ' · ' + regionById(this.store.s.region).name)}
      <div class="pause-menu"><button class="primary-button" data-action="resume">Continue journey ${icon('arrow')}</button><button data-action="save">${icon('save', 19)} Save now</button><button data-action="settings">${icon('settings', 19)} Settings</button><button data-action="export">${icon('journal', 19)} Back up journey</button><button data-action="import">${icon('bag', 19)} Restore backup</button>${this.store.s.ending ? '<button data-action="view-ending">' + icon('sun', 19) + ' Revisit your ending</button>' : ''}<button data-action="prologue">${icon('sun', 19)} Watch prologue</button><button data-action="support">${icon('star', 19)} Support Eldervale</button><button data-action="about">${icon('feather', 19)} About Eldervale</button><button data-action="title">${icon('compass', 19)} Main menu</button></div><input type="file" id="import-save" accept=".json,application/json" hidden/><p class="pause-note">Autosave is active. Export a backup before moving to another device.</p>`);
  }
  private setHudMenu(open:boolean){
    document.querySelector<HTMLElement>('#world-menus')!.hidden=!open;
    const button=document.querySelector<HTMLButtonElement>('.game-menu-toggle')!;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close game menus':'Open game menus');
  }
  private syncAdSurface(){setGameplayFullscreen(this.mode==='game'&&!this.modalName&&!this.adShowing);this.monetization.setSurface(this.adShowing?'none':this.modalName==='pause'||this.modalName==='support'?this.modalName:this.mode==='title'&&!this.modalName?'title':'none');}
  private monetizationChanged(){
    const s=this.monetization.state;
    document.documentElement.style.setProperty('--ad-bottom',Math.max(0,s.bannerHeight)+'px');
    document.body.classList.toggle('ads-visible',s.bannerVisible);
    if(s.fullScreen!==this.adShowing){
      this.adShowing=s.fullScreen;
      if(s.fullScreen){this.releaseControls();this.world?.cancelAction();this.store.save();this.store.paused=true;this.game?.loop.sleep();this.audio.stopVoice();this.audio.setAppActive(false);}
      else this.audio.setAppActive(true);
    }
    if(this.modalName==='support'&&!this.adShowing)this.support();
    this.syncAdSurface();
  }
  private async supportAction(action:()=>Promise<string>){
    if(this.supportBusy)return;this.supportBusy=true;this.support();
    try{this.toast(await action());}catch(error){this.toast(error instanceof Error?error.message:'Unavailable right now. You can keep playing.');}
    finally{this.supportBusy=false;if(this.modalName==='support')this.support();}
  }
  private updateSupportCooldown(){
    if(this.modalName!=='support'||this.adShowing)return;
    const button=document.querySelector<HTMLButtonElement>('[data-action="ad-supplies"]');if(!button)return;
    const s=this.monetization.state,wait=this.monetization.rewardWait;
    button.textContent=wait?'Ready in '+wait+'s':s.adFree?'Claim supplies':'Watch an ad · Get supplies';
    button.disabled=this.supportBusy||s.pending||wait>0||!s.native||!s.adFree&&!s.rewardedReady;
  }
  private support(){
    const s=this.monetization.state,wait=this.monetization.rewardWait,busy=this.supportBusy||s.pending;
    this.openModal('support',`${this.modalHeading('KEEP THE LIGHT ALIVE','Support Eldervale')}
      ${s.native&&s.testMode?'<span class="build-status">TEST ADS</span>':''}
      <article class="support-card"><span class="support-symbol">${icon('sun',32)}</span><div><h3>${s.adFree?'Your ad-free journey':'Remove Ads'}</h3><p>One purchase. An entirely ad-free journey.</p></div>
        <button class="primary-button" data-action="remove-ads" ${busy||s.adFree||!s.purchaseAvailable?'disabled':''}>${s.adFree?'Purchased':busy?'Please wait…':'Remove Ads · '+esc(s.price)}</button>
        <button class="quiet-button" data-action="restore-purchases" ${busy||!s.native?'disabled':''}>Restore purchases</button>
        ${!s.purchaseAvailable&&!s.adFree?'<small>Purchases are available in the Google Play edition.</small>':''}
      </article>
      ${this.store.state?`<article class="support-card supply-card"><div><h3>A little help for the road</h3><p>Receive 2 healing potions and 30 gold.</p></div><button class="small-primary" data-action="ad-supplies" ${busy||wait||!s.native||!s.adFree&&!s.rewardedReady?'disabled':''}>${wait?'Ready in '+wait+'s':s.adFree?'Claim supplies':'Watch an ad · Get supplies'}</button><small>${s.adFree?'Included with your ad-free journey.':'Optional. Supplies arrive after the ad completes.'}</small></article>`:''}
      <div class="support-tools">${s.privacyRequired?'<button class="quiet-button" data-action="ad-privacy">Privacy choices</button>':''}${s.native?'<button class="quiet-button" data-action="ad-refresh">Refresh availability</button>':''}</div>
      ${s.native&&s.testMode?`<button class="quiet-button test-ad-button" data-action="ad-test-interstitial" ${busy||s.adFree||!s.interstitialReady?'disabled':''}>Preview test interstitial</button>`:''}
      <p class="support-note">Your journey remains playable offline.</p>`);
  }
  private async exportSave() {
    if (!this.store.state) return; this.store.save(); const text = JSON.stringify(this.store.s, null, 2), name = 'eldervale-save-' + new Date().toISOString().slice(0, 10) + '.json';
    try {
      if (await nativeExportSave(text, name)) return;
      const blob = new Blob([text], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); this.toast('Save exported.');
    } catch { this.toast('Save export cancelled. Your journey is still saved.'); }
  }
  private about() {
    this.openModal('about', `<div class="about-emblem"><img src="/assets/art/app-icon.png" alt="Emblem Eldervale"/></div>${this.modalHeading('AN ORIGINAL FANTASY RPG', 'Eldervale', 'The Hollow Sun · Version 1.4.0')}<p class="about-story">A story of light, memory, and the people who make a place worth coming home to.</p><div class="about-facts"><span><b>27</b>World areas</span><span><b>26</b>Quests</span><span><b>30</b>Interiors</span><span><b>43</b>Items</span><span><b>3</b>Disciplines</span><span><b>3</b>Endings</span></div><div class="about-credits"><p>Unity-derived sprites, original masked art and reusable furnishings. Spoken performances: ElevenLabs. Nature recordings: Thimras, Park Ambiences (CC0).</p><p>Offline on Android. Your journey stays on this device.</p></div><div class="about-actions"><button data-action="prologue">Watch prologue</button><button class="quiet-button" data-action="share">Share Eldervale ${icon('share', 15)}</button><button class="quiet-button" data-action="rate">Write a review ${icon('star', 15)}</button></div>`);
  }
  private async share() {
    const text = 'ELDERVALE: The Hollow Sun — every dawn takes a memory. A fantasy RPG about light, loss, and the road home.';
    const local = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);
    const data = { title: 'Eldervale: The Hollow Sun', text, ...(!local ? { url: location.origin + location.pathname } : {}) };
    try { if (await nativeShare(text)) return; if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(text + (!local ? ' ' + location.href : '')); this.toast('Share text copied.'); } } catch (e) { if (!nativeAndroid && (e as DOMException).name !== 'AbortError') this.openModal('share', this.modalHeading('SHARE ELDERVALE', 'A story worth sharing') + '<textarea class="share-text" readonly>' + esc(text) + '</textarea><p>Copy this text to share Eldervale.</p>'); }
  }
  private review() {
    this.openModal('review', `${this.modalHeading('YOUR FEEDBACK', 'How was your journey?', 'Your review is saved on this device.')}<div class="review-stars">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= this.rating ? 'selected' : ''}" data-action="rating" data-id="${n}" aria-label="${n} stars" aria-pressed="${n === this.rating}">${icon('star', 35)}</button>`).join('')}</div><label class="review-label">What stayed with you?<textarea id="review-note" maxlength="1500" placeholder="Story, combat, or something you would improve…">${esc(this.reviewDraft)}</textarea></label><button class="primary-button" data-action="submit-rating" ${this.rating ? '' : 'disabled'}>Save review ${icon('feather', 17)}</button><p class="review-disclosure">Local feedback. Nothing is sent to a server.</p>`);
  }
}
