import type Phaser from 'phaser';

/** Anchor characters at their visible feet, excluding transparent atlas padding. */
export function registerGroundPivots(scene: Phaser.Scene): void {
  for (const atlas of ['heroes', 'actors', 'monsters', 'battlers']) {
    const texture = scene.textures.get(atlas);
    for (const name of texture.getFrameNames()) {
      const frame = texture.get(name);
      // Phaser applies custom pivots on both setFrame and animation frame changes.
      frame.customPivot = true;
      frame.pivotX = 0.5;
      frame.pivotY = (frame.y + frame.height) / frame.realHeight;
      // The 64px attack cells include a weapon arc below/around the body.
      // Anchor the body, not the arc's outer edge, throughout all strike frames.
      const attack=/^hero\d+\/attack\/(down|up|left|right)\//.exec(name);
      if(attack){const dir=attack[1];frame.pivotX=(dir==='left'?38:dir==='right'?26:32)/64;frame.pivotY=(dir==='up'?48:32)/64;}
      if(/^hero\d+\/spin\//.test(name))frame.pivotY=25/32;
    }
  }
}
