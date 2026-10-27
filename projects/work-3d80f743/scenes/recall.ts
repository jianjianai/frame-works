// 终章第三声的回忆（图层 recall，offset = start：模块时间就是作品时间；时刻在 lib/end_t.ts 的 mem0…flip0）。
// 用户 2026-10-27：「这个镜头删除，全部替换成回忆。2:05.53放她抓住栏杆的近景」——他朝她喊完，「下」就溶进回忆，一直到 2:05.52（3 秒）：
//   他喊着的脸溶成七岁的她哭着的脸（同一个位置、同样大小）——十二年前同一条街，她穿着妈妈的大铁靴仰着头，忍着、忍不住了，
//   两只手伸上去哭着喊妈妈；镜头从她脸上拉开：上面是妈妈，光着脚，低头看着她含着泪笑，一只手伸下来够不着；
//   妈妈越飘越快出了画面，天上一亮（妈妈到了白里），灰落下来；一块小木牌从上面掉下来，镜头跟着它往下，拍上「咚」砸在她的铁靴跟前
//   （和副歌一⑧一样）——上面写着「活下去」，她吓一跳，低头看着它。拍上切回现在：她抓住栏杆的近景（finale.ts）。
// 他喊的「活下去」、妈妈丢下来的「活下去」、她写给自己的那块「活下去」是同一句话。
// （第一版：她在白的边上睁眼、一闪回忆 0.9 秒；第二版：她睁眼、溶进回忆 1.7 秒、白掉、回到她的脸；用户：「这个镜头删除，全部替换成回忆」）

import type { Scene, SceneOptions } from "@frame/engine/types";
import { castJoints } from "@materials/剪纸角色/code/cast";
import type { MoveKey, PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { type Cam, E, aim, applyCam, camLerp, kick, ph, toScreen, viewOf } from "../lib/cam";
import { drawGlow, drawStreet, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { makeStage } from "../lib/stage";
import { ZHONG_HOUSE, ZHONG_NEIGHBORS, pose } from "../lib/dawn";
import { drawHouse, drawHouseWindowFront } from "../lib/props";
import { KID, KID_OPTS, KID_POSES, KID_X, MAMA, memoryGrade, thenAt } from "../lib/memory";
import { BOARD, drawBoard } from "../lib/sign";
import { live } from "../lib/motion";
import { armL, armR, legL, legR } from "../lib/poses";
import { skyLook } from "../lib/sky";
import { drawPerson } from "../lib/people";
import { TE, type V2, breath } from "../lib/end_t";
import { chainCam } from "../lib/end_cam";
import { STONE, kidAt } from "../lib/end_pair";

/** 副歌一⑦的时间轴（只给妈妈的样子用：放慢一点，像想起来的样子） */
const tau = (t: number) => 58.25 + 0.9 * (t - TE.mem0);

// ——————————————— 七岁的她 ———————————————
/** 「咚」一下，低头看着脚边的木牌（和副歌一⑧一样） */
const 看牌 = pose(8, { face: 0.72, ...legR(6, -6), ...legL(-6, -4), neck: -34, expression: "含泪", sad: 0.9, tears: 0.9, lookX: 0.4, lookY: 1 }, (l) => ({
  ...armL(12, 20, 0, "relax", l),
  ...armR(26, 24, 0, "open", l),
}));
const KID_KEYS: MoveKey[] = [
  { t: TE.mem0 - 1, x: 0, p: KID_POSES.仰头 },
  // 仰着头忍着 → 忍不住了，两只手伸上去哭着喊妈妈
  { t: TE.memCry, p: KID_POSES.仰头 },
  { t: TE.memCry + 0.45, ease: "inOut", p: KID_POSES.够 },
  // 木牌「咚」砸在跟前：吓一跳，低头看着它
  { t: TE.memLand - 0.02, p: KID_POSES.够 },
  { t: TE.memLand + 0.1, ease: "out", p: { ...看牌, expression: "吓一跳", neck: -18, lookY: 0.8 } },
  { t: TE.memLand + 0.36, ease: "inOut", p: 看牌 },
  { t: TE.flip0 + 1, p: 看牌 },
] as MoveKey[];
const kidMove = live(KID_KEYS, KID_OPTS);
function kidNow(t: number) {
  const p = kidMove(t).pose;
  const j = castJoints(KID, p);
  return { pose: p, head: [KID_X + j.head[0], j.head[1]] as V2 };
}

// ——————————————— 妈妈、木牌 ———————————————
/** 妈妈的根（光着的脚底）：比副歌一⑦离她近（脚底离她伸上去的手不到一人高），低头看着她不动；memUp 起越飘越快，出了画面 */
function mamaRoot(t: number): V2 {
  const s = Math.max(0, t - TE.memUp);
  return [-2250 + 30 * Math.sin(tau(t) * 0.9), -600 - 25 * (t - TE.mem0) - 1500 * s * s];
}
/** 木牌落地以后靠在她前面那只铁靴上（同副歌一⑧） */
const LEAN = -0.2;
const LAND: V2 = [KID_X + 72, -((BOARD.h / 2) * Math.cos(LEAN) + (BOARD.w / 2) * Math.sin(-LEAN))];
const DROP_Y = -1320;
/** 木牌：从画面上面掉进来（已经在往下掉，越掉越快），转一圈，拍上砸在靴子跟前弹一下、靠在靴子上 */
function boardAt(t: number): { c: V2; rot: number } | null {
  if (t < TE.memDrop) return null;
  if (t < TE.memLand) {
    const D = TE.memLand - TE.memDrop;
    const s = t - TE.memDrop;
    const v0 = 900;
    const a = (2 * (LAND[1] - DROP_Y - v0 * D)) / (D * D);
    const u = s / D;
    return { c: [-2300 + (LAND[0] + 2300) * u, DROP_Y + v0 * s + 0.5 * a * s * s], rot: 0.5 + (LEAN - 2 * Math.PI - 0.5) * u };
  }
  const u = ph(t, TE.memLand, TE.memLand + 0.2);
  const hop = 14 * Math.sin(Math.PI * u) * (1 - u * 0.3);
  return { c: [LAND[0] + 4 * Math.sin(Math.PI * u), LAND[1] - hop], rot: LEAN + 0.16 * Math.sin(Math.PI * u) };
}
/** 妈妈到了白里以后落下来的灰：从上往下一层层显出来，慢慢飘落 */
const ASH = (() => {
  const r = seeded(91);
  return Array.from({ length: 90 }, () => ({ x: KID_X - 520 + r() * 1040, y: -1320 + r() * 1300, v: 40 + r() * 50, s: 3 + r() * 4, ph: r() * 6.28, glow: r() < 0.3 }));
})();

// ——————————————— 镜头 ———————————————
/** 他、七岁的她的头比大人小多少（素材库：小石头 0.6 × 1.42，七岁的秤砣 0.58 × 1.42） */
const BOY_HEAD = STONE.scale * (STONE.headScale ?? 1);
const KID_HEAD = KID.scale * (KID.headScale ?? 1);
/** 溶进来的那一刻：他喊着的脸在画面上哪、多大，七岁的她哭着的脸就在哪、多大 */
function matchCam(t: number): Cam {
  const n = chainCam(t);
  const b = kidAt(t).head;
  const s = toScreen(n, b[0], b[1]);
  const kh = kidNow(t).head;
  return aim(kh[0], kh[1], s[0], s[1], (n.z * BOY_HEAD) / KID_HEAD);
}
/** 拉开以后：上面是妈妈（低头含着泪笑，一只手伸下来），下面是穿着大铁靴、两只手伸上去哭着喊的她，中间空着够不着的那一截 */
const WIDE: Cam = aim(-2360, -695, 540, 800, 1.45);
/** 跟着木牌落下去，停在她（低头看着）和她跟前的木牌（「活下去」）身上 */
const LOW: Cam = aim(-2395, -175, 540, 1000, 2.35);
function recallCam(t: number): Cam {
  const m = TE.mem0 + 0.24;
  let c = matchCam(Math.min(t, m));
  // 溶完先停在她脸上（她忍着、忍不住了），再柔和起步、越拉越慢地拉开
  c = camLerp(c, WIDE, E.settle(ph(t, TE.memPull0, TE.memPull1)));
  // 妈妈飘走以后木牌掉下来：镜头跟着它往下、推近一点，它落地时正好停在她和木牌身上
  c = camLerp(c, LOW, E.io(ph(t, TE.memDrop - 0.05, TE.memLand + 0.12)));
  // 「咚」一震，之后极慢地再凑一点
  const kk = kick(t, TE.memLand, 0.1);
  c = { ...c, z: c.z * (1 + 0.035 * kk + 0.03 * ph(t, TE.memLand, TE.flip0)), y: c.y + (7 * kk * Math.sin(t * 57)) / c.z };
  const [bx, by] = breath(t, 1.4);
  return { ...c, x: c.x + bx / c.z, y: c.y + by / c.z };
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir } = makeStage(base, grain, ZHONG_NEIGHBORS);

  /** 十二年前的两个人：妈妈在上面（身后一团光），七岁的她站在街上；木牌、落地扬起的灰 */
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number) => {
    const mr = mamaRoot(t);
    if (mr[1] > -2200) {
      // 妈妈近处那只手伸下来够她（够不着）
      const m = thenAt(tau(t)).mama.pose;
      const mp: PoseIn = { ...m, armL: { ...(m.armL as object), to: [-150, -250], ik: 1 } as PoseIn["armL"] };
      const mj = castJoints(MAMA, mp);
      drawGlow(g, mr[0] + (mj.shoulderL[0] + mj.shoulderR[0]) / 2, mr[1] + mj.shoulderL[1] + 40, 340, 0.35);
      drawPerson(g, MAMA, mp, mr[0], mr[1], z);
    }
    g.save();
    g.fillStyle = "rgba(96,62,70,0.22)";
    g.beginPath();
    g.ellipse(KID_X + 10, 6, 120, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    drawPerson(g, KID, kidNow(t).pose, KID_X, 0, z);
    const b = boardAt(t);
    if (b) drawBoard(g, b.c, b.rot, 62.5, z);
    // 砸下去扬起的一小团灰
    const d = t - TE.memLand;
    if (d > 0 && d < 0.6) {
      const r = seeded(84);
      g.save();
      for (let i = 0; i < 7; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const sp = 60 + r() * 90;
        g.globalAlpha = 0.4 * (1 - d / 0.6);
        g.fillStyle = "#cdb9a4";
        g.beginPath();
        g.arc(LAND[0] + dir * (8 + sp * (1 - Math.exp(-d / 0.18))), -4 - (10 + r() * 22) * (1 - Math.exp(-d / 0.2)), 7 + r() * 8 + 26 * d, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  };
  /** 妈妈到了白里：灰从上往下一层层显出来，慢慢飘落 */
  const drawAsh = (g: CanvasRenderingContext2D, t: number, z: number) => {
    const d = t - TE.memFlash;
    if (d < 0.05) return;
    g.save();
    for (const f of ASH) {
      const delay = 0.05 + ((f.y + 1320) / 1300) * 0.5;
      const a = Math.min(1, Math.max(0, (d - delay) / 0.3));
      if (a <= 0) continue;
      const tw = 0.7 + 0.3 * Math.sin(t * 4 + f.ph * 3);
      g.globalAlpha = a * tw * 0.85;
      g.fillStyle = f.glow ? "#f6ead8" : "#b49eb2";
      g.beginPath();
      g.arc(f.x + 20 * Math.sin(t * 1.3 + f.ph), f.y + f.v * (d - delay), Math.max(1.6 / z, f.s), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  };
  /** 天上一亮：从画面顶上照下来的一片白（同副歌一⑧） */
  const flash = (t: number) => {
    const d = t - TE.memFlash;
    const a = d < 0 ? 0 : 0.5 * Math.min(1, d / 0.05) * Math.exp(-d / 0.34);
    if (a < 0.005) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const gr = ctx.createLinearGradient(0, 0, 0, height * 0.85);
    gr.addColorStop(0, `rgba(255,248,234,${a})`);
    gr.addColorStop(1, "rgba(255,248,234,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `rgba(255,248,234,${a * 0.22})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };
  /** 像隔着一层水汽：糊一点的一层叠上去（screen），亮处发柔 */
  const soften = () => {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${Math.max(1, Math.round((7 * width) / 1080))}px)`;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.24;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  };

  return {
    canvas,
    render(t) {
      const ta = tau(t);
      const cam = recallCam(t);
      setDusk(0);
      try {
        drawWorld(ctx, cam, ta, [0, 0], undefined, 0);
        applyCam(ctx, base, cam, 1);
        const v = viewOf(cam, 1);
        const H_ = ZHONG_HOUSE;
        if (H_.x0 < v.x1 + 200 && H_.x1 > v.x0 - 200 && v.y1 > H_.top - 300) {
          drawHouse(ctx, H_, ta);
          drawHouseWindowFront(ctx, H_);
        }
        if (v.y1 > -400) drawStreet(ctx, cam);
        applyCam(ctx, base, cam, 1);
        drawPeople(ctx, t, cam.z);
        drawAir(ctx, cam, ta, [0, 0], skyLook(ta), 0, 0);
        applyCam(ctx, base, cam, 1);
        drawAsh(ctx, t, cam.z);
        flash(t);
        memoryGrade(ctx, base, 1);
        soften();
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
