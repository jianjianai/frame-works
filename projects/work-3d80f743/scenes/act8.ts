// 副歌二 + 静（95.513–113.88），2026-10-25 重做（用户：「1:34.92~2:32.00 拉完了需要全部重做，参考按照草稿的时间点和表现手段……
// 这段是全片情绪的最高点」）。时间点照草稿（3d80f743 的 chorus2.ts），时刻在 lib/fin_t.ts（作品时间；图层 offset = start）。
//   95.513「就请你」：天快亮，仰头看天花板上的两张床——他那张空了；她的手在床缝上攥了一下（空的），睁开眼，扭头看见空床，扑起来（镜头冲向她）。
//   96.263「咚」她跺进铁靴（画外）：窗外，她那扇窗一震；96.33「哐」铁栅栏门被撞开；镜头顺着她的视线沿着楼墙一路往下扎——
//   97.25 街上：他光着脚踮着，把「妈妈，明天见」举过头顶朝着白，他妈妈那件外套堆在脚边；97.40 脚离了地，越飘越快；
//   97.72 镜头顺着楼墙甩回她的窗口：她扑出去，头朝下往下冲；镜头把两个人都框住，越近推得越近，99.013 在楼的一半一把抱住他（暖光炸开）；
//   惯性带着两个人往下坠，越坠越慢，100.263 停住——她的靴底离他妈妈那件外套只差一点；又开始往上飘，风把两个人往右带，
//   两边窗里的人看着他们，一个接一个拉上窗帘、关了灯（每半拍一扇）；101.91 她看看他，看看自己的铁靴：
//   一只、再一只拔下来，套在他脚上；103.5 松手，他带着铁靴往下坠，104.013「咚」落在街上；她那块「活下去」从靴口震出来——
//   近景：他捡起来捧到眼前，翻过来是她的字，两滴眼泪砸在字上；他抬起头，镜头顺着他的视线甩上去：她光着脚往上升，穿过网，
//   106.95 低头冲他笑；107.55 顺着她的视线落回去：穿着她的大铁靴仰着头的他（和十二年前七岁的她同一个构图，叠一下那一格）；
//   109.55 再顺着他的视线甩上去：她升过最高那栋楼的楼顶，升进光里。
//   112.013 静：老钟端着茶杯在窗后等不到她的脚步声。112.9 白的边上（和全片第一帧同一个构图）：她闭着眼张开手，发梢化成光，
//   白里妈妈朝她张开手；113.3 她把手伸过去——113.62 一片白（下一镜的「咚」从白里砸出来）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, W, H, applyCam, clamp01, ph, shake, toScreen, viewOf, E } from "../lib/cam";
import { drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { setCage, setHomeLamp } from "../lib/night";
import { drawCeiling } from "../lib/bed";
import { ZHONG_NEIGHBORS } from "../lib/dawn";
import { drawNet4Far } from "../lib/brick6";
import { T8, lerp, win } from "../lib/fin_t";
import { K_LAND, drawHer, drawKid, herAt, herChest, holding, kidAt } from "../lib/fin_cast";
import { camKick, camOut, ceilCam, ceilCast, edgeCam, rushBlur, zhongCam } from "../lib/fin_cam8";
import { drawBrickTears, drawCoatHeap, drawDiveLines, drawFloatTears, drawHairLight, drawKidGlow, drawLandBurst, drawMama, drawShutters, mamaRootOf } from "../lib/fin_world";
import { drawFinNet, drawFinNetFront } from "../lib/fin_net";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { figurePose } from "@materials/剪纸角色/code/chengtuo";
import { drawPerson } from "../lib/people";
import { armL, armR, legL, legR } from "../lib/poses";
import { pose } from "../lib/dawn";
import { mirrorCam } from "../lib/fin_cam8";
import { drawZhongHouse } from "../lib/fin_zhong";

/** 铁栅栏门转到哪（1 关上，−0.32 往左开着）：「哐」一下甩开、撞到墙上弹回来一点 */
function cageAt(t: number) {
  const d = t - T8.cage;
  if (d <= 0) return 1;
  if (d < 0.07) return 1 - 1.5 * E.out(d / 0.07);
  return -0.32 - 0.18 * Math.exp(-(d - 0.07) / 0.06) * Math.cos((d - 0.07) * 40);
}
const STONE_SPEC = { ...CAST.小石头, coat: undefined };
/** 十二年前七岁的她（和副歌一⑦回忆里一样：仰着头，两只手伸上去够，哭着喊她） */
const PAST_KID = CAST.小时候的秤砣;
const PAST_POSE = figurePose(
  pose(-6, { face: -0.72, ...legR(8, -6), ...legL(-6, -4), neck: 34, expression: "仰望", sad: 0.85, tears: 0.9, open: 0.3, blush: 0.6, lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(130, 24, 0, "open", l),
    ...armR(160, 16, 0, "open", l),
  })),
  0,
  lookOf(PAST_KID),
);
/** 天色：天快亮（0.5，还有几扇窗亮着）→ 越来越亮（静的时候太阳快出来了） */
const duskAt = (t: number): [number, number] => {
  const u = E.io(ph(t, 99, 113.8));
  return [0.5 - 0.16 * u, 0.35 - 0.2 * u];
};

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir } = makeStage(base, grain, ZHONG_NEIGHBORS);
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const mamaCv = { c: null as HTMLCanvasElement | null };
  /** 竖着的拖影：把这一帧拷一份，上下错开叠几层（人画在拖影后面，保持清楚） */
  const smearV = (dy: number) => {
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
  /** 放射模糊（冲向她）：以画面上的一点为中心放大叠几层 */
  const zoomBlur = (cx: number, cy: number, k: number) => {
    if (k < 0.01) return;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    const n = 8;
    const sx = (cx * width) / W;
    const sy = (cy * height) / H;
    for (let i = 1; i < n; i++) {
      const s = 1 + (0.14 * k * i) / (n - 1);
      ctx.globalAlpha = 1 / (i + 1);
      ctx.setTransform(s, 0, 0, s, sx - s * sx, sy - s * sy);
      ctx.drawImage(buf, 0, 0);
    }
    ctx.restore();
  };
  const white = (a: number) => {
    if (a <= 0.003) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  /** 回忆的颜色（淡、旧：一层暖的米色把对比压下去、往旧照片的褐色上拉、四角暗一点），和副歌一⑦一样 */
  const pastGrade = (k: number) => {
    ctx.save();
    ctx.setTransform(base);
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = `rgba(196,158,120,${0.38 * k})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(250,236,214,${0.2 * k})`;
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.75);
    v.addColorStop(0, "rgba(80,52,44,0)");
    v.addColorStop(1, `rgba(80,52,44,${0.32 * k})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  /** 天花板那一镜：她醒来，他那张床空了 */
  const renderCeiling = (t: number) => {
    const cam = ceilCam(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1c1820";
    ctx.fillRect(0, 0, width, height);
    drawCeiling(ctx, base, t, cam, ceilCast(t));
    setDusk(1, 1);
    drawAir(ctx, cam, t, [0, 0], skyLook(t), 1);
    setDusk(0);
    const [fx, fy] = toScreen(cam, -175, -318);
    zoomBlur(fx, fy, rushBlur(t));
    // 冲到最后一下：窗外的白光迎面压过来（切到窗外）
    white(0.6 * E.in2(ph(t, T8.out - 0.1, T8.out)));
  };

  /** 窗外的一镜到底（96.263–112.0） */
  const renderOut = (t: number) => {
    const past = win(t, T8.mirror, T8.mirror + 0.12, T8.mirror + 0.48, T8.mirror + 0.66);
    const c0 = camOut(t);
    const kk = camKick(t);
    const cam: Cam = { ...c0, z: c0.z * kk.z };
    const sh = shake(t, kk.sh);
    setDusk(...duskAt(t));
    setHomeLamp(0);
    setCage(cageAt(t));
    drawWorld(ctx, cam, t, sh, (D) => drawNet4Far(ctx, t, D, cam.z), clamp01((0.62 - cam.z) / 0.3));
    applyCam(ctx, base, cam, 1, sh);
    drawZhongHouse(ctx, t, cam);
    if (viewOf(cam, 1).y1 > -400) drawStreet(ctx, cam);
    const pair = herChest(t);
    drawShutters(ctx, t, pair);
    // 甩镜、往下冲的时候背景竖着拖影（按镜头这一帧在画面上走了多少），人画在拖影后面
    const cp = camOut(t - 1 / 60);
    const dy = (c0.y - cp.y) * c0.z + Math.log(c0.z / cp.z) * 400;
    if (Math.abs(dy) > 4 && t < T8.land) smearV(dy * 0.9);
    applyCam(ctx, base, cam, 1, sh);
    const z = cam.z;
    // 地上：他妈妈那件外套
    if (viewOf(cam, 1).y1 > -200) drawTinted(ctx, [-3560, -120, -3200, 40], (gg) => drawCoatHeap(gg, t, 1 / Math.sqrt(Math.max(0.3, z))), 0.85);
    // 他身上那团暖光（往上飘的人，远看像一盏灯；抱住时炸开）
    const k = kidAt(t);
    drawKidGlow(ctx, t, k.chest, z);
    if (t < T8.catch) {
      drawTinted(ctx, [k.root[0] - 420, k.root[1] - 640, k.root[0] + 420, k.root[1] + 140], (gg) => drawKid(gg, t, z), 0.85);
      if (t >= 97.84) {
        const c = herChest(t);
        drawDiveLines(ctx, t, c, z);
        drawTinted(ctx, [c[0] - 640, c[1] - 700, c[0] + 640, c[1] + 700], (gg) => drawHer(gg, t, z), 0.85);
      }
    } else if (holding(t)) {
      const c = herChest(t);
      drawTinted(ctx, [c[0] - 640, c[1] - 680, c[0] + 640, c[1] + 760], (gg) => drawHer(gg, t, z, (cc) => drawKid(cc, t, z)), 0.85);
    } else {
      // 松了手：她（往上飘）画在后面，他（往下坠、落地）在前面；网里的人在她后面，她从红绳后面升过去
      drawFinNet(ctx, t, cam);
      const c = herChest(t);
      if (c[1] + 700 > viewOf(cam, 1).y0 && c[1] - 700 < viewOf(cam, 1).y1) drawTinted(ctx, [c[0] - 640, c[1] - 700, c[0] + 640, c[1] + 700], (gg) => drawHer(gg, t, z), 0.85);
      drawFinNetFront(ctx, t, cam);
      // 构图 A：叠一下十二年前那一格——他在的地方换成七岁的她（穿着妈妈的大铁靴，也是这样仰着头伸着手），再换回来
      if (past > 0.01) {
        ctx.save();
        ctx.globalAlpha = past;
        drawTinted(ctx, [K_LAND[0] - 420, -720, K_LAND[0] + 420, 120], (gg) => drawPerson(gg, PAST_KID, PAST_POSE, K_LAND[0] - 8, 0, z), 0.85);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 1 - past;
      if (past < 0.99 && k.root[1] - 700 < viewOf(cam, 1).y1 && k.root[1] + 200 > viewOf(cam, 1).y0)
        drawTinted(ctx, [K_LAND[0] - 520, k.root[1] - 680, K_LAND[0] + 520, Math.max(k.root[1] + 200, 160)], (gg) => {
          drawKid(gg, t, z);
          drawLandBurst(gg, t, K_LAND[0] - 10, T8.land, z);
          // 手捧着她的砖：两滴眼泪砸在字上
          if (k.her && t > T8.tears[0] - 0.35) {
            const j = castJoints(STONE_SPEC, k.pose);
            drawBrickTears(gg, t, [k.root[0] + j.head[0] - 10, k.root[1] + j.head[1] + 14], k.her, z);
          }
        }, 0.85);
      ctx.restore();
    }
    drawAir(ctx, cam, t, sh, skyLook(t), 0, 0.25 * Math.exp(-Math.max(0, t - T8.catch) / 0.18) * (t >= T8.catch ? 1 : 0));
    // 构图 A：叠一下十二年前那一格（回忆的颜色压上来）
    if (past > 0.01) pastGrade(past);
    // 她升进刺眼的光里
    white(E.io(ph(t, T8.glare, T8.silent)));
  };

  /** 静：老钟端着茶杯在窗后等不到她的脚步声 */
  const renderZhong = (t: number) => {
    const cam = zhongCam(t);
    setDusk(...duskAt(t));
    drawWorld(ctx, cam, t, [0, 0]);
    applyCam(ctx, base, cam, 1);
    drawZhongHouse(ctx, t, cam);
    drawAir(ctx, cam, t, [0, 0], { vig: 0.3, warm: 0.8 }, 0, 0);
    // 从一片白里淡出来
    white(1 - E.out(ph(t, T8.silent, T8.silent + 0.3)));
  };

  /** 静：白的边上（和全片第一帧同一个构图） */
  const renderEdge = (t: number) => {
    const cam = edgeCam(t);
    setDusk(...duskAt(t));
    drawWorld(ctx, cam, t, [0, 0], (D) => drawNet4Far(ctx, t, D, cam.z), clamp01((0.62 - cam.z) / 0.3));
    applyCam(ctx, base, cam, 1);
    const z = cam.z;
    const c = herChest(t);
    drawTinted(ctx, [c[0] - 640, c[1] - 700, c[0] + 640, c[1] + 700], (gg) => drawHer(gg, t, z), 0.85);
    drawAir(ctx, cam, t, [0, 0], skyLook(t), 0, 0.2 * Math.exp(-(t - T8.edge) / 0.25));
    applyCam(ctx, base, cam, 1);
    // 白里的妈妈朝她张开手（画在白上面，淡淡的）
    drawMama(ctx, t, mamaRootOf(c), z, E.io(ph(t, T8.edge + 0.12, T8.edge + 0.6)), mamaCv);
    applyCam(ctx, base, cam, 1);
    drawHairLight(ctx, t, T8.edge, 1e9);
    drawFloatTears(ctx, t, T8.edge, T8.end);
    // 从老钟那一镜溶过来；最后一片白
    white(Math.max(1 - E.out(ph(t, T8.edge, T8.edge + 0.25)), E.in2(ph(t, T8.flash, T8.end))));
  };

  return {
    canvas,
    render(t) {
      try {
        if (t < T8.out) renderCeiling(t);
        else if (t < T8.silent) renderOut(t);
        else if (t < T8.edge) renderZhong(t);
        else renderEdge(t);
      } finally {
        setDusk(0);
        setHomeLamp(null);
        setCage(-0.32);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
void win;
void lerp;
void herAt;
