import {Video} from '@remotion/media';
import {AbsoluteFill,CanvasImage,Sequence,staticFile,useVideoConfig} from 'remotion';
import {Dust,Reveal,palette,serif,sans} from './theme';
export type GameplayProps={clip:string;secondary:string;eyebrow:string;title:string;detail:string;};
const Footage=({first,second,swap}:{first:string;second:string;swap:boolean})=>swap?<>
 <Sequence name="First gameplay shot" from={0} durationInFrames={90}><Video src={staticFile(`clips/${first}.mp4`)} muted objectFit="contain" style={{width:'100%',height:'100%'}}/></Sequence>
 <Sequence name="Second gameplay shot" from={90} durationInFrames={90}><Video src={staticFile(`clips/${second}.mp4`)} muted objectFit="contain" style={{width:'100%',height:'100%'}}/></Sequence>
</>:<Video src={staticFile(`clips/${first}.mp4`)} muted loop objectFit="contain" style={{width:'100%',height:'100%'}}/>;
export const GameplayScene=({clip,secondary,eyebrow,title,detail}:GameplayProps)=>{const {width}=useVideoConfig();const portrait=width<1200;return <AbsoluteFill style={{background:palette.navy,color:palette.ivory}}>
 <CanvasImage src={staticFile('art/hollow-sun-keyvisual.png')} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.24}}/>
 <AbsoluteFill style={{background:'linear-gradient(90deg,#071020ba,transparent 90%)'}}/>
 <div style={{position:'absolute',left:portrait?72:120,top:portrait?66:224,width:portrait?936:710,zIndex:2}}>
  <Reveal><div style={{fontFamily:sans,fontSize:portrait?26:26,letterSpacing:5,color:palette.gold,marginBottom:portrait?18:36}}>{eyebrow}</div></Reveal>
  <Reveal delay={3}><div style={{fontFamily:serif,fontWeight:700,fontSize:portrait?94:110,whiteSpace:'pre-line',lineHeight:.98,letterSpacing:-1}}>{title}</div></Reveal>
  {!portrait&&<Reveal delay={13}><div style={{marginTop:38,width:620,fontFamily:sans,fontSize:32,lineHeight:1.5,color:palette.muted}}>{detail}</div></Reveal>}
 </div>
 {portrait?<div style={{position:'absolute',left:90,top:306,width:900,height:1600,border:'1px solid #d6b57580',boxShadow:'0 20px 60px #0009',overflow:'hidden'}}><Footage first={clip} second={secondary} swap={['frost','combat','dungeon','inventory'].includes(clip)}/></div>:<>
  <div style={{position:'absolute',left:862,top:56,width:540,height:960,border:'1px solid #d6b57580',boxShadow:'0 20px 80px #000b',overflow:'hidden'}}><Footage first={clip} second={secondary} swap={['frost','combat','dungeon','inventory'].includes(clip)}/></div>
  <div style={{position:'absolute',left:1446,top:151,width:390,height:694,border:'1px solid #d6b57540',boxShadow:'0 20px 80px #000b',overflow:'hidden'}}><Footage first={secondary} second={clip} swap={['frost','combat','dungeon','inventory'].includes(clip)}/></div>
  <div style={{position:'absolute',left:1448,top:884,fontFamily:sans,fontSize:22,letterSpacing:3,color:palette.gold}}>THE HOLLOW SUN</div>
 </>}
 <Dust/>
</AbsoluteFill>;};

