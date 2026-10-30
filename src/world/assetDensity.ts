/** Packed generated sprites carry two source pixels per world pixel. */
export function assetScale(texture: string): number {
  return texture === 'furniture' || texture === 'flora' ? .5 : 1;
}
