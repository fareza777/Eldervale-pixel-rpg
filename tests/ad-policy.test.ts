import { describe,it,expect } from 'vitest';
import { AdPolicy,validReward } from '../src/core/adPolicy';
describe('optional, paced monetization',()=>{
  it('protects the introduction, short visits and paid owners from interstitials',()=>{
    const p=new AdPolicy();p.visit('elderbrook');expect(p.canInterstitial(600,1000000,false)).toBe(false);
    p.visit('wilds');p.visit('oldroad');expect(p.canInterstitial(299,1000000,false)).toBe(false);
    expect(p.canInterstitial(300,1000000,false)).toBe(true);expect(p.canInterstitial(600,1000000,true)).toBe(false);
    p.shown(1000000);expect(p.canInterstitial(600,1179999,false)).toBe(false);expect(p.canInterstitial(600,1180000,false)).toBe(true);
  });
  it('never grants supplies for a skip, failure or duplicate SDK completion',()=>{
    expect(validReward({earned:false,rewardId:'unique-reward-1'},'')).toBe(false);
    expect(validReward({earned:true,rewardId:'unique-reward-1'},'unique-reward-1')).toBe(false);
    expect(validReward({earned:true,rewardId:''},'')).toBe(false);
    expect(validReward({earned:true,rewardId:'unique-reward-2'},'unique-reward-1')).toBe(true);
  });
});
