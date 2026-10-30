import type { GameStore } from './core/store';
import { CombatAmbience } from './combatAmbience';

/** Offline nature, Foley and spoken performances. No music or instruments. */
export class AudioManager {
  private track: HTMLAudioElement | null = null;
  private retiring: HTMLAudioElement | null = null;
  private speech: HTMLAudioElement | null = null;
  private speechKind = '';
  private current = '';
  private enabled = false;
  private appActive = true;
  private fade = 0;
  private mixFrame=0;
  private environment=new CombatAmbience();
  private effects = new Map<string, HTMLAudioElement[]>();
  private skillVoiceAt = 0;
  private skillVariant = 0;
  constructor(private store: GameStore) {
    store.subscribe(() => this.update());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pauseAll();
      else this.update();
    });
  }
  unlock() { if (this.enabled) return; this.enabled = true; this.update(); }
  private pauseAll() {
    cancelAnimationFrame(this.fade); this.fade = 0;
    cancelAnimationFrame(this.mixFrame);this.mixFrame=0;
    this.track?.pause(); this.retiring?.pause(); this.speech?.pause();
    for (const pool of this.effects.values()) for (const sound of pool) sound.pause();
  }
  setAppActive(active: boolean) {
    this.appActive = active;
    if (!active) this.pauseAll(); else this.update();
  }
  private get duck() { return this.speech && !this.speech.paused ? .35 : 1; }
  setCombat(active:boolean){
    this.environment.combat=active;
    if(this.mixFrame||this.environment.settled||!this.enabled||!this.appActive||document.hidden)return;
    let previous=performance.now();
    const tick=(now:number)=>{
      this.environment.step((now-previous)/1000);previous=now;
      if(this.track&&!this.fade)this.track.volume=this.store.settings.ambience*this.duck*this.environment.gain;
      this.mixFrame=this.environment.settled?0:requestAnimationFrame(tick);
    };
    this.mixFrame=requestAnimationFrame(tick);
  }
  ambience(name: string) {
    if (this.current === name) { this.update(); return; }
    this.current = name;
    cancelAnimationFrame(this.fade);
    if (this.retiring) { this.retiring.pause(); this.retiring.src = ''; }
    const previous = this.track; this.retiring = previous;
    const next = new Audio('/assets/audio/ambience/' + name + '.wav');
    next.loop = true; next.preload = 'auto'; next.volume = 0; this.track = next;
    if (!this.enabled || !this.appActive || document.hidden) { previous?.pause(); this.retiring = null; return; }
    void next.play().catch(() => {});
    const started = performance.now(), oldVolume = previous?.volume ?? 0;
    const tick = () => {
      const progress = Math.min(1, (performance.now() - started) / 1400);
      next.volume = this.store.settings.ambience * this.duck * this.environment.gain * Math.sin(progress * Math.PI / 2);
      if (previous) previous.volume = oldVolume * Math.cos(progress * Math.PI / 2);
      if (progress < 1) this.fade = requestAnimationFrame(tick);
      else { previous?.pause(); if (previous) previous.src = ''; this.retiring = null; this.fade = 0; }
    };
    this.fade = requestAnimationFrame(tick);
  }
  update() {
    const active = this.enabled && this.appActive && !document.hidden;
    if(active)this.setCombat(this.environment.combat);
    if (this.speech) {
      this.speech.volume = this.store.settings.voice;
      if (!active || !this.store.settings.voice) this.speech.pause();
      else if (this.speech.paused && !this.speech.ended) void this.speech.play().catch(() => {});
    }
    if (!this.track) return;
    if (!this.fade) this.track.volume = this.store.settings.ambience * this.duck * this.environment.gain;
    if (!active || !this.store.settings.ambience) this.track.pause();
    else if (this.track.paused) void this.track.play().catch(() => {});
  }
  stopVoice() {
    const voice = this.speech; this.speech = null; this.speechKind = '';
    if (voice) { voice.onended = null; voice.onerror = null; voice.pause(); voice.removeAttribute('src'); voice.load(); }
    this.update();
  }
  /** Narrative has priority. Advancing or closing a scene cancels its previous line. */
  voice(id: string, kind = 'dialogue', onEnd?: () => void): HTMLAudioElement | null {
    if (!id || !this.enabled || !this.appActive || document.hidden || !this.store.settings.voice) return null;
    if (kind === 'skill' && this.speech && this.speechKind !== 'skill') return null;
    this.stopVoice();
    const voice = new Audio('/assets/audio/voice/' + id + '.mp3');
    voice.preload = 'auto'; voice.volume = this.store.settings.voice;
    this.speech = voice; this.speechKind = kind;
    const finish = () => {
      if (this.speech !== voice) return;
      this.speech = null; this.speechKind = ''; this.update(); onEnd?.();
    };
    voice.onended = finish; voice.onerror = finish;
    void voice.play().then(() => this.update()).catch(finish);
    return voice;
  }
  skillVoice(discipline: string) {
    // Short, varied calls with breathing room between them, even if skills recharge.
    const now = performance.now();
    if (now < this.skillVoiceAt) return;
    if (this.voice('skill_' + discipline + '_' + this.skillVariant % 3, 'skill')) {
      this.skillVariant++; this.skillVoiceAt = now + 10000;
    }
  }
  sfx(name: string) {
    if (!this.enabled || !this.appActive || document.hidden || !this.store.settings.sfx) return;
    let pool = this.effects.get(name);
    if (!pool) { pool = Array.from({ length: 3 }, () => new Audio('/assets/audio/foley/' + name + '.wav')); this.effects.set(name, pool); }
    const sound = pool.find(a => a.paused || a.ended) ?? pool[0];
    sound.volume = this.store.settings.sfx * (name === 'ui_page' ? .22 : .8) * (this.duck === 1 ? 1 : .55);
    sound.currentTime = 0; void sound.play().catch(() => {});
  }
}
