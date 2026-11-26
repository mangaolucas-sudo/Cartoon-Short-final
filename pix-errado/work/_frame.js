
// ---------- per-frame ----------
const GROUND = 0;
function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    if (a.key !== c.key) { c.key = a.key; const g = c.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); c.hands = a.draw(new T.Pen(g)) || {}; c.t.needsUpdate = true; }
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false; c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < 0.3) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? GROUND) + 0.015, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
    c.mesh.updateMatrixWorld(); a._card = c;
  });
}
const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
function placeProps(list, actors, cam) {
  for (const k in PROPS) PROPS[k].visible = false;
  for (const pr of list) {
    const o = PROPS[pr.kind]; if (!o) continue; o.visible = true;
    if (pr.kind === 'phone' && pr.screen) setScreen(pr.screen);
    if (pr.attach) { // to a card's hand: card-local coordinates -> world
      const a = actors[pr.attach.actor], c = a && a._card, h = c && c.hands && c.hands[pr.attach.hand];
      if (!h) { o.visible = false; continue; }
      const lx = (h.x / 600 - 0.5) * CM * 0.6, ly = (1 - h.y / 1000) * CM - CM * 0.025;
      const v = new THREE.Vector3(lx + (pr.attach.dx || 0), ly + (pr.attach.dy || 0), pr.attach.dz ?? 0.06); c.mesh.localToWorld(v);
      o.position.copy(v); o.quaternion.copy(c.mesh.quaternion);
      if (pr.rot) { tmpE.set(...pr.rot); tmpQ.setFromEuler(tmpE); o.quaternion.multiply(tmpQ); }
    } else {
      o.position.set(...pr.pos);
      if (pr.face === 'cam') { o.lookAt(cam.position); if (pr.rot) { tmpE.set(...pr.rot); tmpQ.setFromEuler(tmpE); o.quaternion.multiply(tmpQ); } }
      else o.rotation.set(...(pr.rot || [0, 0, 0]));
    }
    o.scale.setScalar(pr.s || 1);
  }
}
const outC = document.getElementById('o'), outG = outC.getContext('2d');
function renderView(f, V, S, L, vi) {
  const C = V.cam;
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  const actors = [...actorsAt(f, T, vi), ...fxAt(f, T, vi)];
  drawActors(actors, camera);
  placeProps(propsAt(f, vi), actors, camera);
  sky.position.copy(camera.position);
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  const D = V.dof || { focus: 5, cinf: 0 };
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (V.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  const [sx, sy, sw, sh] = V.src || [0, 0, W, H], [dx, dy, dw, dh] = V.dst || [0, 0, W, H];
  outG.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
}
window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f);
  applyLight(L, f); worldState(worldAt(f), f);
  outG.setTransform(1, 0, 0, 1, 0, 0); outG.clearRect(0, 0, W, H);
  viewsAt(f).forEach((V, vi) => renderView(f, V, S, L, vi));
  drawOverlay(outG, overlayAt(f), f);
  return true;
};
window.TOTAL = TOTAL;
document.fonts.load('900 80px Inter').then(() => document.fonts.load('40px "Noto Color Emoji"')).finally(() => { window.ready = true; });
