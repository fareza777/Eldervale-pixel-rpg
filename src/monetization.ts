import { registerPlugin } from '@capacitor/core';
import { nativeAndroid } from './platform';
import type { GameStore } from './core/store';
import { AdPolicy,validReward,type EarnedReward } from './core/adPolicy';

export interface MonetizationState {
  native:boolean;testMode:boolean;initialized:boolean;adFree:boolean;bannerVisible:boolean;bannerHeight:number;
  interstitialReady:boolean;rewardedReady:boolean;fullScreen:boolean;privacyRequired:boolean;
  price:string;purchaseAvailable:boolean;pending:boolean;message:string;error:string;
}
interface AdsPlugin {
  initialize():Promise<Partial<MonetizationState>>;getState():Promise<Partial<MonetizationState>>;
  setSurface(p:{surface:string}):Promise<Partial<MonetizationState>>;refresh():Promise<Partial<MonetizationState>>;
  showInterstitial():Promise<{shown:boolean}>;showRewarded():Promise<EarnedReward>;
  privacyOptions():Promise<Partial<MonetizationState>>;
  addListener(name:'state',fn:(s:Partial<MonetizationState>)=>void):Promise<unknown>;
}
interface BillingPlugin {
  initialize():Promise<Partial<MonetizationState>>;purchase():Promise<Partial<MonetizationState>>;
  restore():Promise<Partial<MonetizationState>>;
  addListener(name:'state',fn:(s:Partial<MonetizationState>)=>void):Promise<unknown>;
}
const Ads=registerPlugin<AdsPlugin>('EldervaleAds'),Billing=registerPlugin<BillingPlugin>('PlayBilling');
export class Monetization {
  readonly policy=new AdPolicy();
  state:MonetizationState={native:nativeAndroid,testMode:true,initialized:false,adFree:false,bannerVisible:false,bannerHeight:0,
    interstitialReady:false,rewardedReady:false,fullScreen:false,privacyRequired:false,price:'US$4.99',purchaseAvailable:false,pending:false,
    message:'Available in the Android edition.',error:''};
  private listeners=new Set<()=>void>();
  private surface='';
  private busy=false;
  constructor(private store:GameStore){}
  subscribe(fn:()=>void){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
  private update(partial:Partial<MonetizationState>){this.state={...this.state,...partial};for(const fn of this.listeners)fn();}
  async initialize(){
    if(!nativeAndroid)return;
    await Ads.addListener('state',s=>this.update(s));await Billing.addListener('state',s=>this.update(s));
    await Promise.allSettled([Ads.initialize().then(s=>this.update(s)),Billing.initialize().then(s=>this.update(s))]);
  }
  setSurface(surface:string){
    if(!nativeAndroid||this.surface===surface)return;this.surface=surface;
    void Ads.setSurface({surface}).then(s=>this.update(s)).catch(()=>{});
  }
  async naturalBreak(){
    if(!nativeAndroid||this.busy||!this.store.state||!this.state.interstitialReady||!this.policy.canInterstitial(this.store.s.playtime,Date.now(),this.state.adFree))return;
    this.busy=true;try{const result=await Ads.showInterstitial();if(result.shown)this.policy.shown(Date.now());}finally{this.busy=false;}
  }
  get rewardWait(){if(!this.store.state)return 0;return Math.max(0,Math.ceil((Number(this.store.s.choices['supplies:next']??0)-Date.now())/1000));}
  async supplies(){
    if(!this.store.state||this.busy)return 'Another action is in progress.';
    if(this.rewardWait)return 'Your next supply cache will be ready soon.';
    if(!nativeAndroid)return 'Rewarded supplies are available in the Android edition.';
    this.busy=true;
    try{
      const journey=this.store.s.created;
      const result=this.state.adFree?{earned:true,rewardId:'ad-free:'+Date.now()}:await Ads.showRewarded();
      if(this.store.s.created!==journey)return 'Your journey changed. No supplies were added.';
      if(!validReward(result,this.store.s.choices['supplies:last']??''))return 'Ad closed. No supplies were added.';
      this.store.s.choices['supplies:last']=result.rewardId;this.store.s.choices['supplies:next']=String(Date.now()+120000);
      this.store.addItem('potion',2);this.store.s.gold+=30;this.store.save();this.store.changed();return 'Supply cache · +2 potions · +30 gold';
    }finally{this.busy=false;}
  }
  async purchase(){if(!nativeAndroid)return 'Remove Ads is available in the Android edition.';const s=await Billing.purchase();this.update(s);return s.message??'Purchase checked.';}
  async restore(){if(!nativeAndroid)return 'Restore with Google Play in the Android edition.';const s=await Billing.restore();this.update(s);return s.adFree?'Your ad-free purchase has been restored.':s.message??'No purchases found.';}
  async refresh(){if(nativeAndroid)this.update(await Ads.refresh());}
  async testInterstitial(){if(!nativeAndroid||!this.state.testMode)return;await Ads.showInterstitial();}
  async privacy(){if(nativeAndroid)this.update(await Ads.privacyOptions());}
}
