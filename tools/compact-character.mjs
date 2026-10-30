import {readFileSync,writeFileSync} from 'node:fs';
let ui=readFileSync('src/ui.ts','utf8');
ui=ui.replace('<div class="character-layout"><aside class="character-profile">', '<nav class="character-mobile-tabs filter-tabs"><button data-action="character-view" data-id="overview" class="${this.characterView === \'overview\' ? \'active\' : \'\'}">Overview</button><button data-action="character-view" data-id="talents" class="${this.characterView === \'talents\' ? \'active\' : \'\'}">Talents <b>${s.points}</b></button></nav><div class="character-layout" data-view="${this.characterView}"><aside class="character-profile">');
writeFileSync('src/ui.ts',ui);
