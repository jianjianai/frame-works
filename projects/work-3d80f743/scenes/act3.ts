// 副歌一（39.39 起）。一个镜头一个镜头做，用户确认一个再做下一个。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 39.39–43.92「只因为 / 你那渴望自由的心脏 / 困在一张没空隙的网」（lib/net.ts）：从她的屋子退出窗外；窗外的巷子里一个人往上飘、
//      扑向头顶的白，「困」拴在他脚踝上的红绳一下绷直，把他拽住；镜头一路退到整座城：天上到处是被红绳拴住的人，缠成一张盖住整座城的网。
//   ② 43.92–47.92「我们的周围并非没光亮 / 只是太耀眼将我们灼伤」（lib/dawn.ts，还是同一个镜头）：天亮起来，窗一组组灭，天上的人被
//      一个个收回窗里；「只是」镜头扎到街上：小石头飘了起来，妈妈攥着拴在他脚踝上的红绳往下拽，「灼」她的脚跟也离了地。
//   ③ 47.92–49.98「在这个世界难免会迷茫」（lib/coat.ts，还是同一个镜头）：妈妈两把把自己拽到儿子跟前，脱下外套（下摆缝着铅）裹在他身上，
//      他一沉，「茫」抱住妈妈的脚踝；沉沉从最高那栋楼那边冲过来。
//   ④ 49.98–51.93「但别再把小刀带在身上」（lib/knife.ts，还是同一个镜头）：沉沉抓住小石头的脚踝往下拽，三个人连在一根红绳上还在往上飘，
//      沉沉的铁靴也离了地；镜头推到妈妈手上，「小刀」她割断手腕上的红绳；镜头甩到街上，沉沉抱着小石头落地「咚」。
//   ⑤ 51.93–53.94「至少我还在为你而歌唱」（lib/sing.ts，还是同一个镜头）：镜头顺着视线往上甩、追上往上飘的妈妈，她张着手低头看着儿子
//      哭着笑，越飘越快；「歌唱」她仰起脸迎着白，镜头追不上了往后退，她一个人往白的边上冲去。
//   ⑥ 53.94–55.98「在黑暗漫长的反乌托邦」（lib/ash.ts，还是同一个镜头）：54.018 她碰到白，散成淡彩的光点，彩色的光炸开、画面一亮；
//      光点变成灰像雪一样往城里落，镜头顺着灰慢慢往下，落到街上：沉沉紧紧抱着小石头。
//   ⑦ 55.98–60.02「即便我们都在这黑暗漫长的反乌托邦」（lib/memory.ts）：推近沉沉闭着眼的脸，「在这」溶成同一位置、同样大小的小时候的脸——
//      十二年前同一条街，七岁的她穿着妈妈的大铁靴仰着头，光着脚的妈妈往天上飘；镜头从她脸上拉开。
//   ⑧ 60.02–64.02「邦」拖着的 4 秒（lib/sign.ts，还在十二年前，同一个镜头）：推到天上的妈妈手里，她掏出一块小木牌竖着写下「活下去」，
//      丢下来；镜头跟着木牌往下掉，62.018「咚」砸在她的铁靴跟前。路人低着头走过；她跪下去捡起来抱在胸前，63.018 天上一亮、灰落下来，
//      她抱着牌子仰着头。
//   间奏 64.02–72.02（lib/grow.ts，还是同一个镜头）：她把木牌插进靴子里站起来往右走，一拍一步、一步一年地长大，拽下一个女学生、
//      跳起来拽下一个大叔塞给他一块砖；十九岁跪下去张开手，溶回现在：清晨的街上她抱着小石头，抬起头看着天。
// 第二幕的城、她那扇窗、她的屋子都从 lib/stage.ts 画（和第二幕同一套），接过去的那一帧一样。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, E, applyCam, ph, shake, viewOf } from "../lib/cam";
import { drawBurst, drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { drawMan, drawNetLayer, manRopeSeg, netCam, netShake, netWide } from "../lib/net";
import { DAWN_T, ZHONG_HOUSE, ZHONG_NEIGHBORS, dawnCam, dawnShake, dawnSky, drawDazzle, drawStreet2 } from "../lib/dawn";
import { drawHouse, drawHouseWindowFront } from "../lib/props";
import { COAT_T, coatCam, drawChen3, drawCoat3 } from "../lib/coat";
import { KNIFE_T, drawKnife4, knifeCam, knifeShake } from "../lib/knife";
import { SING_T, drawSing5, singAt, singCam } from "../lib/sing";
import { ASH_T, ashCam, ashFlash, ashShake, burnLine, burnedOut, burstAt, drawBits, drawSnow } from "../lib/ash";
import { MEM_T, drawThen, memoryGrade, nowCam, thenCam } from "../lib/memory";
import { SIGN_T, drawDust, drawFallingBoard, drawMemAsh, drawMemFlash, drawSign8, signCam, signShake } from "../lib/sign";
import { GROW_T, backCam, drawGrow, growCam, memoryAmount } from "../lib/grow";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
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
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir, windowCovers, drawInside } = makeStage(base, grain, ZHONG_NEIGHBORS);
  /** 这一幕的镜头：①接②（同一个镜头） */
  /** 现在这条线的镜头（⑦ 推近沉沉的脸为止） */
  const nowAt = (t: number) => nowCam(t, (tn) => ashCam(tn, (t0) => singCam(t0, (t1) => knifeCam(t1, (t2) => coatCam(t2, (t3) => dawnCam(t3, netCam))))));
  /** 间奏最后接回现在（和十九岁跪下来的她对齐） */
  const camAt = (t: number): Cam => backCam(t, nowAt, thenCamAt);
  /** ⑦⑧、间奏 十二年前的镜头 */
  const thenCamAt = (t: number): Cam => growCam(t, (t2) => signCam(t2, (tt) => thenCam(tt, camAt)));

  /** ⑦⑧ 十二年前：同一条街，白天，颜色淡一些、旧一些；穿着妈妈铁靴的她、往天上飘的妈妈（掉在半空的木牌、灰、调色在 drawPastTop） */
  const drawPast = (g: CanvasRenderingContext2D, t: number) => {
    const cam = thenCamAt(t);
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
    else if (t < GROW_T.start) {
      drawSign8(g, t, cam.z);
      drawDust(g, t);
    } else drawGrow(g, t, cam.z);
    drawAir(g, cam, t, sh, skyLook(t), 0, 0);
  };
  /** 拖影上面的：掉在半空的木牌（保持清楚）、灰、天上那一亮，最后整幅蒙回忆的颜色 */
  const drawPastTop = (g: CanvasRenderingContext2D, t: number) => {
    const cam = thenCamAt(t);
    applyCam(g, base, cam, 1, shake(t, signShake(t)));
    drawFallingBoard(g, t, cam.z);
    drawMemAsh(g, t, cam.z);
    drawMemFlash(g, base, t);
    memoryGrade(g, base, t < GROW_T.start ? 1 : memoryAmount(t));
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
    const py = (Math.min(260, Math.abs(dy)) * Math.sign(dy) * height) / 1920;
    for (let i = 1; i < n; i++) {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * py);
    }
    ctx.restore();
  };

  /** 夜里（天亮）的城和网、街上（她那扇窗、窗里的屋子由 stage 画） */
  const drawNight = (g: CanvasRenderingContext2D, t: number) => {
    const cam = camAt(t);
    const sh = shake(t, netShake(t) + dawnShake(t) + knifeShake(t) + ashShake(t));
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
      drawNetLayer(g, t, 1, cam.z, manRopeSeg(t));
      drawMan(g, t, cam.z);
      // ② 街上的小石头和妈妈
      if (t > DAWN_T.dive0 - 0.2) {
        drawTinted(g, [-3400, -2800, -1500, 80], (gg) => {
          if (t <= COAT_T.start) drawStreet2(gg, t, cam.z);
          else if (t <= KNIFE_T.start) {
            drawCoat3(gg, t, cam.z);
            drawChen3(gg, t, cam.z);
          } else drawKnife4(gg, t, cam.z, t <= SING_T.start);
        }, 0.85);
        // ⑤ 往白里飘的妈妈（单独蒙色：她已经飘出街上那一块了）；⑥ 碰到白以后从头顶往下一截截散成光点
        if (t > SING_T.start && !burnedOut(t)) {
          const r = singAt(t).root;
          const line = burnLine(t);
          g.save();
          if (line !== null) {
            g.beginPath();
            g.rect(r[0] - 3000, line, 6000, 9000);
            g.clip();
          }
          drawTinted(g, [r[0] - 600, r[1] - 1000, r[0] + 600, r[1] + 200], (gg) => drawSing5(gg, t, cam.z), 0.85);
          g.restore();
        }
        drawBits(g, t, cam.z);
        drawSnow(g, t, cam.z);
        drawDazzle(g, t);
      }
      // 退出窗时外面的空气（浮尘、白）跟着倍数淡进来（和⑧推进窗反过来）
      drawAir(g, cam, t, sh, skyLook(t), E.io(ph(cam.z, 2, 6)), ashFlash(t));
      // ⑥ 碰到白：一圈像肥皂泡边一样的彩色光炸开（画在最上面）
      if (t > ASH_T.touch - 0.02 && t < ASH_T.touch + 2) {
        const b = burstAt();
        drawBurst(g, base, cam, b[0], b[1], t - ASH_T.touch, 1.4);
      }
    } finally {
      setDusk(0);
    }
  };

  return {
    canvas,
    render(t) {
      // 间奏最后溶回现在：先画现在，再把回忆那一帧叠在上面越来越淡
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
      drawNight(ctx, t);
      // ④顺着掉下去的红绳甩到街上、⑤顺着视线往上甩：镜头竖着甩得很快，按 1/48 秒快门竖着拖一下
      const whip = (t > KNIFE_T.whip0 - 0.03 && t < KNIFE_T.land + 0.03) || (t > SING_T.start && t < SING_T.catch + 0.05);
      if (whip) smear(cam.z, camAt(t - 1 / 120), camAt(t + 1 / 120));
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
