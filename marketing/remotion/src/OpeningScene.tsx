import {AbsoluteFill,useVideoConfig} from 'remotion';
import {CinematicArt,Dust,Reveal,palette,serif,sans} from './theme';
export const OpeningScene=()=>{const {width}=useVideoConfig();const portrait=width<1200;return <AbsoluteFill style={{background:palette.navy}}>
 <CinematicArt src="art/the-empty-chair.png" position={portrait?'60% center':'center'}/>
 <AbsoluteFill style={{background:portrait?'linear-gradient(180deg,#050c19bb 0%,transparent 75%)':'linear-gradient(90deg,#050c19bb,transparent 85%)'}}/>
 <div style={{position:'absolute',left:portrait?85:140,top:portrait?200:195,width:portrait?920:1050,color:palette.ivory}}>
  <Reveal><div style={{fontFamily:sans,fontSize:portrait?28:27,letterSpacing:6,color:palette.gold,marginBottom:30}}>EVERY DAWN TAKES SOMETHING.</div></Reveal>
  <Reveal delay={4}><div style={{fontFamily:serif,fontWeight:700,fontSize:portrait?125:116,lineHeight:.98}}>Tomorrow,<br/>will you<br/><span style={{color:palette.gold}}>remember her?</span></div></Reveal>
 </div><Dust/>
</AbsoluteFill>;};
