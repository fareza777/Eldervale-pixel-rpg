import React from 'react';
import {AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family:'Eldervale Display',url:staticFile('fonts/font-3.woff2'),weight:'700'});
loadFont({family:'Eldervale Sans',url:staticFile('fonts/font-6.woff2'),weight:'600'});
export const palette={navy:'#080f1b',ink:'#0e192b',gold:'#d6b575',ivory:'#fff1d9',muted:'#bcc6d3'};
export const serif='Eldervale Display, Georgia, serif';
export const sans='Eldervale Sans, Arial, sans-serif';
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

export const Wordmark=({size=100,center=false}:{size?:number;center?:boolean})=><div style={{textAlign:center?'center':'left',color:palette.ivory}}><div style={{fontFamily:serif,fontWeight:700,fontSize:size,letterSpacing:size*.052,lineHeight:1}}>ELDERVALE</div><div style={{fontFamily:sans,fontWeight:600,fontSize:size*.21,letterSpacing:size*.078,marginTop:size*.14,color:palette.gold}}>THE HOLLOW SUN</div></div>;

export const CinematicArt=({src,position='center',dark=.1}:{src:string;position?:string;dark?:number})=>{const f=useCurrentFrame();return <AbsoluteFill><CanvasImage src={staticFile(src)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:position,scale:interpolate(f,[0,180],[1.03,1.08],{...clamp,output:'perceptual-scale'})}}/><AbsoluteFill style={{background:`rgba(4,10,20,${dark})`}}/></AbsoluteFill>;};

export const Reveal=({children,delay=0}:{children:React.ReactNode;delay?:number})=>{const f=useCurrentFrame();return <div style={{opacity:interpolate(f,[delay,delay+16],[0,1],clamp),translate:interpolate(f,[delay,delay+23],['0px 24px','0px 0px'],{...clamp,easing:Easing.bezier(.18,1,.3,1)})}}>{children}</div>;};

export const Dust=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{pointerEvents:'none'}}>{Array.from({length:15},(_,i)=><div key={i} style={{position:'absolute',left:`${(i*47+19)%100}%`,top:`${((i*31+f*.025)%108)-4}%`,width:i%3===0?3:2,height:i%3===0?3:2,borderRadius:'50%',background:palette.gold,opacity:.12+Math.sin((f+i*9)/28)*.09,boxShadow:'0 0 12px #d6b575'}}/>)}</AbsoluteFill>;};
