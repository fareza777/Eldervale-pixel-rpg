import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const root=process.cwd(),out=path.resolve(root,'../store-v1/exports'),review=path.resolve(root,'../store-v1/review');
await mkdir(review,{recursive:true});
await mkdir(out,{recursive:true});
const url=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir:path.join(root,'.bundle')});
const browser=await openBrowser('chrome',{browserExecutable:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const comps=await getCompositions(url,{puppeteerInstance:browser});
 await writeFile(path.join(review,'compositions.json'),JSON.stringify(comps.map(({id,width,height,fps,durationInFrames})=>({id,width,height,fps,durationInFrames})),null,2));
 const selected=process.argv[2]||'stills';
 if(selected==='stills'){
  for(const c of comps.filter(c=>c.id==='App-Icon'||c.id==='Feature-Graphic'||c.id.startsWith('Screenshot-'))){
   const name=c.id==='App-Icon'?'app-icon-512':c.id==='Feature-Graphic'?'feature-graphic-1024x500':c.id.toLowerCase()+'-1080x1920';
   await renderStill({composition:c,serveUrl:url,output:path.join(out,name+'.png'),puppeteerInstance:browser,imageFormat:'png'});
   if(c.id==='App-Icon'){
    const require=createRequire(import.meta.url);
    const ffmpeg=process.env.FFMPEG_PATH||path.join(path.dirname(require.resolve('@remotion/compositor-win32-x64-msvc/package.json')),'ffmpeg.exe');
    const temp=path.join(out,'app-icon-rgba.png');
    execFileSync(ffmpeg,['-v','error','-y','-i',path.join(out,name+'.png'),'-pix_fmt','rgba',temp]);
    await rename(temp,path.join(out,name+'.png'));
   }
   console.log('Exported '+name);
  }
  for(const id of ['Eldervale-Landscape','Eldervale-Portrait'])for(const frame of [60,165,300,465,645,810,975,1110]){
   await renderStill({composition:comps.find(c=>c.id===id),serveUrl:url,output:path.join(review,`${id}-${frame}.png`),puppeteerInstance:browser,imageFormat:'png',frame});
   console.log('Reviewed '+id+' frame '+frame);
  }
 }else{
  const c=comps.find(c=>c.id===selected);if(!c)throw new Error('Unknown composition');
  let last=-1;
  await renderMedia({composition:c,serveUrl:url,outputLocation:path.join(out,selected.toLowerCase()+'-1080p.mp4'),codec:'h264',audioCodec:'aac',audioBitrate:'192k',crf:18,pixelFormat:'yuv420p',puppeteerInstance:browser,concurrency:2,onProgress:({progress})=>{const n=Math.floor(progress*10);if(n!==last){last=n;console.log(selected+' '+n*10+'%');}}});
  console.log('Exported '+selected);
 }
}finally{await browser.close({silent:true});}
