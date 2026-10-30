/** Ads never interrupt gameplay; rewards require the SDK's earned result. */
export class AdPolicy {
  private lastInterstitialAt=0;
  private visited=new Set<string>();
  visit(region:string){this.visited.add(region);}
  canInterstitial(playtime:number,now:number,owned:boolean){return !owned&&playtime>=300&&this.visited.size>=3&&now-this.lastInterstitialAt>=180000;}
  shown(now:number){this.lastInterstitialAt=now;}
}
export interface EarnedReward { earned:boolean; rewardId:string; }
export function validReward(result:EarnedReward,lastId:string){return result.earned===true&&typeof result.rewardId==='string'&&result.rewardId.length>=8&&result.rewardId.length<=80&&result.rewardId!==lastId;}
