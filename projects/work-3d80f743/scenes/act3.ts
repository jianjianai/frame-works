// 副歌一（39.39 起）。一个镜头一个镜头做，用户确认一个再做下一个。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 39.39–43.92「只因为 / 你那渴望自由的心脏 / 困在一张没空隙的网」（lib/net.ts，2026-10-21 重做）：⑫ 转着甩切过来，接着转、鼓进来时转正；
//      最高那栋楼右边一个人张着手笑着往上飞、越飞越快，「困」拴在他脚踝上的红绳一下绷直，把他拽住；没被拴住的人从他身边冲进白里散成灰；
//      镜头一下往后撤到整座城：天上到处是被红绳拴住的人，交错成一张网，网上面的人一拍一个、两个、三个冲进白里化成灰。
//   ②–⑦ 2026-10-22 用户重做，一个镜头（人和东西 lib/mother.ts，镜头 lib/streetcam.ts）：
//   ② 43.92「我们的周围并非没光亮」：小石头飘在半空，妈妈攥着红绳也离了地；她一把把往下拽（她往上、他往下），「亮」把他拽进怀里。
//   ③ 45.93「只是太耀眼将我们灼伤」：抱着，脱下外套裹在他身上；「灼」推开——他往下掉、她往上飘，48.02 红绳绷直。
//   ④ 47.94「在这个世界难免会迷茫」：沉沉跑来起跳，「茫」抓住他的脚踝，一串人被坠下去，铁靴落回街面拽着。
//   ⑤ 49.95「但别再把小刀带在身上」：「但」铁靴离了地；妈妈哭着笑，「带」割断红绳飞上去；两个人掉回街上「咚」。
//   ⑥ 51.93「至少我还在为你而歌唱」：镜头不动，抱在一起；52.517 天上炸开彩色的光，灰落下来。
//   ⑦ 53.94「在黑暗漫长的反乌托邦」：54.518 小刀从天上掉下来「叮」靠在她的铁靴上；两个人看着它（不捡），抬头看天。
//   ⑦ 55.98–60.02「即便我们都在这黑暗漫长的反乌托邦」（lib/memory.ts）：推近沉沉仰着的脸，「在这」溶成同一位置、同样大小的小时候的脸——
//      十二年前同一条街，七岁的她穿着妈妈的大铁靴仰着头，光着脚的妈妈往天上飘；镜头从她脸上拉开。
//   ⑧ 60.02–64.02「邦」拖着的 4 秒（lib/sign.ts，还在十二年前，同一个镜头）：推到天上的妈妈手里，她掏出一块小木牌竖着写下「活下去」，
//      丢下来；镜头跟着木牌往下掉，62.018「咚」砸在她的铁靴跟前。路人低着头走过；她跪下去捡起来抱在胸前，63.018 天上一亮、灰落下来，
//      她抱着牌子仰着头。
//   间奏 64.02–72.02（lib/grow.ts，还是同一个镜头）：她把木牌插进靴子里站起来往右走，一拍一步、一步一年地长大，拽下一个女学生、
//      跳起来拽下一个大叔塞给他一块砖；十九岁跪下去张开手，溶回现在：清晨的街上她抱着小石头，抬起头看着天。
// 第二幕的城、她那扇窗、她的屋子都从 lib/stage.ts 画（和第二幕同一套），接过去的那一帧一样。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, E, H, LANDSCAPE, W, applyCam, ph, shake, spinBlur, setLens, syncFrame, viewOf } from "../lib/cam";
import { lensAt } from "../lib/wide";
import { drawBurst, drawRays, drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { NET_T, drawFree, drawFreeBursts, drawMan, drawNetLayer, manRopeSeg, netFlash, netWide } from "../lib/net";
import { DAWN_T, ZHONG_HOUSE, ZHONG_NEIGHBORS, dawnSky } from "../lib/dawn";
import { drawHouse, drawHouseWindowFront } from "../lib/props";
import { MT, drawDazzle, drawMothers } from "../lib/mother";
import { ASH_T, ashFlash, ashRays, burstAt, drawSkyBloom, drawSnow } from "../lib/ash";
import { XFER, streetCam, streetLook, streetShake, xferWhite } from "../lib/streetcam";
import { MEM_T, drawThen, memoryGrade, nowCam, thenCam } from "../lib/memory";
import { SIGN_T, drawDust, drawFallingBoard, drawMemAsh, drawMemFlash, drawSign8, signCam, signShake, walkersOut } from "../lib/sign";
import { GROW_T, type Layer, backCam, drawGrowFront, drawGrowGlow, drawSaved, frontSeg, growCam, growDissolve, growDusk, growLook, growShake, landX, memoryAmount, segAt } from "../lib/grow";
import { drawBusStop, drawSchool } from "../lib/years";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  syncFrame(width, height);
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // 拖影用的上一帧
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir, windowCovers, drawInside } = makeStage(base, grain, ZHONG_NEIGHBORS);
  /** 这一幕的镜头：①接②（同一个镜头） */
  /** 现在这条线的镜头（⑦ 推近沉沉的脸为止） */
  const nowAt = (t: number) => nowCam(t, streetCam);
  /** 间奏最后接回现在（和十九岁跪下来的她对齐） */
  const camAt = (t: number): Cam => backCam(t, nowAt, thenCamAt);
  /** ⑦⑧、间奏 十二年前的镜头 */
  const thenCamAt = (t: number): Cam => growCam(t, (t2) => signCam(t2, (tt) => thenCam(tt, camAt)));

  /** 横屏：⑧ 两个路人各自走出画面的那一刻（第一次画到时按横屏镜头算） */
  let walkOut: number[] | undefined;
  const walkOutAt = () =>
    (walkOut ??= walkersOut((t) => {
      const lens = lensAt("act3", t);
      return lens ? lens(thenCamAt(t)) : thenCamAt(t);
    }));
  /** ⑦⑧ 十二年前：同一条街，白天，颜色淡一些、旧一些；穿着妈妈铁靴的她、往天上飘的妈妈（掉在半空的木牌、灰、调色在 drawPastTop） */
  const drawPast = (g: CanvasRenderingContext2D, t: number, layer?: Layer) => {
    const cam = thenCamAt(t);
    // 十二年前那一层（间奏第一次叠化的前一层）一直按 ⑧ 画：她跪着抱着木牌望着天
    if (t >= GROW_T.start && (layer?.seg ?? segAt(t)) !== 0) {
      drawYears(g, t, cam, layer);
      return;
    }
    const sh = shake(t, signShake(t));
    drawWorld(g, cam, t, sh, undefined, 0);
    applyCam(g, base, cam, 1, sh);
    const v = viewOf(cam, 1);
    const H_ = ZHONG_HOUSE;
    if (H_.x0 < v.x1 + 200 && H_.x1 > v.x0 - 200 && v.y1 > H_.top - 300) {
      drawHouse(g, H_, t);
      drawHouseWindowFront(g, H_);
    }
    if (v.y1 > -400) drawStreet(g, cam);
    applyCam(g, base, cam, 1, sh);
    if (t < SIGN_T.start) drawThen(g, t, cam.z);
    else {
      drawSign8(g, t, cam.z, LANDSCAPE ? walkOutAt() : undefined);
      drawDust(g, t);
    }
    drawAir(g, cam, t, sh, skyLook(t), 0, 0);
  };
  /**
   * 间奏（lib/grow.ts、lib/years.ts）：她走两步，第二步落脚前后 0.4 秒叠化成下一个地方，她一直在画面正中。
   * 一层画面（layer：哪个地方、几岁的她；不给就按这一刻）：先画那个地方（里面带着还飘着的人），再画她，再画坐在她前面的人，
   * 最后砖的光、空气和调色
   */
  const drawYears = (g: CanvasRenderingContext2D, t: number, cam: Cam, layer?: Layer) => {
    const sh = shake(t, growShake(t));
    const late: (() => void)[] = [];
    const seg = layer?.seg ?? segAt(t);
    if (seg === 0) {
      drawWorld(g, cam, t, sh, undefined, 0);
      applyCam(g, base, cam, 1, sh);
      const v = viewOf(cam, 1);
      const H_ = ZHONG_HOUSE;
      if (H_.x0 < v.x1 + 200 && H_.x1 > v.x0 - 200 && v.y1 > H_.top - 300) {
        drawHouse(g, H_, t);
        drawHouseWindowFront(g, H_);
      }
      if (v.y1 > -400) drawStreet(g, cam);
    } else {
      const people = () => {
        applyCam(g, base, cam, 1, sh);
        drawSaved(g, t, cam.z, seg, false, late);
      };
      if (seg === 1) drawBusStop(g, base, cam, t, sh, landX(1), people);
      else {
        setDusk(0.5, 0.5);
        try {
          drawSchool(g, base, cam, t, sh, landX(2), people);
        } finally {
          setDusk(0);
        }
      }
      for (const f of late.splice(0)) f();
    }
    applyCam(g, base, cam, 1, sh);
    drawGrowFront(g, t, cam.z, late, layer?.age);
    // 摔下来以后坐在她前面的人（她走开时从他身后经过）
    const fs = frontSeg(t, seg);
    if (fs) {
      applyCam(g, base, cam, 1, sh);
      drawSaved(g, t, cam.z, fs, true, late);
    }
    for (const f of late.splice(0)) f();
    drawGrowGlow(g, t, width / W, seg);
    const dk = growDusk(seg);
    setDusk(dk, dk);
    try {
      drawAir(g, cam, t, sh, growLook(t), 0, 0);
    } finally {
      setDusk(0);
    }
  };
  /** 拖影上面的：掉在半空的木牌（保持清楚）、灰、天上那一亮，最后整幅蒙回忆的颜色 */
  const drawPastTop = (g: CanvasRenderingContext2D, t: number, layer?: Layer) => {
    const cam = thenCamAt(t);
    const seg = layer?.seg ?? segAt(t);
    applyCam(g, base, cam, 1, shake(t, signShake(t)));
    drawFallingBoard(g, t, cam.z);
    if (t < GROW_T.start || seg === 0) drawMemAsh(g, t, cam.z);
    drawMemFlash(g, base, t);
    memoryGrade(g, base, t < GROW_T.start ? 1 : memoryAmount(seg));
  };
  /** 镜头竖着甩得很快时按 1/48 秒快门竖着拖一下（a、b 是前后 1/120 秒的镜头） */
  const smear = (z: number, a: { y: number }, b: { y: number }) => {
    const dy = ((b.y - a.y) * z * 60) / 48;
    if (Math.abs(dy) <= 8) return;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = 9;
    const py = (Math.min(260, Math.abs(dy)) * Math.sign(dy) * height) / H;
    for (let i = 1; i < n; i++) {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * py);
    }
    ctx.restore();
  };

  /** 夜里（天亮）的城和网、街上（她那扇窗、窗里的屋子由 stage 画） */
  const drawNight = (g: CanvasRenderingContext2D, t: number, beforeMan?: () => void) => {
    const cam = camAt(t);
    const sh = shake(t, streetShake(t));
    setDusk(...dawnSky(t));
    try {
      drawWorld(g, cam, t, sh, (D) => {
        if (D === 4 || D === 2.2 || D === 1.5) drawNetLayer(g, t, D, cam.z);
      }, netWide(cam));
      applyCam(g, base, cam, 1, sh);
      // 第一幕老钟家（和第一幕同一条街）：夜里、清晨蒙上那层色
      const v = viewOf(cam, 1);
      const H_ = ZHONG_HOUSE;
      if (H_.x0 < v.x1 + 200 && H_.x1 > v.x0 - 200 && v.y1 > H_.top - 300)
        drawTinted(g, [H_.x0 - 120, H_.top - 260, H_.x1 + 160, 60], (gg) => {
          drawHouse(gg, H_, t);
          drawHouseWindowFront(gg, H_);
        });
      if (v.y1 > -400) drawStreet(g, cam);
      applyCam(g, base, cam, 1, sh);
      // ①的网（人这一层）：天亮切到街上以后不画（那个人就在这条街的上空，红绳会垂进画面）
      if (t < DAWN_T.start) drawNetLayer(g, t, 1, cam.z, manRopeSeg(t));
      // ① 他往上飞得很快：楼、窗、网按快门竖着拖影，他自己清楚（拖完再画他）
      if (beforeMan) {
        beforeMan();
        applyCam(g, base, cam, 1, sh);
      }
      if (t < DAWN_T.start) {
        drawMan(g, t, cam.z);
        drawFree(g, t, cam.z);
      }
      // ②–⑦ 街上：小石头和妈妈、沉沉、红绳、外套、小刀（清晨的那层色，lib/mother.ts）；落下来的灰
      if (t >= DAWN_T.start) {
        drawTinted(g, [-3500, -2900, -1500, 80], (gg) => drawMothers(gg, t, cam.z), 0.85);
        drawSnow(g, t, cam.z);
        drawDazzle(g, t);
      }
      // 退出窗时外面的空气（浮尘、白）跟着倍数淡进来（和⑧推进窗反过来）
      drawAir(g, cam, t, sh, t >= DAWN_T.start ? streetLook(t, skyLook(t)) : skyLook(t), E.io(ph(cam.z, 2, 6)), ashFlash(t) + netFlash(t));
      // ① 退到整座城上：白往下打几道宽宽的斜光（和序章全城那个画面一样），天亮以后淡掉
      if (t < DAWN_T.start) drawRays(g, base, cam, t, netWide(cam));
      // ⑥ 天上炸开彩色的光：白往下打几道光（照在地上仰着头的两个人身上）
      else if (t > ASH_T.touch) drawRays(g, base, cam, t, 0.95 * ashRays(t));
      // ① 没被拴住的人碰到白：彩色光环、灰（画在最上面）
      drawFreeBursts(g, base, cam, t);
      // ⑥ 碰到白：一圈像肥皂泡边一样的彩色光炸开（画在最上面）
      drawSkyBloom(g, base, t);
      if (t > ASH_T.touch - 0.02 && t < ASH_T.touch + 2) {
        const b = burstAt();
        drawBurst(g, base, cam, b[0], b[1], t - ASH_T.touch, 2.1);
        drawBurst(g, base, cam, b[0] - 260, b[1] + 200, t - ASH_T.touch - 0.12, 1.2);
      }
    } finally {
      setDusk(0);
    }
  };

  return {
    canvas,
    render(t) {
      syncFrame(width, height);
      setLens(lensAt("act3", t));
      // 间奏最后溶回现在：先画现在，再把回忆那一帧叠在上面越来越淡（两边的她同一个姿势、同一个地方、一样大，只有四周和怀里的人在换）
      if (t >= GROW_T.kneel) {
        drawNight(ctx, t);
        if (t < GROW_T.dis1) {
          drawPast(bctx, t);
          drawPastTop(bctx, t);
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1 - E.io(ph(t, GROW_T.kneel, GROW_T.dis1));
          ctx.drawImage(buf, 0, 0);
          ctx.restore();
        }
        return;
      }
      // 间奏换地方：前一个地方先画，后一个地方叠上去
      const dz = t >= GROW_T.start ? growDissolve(t) : null;
      if (dz) {
        drawPast(ctx, t, dz.from);
        drawPastTop(ctx, t, dz.from);
        drawPast(bctx, t, dz.to);
        drawPastTop(bctx, t, dz.to);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = dz.w;
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
        return;
      }
      // ⑦ 溶进十二年前：先画回忆，再把现在那一帧叠在上面越来越淡
      if (t >= MEM_T.dis0) {
        drawPast(ctx, t);
        // ⑧ 跟着木牌往下掉：背景竖着拖影，木牌画在拖影上面
        if (t > SIGN_T.rel + 0.04 && t < SIGN_T.land) smear(thenCamAt(t).z, thenCamAt(t - 1 / 120), thenCamAt(Math.min(t + 1 / 120, SIGN_T.land - 1e-4)));
        drawPastTop(ctx, t);
        if (t < MEM_T.dis1) {
          drawNight(bctx, t);
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1 - E.io(ph(t, MEM_T.dis0, MEM_T.dis1));
          ctx.drawImage(buf, 0, 0);
          ctx.restore();
        }
        return;
      }
      const cam = camAt(t);
      if (windowCovers(cam)) {
        drawInside(ctx, t, cam);
        return;
      }
      // ① 转场切过来还在转：转着拖影；转正以后他往上飞得很快：背景竖着拖影（他自己不拖）
      const flying = t >= NET_T.upright - 0.05 && t < NET_T.yank + 0.02;
      drawNight(ctx, t, flying ? () => smear(cam.z, camAt(t - 1 / 120), camAt(t + 1 / 120)) : undefined);
      if (t < NET_T.upright || (t > XFER.w0 && t < XFER.w1)) spinBlur(ctx, buf, bctx, ((camAt(t + 0.004).r - camAt(t - 0.004).r) / 0.008) / 48);
      // ①→② 转场：白压满画面，再从白里退出来（天亮）
      const wk = xferWhite(t);
      if (wk > 0.001) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const wg = ctx.createLinearGradient(0, 0, 0, height);
        wg.addColorStop(0, "#fffdf6");
        wg.addColorStop(1, "#fff1dc");
        ctx.globalAlpha = wk;
        ctx.fillStyle = wg;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      // ⑤ 割断以后顺着掉下去的两个人甩到街上：镜头竖着甩得很快，按 1/48 秒快门竖着拖一下
      const whip = t > MT.cut + 0.08 && t < MT.land + 0.03;
      if (whip) smear(cam.z, camAt(t - 1 / 120), camAt(t + 1 / 120));
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
