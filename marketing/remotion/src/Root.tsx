import {Composition,Folder,Still} from 'remotion';
import {Trailer} from './Trailer';
import {OpeningScene} from './OpeningScene';
import {ClosingScene} from './ClosingScene';
import {GameplayScene} from './GameplayScene';
import {FeatureGraphic,StoreIcon,StoreShot} from './StoreAssets';

export const RemotionRoot=()=> <>
 <Composition id="Eldervale-Landscape" component={Trailer} width={1920} height={1080} fps={30} durationInFrames={1200}/>
 <Composition id="Eldervale-Portrait" component={Trailer} width={1080} height={1920} fps={30} durationInFrames={1200}/>
 <Folder name="Play-Store">
  <Still id="App-Icon" component={StoreIcon} width={512} height={512}/>
  <Still id="Feature-Graphic" component={FeatureGraphic} width={1024} height={500}/>
  <Still id="Screenshot-01" component={StoreShot} width={1080} height={1920} defaultProps={{index:'01',title:'A world worth\nremembering.',capture:'01-world'}}/>
  <Still id="Screenshot-02" component={StoreShot} width={1080} height={1920} defaultProps={{index:'02',title:'Make every\nstrike count.',capture:'02-combat'}}/>
  <Still id="Screenshot-03" component={StoreShot} width={1080} height={1920} defaultProps={{index:'03',title:'Shape your\nstrength.',capture:'03-talents'}}/>
  <Still id="Screenshot-04" component={StoreShot} width={1080} height={1920} defaultProps={{index:'04',title:'Follow the light.\nFace the dark.',capture:'04-dungeon'}}/>
  <Still id="Screenshot-05" component={StoreShot} width={1080} height={1920} defaultProps={{index:'05',title:'Take the\nlonger road.',capture:'05-frosthaven',accent:'#c0d5ed'}}/>
  <Still id="Screenshot-06" component={StoreShot} width={1080} height={1920} defaultProps={{index:'06',title:'She was real.\nProve it.',capture:'06-dialogue'}}/>
  <Still id="Screenshot-07" component={StoreShot} width={1080} height={1920} defaultProps={{index:'07',title:'Find your\nnext advantage.',capture:'07-inventory'}}/>
  <Still id="Screenshot-08" component={StoreShot} width={1080} height={1920} defaultProps={{index:'08',title:'Beyond the\nmain quest.',capture:'08-quests'}}/>
 </Folder>
 <Folder name="Trailer-Scenes">
  <Composition id="Opening" component={OpeningScene} width={1920} height={1080} fps={30} durationInFrames={120}/>
  <Composition id="Sister" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={120} defaultProps={{clip:'town',secondary:'dialogue',eyebrow:'A SISTER ERASED',title:'The world forgot.\nYou won’t.',detail:'Follow Lyra’s lantern into a world that denies she ever existed.'}}/>
  <Composition id="Exploration" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={{clip:'frost',secondary:'river',eyebrow:'EXPLORE ELDERVALE',title:'Take the\nlonger road.',detail:'Quiet towns. Frozen roads. Secrets waiting beyond the next turn.'}}/>
  <Composition id="Combat" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={{clip:'combat',secondary:'magic',eyebrow:'REAL-TIME COMBAT',title:'Strike. Dodge.\nBreak the dark.',detail:'Sword, bow or magic. Find your rhythm and make each opening count.'}}/>
  <Composition id="Hero-Build" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={150} defaultProps={{clip:'inventory',secondary:'talents',eyebrow:'EQUIPMENT & TALENTS',title:'Shape your\nstrength.',detail:'Find rare equipment. Grow your talents. Build your way forward.'}}/>
  <Composition id="Discovery" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={{clip:'dungeon',secondary:'interior',eyebrow:'BEYOND THE DAYLIGHT',title:'Nothing stays\nburied forever.',detail:'Search the forgotten halls for what the dawn was meant to hide.'}}/>
  <Composition id="Story" component={GameplayScene} width={1920} height={1080} fps={30} durationInFrames={120} defaultProps={{clip:'dialogue',secondary:'town',eyebrow:'A STORY OF MEMORY & CHOICE',title:'Even the truth\nhas a price.',detail:'Discover who paid for the light. Decide what tomorrow will cost.'}}/>
  <Composition id="Closing" component={ClosingScene} width={1920} height={1080} fps={30} durationInFrames={150}/>
 </Folder>
</>;
