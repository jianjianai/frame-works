// 1:34.02–2:32 终章（2026-10-25 第三次重做；用户确认的方案见 AGENTS.md「1:34.02–2:32 终章」，时刻在 lib/end_t.ts）。
// 图层 offset = start：模块里的时间就是作品时间。按镜头分段画：
//   街（94.02）→ 天花板她醒来（95.40）→ 一镜到底（96.02：他冲上去、她扑下来、抱住、下坠、停住、交靴、松手、他落地）→
//   （他落地以后天上掉下来一块砖，104.52 砸在靴尖前面）→ 第一视角（104.8：捡起来、看）→ 她越升越快冲他笑（106.02）→ 跺地（108.02）→ 慢放：白的边上（109.89）→
//   静：老钟的特写（112.02，屋里墙上的钟跳两下）→ 窗外：他从靴子里出来往上飘、老钟攥住他、被拽出窗（113.88）→
//   人链（118.02 街上一个抓住一个，退到 119.45 改成跟着他往上）→ 第三声（121.75）从他往下一张脸一张脸看到街上最后那个人 →
//   第四声（126.01）从街上往后拉开到整条人链，人链先往右、再往左荡 → 在这反乌托邦里（129.55 起推）推到他，跟着他往左荡过去，
//   句子唱完把砖递到她手里（131.96）、鼓回来那一下一接过来就亮（132.01）、她立即松开栏杆抱住他、转正（132.58）→
//   拉远、整个画面暗下去（132.75）→ 尾奏：光直接炸开、铺满整个画面（134.02）→ 散开、落下来、推向两个人 →
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
import { ceilCam, chainCam, endCam, handCam, oneTakeCam, slowCam, smileCam, stompCam, streetCam, zhongCam, zhongCloseCam } from "../lib/end_cam";
import { HB_REST, drawCoat, drawCoatInHands, drawGroundBrick, drawHer, drawKid, drawKidBoots, drawLooseGift, herAt, herBrickAt, holding, kidAt, warmAt } from "../lib/end_pair";
import { drawZhongHouse } from "../lib/end_zhong";
import { drawChain } from "../lib/end_chain";
import { drawBigLight, drawBrickLight, drawCrater, drawCraterFront, drawDiveLines, drawFloatTears, drawLandBurst, drawLightMotes, drawRiseGlow, drawStompBurst, stompFlash } from "../lib/end_fx";
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
    if (t > 110.6 && t < TE.flip0 + 0.3) drawLightMotes(ctx, t, [h.head[0] - 4, h.head[1] - 70], 110.6, TE.flip0, speed);
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
   * 第三声从他往下一张脸一张脸看到街上 → 第四声从街上往后拉开到整条人链，人链先往右、再往左荡。
   * （原来「去」的长音里有一道淡光沿人链从街上描到他；现在第三声的镜头自己把每个人看过一遍，光去掉了）
   */
  const renderChain = (t: number) => {
    const cam = chainCam(t);
    worldShot(cam, t);
    // 往下看的时候镜头走得快：轻轻的竖向拖影（按这一帧镜头在画面上竖着走了多少；人画在拖影后面清楚不了，所以很轻）
    if (t > TE.look0 && t < TE.sweepEnd) {
      const prev = chainCam(t - 1 / 60);
      smearV((cam.y - prev.y) * cam.z * 0.2);
    }
    herLight(cam, t);
  };
  /** 「在这反乌托邦里」：推到他，跟着他荡过去把砖递给她，一接过来就亮，她立即松开栏杆抱住他、转正 */
  const renderHand = (t: number) => {
    const cam = handCam(t);
    worldShot(cam, t);
    herLight(cam, t);
    // 全片最强的暖光：以砖为中心；亮起来那一下一闪
    const b = herBrickAt(t);
    if (b) drawBrickLight(ctx, base, cam, b.c, warmAt(t), t);
    white(0.4 * kick(t, TE.glow, 0.22), "#fff3d8");
  };
  const renderEnd = (t: number) => {
    const cam = endCam(t);
    worldShot(cam, t);
    const b = herBrickAt(t);
    if (b) {
      // 「在这反乌托邦里」后半句：整个画面（连天上的白）暗下去，只剩她的光在画面正中；
      // 这句唱完（后奏一 134.02）光直接炸开，铺满整个画面；之后慢慢退去，退完正好人链散开
      const back = E_io((t - TE.rev0) / (TE.let0 - TE.rev0));
      const dark = 0.88 * E_io((t - TE.dim0 - 0.1) / 1.1) * (1 - back);
      if (dark > 0.003) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = dark;
        ctx.fillStyle = "#140f17";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      const grow = E_io((t - TE.descend) / (TE.lit - TE.descend));
      drawBrickLight(ctx, base, cam, b.c, warmAt(t) * (0.6 + 0.4 * (1 - back)), t);
      drawBigLight(ctx, base, cam, b.c, (0.75 + 0.25 * grow) * E_io((t - TE.dim0) / 0.6) * (1 - 0.85 * back), t, 0.32 + 2.6 * grow * grow);
      white(0.85 * grow * grow * (1 - back) + 0.3 * kick(t, TE.descend, 0.2), "#fff4dc");
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
