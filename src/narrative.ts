import story from './story.json';
import type { GameState, NpcDef } from './core/types';

export interface VoiceLine { id: string; cast: string; text: string; }
export const PROLOGUE = story.intro;
export const CHRONICLE = story.chapters;
export const STORY_MEMORY = story.memories;
export const SKILL_VOICES = story.skills;
export const GUARDIAN_VOICES = story.reveals;
export const ENDING_VOICES = story.endings;
export function dialogueLines(npc: NpcDef, state: GameState, chapter: number): VoiceLine[] {
  let key = npc.id;
  if (key.startsWith('house_')) key = 'house_' + npc.service;
  if (key === 'mara' && chapter >= 5) key = 'mara_return';
  if (key === 'orrin' && chapter >= 5) key = 'orrin_return';
  if (key === 'elara' && chapter >= 7) key = 'elara_return';
  if (key === 'lyra' && state.ending) key = 'lyra_home';
  return (story.dialogues as Record<string, VoiceLine[]>)[key] ?? npc.text.map(text=>({id:'',cast:'',text}));
}
