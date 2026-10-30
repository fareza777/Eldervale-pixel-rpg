/** Exercise the same collapsed menu flow a player uses on a phone. */
export async function openGameMenus(page,touch=false){
  if(await page.locator('#world-menus').isHidden()){
    const toggle=page.locator('.game-menu-toggle');
    if(touch)await toggle.tap();else await toggle.click();
  }
}
export async function gameMenu(page,name,touch=false){
  await openGameMenus(page,touch);
  const button=page.locator('.game-nav [data-action="'+name+'"]');
  if(touch)await button.tap();else await button.click();
}
/** A comfortable left-thumb start inside the floating movement surface. */
export async function movementBox(page){
  return page.locator('#movement-zone').evaluate(el=>{
    const r=el.getBoundingClientRect(),cx=r.left+Math.min(72,r.width*.36),cy=r.bottom-90;
    return{x:cx-54,y:cy-54,width:108,height:108};
  });
}
