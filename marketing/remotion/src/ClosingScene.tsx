import {AbsoluteFill,useVideoConfig} from 'remotion';
import {CinematicArt,Dust,Reveal,Wordmark,palette,serif,sans} from './theme';
export const ClosingScene=()=>{const {width}=useVideoConfig();const portrait=width<1200;return <AbsoluteFill style={{background:palette.navy}}>
 <CinematicArt src="art/hollow-sun-keyvisual.png" position={portrait?'76% center':'center'}/>
 <AbsoluteFill style={{background:portrait?'linear-gradient(180deg,#08101cc9,transparent 75%)':'linear-gradient(90deg,#08101c80,transparent 70%)'}}/>
 <div style={{position:'absolute',left:portrait?70:130,top:portrait?210:300,width:portrait?940:1100,color:palette.ivory}}>
 <Reveal><Wordmark size={portrait?124:137} center={portrait}/></Reveal>
 <Reveal delay={18}><div style={{fontFamily:serif,fontSize:portrait?69:68,marginTop:portrait?88:72,textAlign:portrait?'center':'left'}}>Remember what matters.</div></Reveal>
 <Reveal delay={30}><div style={{fontFamily:sans,fontSize:portrait?28:27,letterSpacing:5,color:palette.gold,marginTop:30,textAlign:portrait?'center':'left'}}>A STORY-DRIVEN ACTION RPG</div></Reveal>
 </div><Dust/>
</AbsoluteFill>;};
