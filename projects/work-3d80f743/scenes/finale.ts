// 1:34.02–2:32 终章（2026-10-25 第三次重做；用户确认的方案见 AGENTS.md「1:34.02–2:32 终章」，时刻在 lib/end_t.ts）。
// 图层 offset = start：模块里的时间就是作品时间。按镜头分段画：
//   街（94.02）→ 天花板她醒来（95.40）→ 一镜到底（96.02：他冲上去、她扑下来、抱住、下坠、停住、交靴、松手、他落地）→
//   （他落地以后天上掉下来一块砖，104.52 砸在靴尖前面）→ 第一视角（104.8：捡起来、看）→ 她越升越快冲他笑（106.02）→ 跺地（108.02）→ 慢放：白的边上（109.89）→
//   静：老钟的特写（112.02，屋里墙上的钟跳两下）→ 窗外：他从靴子里出来往上飘、老钟攥住他、被拽出窗（113.88）→
//   人链（118.02 街上一个抓住一个，退到 119.45 改成跟着他往上）→ 第三声前推到他脸上，「活」（122.02）他朝她拼命喊 →
//   「下」（122.52）溶进回忆（recall 图层，scenes/recall.ts：七岁的她哭着喊妈妈，妈妈飘走了，「活下去」的木牌掉在她铁靴跟前）→
//   125.52 拍上切回现在：她抓住楼顶栏杆的近景（翻身不拍）→
//   第四声（126.01）从街上往后拉开到整条人链，人链先往右、再往左荡 → 在这反乌托邦里（129.55 起推）推到他，跟着他往左荡过去，
//   句子唱完把砖递到她手里（131.96）、鼓回来那一下一接过来就亮（132.01）、她立即松开栏杆抱住他、转正（132.58）→
//   推到她脸上：睁开眼看砖，一滴眼泪往下掉在「活」字上（133.02）→
//   拉远、整个画面暗下去（133.3）→ 尾奏：光直接炸开、铺满整个画面（134.02），白里留着两个人的影子 → 散开、落下来、推向两个人 →
//   落地、给他穿外套 → 光脚跺一下（134.03）。
//   （用户 2026-10-25 第二次改 112.02 以后：下面的人是在救他；人链钉在地上的那一点不动，随风摆；砖不翻面；她给他穿外套，光着脚跺出一个坑）

import type { Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, applyCam, kick, toScreen, viewOf } from "../lib/cam";
import { drawGlow, drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { drawCeiling } from "../lib/bed";
import { TE, type V2 } from "../lib/end_t";
import { drawWatchers, makeEndStage } from "../lib/end_map";
import { wakeCast } from "../lib/end_ceil";
import { ceilCam, chainCam, endCam, gripCam, handCam, oneTakeCam, slowCam, smileCam, stompCam, streetCam, zhongCam, zhongCloseCam } from "../lib/end_cam";
import { HB_REST, drawCoat, drawCoatInHands, drawGroundBrick, drawHer, drawKid, drawKidBoots, drawLooseGift, herAt, herBrickAt, holding, kidAt, warmAt } from "../lib/end_pair";
import { drawZhongHouse } from "../lib/end_zhong";
import { drawChain } from "../lib/end_chain";
import { drawBigLight, drawBrickLight, drawCrater, drawCraterFront, drawDiveLines, drawFallTear, drawFloatTears, drawLandBurst, drawLightMotes, drawRiseGlow, drawStompBurst, stompFlash } from "../lib/end_fx";
import { drawPov } from "../lib/end_pov";
import { X_K } from "../lib/end_map";
import { drawCrowdFar, drawCrowdNear } from "../lib/end_crowd";

/** 天色：天快亮（还有几扇窗亮着）→ 越来越亮；砖亮起来以后太阳出来 */
function duskAt(t: number): [number, number] {
  const a = Math.min(1, Math.max(0, (t - 94) / 36));
  const s = Math.min(1, Math.max(0, (t - 132.4) / 5));
  const sun = s * s * (3 - 2 * s);
  return [0.5 - 0.14 * a - 0.24 * sun, (0.35 - 0.12 * a) * (1 - sun)];
}
const E_io = (x: number) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
const wideOf = (cam: Cam) => Math.min(1, Math.max(0, (0.62 - cam.z) / 0.3));

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir } = makeEndStage(base, grain);
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const fill = (c = "#1c1820") => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, width, height);
  };
  /** 竖着的拖影：把这一帧拷一份，上下错开叠几层 */
  const smearV = (dy: number) => {
    if (Math.abs(dy) < 3) return;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = 9;
    const py = (Math.min(260, Math.abs(dy)) * Math.sign(dy) * height) / 1920;
    for (let i = 1; i < n; i++) {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * py);
    }
    ctx.restore();
  };
  const white = (a: number, c = "#fffdf8") => {
    if (a <= 0.003) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };
  const box = (c: V2, r = 700): [number, number, number, number] => [c[0] - r, c[1] - r, c[0] + r, c[1] + r];

  /**
   * 世界里的一个镜头：天、城、楼、窗里的人、老钟家、街面、坑、外套、铁靴、人链、两个人、空气和白。
   * smear：这一帧镜头在画面上竖着走了多少（拖影；人画在拖影后面，保持清楚）
   */
  const worldShot = (cam: Cam, t: number, o: { smear?: number; flash?: number; chain?: boolean; pair?: boolean } = {}) => {
    setDusk(...duskAt(t));
    const wide = wideOf(cam);
    // 街坊（lib/end_crowd.ts）：马路上的几排画在对面人行道那一层（D 1.25）之后、人这一层的楼之前
    drawWorld(ctx, cam, t, [0, 0], (D) => D < 1.3 && drawCrowdFar(ctx, base, cam, t, wide), wide);
    applyCam(ctx, base, cam, 1);
    const v = viewOf(cam, 1);
    const k = kidAt(t);
    drawWatchers(ctx, t, k.root, v);
    drawZhongHouse(ctx, t, cam);
    if (v.y1 > -400) drawStreet(ctx, cam);
    drawCrowdNear(ctx, base, cam, t, wide);
    if (o.smear) smearV(o.smear);
    applyCam(ctx, base, cam, 1);
    // 地上的：坑、外套、她那块砖、留在坑里的铁靴、坑的前沿、碎块和灰
    if (v.y1 > -600) {
      drawCrater(ctx, t, cam.z);
      drawTinted(ctx, [X_K - 1000, -400, X_K + 600, 80], (gg) => drawCoat(gg, t, cam.z), 0.85);
      drawGroundBrick(ctx, t, cam.z);
      if (t >= TE.out1) drawTinted(ctx, [X_K - 420, -500, X_K + 400, 80], (gg) => drawKidBoots(gg, t, cam.z), 0.85);
      drawCraterFront(ctx, t, cam.z);
      drawStompBurst(ctx, t, cam.z);
      drawLandBurst(ctx, t, X_K - 10, TE.land, cam.z);
      drawLandBurst(ctx, t, HB_REST[0], TE.brickHit, cam.z, 0.35);
    }
    // 他那块「妈妈，明天见」被她抱住那一下掉了：往下掉、躺在街上（画在两个人后面）
    drawLooseGift(ctx, t, cam.z);
    if (o.chain !== false) drawChain(ctx, t, cam);
    if (o.pair !== false) {
      const h = herAt(t);
      if (holding(t)) {
        drawTinted(ctx, box(h.chest, 820), (gg) =>
          drawHer(gg, t, cam.z, (cc) => {
            drawKid(cc, t, cam.z, { boots: false });
            if (t < TE.out1) drawKidBoots(cc, t, cam.z);
          }), 0.85);
      } else {
        // 她手里拎着的外套：拎在她身前，披的时候绕到他身后（画在她和他中间）
        if (t >= TE.bang - 0.02) drawTinted(ctx, box(h.chest, 820), (gg) => drawHer(gg, t, cam.z), 0.85);
        drawTinted(ctx, box(k.chest, 640), (gg) => drawCoatInHands(gg, t, cam.z), 0.85);
        drawTinted(ctx, box(k.chest, 640), (gg) => drawKid(gg, t, cam.z, { boots: t < TE.out1 }), 0.85);
      }
      // 往上飘的人身上那团暖光（远看像一盏灯），抱住那一下炸开
      if (t > TE.lift0 && t < TE.catch + 1.5) drawRiseGlow(ctx, t, k.chest, cam.z);
      drawDiveLines(ctx, t, h.chest, cam.z);
    }
    drawAir(ctx, cam, t, [0, 0], { vig: 0.16, warm: 0.9 }, o.flash ?? 0);
  };
  /** 白的边上她身上化成的光（画在白上面）：发梢（停着时）、脚尖（倒挂时碰进白里） */
  const herLight = (cam: Cam, t: number, speed = 1) => {
    applyCam(ctx, base, cam, 1);
    const h = herAt(t);
    // 切到攥栏杆的特写（她倒过来了）就不画了：倒着画会糊在脸上
    if (t > 110.6 && t < TE.flip0) drawLightMotes(ctx, t, [h.head[0] - 4, h.head[1] - 70], 110.6, TE.flip0 + 0.4, speed);
    if (t > TE.hang - 0.2 && t < TE.glow + 0.6) {
      // 倒挂着：脚尖朝上碰进白里，一点点化成光（砖亮起来才停）
      const toe: V2 = [h.root[0], h.root[1] - 520];
      drawLightMotes(ctx, t, toe, TE.hang - 0.2, TE.glow);
    }
  };

  // ——————————————— 各个镜头 ———————————————
  const renderStreet = (t: number) => worldShot(streetCam(t), t, { chain: false, pair: true });
  const renderCeiling = (t: number) => {
    const cam = ceilCam(t);
    fill();
    drawCeiling(ctx, base, t, cam, wakeCast(t));
    setDusk(1, 1);
    drawAir(ctx, cam, t, [0, 0], { vig: 0.2, warm: 0.85 }, 0, 0);
    setDusk(0);
  };
  const renderOneTake = (t: number) => {
    const cam = oneTakeCam(t);
    const prev = oneTakeCam(t - 1 / 60);
    const dy = (cam.y - prev.y) * cam.z + Math.log(cam.z / prev.z) * 300;
    worldShot(cam, t, { smear: t < TE.stop ? dy * 0.8 : 0, chain: false, flash: 0.25 * kick(t, TE.catch, 0.18) });
    // 天上掉下来的那块砖（她的「活下去」）带一点暖光，一眼看得见；落地一亮，之后慢慢收
    if (t > TE.land) {
      const b = herBrickAt(t);
      if (b) {
        applyCam(ctx, base, cam, 1);
        const a = 0.55 * E_io((t - TE.land - 0.05) / 0.15) * (1 - 0.5 * E_io((t - TE.brickHit - 0.1) / 0.4)) + 0.35 * kick(t, TE.brickHit, 0.2);
        drawGlow(ctx, b.c[0], b.c[1], 110, a);
      }
    }
  };
  const renderPov = (t: number) => {
    if (t > TE.lookUp) {
      // 抬头：第一视角带着竖向拖影往下滑走，露出她往上升的那一镜（镜头往上甩着追上去）
      renderSmile(TE.smile);
      drawPov(ctx, base, t);
      smearV(-260 * Math.min(1, (t - TE.lookUp) / 0.08));
      return;
    }
    fill("#d8c3ad");
    drawPov(ctx, base, t);
  };
  function renderSmile(t: number) {
    const cam = smileCam(t);
    const prev = smileCam(t - 1 / 60);
    worldShot(cam, t, { smear: (cam.y - prev.y) * cam.z * 0.9 + (t < TE.smile + 0.25 ? -260 * (1 - (t - TE.smile) / 0.25) : 0), chain: false });
    applyCam(ctx, base, cam, 1);
    const h = herAt(t);
    drawFloatTears(ctx, t, [h.head[0], h.head[1] + 8], TE.smile + 0.3, TE.stompCut);
  }
  const renderStomp = (t: number) => worldShot(stompCam(t), t, { chain: false, flash: stompFlash(t) });
  const renderSlow = (t: number) => {
    const cam = slowCam(t);
    worldShot(cam, t, { chain: false });
    herLight(cam, t, 0.4);
    applyCam(ctx, base, cam, 1);
    const h = herAt(t);
    drawFloatTears(ctx, t, [h.head[0], h.head[1] + 8], TE.slow, TE.silent, 0.4);
    // 慢放：越来越亮（白压过来）
    white(0.12 * Math.min(1, (t - TE.slow) / 2), "#fff6ea");
  };
  const renderZhongClose = (t: number) => worldShot(zhongCloseCam(t), t, { chain: false, pair: false });
  const renderZhong = (t: number) => worldShot(zhongCam(t), t, { chain: true });
  /**
   * 第二声跟着他往上 → 第三声前推到他脸上，他朝她喊 → 第四声从街上往后拉开到整条人链，人链先往右、再往左荡。
   * （2026-10-27 重排：原来第三声从他往下一张脸一张脸看到街上最后那个人，用户：「这个从上往下的镜头有点多余」）
   */
  const renderChain = (t: number) => {
    const cam = chainCam(t);
    worldShot(cam, t);
    herLight(cam, t);
  };
  /** 她抓住栏杆的近景（从回忆切回来，翻身不拍）：倒着的脸在画面中间，两只手落到栏杆上攥紧，一震 */
  const renderGrip = (t: number) => {
    const cam = gripCam(t);
    worldShot(cam, t);
    herLight(cam, t);
    white(0.05, "#fff6ea");
  };
  /** 她的近处那只眼的眼角（相对头；转正抱着他、低头看砖时） */
  const EYE: V2 = [22, 18];
  const eyeAt = (t: number): V2 => {
    const h = herAt(t).head;
    return [h[0] + EYE[0], h[1] + EYE[1]];
  };
  /**
   * 「在这反乌托邦里」：推到他，跟着他荡过去把砖递给她，一接过来就亮，她立即松开栏杆抱住他、转正；
   * 镜头推到她脸上停住：她睁开眼看着砖，一滴眼泪往下掉在砖上，砖跟着一亮
   */
  const renderHand = (t: number) => {
    const cam = handCam(t);
    worldShot(cam, t);
    herLight(cam, t);
    // 全片最强的暖光：以砖为中心；亮起来那一下一闪，之后镜头推到她脸上，光收在砖上（不把两个人的脸照白），拉远时再放开（renderEnd）
    const b = herBrickAt(t);
    if (b) drawBrickLight(ctx, base, cam, b.c, warmAt(t), t, 1 - 0.75 * E_io((t - TE.glow - 0.12) / 0.4));
    white(0.4 * kick(t, TE.glow, 0.22), "#fff3d8");
    tearFx(cam, t);
  };
  /** 她那一滴眼泪：从眼角直直地往下掉，砸在砖面上（落点横着在眼角正下方，不出砖；砸下去以后跟着砖走），砖跟着一亮 */
  const tearFx = (cam: Cam, t: number) => {
    const b = herBrickAt(t);
    if (!b || t < TE.tear0) return;
    applyCam(ctx, base, cam, 1);
    const hb = herBrickAt(TE.tearHit)!.c;
    const e1 = eyeAt(TE.tear1);
    const off: V2 = [Math.min(36, Math.max(-36, e1[0] - hb[0])), -4];
    const hit: V2 = t < TE.tearHit ? [hb[0] + off[0], hb[1] + off[1]] : [b.c[0] + off[0], b.c[1] + off[1]];
    drawFallTear(ctx, t, eyeAt(Math.min(t, TE.tear1)), hit, TE.tear0, TE.tear1, TE.tearHit, cam.z);
    drawGlow(ctx, hit[0], hit[1], 60, 0.32 * kick(t, TE.tearHit, 0.3));
  };
  /** 两个人抱在一起的影子（暖褐，糊一点），画在全白上面；光的芯在两个人中间（砖） */
  const pairShadow = (cam: Cam, t: number, c: V2, a: number) => {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    applyCam(bctx, base, cam, 1);
    drawHer(bctx, t, cam.z, (cc) => drawKid(cc, t, cam.z, { boots: false }));
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.globalCompositeOperation = "source-in";
    bctx.fillStyle = "#9c6a48";
    bctx.fillRect(0, 0, width, height);
    bctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.34 * a;
    ctx.filter = `blur(${Math.max(1, Math.round((3 * width) / 1080))}px)`;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
    applyCam(ctx, base, cam, 1);
    drawGlow(ctx, c[0], c[1], 26 / cam.z, 0.9 * a);
  };
  const renderEnd = (t: number) => {
    const cam = endCam(t);
    worldShot(cam, t);
    tearFx(cam, t);
    const b = herBrickAt(t);
    if (b) {
      // 「在这反乌托邦里」后半句：整个画面（连天上的白）暗下去，只剩她的光在画面正中；
      // 这句唱完（后奏一 134.02）光直接炸开，铺满整个画面；之后慢慢退去，退完正好人链散开
      const back = E_io((t - TE.rev0) / (TE.let0 - TE.rev0));
      // 从她脸上拉远时暗下去（原来 1.2 秒，现在先在她脸上停了一会儿，0.75 秒暗下去，光炸开以前暗透）
      const dark = 0.88 * E_io((t - TE.dim0) / 0.75) * (1 - back);
      if (dark > 0.003) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = dark;
        ctx.fillStyle = "#140f17";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      const grow = E_io((t - TE.descend) / (TE.lit - TE.descend));
      drawBrickLight(ctx, base, cam, b.c, warmAt(t) * (0.6 + 0.4 * (1 - back)), t, 0.25 + 0.75 * E_io((t - TE.dim0) / 0.5));
      drawBigLight(ctx, base, cam, b.c, (0.75 + 0.25 * grow) * E_io((t - TE.dim0) / 0.6) * (1 - 0.85 * back), t, 0.32 + 2.6 * grow * grow);
      const wa = 0.85 * grow * grow * (1 - back);
      white(wa + 0.3 * kick(t, TE.descend, 0.2), "#fff4dc");
      // 全白的时候中间留着两个人抱在一起的影子（光是从他们中间来的）；光退下去时他们先露出来
      if (wa > 0.02) pairShadow(cam, t, b.c, wa);
    }
    // 淡出
    if (t > TE.fade0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, (t - TE.fade0) / (TE.end - 0.05 - TE.fade0));
      ctx.fillStyle = "#0d0e11";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  };

  return {
    canvas,
    render(t) {
      try {
        if (t < TE.ceil) renderStreet(t);
        else if (t < TE.launch) renderCeiling(t);
        else if (t < TE.pov) renderOneTake(t);
        else if (t < TE.smile) renderPov(t);
        else if (t < TE.stompCut) renderSmile(t);
        else if (t < TE.slow) renderStomp(t);
        else if (t < TE.silent) renderSlow(t);
        else if (t < TE.zWide) renderZhongClose(t);
        else if (t < TE.chainCut) renderZhong(t);
        else if (t < TE.mem0 + 0.25) renderChain(t);
        else if (t < TE.flip0) fill(); // 回忆（recall 图层）整个盖住
        else if (t < TE.pull0) renderGrip(t);
        else if (t < TE.corner) renderChain(t);
        else if (t < TE.dim0) renderHand(t);
        else renderEnd(t);
      } finally {
        setDusk(0);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
void toScreen;
