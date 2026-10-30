import {AbsoluteFill,CanvasImage,staticFile} from 'remotion';
import {palette,serif,sans,Wordmark} from './theme';

export const StoreIcon=()=> <AbsoluteFill style={{background:'#040c15',alignItems:'center',justifyContent:'center'}}><CanvasImage src={staticFile('art/hollow-sun-icon.png')} style={{width:480,height:480,objectFit:'contain'}}/></AbsoluteFill>;
export const FeatureGraphic=()=> <AbsoluteFill style={{background:palette.navy}}><CanvasImage src={staticFile('art/hollow-sun-keyvisual.png')} style={{width:'100%',height:'100%',objectFit:'cover'}}/><AbsoluteFill style={{background:'linear-gradient(90deg,rgba(4,12,25,.3),transparent 80%)'}}/><div style={{position:'absolute',left:66,top:178}}><Wordmark size={66}/></div><div style={{position:'absolute',left:70,top:324,fontFamily:sans,fontSize:17,letterSpacing:1,color:'#e0d6c5'}}>Every dawn steals a memory.</div></AbsoluteFill>;

type StoreShotProps={index:string;title:string;capture:string;accent?:string;};
export const StoreShot=({index,title,capture,accent=palette.gold}:StoreShotProps)=> <AbsoluteFill style={{background:palette.navy,color:palette.ivory,fontFamily:serif}}>
 <CanvasImage src={staticFile('art/hollow-sun-keyvisual.png')} style={{position:'absolute',height:'100%',width:'100%',objectFit:'cover',objectPosition:'65% center',opacity:.2}}/>
 <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(8,15,27,.22) 0%,#080f1b 55%)'}}/>
 <div style={{position:'absolute',top:35,left:70,right:70,display:'flex',justifyContent:'space-between',fontFamily:sans,fontSize:23,letterSpacing:5,color:accent}}><span>ELDERVALE</span><span>{index} / 08</span></div>
 <div style={{position:'absolute',left:67,right:50,top:82,fontSize:84,fontWeight:700,lineHeight:.96,whiteSpace:'pre-line',letterSpacing:-1}}>{title}</div>
 <div style={{position:'absolute',left:70,top:264,width:104,height:3,background:accent}}/>
 <div style={{position:'absolute',left:89,top:292,width:900,height:1600,boxShadow:'0 24px 100px #0009',border:`1px solid ${accent}80`,overflow:'hidden'}}><CanvasImage src={staticFile(`captures/${capture}.png`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>
</AbsoluteFill>;
