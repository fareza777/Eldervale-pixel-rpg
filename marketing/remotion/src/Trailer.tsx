import {AbsoluteFill,Sequence,interpolate,useCurrentFrame,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {OpeningScene} from './OpeningScene';
import {GameplayScene} from './GameplayScene';
import {ClosingScene} from './ClosingScene';
import {clamp} from './theme';

export const Trailer=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:'#080f1b'}}>
 <Sequence from={0} durationInFrames={120} name="01 — The memory hook"><OpeningScene/></Sequence>
 <Sequence from={120} durationInFrames={120} name="02 — A sister erased"><GameplayScene clip="town" secondary="dialogue" eyebrow="A SISTER ERASED" title={'The world forgot.\nYou won’t.'} detail="Follow Lyra’s lantern into a world that denies she ever existed."/></Sequence>
 <Sequence from={240} durationInFrames={180} name="03 — Follow forgotten roads"><GameplayScene clip="frost" secondary="river" eyebrow="EXPLORE ELDERVALE" title={'Take the\nlonger road.'} detail="Quiet towns. Frozen roads. Secrets waiting beyond the next turn."/></Sequence>
 <Sequence from={420} durationInFrames={180} name="04 — Fight for every memory"><GameplayScene clip="combat" secondary="magic" eyebrow="REAL-TIME COMBAT" title={'Strike. Dodge.\nBreak the dark.'} detail="Sword, bow or magic. Find your rhythm and make each opening count."/></Sequence>
 <Sequence from={600} durationInFrames={150} name="05 — Shape your hero"><GameplayScene clip="inventory" secondary="talents" eyebrow="EQUIPMENT & TALENTS" title={'Shape your\nstrength.'} detail="Find rare equipment. Grow your talents. Build your way forward."/></Sequence>
 <Sequence from={750} durationInFrames={180} name="06 — Buried truths"><GameplayScene clip="dungeon" secondary="interior" eyebrow="BEYOND THE DAYLIGHT" title={'Nothing stays\nburied forever.'} detail="Search the forgotten halls for what the dawn was meant to hide."/></Sequence>
 <Sequence from={930} durationInFrames={120} name="07 — The price of dawn"><GameplayScene clip="dialogue" secondary="town" eyebrow="A STORY OF MEMORY & CHOICE" title={'Even the truth\nhas a price.'} detail="Discover who paid for the light. Decide what tomorrow will cost."/></Sequence>
 <Sequence from={1050} durationInFrames={150} name="08 — Eldervale"><ClosingScene/></Sequence>
 <Audio name="Narration — hook" from={8} src={staticFile('audio/01-hook.mp3')}/>
 <Audio name="Narration — sister" from={130} src={staticFile('audio/02-sister.mp3')}/>
 <Audio name="Narration — roads" from={254} src={staticFile('audio/03-world.mp3')}/>
 <Audio name="Narration — combat" from={437} src={staticFile('audio/04-combat.mp3')}/>
 <Audio name="Narration — hero" from={614} src={staticFile('audio/05-build.mp3')}/>
 <Audio name="Narration — choice" from={942} src={staticFile('audio/06-choice.mp3')}/>
 <Audio name="Narration — title" from={1070} src={staticFile('audio/07-title.mp3')}/>
 <Audio name="Quiet air — no music" src={staticFile('audio/still-wind.wav')} loop durationInFrames={1200} volume={.18}/>
 <Audio name="Distant thunder" from={744} src={staticFile('audio/thunder.wav')} volume={.15}/>
 <Audio name="Sword arc" from={434} src={staticFile('audio/swing.wav')} volume={.3}/>
 <Audio name="Blade contact" from={441} src={staticFile('audio/hit.wav')} volume={.38}/>
 <Audio name="Dodge" from={466} src={staticFile('audio/dash.wav')} volume={.3}/>
 <Audio name="Second strike" from={486} src={staticFile('audio/swing.wav')} volume={.3}/>
 <Audio name="Second impact" from={494} src={staticFile('audio/hit.wav')} volume={.35}/>
 <Audio name="Skill burst" from={513} src={staticFile('audio/cast.wav')} volume={.25}/>
 <Audio name="Page turn" from={600} src={staticFile('audio/ui_page.wav')} volume={.18}/>
 <AbsoluteFill style={{background:'#080f1b',pointerEvents:'none',opacity:interpolate(f,[1176,1199],[0,1],clamp)}}/>
</AbsoluteFill>;};
