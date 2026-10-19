// 第一幕「最沉的人」（0–16 秒，就是前奏的 8 小节：介绍这个世界和主角），暖光老城区画风（样张 sheets/画风.ts）。
// 前 4 小节没有鼓：从化成灰到递砖要一口气做完；第 5 小节（8 秒）鼓进来的那一拍砖刚好递完、亮起来，她站起来往前走（一步一拍）。
// 每一段先定情绪，再定镜头（经验库「情绪运镜」）；镜头每次动都跟着画面里的东西（人、视线、掉下来的东西），推和拉之间隔得开、不歪、不变速：
//   ① 天上（屏息 → 被光推开）：光里的女人张着手、闭着眼笑，身后远远还有人在往上飘，楼顶一角；头发碰到白化成光和灰，镜头被推开，猛地往下甩。
//   ② 他（紧张）：甩到街上落在周磊身上，镜头一动不动，他在画面里往上飘；他闭上眼，手指松开，公文包滑到指尖。路人在对面楼前低头走过。
//   ③ 她（登场：急、决绝）：第 5 拍切到贴地狂奔的铁靴，跟着跑抬起来露出整个人，镜头和她一样快，路灯杆从镜头前一闪而过。
//   ④ 险：她跑完、刹住、抬头盯着掉下来的公文包；切到公文包的近景（不动），它从画面上面掉进来（地上的影子越落越实），
//      砸在靴尖跟前，她一缩。
//   ⑤ 救：不切，镜头从近景往上退开到地上的她和头顶老高的他；她抬头、一蹲、跳起来攥住他，镜头跟着两个人（晚一点跟），拽回地面，
//      落地画面往下一沉。「城里都说，她是最沉的人」在她把人拽回地面以后上。
//   ⑥ 交出一样重要的东西（不切）：镜头顺着两个人落下来，落定就直接往里推，推镜的中心是递砖的那一点（只推、不横移），
//      砖落进他手里时越推越慢。
//   ⑦ 鼓点：砖亮起来，镜头一顶、往后舒一口气，她站起来，镜头跟着她往上；她从他身后走过，低头冲他笑。
//   ⑧ 打招呼：她抬头看见窗里的老钟，镜头顺着视线挤到两个人中间，她越走越近、镜头越推越近；老钟举杯，她挥手。
//   ⑨ 小石头：镜头往左带去接跑过来的他，收成窗里的老钟、小石头、她三个人，慢慢推近；她不停，边走边摸他的头，接着往前走。平静的段落镜头像手持一样轻轻呼吸。
//   ⑩ 镜头升起来拉出全城：一开始就看得出在慢慢升（余韵），越拉越快，满天往上飘的人一拍一个被白吸进去，16 秒停稳。
// 场景：人脚下有影子；近景一层（路灯杆、花箱、自行车）让镜头动的时候有纵深；老钟家墙上有壁灯、信箱、空调外机、晾衣杆、爬藤。
// 姿势全部在 lib/poses.ts 里按关节角度写（不用素材库的动作预设），检查页 sheets/前奏姿势.ts。
// 站、停、跪一律远处那条腿（R）在前（朝左时画面左边的脚在前）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { beatAt } from "@frame/engine/tempo";
import { seeded } from "@frame/engine/math";
import { CAST, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import {
  type Angles,
  type HoldFn,
  type MoveKey,
  type PoseIn,
  CHENGTUO,
  drawBrickShape,
  drawChengtuo,
  figurePose,
  jointsOf,
  swapSides,
} from "@materials/剪纸角色/code/chengtuo";
import type { Ink } from "@materials/剪纸角色/code/rig";
import { type Cam, E, H, W, aim, applyCam, camLerp, clamp01, kick, ph, shake, toScreen, viewOf } from "../lib/cam";
import { INK, TOWER, Y_WHITE, drawBlock, drawBurst, drawCity, drawGrade, drawMotes, drawSilhouette, drawSky, drawStreet, drawSunbeams, drawWhite, makeGrain, part, whiteEdge } from "../lib/world";
import { type Note, HAND_FONT, drawNote, loadHandFont } from "../lib/note";
import { type Walker, drawPerson, walkerAt } from "../lib/people";
import { type Num, ARMS, LIMP, SMOOTH, fade, hitch, live, ring, smoothTrack, withDrag } from "../lib/motion";
import { CHEN, KID, WAVE_R, ZHONG, ZHOU as ZP, armL, armR, legL, legR } from "../lib/poses";

const ZHOU = CAST.周磊;
const WOMAN = CAST.光里的女人;
const STONE = CAST.小石头;
const OLD = CAST.老钟;
/** 公文包往下掉的加速度（世界单位 / 秒²；人 590 高 ≈ 1.7 米）。比真实重力大一倍：掉得快、砸得狠（用户 2026-10-19：「公文包落地速度加快」） */
const G = 6800;
/** 公文包：宽、高、盖子那一截多高 */
const CASE = { w: 150, h: 104, lid: 26 };
/** 她跑过来刹住、停稳的位置（根）；公文包落在她靴尖前面 */
const X_STOP = 330;
// 差点砸到她（用户 2026-10-19：「公文包掉落差点砸到主角没有体现」）：刹住时前脚伸得远、靴尖在根前面约 180，远处的手被甩在身前约 157；
// 公文包的右边擦着手落下、砸在靴尖跟前（右边在根前面 185），她一惊、上身往后一仰、手缩回来，脚还扎在原地
const X_LAND = X_STOP - 185 - CASE.w / 2;
/** 她越过公文包跃起、落地，一共往左挪多少 */
const LEAP = 600;
/** 光里的女人 */
const WX = 200;
/** 满天往上飘的人画多大（离得远） */
const CROWD_K = 0.38;
/** 风：往画面右边吹（她朝左，头发、围巾往后飘，不糊在脸上），天上大一点；头发、围巾按素材库的 4 秒循环一阵一阵地飘 */
const WIND = 0.85;
const WIND_SKY = 1.1;
/** 老钟家：一楼窗户（窗框里是亮着灯的屋子，老钟站在窗后） */
const HOUSE = { x0: -1500, x1: -700, top: -1480 };
const WIN = { x: -1020, w: 330, sill: -300, top: -660 };
/** 老钟的窗放在她举手打招呼时前面（左边）多远 */
const WIN_AHEAD = 560;

type V2 = [number, number];

function timeline() {
  const b = beatAt;
  const launch = b(9) + 0.2;
  return {
    burn: b(1),
    /** 化成灰以后镜头开始往下甩 */
    // 甩得快一点（0.28 秒），落到他身上也快（0.25 秒）：把时间留给观众看他往上飘（用户 2026-10-19）
    whip: b(2) + 0.22,
    /** 切到街上（他） */
    cut: b(3),
    /** 切到她：跟着她跑 */
    her: b(5),
    /** 公文包砸地、她刹住 */
    slam: b(8),
    drop: 3.4,
    launch,
    /** 空中攥住他的脚踝（跳到最高，第 10 拍） */
    grab: b(10),
    /** 两个人一起落地 */
    land: b(11),
    kneel: b(12) + 0.05,
    /** 砖从靴筒里抽出来、递到他手边、落进他手里 */
    // 给砖给得快（用户 2026-10-19：「让主角给砖快一点，让砖头早点发光」）：跪下就掏，第 14 拍砖落进他手里、亮起来
    pull: b(12.5) + 0.05,
    give: b(13.5) - 0.05,
    take: b(14),
    /** 鼓进来（第 5 小节）：砖亮起来，她站起来 */
    drum: b(16),
    laugh: b(18),
    rise: b(16),
    /** 往前走：第一步（L）落地，一步一拍 */
    walk0: b(17),
    zhong: b(19),
    /** 最后一步（R）落地、停住 */
    stop: b(22),
    kidStop: b(23),
    pat: b(23) + 0.3,
    r0: b(26),
    r1: b(31),
    end: b(32),
    beat: (k: number) => b(k),
  };
}

// ——— 光里的女人：张着手、闭着眼笑，眼泪往上飘 ———
// 失重只给 0.2：这个角色的长发失重到 0.3 以上就画成一根根竖起的尖（像刺猬），0–0.2 是垂着、被风往一边带的长发
const WOMAN_POSE: Angles = {
  face: -0.5,
  float: 0.2,
  ground: false,
  neck: 24,
  lean: -4,
  rot: 4,
  shoulderL: -128,
  elbowL: -14,
  wristL: -10,
  handL: "open",
  shoulderR: 122,
  elbowR: 16,
  wristR: 10,
  handR: "open",
  ...legL(-10, -26, -60),
  ...legR(8, -36, -60),
  expression: "哭着笑",
  blink: 1,
  tears: 1,
};
const FLOAT_POSE: Angles = { face: -0.2, float: 0.2, ground: false, neck: 18, rot: 8, shoulderL: -110, elbowL: -20, handL: "open", shoulderR: 104, elbowR: 22, handR: "open", ...legL(-6, -30, -60), ...legR(6, -40, -60), expression: "闭眼", sad: 0.7 };

/**
 * 一块写着「活下去」的砖（拿在手里画；托着 / 提着两种拿法和素材库的 holdBrick 一样），warm 0..1 暖起来。
 * 托着（掌心朝上）时放进 late，等两个人都画完再画：递砖时两只手叠在一起，砖不能被另一个人的手挡住。
 */
function brickHold(warm: () => number, at: { p: V2 | null }, late: (() => void)[]): HoldFn {
  return (ctx, hand, _mir, info) => {
    const present = info.shape === "flat";
    if (present !== (info.layer === "front")) return;
    if (present) {
      const m = ctx.getTransform();
      late.push(() => {
        ctx.save();
        ctx.setTransform(m);
        drawBrick(ctx, hand, info.sx, true, warm, at);
        ctx.restore();
      });
    } else drawBrick(ctx, hand, info.sx, false, warm, at);
  };
}

function drawBrick(ctx: CanvasRenderingContext2D, hand: Parameters<HoldFn>[1], sx: number, present: boolean, warm: () => number, at: { p: V2 | null }) {
  const f = present ? hand.child(-9.5 * sx, 30, (-Math.PI / 2) * sx) : hand.child(2.5 * sx, 56, 0);
  const w = warm();
  const mixc = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * w)).join(",")})`;
  const ink: Ink = { line: INK, lw: 3, shade: [3, 3] };
  drawBrickShape(ctx, f, 36, 27, ink, mixc([203, 198, 189], [250, 208, 150]), mixc([178, 173, 164], [230, 172, 108]));
  // 字：按画面方向写正（人朝右时整个人是镜像画的）
  const m = ctx.getTransform();
  const P = (p: V2): V2 => {
    const q = m.transformPoint(new DOMPoint(p[0], p[1]));
    return [q.x, q.y];
  };
  const a = P(f.p(-18, -13.5));
  const b = P(f.p(18, -13.5));
  const c = P(f.p(0, -13.5));
  const top = P(f.p(0, -27));
  let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (ang > Math.PI / 2) ang -= Math.PI;
  if (ang < -Math.PI / 2) ang += Math.PI;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const hgt = Math.hypot(top[0] - c[0], top[1] - c[1]) * 2;
  at.p = c;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(c[0], c[1]);
  ctx.rotate(ang);
  ctx.font = `${Math.max(4, hgt * 0.62)}px ${HAND_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.fillText("活下去", 0, hgt * 0.04, len * 0.86);
  ctx.restore();
}

/** 老钟手里的茶杯（攥着：杯子在手掌里，杯口朝上），冒一缕热气 */
const cupHold: HoldFn = (ctx, hand, _mir, info) => {
  if (info.layer !== "front") return;
  const f = hand.child(-6 * info.sx, 24, 0);
  ctx.save();
  const m = ctx.getTransform();
  const o = m.transformPoint(new DOMPoint(f.p(0, 0)[0], f.p(0, 0)[1]));
  const k = Math.hypot(m.a, m.b);
  ctx.setTransform(k, 0, 0, k, o.x, o.y);
  const cup = new Path2D();
  cup.moveTo(-17, -24);
  cup.lineTo(17, -24);
  cup.lineTo(13, 14);
  cup.quadraticCurveTo(0, 20, -13, 14);
  cup.closePath();
  part(ctx, cup, "#f4f0e8", "#ddd6ca", 3, [3, 3]);
  part(ctx, (() => {
    const p = new Path2D();
    p.rect(-16, -10, 32, 7);
    return p;
  })(), "#7aa0b8", null, 0);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -32);
  ctx.bezierCurveTo(-12, -46, 6, -54, -2, -70);
  ctx.stroke();
  ctx.restore();
};

/** 公文包：棕色皮面、上面一个提手、两个铜锁扣；open（弧度）> 0 时盖子从后面那条边掀开，露出里面的文件 */
function drawBriefcase(g: CanvasRenderingContext2D, x: number, y: number, rot: number, open = 0) {
  const { w, h, lid } = CASE;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const top = -h / 2;
  const seam = top + lid;
  // 箱体（盖子下面那一截）
  const body = new Path2D();
  body.roundRect(-w / 2, seam - 4, w, h / 2 - seam + 4, [4, 4, 12, 12]);
  part(g, body, "#7a4b2e", "#663c23", 3, [5, 5]);
  if (open > 0.01) {
    // 掀开的口子：里面露出一沓白纸
    g.fillStyle = "#3b261a";
    g.fillRect(-w / 2 + 6, seam - 6, w - 12, 8);
    g.fillStyle = "#f3efe6";
    g.fillRect(-w / 2 + 14, seam - 12 - 8 * open, w - 40, 10);
  }
  // 盖子（绕后面那条边转开）
  g.save();
  g.translate(w / 2, seam);
  g.rotate(-open);
  g.translate(-w / 2, -seam);
  const handle = new Path2D();
  handle.moveTo(-26, top + 2);
  handle.lineTo(-24, top - 16);
  handle.quadraticCurveTo(0, top - 30, 24, top - 16);
  handle.lineTo(26, top + 2);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.stroke(handle);
  g.strokeStyle = "#5b3a26";
  g.lineWidth = 6;
  g.stroke(handle);
  const lidP = new Path2D();
  lidP.roundRect(-w / 2, top, w, lid, [12, 12, 4, 4]);
  part(g, lidP, "#865535", "#704428", 3, [4, 4]);
  // 锁扣
  for (const cx of [-w * 0.3, w * 0.3]) part(g, rectPath(cx - 9, seam - 8, 18, 14), "#d9b25e", "#c29a48", 2.4, [2, 2]);
  g.restore();
  g.restore();
}

/**
 * 近景（离镜头比人更近的一层，D = 0.62）：镜头一动它们划得比人快，画面就有了纵深。路灯杆细高、跟着跑的时候从镜头前一闪而过；
 * 花箱、自行车矮，只在画面底边露一截，不挡人。（不加模糊：canvas 的 blur 滤镜在浏览器里很贵）
 */
const FG_D = 0.62;
const FOREGROUND: { x: number; kind: "lamp" | "planter" | "bike" | "bollard" }[] = [
  { x: 880, kind: "lamp" },
  { x: 1500, kind: "bollard" },
  { x: -1520, kind: "planter" },
  { x: -1900, kind: "bike" },
];
function drawForegroundItem(g: CanvasRenderingContext2D, kind: (typeof FOREGROUND)[number]["kind"], x: number, t: number) {
  if (kind === "lamp") {
    // 老式路灯：细杆、顶上一个弯脖子灯罩，灯罩里一点暖光
    part(g, rectPath(x - 11, -1500, 22, 1520), "#5f5652", "#4d4542", 3.2, [5, 4]);
    part(g, rectPath(x - 28, -40, 56, 60), "#5f5652", null, 3.2);
    const neck = new Path2D();
    neck.moveTo(x, -1490);
    neck.quadraticCurveTo(x - 10, -1600, x - 120, -1580);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke(neck);
    g.strokeStyle = "#5f5652";
    g.lineWidth = 9;
    g.stroke(neck);
    const shade = new Path2D();
    shade.moveTo(x - 170, -1560);
    shade.lineTo(x - 70, -1560);
    shade.lineTo(x - 90, -1600);
    shade.lineTo(x - 150, -1600);
    shade.closePath();
    part(g, shade, "#4d4542", null, 3.2);
    g.fillStyle = "rgba(255,214,150,0.85)";
    g.beginPath();
    g.ellipse(x - 120, -1556, 42, 10, 0, 0, Math.PI * 2);
    g.fill();
  } else if (kind === "bollard") {
    part(g, rectPath(x - 18, -84, 36, 104), "#8d8580", "#77706b", 3.2, [4, 3]);
    part(g, rectPath(x - 23, -92, 46, 14), "#6f6862", null, 3.2);
  } else if (kind === "planter") {
    // 木头花箱，里面一丛花草（风里轻轻摆）
    part(g, rectPath(x - 90, -46, 180, 66), "#a8805f", "#94704f", 3.2, [5, 4]);
    const sway = 4 * Math.sin(t * 1.1 + x);
    for (let i = 0; i < 6; i++) {
      const bx = x - 72 + i * 29;
      const leaf = new Path2D();
      leaf.ellipse(bx + sway * 0.6, -66 - (i % 3) * 9, 22, 26, 0.2 * Math.sin(i * 1.7), 0, Math.PI * 2);
      part(g, leaf, i % 2 ? "#7e9b62" : "#8fae6d", "#6a8652", 2.4, [3, 3]);
    }
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i % 2 ? "#e9a39a" : "#f2cf7a";
      g.beginPath();
      g.arc(x - 50 + i * 50 + sway, -88 - (i % 2) * 8, 9, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // 靠在路边的旧自行车（只露出车轮和车架下半截）
    g.save();
    g.translate(x, 0);
    g.scale(0.55, 0.55);
    g.translate(-x, 0);
    g.strokeStyle = INK;
    g.lineWidth = 7;
    for (const wx of [x - 110, x + 110]) {
      g.beginPath();
      g.arc(wx, -70, 70, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeStyle = "#5d7f8e";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(x - 110, -70);
    g.lineTo(x - 20, -170);
    g.lineTo(x + 70, -170);
    g.lineTo(x + 110, -70);
    g.moveTo(x - 20, -170);
    g.lineTo(x + 10, -70);
    g.lineTo(x + 70, -170);
    g.moveTo(x - 30, -190);
    g.lineTo(x - 10, -190);
    g.moveTo(x + 70, -170);
    g.lineTo(x + 60, -210);
    g.lineTo(x + 100, -215);
    g.stroke();
    g.restore();
  }
}

/** 全城最高那栋楼的楼顶（开场天上的镜头里露出一角）：栏杆、电视天线、晾着的白床单、一盆花——有人在这里过日子 */
const TOWER_ROOF = (-TOWER.floors * 128 - 60) * (TOWER.fh / 128);
function drawRoof(g: CanvasRenderingContext2D, t: number) {
  const y = TOWER_ROOF;
  const x0 = TOWER.x;
  // 栏杆
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x0 + 10, y - 96);
  g.lineTo(x0 + 700, y - 96);
  for (let x = x0 + 14; x < x0 + 700; x += 46) {
    g.moveTo(x, y);
    g.lineTo(x, y - 96);
  }
  g.stroke();
  g.strokeStyle = "#a39a96";
  g.lineWidth = 2;
  g.stroke();
  // 电视天线（楼顶左端，开场镜头里看得见）
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x0 + 70, y);
  g.lineTo(x0 + 70, y - 420);
  for (const [dy, half] of [[-400, 56], [-350, 44], [-300, 32]]) {
    g.moveTo(x0 + 70 - half, y + dy);
    g.lineTo(x0 + 70 + half, y + dy + 6);
  }
  g.stroke();
  g.strokeStyle = "#8d8580";
  g.lineWidth = 3;
  g.stroke();
  // 一根晾衣绳，挂着一条被风吹鼓的白床单
  const ax = x0 + 190;
  const bx = x0 + 560;
  g.strokeStyle = INK;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(ax, y);
  g.lineTo(ax, y - 300);
  g.moveTo(bx, y);
  g.lineTo(bx, y - 300);
  g.stroke();
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(ax, y - 290);
  g.quadraticCurveTo((ax + bx) / 2, y - 262, bx, y - 290);
  g.stroke();
  const flap = 18 * Math.sin(t * 2.2) + 10 * Math.sin(t * 3.7 + 1);
  const sheet = new Path2D();
  sheet.moveTo(ax + 30, y - 284);
  sheet.quadraticCurveTo((ax + bx) / 2, y - 258, bx - 30, y - 284);
  sheet.quadraticCurveTo(bx - 10 + flap, y - 190, bx - 20 + flap * 1.6, y - 110);
  sheet.quadraticCurveTo((ax + bx) / 2 + flap, y - 140 + flap * 0.4, ax + 40 + flap * 0.8, y - 120);
  sheet.quadraticCurveTo(ax + 20 + flap * 0.3, y - 200, ax + 30, y - 284);
  sheet.closePath();
  part(g, sheet, "#f7f4ee", "#e6e0d6", 3, [6, 5]);
  // 栏杆边上一盆花（楼顶左端）
  const pot = new Path2D();
  pot.moveTo(x0 + 16, y);
  pot.lineTo(x0 + 86, y);
  pot.lineTo(x0 + 78, y - 60);
  pot.lineTo(x0 + 24, y - 60);
  pot.closePath();
  const leaves = new Path2D();
  leaves.ellipse(x0 + 51, y - 104, 50, 46, 0, 0, Math.PI * 2);
  part(g, leaves, "#8fae6d", "#7a9457", 3, [5, 4]);
  part(g, pot, "#c77b5a", "#b36a4b", 3, [4, 3]);
}

/** 地上一块软软的影子（太阳在左上，影子往右偏一点）：x 是中心，w 是半宽 */
function groundShadow(g: CanvasRenderingContext2D, x: number, w: number, a: number) {
  if (a < 0.01 || w < 2) return;
  g.save();
  g.translate(x, 6);
  g.scale(1, 0.16);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w);
  gr.addColorStop(0, `rgba(70,48,40,${a})`);
  gr.addColorStop(0.6, `rgba(70,48,40,${a * 0.55})`);
  gr.addColorStop(1, "rgba(70,48,40,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, w, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

const rectPath = (x: number, y: number, w: number, h: number) => {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
};

/** 老钟家（两层的老房子，和人在同一层）：墙、二楼的窗、门；一楼那扇窗只挖出亮着灯的屋子，窗框在 drawWindowFront 里画 */
function drawHouse(g: CanvasRenderingContext2D, t: number) {
  const { x0, x1, top } = HOUSE;
  const wall = new Path2D();
  wall.rect(x0, top, x1 - x0, -top + 40);
  part(g, wall, "#ead6b8", "#dcc4a2", 3.2, [14, 10]);
  // 墙根一道水泥裙、墙角往上爬的藤
  part(g, rectPath(x0, -90, x1 - x0, 92), "#d9c3a3", null, 2.6);
  g.strokeStyle = "#6f8a55";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x0 + 26, 0);
  for (let y = 0; y > -1040; y -= 40) g.lineTo(x0 + 26 + 14 * Math.sin(y / 70), y);
  g.stroke();
  for (let y = -30; y > -1020; y -= 64) {
    const lx = x0 + 26 + 14 * Math.sin(y / 70);
    const leaf = new Path2D();
    leaf.ellipse(lx + (y % 128 === 0 ? 20 : -16), y, 20, 13, y % 128 === 0 ? 0.5 : -0.5, 0, Math.PI * 2);
    part(g, leaf, "#8fae6d", "#7a9457", 2.2, [3, 2]);
  }
  // 屋檐、二楼的窗（防盗窗、花盆）、门
  part(g, rectPath(x0 - 30, top - 40, x1 - x0 + 60, 44), "#b98f74", "#a77c62", 3.2, [6, 5]);
  for (const wx of [x0 + 110, x0 + 470]) {
    part(g, rectPath(wx, -1180, 220, 260), "#8a91a0", "#767d8c", 3, [6, 6]);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.strokeRect(wx - 12, -1192, 244, 290);
    g.lineWidth = 2;
    g.beginPath();
    for (let k = 1; k < 6; k++) {
      g.moveTo(wx - 12 + (244 * k) / 6, -1192);
      g.lineTo(wx - 12 + (244 * k) / 6, -902);
    }
    g.stroke();
    part(g, rectPath(wx - 20, -905, 260, 16), "#a39a96", null, 2.6);
  }
  // 左边窗下的空调外机、一根冷凝水管
  {
    const ax = x0 + 150;
    part(g, rectPath(ax, -870, 160, 96), "#f2efe8", "#e1ddd3", 3, [5, 5]);
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(ax + 108, -822, 32, 0, Math.PI * 2);
    for (let k = -2; k <= 2; k++) {
      g.moveTo(ax + 108 + k * 12, -850);
      g.lineTo(ax + 108 + k * 12, -794);
    }
    g.stroke();
    g.strokeStyle = "#9c968f";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(ax + 20, -774);
    g.lineTo(ax + 20, -620);
    g.stroke();
  }
  // 右边窗台伸出一根晾衣杆，晾着的衣服被风往右吹
  {
    const py = -930;
    const pxA = x0 + 640;
    const pxB = x1 + 160;
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(pxA, py);
    g.lineTo(pxB, py - 14);
    g.stroke();
    g.strokeStyle = "#b9b2a8";
    g.lineWidth = 5;
    g.stroke();
    const clothes: [number, number, number, string, string][] = [
      [0.22, 70, 96, "#e9a39a", "#d98d84"],
      [0.48, 54, 120, "#9fb8cf", "#8aa3ba"],
      [0.72, 64, 78, "#f2e3b6", "#e2d2a2"],
    ];
    for (const [u, w, h, fill, shade] of clothes) {
      const cx = pxA + (pxB - pxA) * u;
      const cy = py - 14 * u;
      const sw = 0.12 + 0.06 * Math.sin(t * 1.8 + u * 9);
      g.save();
      g.translate(cx, cy);
      g.rotate(-sw);
      const cloth = new Path2D();
      cloth.moveTo(-w / 2, 0);
      cloth.lineTo(w / 2, 0);
      cloth.quadraticCurveTo(w / 2 + 6, h * 0.6, w / 2 - 4, h);
      cloth.lineTo(-w / 2 + 6, h);
      cloth.quadraticCurveTo(-w / 2 - 2, h * 0.5, -w / 2, 0);
      cloth.closePath();
      part(g, cloth, fill, shade, 2.6, [4, 4]);
      g.restore();
    }
  }
  // 门（在窗的右边，不和窗叠在一起）、门上的门牌、窗左边的绿信箱、门口一盆花
  const door = new Path2D();
  door.rect(x1 - 150, -720, 120, 722);
  part(g, door, "#8d6a54", "#7a5944", 3.2, [6, 5]);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x1 - 52, -360, 7, 0, Math.PI * 2);
  g.fill();
  part(g, rectPath(x1 - 117, -780, 54, 34), "#5b7fa6", null, 2.4);
  part(g, rectPath(x0 + 210, -470, 64, 84), "#6f9a72", "#5e8661", 2.8, [4, 4]);
  part(g, rectPath(x0 + 210, -440, 64, 8), "#3e5a42", null, 0);
  const pot = new Path2D();
  pot.moveTo(x1 + 10, 0);
  pot.lineTo(x1 + 90, 0);
  pot.lineTo(x1 + 82, -70);
  pot.lineTo(x1 + 18, -70);
  pot.closePath();
  const bush = new Path2D();
  bush.ellipse(x1 + 50, -120, 62, 56, 0, 0, Math.PI * 2);
  part(g, bush, "#7e9b62", "#6a8652", 2.8, [5, 4]);
  part(g, pot, "#c77b5a", "#b36a4b", 2.8, [4, 3]);
  // 窗左边一盏壁灯：暖光晕在墙上
  {
    const lx = x0 + 250;
    const ly = -640;
    const glow = g.createRadialGradient(lx, ly + 20, 0, lx, ly + 20, 170);
    glow.addColorStop(0, "rgba(255,214,150,0.55)");
    glow.addColorStop(1, "rgba(255,214,150,0)");
    g.fillStyle = glow;
    g.fillRect(lx - 170, ly - 150, 340, 340);
    part(g, rectPath(lx - 6, ly - 40, 12, 30), "#6f5a4c", null, 2.4);
    const shadeP = new Path2D();
    shadeP.moveTo(lx - 26, ly - 12);
    shadeP.lineTo(lx + 26, ly - 12);
    shadeP.lineTo(lx + 18, ly + 36);
    shadeP.lineTo(lx - 18, ly + 36);
    shadeP.closePath();
    part(g, shadeP, "#ffe2a8", "#f3cf86", 2.6, [3, 3]);
  }
  // 一楼的窗：亮着暖灯的屋子
  const { x, w, sill, top: wt } = WIN;
  const room = g.createLinearGradient(0, wt, 0, sill);
  room.addColorStop(0, "#f6d39b");
  room.addColorStop(1, "#e9b77f");
  g.fillStyle = room;
  g.fillRect(x - w / 2, wt, w, sill - wt);
  // 墙上一盏小灯、一个挂历
  g.fillStyle = "rgba(255,240,200,0.9)";
  g.beginPath();
  g.arc(x + w * 0.3, wt + 60, 26, 0, Math.PI * 2);
  g.fill();
  part(g, rectPath(x - w * 0.42, wt + 40, 70, 90), "#f3efe6", null, 2.4);
  g.fillStyle = "#c95a4a";
  g.fillRect(x - w * 0.42, wt + 40, 70, 18);
}

/** 一楼的窗框、窗台、窗台上的花盆（画在老钟前面） */
function drawWindowFront(g: CanvasRenderingContext2D) {
  const { x, w, sill, top } = WIN;
  const frame = new Path2D();
  frame.rect(x - w / 2 - 18, top - 18, w + 36, sill - top + 36);
  frame.rect(x - w / 2, top, w, sill - top);
  g.fillStyle = "#8f6f58";
  g.fill(frame, "evenodd");
  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.stroke(frame);
  part(g, rectPath(x - w / 2 - 34, sill + 14, w + 68, 22), "#a39a96", "#8f8682", 3, [4, 4]);
  const pot = new Path2D();
  pot.moveTo(x + w / 2 - 70, sill + 14);
  pot.lineTo(x + w / 2 - 22, sill + 14);
  pot.lineTo(x + w / 2 - 28, sill - 24);
  pot.lineTo(x + w / 2 - 64, sill - 24);
  pot.closePath();
  part(g, pot, "#c77b5a", null, 2.6);
  const leaf = new Path2D();
  leaf.ellipse(x + w / 2 - 46, sill - 48, 30, 26, 0, 0, Math.PI * 2);
  part(g, leaf, "#7e9b62", "#6a8652", 2.6, [4, 3]);
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
  // 跟着她跑时背景的横向拖影（人物、公文包画在拖影后面，保持清楚）
  const hbuf = document.createElement("canvas");
  hbuf.width = width;
  hbuf.height = height;
  const hctx = hbuf.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  const T = timeline();


  // 同一时刻的姿势会被镜头、画面、拖影反复用到：按时间记住最近的结果（返回的东西不要改）
  const memoT = <R,>(fn: (t: number) => R) => {
    const m = new Map<number, R>();
    return (t: number) => {
      const k = Math.round(t * 1e4);
      let v = m.get(k);
      if (v === undefined) {
        v = fn(t);
        if (m.size > 800) m.clear();
        m.set(k, v);
      }
      return v;
    };
  };

  // ——————————— 她 ———————————
  // 跑过来（一步 0.26 秒），最后一步 R 在公文包砸地前 0.4 秒落地、铁靴往前滑 0.2 秒刹住——公文包掉下来时她已经停住了；
  // 走、跑的关键帧都用 SMOOTH（速度连续穿过关键帧，不一顿一顿）。
  // 跑的根按 dx 匀速走（有腾空，不能按钉住的脚反推：那样一步里忽快忽慢）；姿势表里站着那只脚的位置是按这个速度反算的，脚不滑
  const RUN_STEP = 0.26;
  const RUN_V = 1200;
  const T_BRAKE = T.slam - 0.4;
  const RUN: [number, Angles, number][] = [
    [0, CHEN.跑_落地, 0.03],
    [0.19, CHEN.跑_踩实, 0.05],
    [0.38, CHEN.跑_蹬地, 0],
    [0.68, CHEN.跑_腾空, -0.02],
  ];
  const RUN_K0 = 5;
  const RUN_K1 = 15;
  const runKeys: MoveKey[] = [];
  for (let k = RUN_K0; k <= RUN_K1; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    for (const [at, p, squash] of RUN) {
      if (k === RUN_K1 && at > 0) break;
      const t = T_BRAKE - (RUN_K1 - k - at) * RUN_STEP;
      const last = runKeys[runKeys.length - 1];
      runKeys.push({ t, ease: SMOOTH, squash, dx: last ? -RUN_V * (t - last.t) : undefined, p: foot === "L" ? p : swapSides(p) });
    }
  }
  // 最后一步落地以后铁靴往前滑一点刹住：速度从 RUN_V 平滑地降到 0（cubic out 起步的速度是 3·dx/时长）
  const SKID = 0.2;

  // 走（一步一拍，铁靴「咚」）：第 k 步 L / R 交替落地；站着的那只脚钉在地上
  const WALK_STEP = 0.5;
  const WALK: [number, Angles, number, MoveKey["ease"]][] = [
    [0, CHEN.走_落地, 0.03, SMOOTH],
    [0.2, CHEN.走_下沉, 0.05, SMOOTH],
    [0.48, CHEN.走_经过, 0, SMOOTH],
    [0.74, CHEN.走_蹬地, 0, SMOOTH],
  ];
  // 一直走到这一幕结束，不停（用户 2026-10-19：「这里主角继续往前走，不要停」）
  const STEPS = 16;
  const walkKeys: MoveKey[] = [];
  for (let k = 0; k <= STEPS; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    const prev = k % 2 === 0 ? "R" : "L";
    const sw = (p: Angles) => (foot === "L" ? p : swapSides(p));
    for (const [at, p, squash, ease] of WALK) {
      if (k === STEPS && at > 0) break;
      const t = T.walk0 + (k + at) * WALK_STEP;
      // 从他身后经过：低头冲他笑；看见窗里的老钟：先抬头（镜头顺着她的视线过去），再把远处的手举起来挥一挥
      const wave = fade(t, T.zhong + 0.05, T.zhong + 0.3) * (1 - fade(t, T.zhong + 1.1, T.zhong + 1.4));
      const passing = t < T.walk0 + 0.6;
      const seeZhong = t >= T.zhong - 0.45 && t < T.zhong + 0.05;
      // 小石头跑到跟前：边走边弯一点腰，近处的手掌心朝下在他头顶揉两下，脚步不停
      const pat = t >= T.pat - 0.3 && t < T.pat + 0.5;
      const extra: Angles =
        pat
          ? { lean: 12, ...armL(50 + (k % 2 ? -8 : 6), 26, -26, "flat", 12), neck: -14, expression: "微笑", squint: 0.4, lookX: -0.4, lookY: 0.9 }
          : wave > 0.5
          ? { ...WAVE_R, shoulderR: (WAVE_R.shoulderR as number) + (k % 2 ? -14 : 14), neck: 18, expression: "笑", lookX: -0.7, lookY: -0.7 }
          : passing
            ? { neck: -12, expression: "微笑", lookX: -0.3, lookY: 0.8 }
            : seeZhong
              ? { neck: 12, expression: "微笑", lookX: -0.7, lookY: -0.5 }
              : {};
      walkKeys.push({ t, ease, squash, plant: at === 0 ? prev : foot, p: { ...sw(p), ...extra } });
    }
  }
  const chenKeys: MoveKey[] = [
    ...runKeys,
    // 刹住（前脚 R 扎在地上往前滑，手被甩在身前）→ 公文包擦着手掉下来：一惊，脚还扎在原地，上身往后一仰、手猛地缩到胸前
    // → 公文包砸在她靴尖跟前（用户 2026-10-19：「主角距离公文包太远了，还要近一点」），又一缩、闭眼 → 抬头看到他
    // 跑的姿势不自动着地（ground: false、胯高直接给）：刹住起换回自动着地，不然后面的姿势全都悬在地面上
    // 刹住的时候抬头盯着掉下来的公文包（看见了才刹：刹车有了理由）
    { t: T_BRAKE + SKID, ease: "out", squash: 0.08, dx: (-RUN_V * SKID) / 3, p: { ...CHEN.刹, ground: true, lift: 0, neck: 20, lookX: -0.45, lookY: -0.75 } },
    { t: T.slam - 0.06, ease: "out", squash: 0.02, p: CHEN.刹_缩 },
    { t: T.slam + 0.08, ease: "out", squash: 0.06, p: { ...CHEN.刹_缩, neck: -16, blink: 1 } },
    { t: T.slam + 0.34, ease: "inOut", plant: "R", squash: 0, p: CHEN.仰头 },
    // 蹲、蹬地，越过公文包斜着跃起来，最高处攥住他的脚踝，一口气带着他落下来
    { t: T.launch - 0.16, ease: "inOut", squash: 0.06, p: CHEN.蹲 },
    { t: T.launch, ease: "in", squash: -0.08, dx: -70, p: CHEN.起跳 },
    { t: T.grab, ease: "out", squash: -0.02, dx: -LEAP * 0.36, p: CHEN.抓住 },
    // 落地那一下手已经拽到身前低处：他的脚踝被一路拽到地上
    { t: T.land, ease: "in", squash: -0.03, dx: -(LEAP - 70 - LEAP * 0.36), p: { ...CHEN.拽着坠, lift: 0, ...armR(30, 10, 4, "grip", CHEN.拽着坠.lean as number) } },
    // 落地直接单膝跪下（用户 2026-10-19：「落地不需要落地动作，直接变成单膝蹲下，这个动作多余显得不够流畅」）：
    // 后脚 L 落地扎住、跪下去，前脚 R 顺着往前冲的势头迈出去（钉前脚的话跪姿前脚伸得远，人会往后滑），一个动作接住落地的分量；
    // 把他摔到地上的那一下就松手（他被攥着的那条腿弹开、落下来）
    { t: T.land + 0.16, ease: "out", squash: 0.12, plant: "L", p: { ...CHEN.单膝跪, handR: "open", expression: "使劲", neck: -10 } },
    { t: T.land + 0.45, ease: "inOut", squash: 0, plant: "L", p: { ...CHEN.单膝跪, neck: -16 } },
    // 跪下来心疼地看他一眼 → 手伸进前面那只靴筒 → 抽出来（很沉）→ 递过去
    { t: T.pull - 0.2, ease: "inOut", plant: "R", p: CHEN.跪_掏砖 },
    { t: T.pull, ease: "inOut", plant: "R", p: { ...CHEN.跪_掏砖, neck: -14 } },
    { t: T.pull + 0.22, ease: "out", plant: "R", p: CHEN.跪_抽出 },
    { t: T.give, ease: "inOut", plant: "R", p: CHEN.跪_递 },
    // 砖落进他手里：手收回来——鼓进来那一拍正好递完，看着他、站起来，直接迈出第一步（后脚 L）
    { t: T.take + 0.22, ease: "inOut", plant: "R", p: { ...CHEN.跪_递, handL: "relax" } },
    { t: T.drum, ease: "inOut", plant: "R", p: CHEN.跪_看他 },
    // 起身直接迈出去：这一帧不减速停下（ease in），接着平滑地进第一步
    { t: T.walk0 - 0.18, ease: "in", plant: "R", p: { ...swapSides(CHEN.走_经过), expression: "微笑", lookX: -0.3 } },
    ...walkKeys,
  ];
  const chenMove = live(chenKeys, {
    look: CHENGTUO,
    base: { wind: WIND },
    idle: true,
    seed: 3,
    springs: ARMS,
    // 站着的时候重心很慢地晃，手也不是钉死的
    add: (t, o) => {
      const s = Math.sin(t * 0.9 + 1.3);
      o.lean += 0.9 * s;
      o.neck -= 0.7 * s;
      o.shoulderL += 1.5 * Math.sin(t * 1.15);
      o.shoulderR -= 1.5 * Math.sin(t * 1.05 + 0.7);
    },
  });
  // 刹住停稳那一刻正好在 X_STOP
  const xRest = chenMove(T_BRAKE + SKID).x;
  const chenAt = memoT((t: number) => {
    const f = chenMove(t);
    return { pose: f.pose, x: X_STOP + (f.x - xRest) };
  });
  const chenPalm = (t: number, side: "L" | "R"): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    const p = side === "L" ? j.palmL : j.palmR;
    return [c.x + p[0], p[1]];
  };

  // ——————————— 周磊 ———————————
  // 拎着公文包往上飘（被风带着往右漂），人不动 → 手指一松，公文包自己滑下去（用户 2026-10-19：「他不用动，包从手里脱落就行」）→
  // 没了分量，手慢慢浮起来、闭着眼往上飘 → 被抓住脚踝一惊 →
  // 被一口气拽下来、屁股砸在地上 → 瘫坐着哭 → 抬头、伸手接砖 → 砖很沉，手一下坠下去 → 两只手捧到胸口哭 → 抬起头哭着笑
  const zKeys = (drop: number): MoveKey[] => [
    { t: 0, p: ZP.拎着飘 },
    { t: T.cut + 0.5, p: { ...ZP.拎着飘, neck: -34 } },
    { t: T.her - 0.65, ease: "inOut", p: { ...ZP.拎着飘, neck: -32, expression: "忍着哭" } },
    // 切走之前：闭上眼，攥着提手的手指松开（公文包滑到指尖上悬着，heldCase 里往下挪）；切到她以后在画外松手
    { t: T.her - 0.12, ease: "inOut", p: { ...ZP.拎着飘, neck: -28, expression: "闭眼", sad: 0.9, handL: "relax" } },
    { t: drop - 0.05, ease: "inOut", p: { ...ZP.松手, handL: "relax" } },
    { t: drop + 0.2, ease: "out", p: ZP.松手 },
    { t: drop + 1.3, ease: "inOut", p: ZP.飘 },
    { t: T.grab - 0.15, p: ZP.飘 },
    { t: T.grab + 0.12, ease: "out", p: ZP.一惊 },
    { t: T.grab + 0.36, ease: "inOut", p: ZP.被拽 },
    { t: T.land - 0.15, ease: "inOut", p: ZP.被拽 },
    { t: T.land + 0.03, ease: "in", squash: 0.08, p: ZP.坐下 },
    { t: T.land + 0.5, ease: "out", squash: 0, p: ZP.瘫坐 },
    { t: T.give - 0.35, ease: "inOut", p: ZP.坐_抬头 },
    { t: T.give + 0.05, ease: "inOut", p: ZP.坐_接 },
    { t: T.take, p: ZP.坐_接 },
    { t: T.take + 0.12, ease: "out", squash: 0.025, p: ZP.坐_一沉 },
    { t: T.take + 0.4, ease: "inOut", squash: 0, p: ZP.坐_两手托 },
    { t: T.drum + 0.3, ease: "inOut", p: ZP.坐_捧着哭 },
    { t: T.laugh - 0.35, ease: "inOut", p: { ...ZP.坐_捧着哭, neck: -18 } },
    { t: T.laugh, ease: "inOut", p: ZP.坐_哭着笑 },
  ];
  // 叠在关键帧上的连续动作
  const zAdd = (t: number, o: Num) => {
    // 飘着：四肢、身子像在水里一样慢慢摆（坐到地上就停）
    const a = 1 - fade(t, T.land - 0.3, T.land);
    if (a > 0) {
      const s = (f: number, p: number) => a * Math.sin(t * f + p);
      o.hipL += 6 * s(1.3, 0);
      o.kneeL -= 4 * (a + s(1.1, 1));
      o.hipR += 6 * s(1.2, 2.1);
      o.kneeR -= 4.5 * (a + s(0.95, 0.4));
      o.ankleL += 5 * s(1.7, 0.5);
      o.ankleR += 5 * s(1.5, 1.9);
      o.rot += 3 * s(0.8, 0.3);
      o.lean += 2 * s(0.7, 1);
      o.neck += 2.5 * s(0.9, 2);
      o.shoulderL += 4 * s(1.1, 0.3);
      o.shoulderR += 4 * s(1.0, 2.4);
      o.elbowL += 6 * s(1.3, 1.2);
      o.elbowR += 6 * s(1.2, 0.2);
    }
    // 被抓住的一下：身子还往上冲，绕着脚踝晃一下
    o.rot += 12 * ring(t, T.grab, 0.8, 0.4);
    o.shoulderL += 18 * ring(t, T.grab + 0.04, 0.5, 0.3);
    o.shoulderR += 14 * ring(t, T.grab + 0.08, 0.5, 0.3);
    // 坐在地上哭：肩膀一抽一抽（低着头的时候；捧着砖、镜头不再盯着砖以后）
    const sob = fade(t, T.land + 0.4, T.land + 0.7) * (1 - fade(t, T.give - 0.5, T.give - 0.3)) + fade(t, T.drum + 0.3, T.drum + 0.6);
    if (sob > 0) {
      const h = sob * hitch(t, 0.62);
      o.lean += 2.5 * h;
      o.neck -= 2 * h;
      o.shoulderL -= 3 * h;
      o.shoulderR -= 3 * h;
      o.elbowL += 2 * h;
    }
    // 素材库周磊的短发在 face ≈ ±0.2…0.45 时会画成一根长刺（库里的毛病）：不停在这一段
    if (Math.abs(o.face) > 0.2 && Math.abs(o.face) < 0.45) o.face = Math.sign(o.face) * (Math.abs(o.face) < 0.325 ? 0.2 : 0.45);
    // 整个人的歪按画面方向算：朝右时整套镜像，rot 要反过来
    if (o.face > 0) o.rot = -o.rot;
  };
  // 只有手臂、脖子、身子跟随（腿跟随的话坐到地上那一下腿慢半拍，会穿进地里；飘着时腿的晃靠 zAdd）
  const makeZ = (drop: number) =>
    live(zKeys(drop), { look: lookOf(ZHOU), base: { wind: WIND * 0.4 }, idle: true, seed: 5, follow: 0, springs: { ...ARMS, rot: LIMP.rot, lean: LIMP.lean }, add: zAdd });
  let zMove = makeZ(T.drop);
  // 同一时刻的姿势会被根、手、影子、头发甩动反复用到：记住（换一次松手的时刻就清掉）
  const zPoseMemo = new Map<number, PoseIn>();
  const setZ = (drop: number) => {
    zMove = makeZ(drop);
    zPoseMemo.clear();
  };
  const zPose = (t: number) => {
    const k = Math.round(t * 1e4);
    let p = zPoseMemo.get(k);
    if (!p) {
      p = zMove(t).pose;
      if (zPoseMemo.size > 1200) zPoseMemo.clear();
      zPoseMemo.set(k, p);
    }
    return p;
  };
  const zAnkle = (pose: PoseIn): V2 => castJoints(ZHOU, pose).ankleL;
  const zPalms = (pose: PoseIn) => {
    const j = castJoints(ZHOU, pose);
    return { L: j.palmL, R: j.palmR };
  };
  // 抓住的那一刻：他的脚踝就在她手里
  const grabAt = chenPalm(T.grab, "R");
  const GRIP: V2 = [0, -6];
  // 抓住之前：根按「抓住那一刻脚踝相对根的位置」走（腿自己晃，身子不跟着腿晃）
  let aGrab = zAnkle(zPose(T.grab));
  // 被风带着往右漂了多远（让松手时公文包正好在她靴尖前面那一点的正上方，下面迭代时算）
  let DRIFT = -200;
  // 坐下以后的位置：他接砖的手在她递砖的手下面（松手的时刻算好以后再算）；比她靠镜头一点（画面上低一点、画在她前面），
  // 她就像跪在他脚边——两个人离得近，她前面那只靴子和他收着的脚在画面上叠在一起
  let ZX_SIT = X_STOP - LEAP - 260;
  const ZY_SIT = 24;

  // 抓住之前：从下面慢慢升到她手里那一点；松手以后轻了，越飘越快；横着被风带着往右漂
  const driftK = (t: number) => 1 - E.soft(ph(t, T.cut - 1, T.grab));
  // 拎着公文包往上飘（用户 2026-10-19：「这里并没有往上飘」）：切到他时脚才刚离开街面，每秒升 200；
  // 松手那一刻脚踝比被抓住时低 D_DROP，松手以后轻了、越飘越快（匀加速），正好在她跳到最高时升到她手里
  // 公文包从更高处掉下来（用户 2026-10-19：「公文包落地时高度提高」）：松手时他离被抓住的地方更近、也就更高（D_DROP 640 → 400），
  // 前半段升得快一点（200 → 300），切到他时脚离街面的高度差不多
  const V_RISE = 300;
  // 她跳得高（抓住时离地 560）：他松手以后轻了，往上飘得多、越飘越快（用户 2026-10-19：「这个人飘的不够高」）
  const D_DROP = 400;
  const ankleBefore = (t: number, drop: number): V2 => {
    const span = T.grab - drop;
    let d: number;
    if (t < drop) d = D_DROP + V_RISE * (drop - t);
    else {
      const s = t - drop;
      const a = (2 * (D_DROP - V_RISE * span)) / (span * span);
      d = D_DROP - V_RISE * s - 0.5 * a * s * s;
    }
    return [grabAt[0] + GRIP[0] + DRIFT * driftK(t), grabAt[1] + GRIP[1] + d];
  };
  let settled = false;
  const zRootRaw = (t: number, drop: number): { x: number; y: number; pose: PoseIn } => {
    const pose = zPose(t);
    if (t < T.grab) {
      const p = ankleBefore(t, drop);
      return { x: p[0] - aGrab[0], y: p[1] - aGrab[1], pose };
    }
    const a = zAnkle(pose);
    const palm = chenPalm(t, "R");
    const pin = { x: palm[0] + GRIP[0] - a[0], y: palm[1] + GRIP[1] - a[1] };
    // 一口气拽下来：脚踝一直攥在她手里，她的手从头顶往前下方拽；快着地时身子往下一收，屁股砸在地上（中途不停、不绕圈）
    const w = ph(t, T.land - 0.06, T.land + 0.03);
    const wx = E.soft(w);
    const wy = w ** 1.7;
    return { x: pin.x + (ZX_SIT - pin.x) * wx, y: pin.y + (ZY_SIT - pin.y) * wy, pose };
  };
  // 头发、领带按他在世界里的速度甩
  const zMemo = memoT((t: number) => {
    const a = zRootRaw(t, T.drop);
    const b = zRootRaw(t - 1 / 30, T.drop);
    const pose = { ...a.pose };
    // 被她一把拽住时速度突变：甩得太狠头发会翻成两只角，收着点
    withDrag(pose, [(a.x - b.x) * 30, (a.y - b.y) * 30], 0.5, 0.25);
    return { ...a, pose };
  });
  const zRootAt = (t: number, drop = T.drop) => (settled && drop === T.drop ? zMemo(t) : zRootRaw(t, drop));

  // ——— 公文包：近处的手拎着提手 → 手指一松，从手里滑下去（按重力反推松手的时刻，落地正好砸在她靴尖前面那一拍）→ 几乎竖着砸在地上 ———
  /** 手指松开时提手滑到指尖：公文包往下坠一截 */
  const caseSlip = (t: number) => 16 * E.io(ph(t, T.her - 0.75, T.her - 0.3));
  const heldCase = (t: number, drop = T.drop): V2 => {
    const r = zRootAt(t, drop);
    const p = zPalms(r.pose);
    return [r.x + p.L[0], r.y + p.L[1] + CASE.h / 2 + 24 + caseSlip(t)];
  };
  let drop = T.drop;
  let v0: V2 = [0, 0];
  let tf = 0.6;
  for (let i = 0; i < 6; i++) {
    setZ(drop);
    aGrab = zAnkle(zPose(T.grab));
    // 漂多远：让他松手时公文包就在落点正上方（直直地掉下去）
    const k = driftK(drop);
    const hands0 = heldCase(drop, drop);
    if (k > 0.05) DRIFT += (X_LAND - hands0[0]) / k;
    const p0 = heldCase(drop, drop);
    const h = -CASE.h / 2 - p0[1];
    tf = Math.sqrt((2 * h) / G);
    drop = T.slam - tf;
    v0 = [(X_LAND - p0[0]) / tf, 0];
  }
  T.drop = drop;
  setZ(drop);
  aGrab = zAnkle(zPose(T.grab));
  {
    const herGive = chenPalm(T.take, "L");
    ZX_SIT = herGive[0] - zPalms(zPose(T.take)).L[0] - 8;
  }
  settled = true;
  const P0 = heldCase(drop);
  const caseSway = (t: number) => 0.1 * Math.sin(t * 1.6) + 0.05 * Math.sin(t * 2.7 + 1);
  const caseAt = (t: number): { x: number; y: number; r: number; open: number } => {
    if (t < T.drop) {
      const p = heldCase(t);
      // 拎着时轻轻晃
      return { x: p[0], y: p[1], r: caseSway(t), open: 0 };
    }
    if (t < T.slam) {
      // 从手里滑下去：直直地往下掉，提手那头先脱手、往前歪一下，落地时放平
      const s = t - T.drop;
      const u = s / tf;
      return { x: P0[0] + v0[0] * s, y: P0[1] + 0.5 * G * s * s, r: caseSway(T.drop) * (1 - u) + 0.22 * Math.sin(Math.PI * u), open: 0 };
    }
    // 砸地：弹一下、往前滑一点；锁扣弹开、盖子掀起来又落回一半
    const a = t - T.slam;
    const hop = a < 0.22 ? 30 * Math.sin((Math.PI * a) / 0.22) : 0;
    const open = a < 0.04 ? 0 : 0.5 * E.out(ph(a, 0.04, 0.16)) - 0.18 * E.io(ph(a, 0.16, 0.5));
    return { x: X_LAND - 10 * E.out(Math.min(1, a / 0.3)), y: -CASE.h / 2 - hop, r: a < 0.22 ? -0.08 * Math.sin((Math.PI * a) / 0.22) : 0, open };
  };
  // 从掀开的盖子里飞出来的几张文件：先蹦起来，再一左一右飘着落下，落地后平躺在地上
  const papers = (() => {
    const r = seeded(23);
    return Array.from({ length: 6 }, () => ({
      vx: -260 + r() * 440,
      vy: -560 + r() * 240,
      ph: r() * 6,
      sw: 40 + r() * 50,
      spin: (r() - 0.5) * 7,
      d: r() * 0.08,
    }));
  })();
  const drawPapers = (g: CanvasRenderingContext2D, t: number) => {
    const a0 = t - T.slam - 0.06;
    if (a0 <= 0) return;
    for (const p of papers) {
      const a = a0 - p.d;
      if (a <= 0) continue;
      const tau = 0.22;
      const x0 = X_LAND - CASE.w * 0.2;
      const y0 = -CASE.h;
      let y = y0 + p.vy * tau * (1 - Math.exp(-a / tau)) + 150 * a;
      const x = x0 + p.vx * 0.3 * (1 - Math.exp(-a / 0.3)) + p.sw * Math.sin(a * 3 + p.ph) * Math.min(1, a * 2);
      const landed = y >= -2;
      if (landed) y = -2;
      // 平躺在地上时侧面看只剩一条细边
      const flat = landed ? 0.14 : 1;
      g.save();
      g.translate(x, y);
      g.rotate(landed ? 0 : 0.6 * Math.sin(a * p.spin + p.ph));
      g.scale(1, flat);
      const sheet = rectPath(-22, -29, 44, 58);
      part(g, sheet, "#f6f2ea", "#e4ddd0", 2.4, [3, 3]);
      if (!landed) {
        g.strokeStyle = "rgba(43,38,48,0.35)";
        g.lineWidth = 2;
        g.beginPath();
        for (let k = 0; k < 4; k++) {
          g.moveTo(-14, -16 + k * 10);
          g.lineTo(14 - (k === 3 ? 10 : 0), -16 + k * 10);
        }
        g.stroke();
      }
      g.restore();
    }
  };

  // ——————————— 小石头：从左边跑过来（一步 0.25 秒，最后一步 R 落地停在她跟前），仰头冲她笑，被摸头 ———————————
  const KID_STEP = 0.25;
  // 站得比她靠镜头一点（画面上低一点、画在她前面）：她边走边摸他的头，从他身后走过去
  const KID_Y = 22;
  const KID_N = 5;
  const kid0 = T.kidStop - KID_STEP * KID_N;
  const KRUN: [number, Angles, number, MoveKey["ease"], number][] = [
    [0, KID.跑_落地, 0.04, SMOOTH, 0],
    [0.22, KID.跑_下沉, 0.07, SMOOTH, 0],
    [0.5, KID.跑_蹬地, 0, SMOOTH, 8],
    [0.76, KID.跑_腾空, 0, SMOOTH, 20],
  ];
  const kidKeys: MoveKey[] = [];
  for (let k = 0; k <= KID_N; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    const prev = k % 2 === 0 ? "R" : "L";
    for (const [at, p, squash, ease, lift] of KRUN) {
      if (k === KID_N && at > 0) break;
      kidKeys.push({ t: kid0 + (k + at) * KID_STEP, ease, squash, plant: k === 0 && at === 0 ? undefined : at === 0 ? prev : foot, p: { ...(foot === "L" ? p : swapSides(p)), lift } });
    }
  }
  kidKeys.push(
    { t: T.kidStop + 0.3, ease: "out", plant: "R", squash: 0, p: KID.仰头笑 },
    { t: T.pat + 0.12, ease: "inOut", plant: "R", p: KID.被摸头 },
    // 她摸完接着往前走：他转过来一点，仰着头笑着目送她
    { t: T.pat + 0.45, ease: "inOut", plant: "R", p: KID.被摸头 },
    { t: T.pat + 0.95, ease: "inOut", plant: "R", p: { ...KID.仰头笑, face: 0.45, lookX: -0.8 } },
  );
  const kidMove = live(kidKeys, { look: lookOf(STONE), base: { wind: WIND * 0.6 }, idle: true, seed: 7, springs: ARMS });
  // 停在她跟前（她摸得到他的头）
  const kidX0 = chenAt(T.pat).x + jointsOf(chenAt(T.pat).pose).palmL[0] - 30 + kidMove(T.pat).x;
  // 朝右的人整套镜像：脚钉在地上算出来的根的 x 要取反
  const kidAt = memoT((t: number) => {
    const f = kidMove(t);
    return { pose: f.pose, x: kidX0 - f.x };
  });

  // ——————————— 老钟：一楼窗后，看见她走过来，举起茶杯 ———————————
  // 窗在她挥手那一刻的前面（左边），她边走边冲窗里笑；停下来时窗还在前面，小石头从窗下跑过来
  WIN.x = chenAt(T.zhong + 0.6).x - WIN_AHEAD;
  HOUSE.x0 = WIN.x - 480;
  HOUSE.x1 = WIN.x + 320;
  const zhongMove = live(
    [
      { t: 0, p: ZHONG.窗后 },
      { t: T.zhong - 0.15, p: ZHONG.窗后 },
      { t: T.zhong + 0.3, ease: "out", p: ZHONG.举杯 },
      { t: T.zhong + 0.8, ease: "inOut", p: { ...ZHONG.举杯, neck: -2 } },
      { t: T.zhong + 1.2, ease: "inOut", p: ZHONG.举杯 },
      { t: T.stop + 0.6, ease: "inOut", p: { ...ZHONG.举杯, lookX: -0.6 } },
    ],
    { look: lookOf(OLD), base: { wind: 0 }, idle: true, seed: 11, springs: ARMS },
  );

  // ——— 光里的女人：往上飘，头发先碰到白 ———
  const W_SPEED = (t: number) => 260 * t + 80 * t * t;
  const W_HIP_BURN = Y_WHITE + 470;
  const WY0 = W_HIP_BURN + W_SPEED(T.burn);
  const womanHip = (t: number): V2 => [WX, WY0 - W_SPEED(Math.min(Math.max(t, 0), T.burn))];
  const W_HEAD = W_HIP_BURN - 480;
  const W_FEET = W_HIP_BURN + 300;
  const BURN_DUR = 0.36;
  const burnBits = (() => {
    const r = seeded(31);
    return Array.from({ length: 150 }, () => {
      const y = W_HEAD + r() * (W_FEET - W_HEAD);
      const k = (y - W_HEAD) / (W_FEET - W_HEAD);
      const spread = 70 + 120 * Math.sin(Math.PI * Math.min(1, k * 1.4));
      const x = WX + (r() - 0.5) * 2 * spread;
      const ang = r() * Math.PI * 2;
      return { x, y, t0: T.burn + k * BURN_DUR, vx: Math.cos(ang) * (120 + r() * 260), vy: Math.sin(ang) * (90 + r() * 200) - 120, s: 8 + r() * 14, hue: r() * 360 };
    });
  })();

  // ——— 路人、飘着的人 ———
  // 路人：在对面人行道（远一层）低着头往右走，周磊飘着的时候从他底下经过，往后拉开时还在她身后，切近景之前已经走出画面
  // （往左走会走进递砖、往前走的镜头：她就是往左走的）
  // 画在对面楼前（远一层，D = 1.5）：比他小，不抢戏；两个人一前一后、步子快慢不一样，不贴在一起
  const WALKER_D = 1.5;
  const walkers: Walker[] = [
    { spec: passerby(2), x0: -420, dir: 1, step: 0.45, t0: 0, seed: 1 },
    { spec: passerby(12), x0: -40, dir: 1, step: 0.52, t0: 0.1, seed: 9 },
  ];
  const skyFloaters = (() => {
    const r = seeded(41);
    const low = Array.from({ length: 10 }, (_, i) => ({ D: i < 5 ? 4 : 2.2, x: -2600 + r() * 5200, y: -1700 - r() * 2600, v: 30 + r() * 50, ph: r() * 6, h: 240 + r() * 40 }));
    // 开场的天上：她身边远远近近还有几个人在往上飘（这里的人，一绝望就会飘起来）
    const high = [
      ...[-700, 1100].map((x, i) => ({ D: 4, x, y: -7400 - i * 500 - r() * 200, v: 40 + r() * 30, ph: r() * 6, h: 420 })),
      { D: 2.2, x: -620, y: -8350, v: 70, ph: r() * 6, h: 300 },
      { D: 2.2, x: 820, y: -8000, v: 55, ph: r() * 6, h: 280 },
      { D: 4, x: -150, y: -8900, v: 45, ph: r() * 6, h: 380 },
    ];
    return [...low, ...high];
  })();
  // 拉出全城时满天往上飘的人：一拍一个被白吸进去
  const BURN_BEAT0 = 27;
  const BURNERS = 5;
  const crowd = (() => {
    const r = seeded(57);
    return Array.from({ length: 30 }, (_, i) => {
      const burner = i < BURNERS;
      return {
        x: -3600 + r() * 5600,
        d0: burner ? 500 + r() * 1600 : 900 + r() * 5600,
        tb: burner ? T.beat(BURN_BEAT0 + i) : 1e9,
        v: 60 + r() * 160,
        spec: passerby(Math.floor(r() * 40)),
        ph: r() * 6,
      };
    });
  })();
  const crowdY = (p: (typeof crowd)[number], t: number) => {
    if (p.tb < 1e8) {
      if (t >= p.tb) return null;
      const span = p.tb - T.r0;
      const d = t < T.r0 ? p.d0 + 0.3 * p.v * (T.r0 - t) : p.d0 * Math.pow((p.tb - t) / span, 1.7);
      return Y_WHITE + 60 + d;
    }
    // 拉出全城之前他们已经在天上（不会飘到街上的镜头里）
    return Y_WHITE + p.d0 - p.v * (t - T.r0) * (t < T.r0 ? 0.3 : 1);
  };

  // ——— 字 ———
  const notes: Note[] = [
    { text: "这里的人，一绝望就会飘起来", x: 540, y: 1340, rot: -0.025, in: -1, out: 1.95, perChar: 0 },
    { text: "飘进天上的强光，就会化成灰", x: 548, y: 1450, rot: 0.02, in: T.burn + 0.08, out: 2.0, perChar: 0.05 },
    // 她把飘着的人一把拽回地面以后才上（刚证明了她有多沉）；跳起来的时候字会压在他头上
    { text: "城里都说，她是最沉的人", x: 540, y: 330, rot: -0.02, in: T.land + 0.25, out: T.pull + 0.45, perChar: 0.05 },
  ];

  // ——————————— 镜头 ———————————
  const memo = new Map<number, Cam>();
  // ① 天上：白在画面顶上，她的胸口在画面中间偏上；镜头屏着气只推近 3%，化成灰以后往后舒一口气，接着猛地往下甩（越甩越快，甩到街上）
  const S1_Z = 1.8;
  const S1_Y = 860;
  const WHIP = 2600;
  const camS1 = (t: number): Cam => {
    const h0 = womanHip(0);
    if (t < T.burn) {
      const u = Math.max(0, t) / T.burn;
      return aim(h0[0], h0[1] - 250, 540, S1_Y, S1_Z * (1 + 0.03 * u), -0.035 + 0.015 * u);
    }
    const u = E.out(ph(t, T.burn, T.burn + 0.6));
    const w = ph(t, T.whip, T.cut) ** 3;
    return aim(h0[0], h0[1] - 250 + WHIP * w, 540, S1_Y + 80 * u, S1_Z * 1.03 * (1 - 0.14 * u), -0.02 * (1 - u));
  };
  // ② 街上：镜头从上面落下来、停在他身上（中景：头、拎着的公文包、脚下远远的街），线性地慢慢逼近（紧张），第 5 拍切走
  const zChest = smoothTrack(
    (t) => {
      const r = zRootAt(t);
      const j = castJoints(ZHOU, r.pose);
      return [r.x + (j.shoulderL[0] + j.shoulderR[0]) / 2, r.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
    },
    T.cut - 0.1,
    T.her + 0.1,
    4,
  );
  // 镜头落定以后对准他、跟着他往上飘（用户 2026-10-19：「飘的时候镜头跟随」；之前「镜头中间对准这个人」）：
  // 他一直在画面中间，不推、不加手持呼吸；身后的树、电线、窗户和脚下低头走过的路人往下沉，看得出他在往上升
  const holdCam = (t: number) => {
    const c = zChest(t);
    return aim(c[0], c[1] + 60, 540, 900, 1.3);
  };
  const ARRIVE = 1000;
  const ARRIVE_T = 0.25;
  const arriveCam = (t: number): Cam => {
    const c = holdCam(t);
    return { ...c, y: c.y - ARRIVE * (1 - E.out(ph(t, T.cut, T.cut + ARRIVE_T))) };
  };
  // ③ 切到她（主角登场：急、决绝）：先贴着地面看见狂奔的铁靴（先看见脚），一边跟着跑一边抬起来露出整个人；之后镜头和她一样快
  //    （人物的速度就是镜头的速度），她在画面偏右、前面留出空，步子一下一下带着镜头轻轻颠。公文包从左边掉进画面、砸在她靴尖前面；
  //    她刹住，镜头带着惯性往前多滑一点才停（cubic out，起步速度接上她跑的速度）：公文包、刹住的她，画面上方是他悬着的腿
  const xBrake = chenAt(T_BRAKE).x;
  const GLIDE_T = 0.36;
  const GLIDE = (RUN_V * GLIDE_T) / 3;
  const trackX = (t: number) => (t < T_BRAKE ? chenAt(t).x : xBrake - GLIDE * E.out(ph(t, T_BRAKE, T_BRAKE + GLIDE_T)));
  const RUN_SX = 690;
  const herCam = (t: number): Cam => {
    const x = trackX(t);
    const boots = aim(x - 40, -100, RUN_SX, 1320, 4);
    const full = aim(x, -380, RUN_SX, 1080, 1.25);
    const k = camLerp(boots, full, E.io(ph(t, T.her + 0.2, T.her + 0.85)));
    // 跟着跑的颠：每步落地往下沉一点，刹住以后停
    const bob = 5 * Math.cos(((t - T_BRAKE) / RUN_STEP) * 2 * Math.PI) * (1 - E.out(ph(t, T_BRAKE, T_BRAKE + 0.3)));
    return { ...k, y: k.y + bob / k.z };
  };
  // 险（用户 2026-10-19：「镜头在主角身上，不在公文包上，这个险很疑惑，应该放大到公文包上」→「应该主角跑放完，切到公文包落地，
  //    之后不要切镜头，而是运镜到主角跃起」）：跟着她跑完、刹住，砸地前 0.3 秒切到公文包的近景（2.6 倍），跟着它坠下去，
  //    砸在靴尖跟前——画面中间是公文包，右边是她扎在地上的铁靴，擦着靴尖
  const CASE_Z = 2.6;
  const CASE_AT: V2 = [470, 1250];
  const caseCam = aim(X_LAND, -CASE.h / 2, CASE_AT[0], CASE_AT[1], CASE_Z);
  const CASE_CUT = T.slam - 0.3;
  // 近景里镜头跟着公文包往下坠（用户 2026-10-19：「镜头需要跟着公文包落地」→「公文包的位置更高一点，镜头远一点，随着落下镜头拉近，
  // 落下时震」）：切过来时公文包在画面上半截、镜头远一点（1.4 倍），跟着它往下坠、越落越近（倍数按 u² 推到 2.6），
  // 公文包在画面上从偏上滑到砸地的位置；砸地那一下镜头跟着它一起猛地停住，再往前顶、震
  const caseFall = (t: number): Cam => {
    const u = ph(t, CASE_CUT, T.slam);
    return aim(X_LAND, Math.min(caseAt(t).y, -CASE.h / 2), CASE_AT[0], CASE_AT[1] - 720 * (1 - u), 1.4 * Math.pow(CASE_Z / 1.4, u * u));
  };
  // ——— 一串取景：每一段从上一个取景过渡到下一个（取景可以是跟着人走的函数），各段自己的速度曲线 ———
  type CamFn = (t: number) => Cam;
  const chain = (keys: [number, CamFn, (x: number) => number][]) => (t: number): Cam => {
    if (t <= keys[0][0]) return keys[0][1](t);
    for (let i = 1; i < keys.length; i++) {
      const [t1, f1, e] = keys[i];
      if (t < t1) {
        const [t0, f0] = keys[i - 1];
        return camLerp(f0(t), f1(t), e((t - t0) / (t1 - t0)));
      }
    }
    return keys[keys.length - 1][1](t);
  };
  const still = (c: Cam): CamFn => () => c;
  const lin = (x: number) => x;

  // ④ 砸地：停在近景上（震、往前顶一下），看它弹一下、盖子弹开、纸飞出来；不切，镜头顺着她抬头往上、往后退开，
  //    一路接到跟着两个人跳起（她抬头看见他、一蹲、蹬地跳起来）
  const RISE0 = T.slam + 0.15;
  // 砸完镜头往后退、移到她身上（用户 2026-10-19：「随后缩小运到主角身上起跳动作停留一会，之后跟随主角向上并向后」）：
  // 中景框住蹲下去攒劲的她（1.75 倍），停住看她蹲、蹬地；蹬地那一下镜头跟着她往上、往后退到能装下头顶的他
  const HOLD0 = T.launch - 0.22;
  const UP_GO = T.launch - 0.04;
  const herHold = (() => {
    const c = chenAt(T.launch - 0.16);
    return aim(c.x + 10, -260, 540, 1080, 1.75);
  })();
  const punch = (t: number) => (t < T.slam ? 1 : 1 + 0.16 * (1 - Math.exp(-(t - T.slam) / 0.06)) * Math.exp(-(t - T.slam) / 0.2));
  const caseHold = (t: number): Cam => ({ ...caseCam, z: caseCam.z * punch(t) });
  // ⑤ 跃起、攥住、一起落下：镜头跟着两个人（她的胸口和他的胸口中间）平移，倍数不变；晚 0.06 秒跟（人先动、镜头再跟上，有惯性），
  //    位置按前后 0.1 秒平均（他被拽到地上那一下很快，不平均的话镜头会跟着一抖）；落地时两个人落在画面下面三分之一
  // 横着取两个人肩膀的中点；竖着取两个人整体的上下范围的中点（他的头顶到她的靴底）：他飘得高，起跳那一刻从地面到他头顶有 1400 多
  const pairRaw = memoT((t: number): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    const r = zRootAt(t);
    const k = castJoints(ZHOU, r.pose);
    const top = r.y + k.head[1] - 70;
    const bottom = Math.max(j.ankleL[1], j.ankleR[1]) + 64;
    return [(c.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 + r.x + (k.shoulderL[0] + k.shoulderR[0]) / 2) / 2, (top + bottom) / 2];
  });
  // 前后 0.1 秒、9 个样本的平均；样本落在 1/40 秒的格子上（格子之间线性插），播放时相邻几帧共用样本，每帧只多算一两个
  const pairMid = (t: number): V2 => {
    const g0 = Math.floor(t * 40) / 40;
    const f = (t - g0) * 40;
    let x = 0;
    let y = 0;
    for (let i = -4; i <= 4; i++) {
      const p = pairRaw(g0 + i / 40);
      const q = pairRaw(g0 + (i + 1) / 40);
      x += (p[0] * (1 - f) + q[0] * f) / 9;
      y += (p[1] * (1 - f) + q[1] * f) / 9;
    }
    return [x, y];
  };
  // ⑥ 落地以后（交出一样重要的东西，不切；用户 2026-10-19：「镜头有一个多余的向左运镜，导致观感很差，镜头顺着两人向下之后
  //    直接推进到两人，中心就是砖头」）：镜头顺着两个人落下来，落定就直接往里推，一直推到砖落进他手里。推镜的中心是递砖的那一点，
  //    放在画面中间、在画面上不动——镜头只推、不横移；柔和起步、一路减速（E.settle），砖落进他手里时越推越慢。两张脸一直都在画面里
  const BRICK_AT: V2 = (() => {
    const p = chenPalm(T.take, "L");
    return [p[0] - 4, p[1] - 22];
  })();
  const BRICK_S: V2 = [556, 1000];
  const Z_LAND = 1.45;
  const PUSH1 = T.drum - 0.05;
  // 推的时机（用户 2026-10-19：「这里镜头放大拖拖拉拉的」→「放大时机不对，应该在砖发光时放大」）：落定以后先不推，
  // 停在两个人身上看她跪下、掏砖、递过去；砖落进他手里亮起来的那一刻 0.55 秒推上去，之后稳住、只很慢地再凑近 2%
  const PUSH_GO = T.take - 0.05;
  const PUSH_IN = T.take + 0.5;
  // 等着的时候砖的那一点放低一点（两个人在画面中间，脚下不空出半屏地面），推上去时回到画面中间。
  // 等的时候也不死停（用户 2026-10-19：「镜头在发光前不能完全不动，不然呆板」）：落定后柔和起步、一路慢慢凑近 8%，
  // 砖亮起来时接着这股劲推上去
  const CREEP = 0.08;
  const brickCam: CamFn = (t) => {
    const e = E.io(ph(t, PUSH_GO, PUSH_IN));
    const creep = 1 + CREEP * E.soft(ph(t, T.land + 0.2, PUSH_IN));
    const z = Z_LAND * creep * Math.pow(2.3 / (Z_LAND * (1 + CREEP)), e) * (1 + 0.02 * E.soft(ph(t, PUSH_IN, PUSH1)));
    return aim(BRICK_AT[0], BRICK_AT[1], BRICK_S[0], BRICK_S[1] + 170 * (1 - e), z);
  };
  const brickEnd = brickCam(PUSH1);
  const ACTION_Z = 1.45;
  // 两个人落定时在画面上的位置：正好是往砖推的镜头起步时的取景（往下拽的一路慢慢挪过去，落定不用再找位置）
  const LAND_S = toScreen(brickCam(T.land + 0.2), ...pairMid(T.land + 0.16));
  // 起跳时他在她头顶老高（用户 2026-10-19：「这个人飘的不够高」）：镜头先退到 1.2 倍把地上的她和高处的他都装进来，
  // 她往上跳、两个人越来越近，镜头跟着推近到 1.45 倍，往下拽时倍数不变，接住落地那一下
  const actionCam = (t: number) => {
    const m = pairMid(t - 0.04);
    const up = E.io(ph(t, T.launch - 0.15, T.grab));
    const k = E.io(ph(t, T.grab + 0.1, T.land + 0.05));
    const z = 1.2 * Math.pow(ACTION_Z / 1.2, up) * Math.pow(Z_LAND / ACTION_Z, k);
    return aim(m[0], m[1], 540 + (LAND_S[0] - 540) * k, 960 + (LAND_S[1] - 960) * k, z);
  };
  // ⑦⑧ 鼓进来：砖整个亮起来，镜头往前一顶；她站起来往前走（用户 2026-10-19：「站起来镜头拉远，向主角前面，跟随主角让主角在
  //    屏幕右边 1/3 位置即可，这里有多个多余运镜」）：一个动作退开、移到她前面（她走的方向留空），之后只跟着她走，她在画面右边 1/3
  //    （横着用弹簧追她的根，走路一步一顿时镜头不跟着顿）
  const herWalkX = smoothTrack((t) => [chenAt(t).x, 0], T.drum, T.r0, 16);
  const walkCam: CamFn = (t) => aim(herWalkX(t)[0], 0, 790, 1480, 1.35);
  // ⑨ 和老钟打招呼：镜头挤到她和窗里的老钟中间，两个人越走越近、镜头跟着越推越近（倍数按两人的距离算）
  const zhongX = () => WIN.x - 20;
  const greetCam: CamFn = (t) => {
    const hx = chenAt(t).x;
    const d = Math.abs(hx - zhongX());
    const z = Math.min(1.45, Math.max(1.1, 780 / d));
    return aim((hx + zhongX()) / 2, -390, 540, 1020, z);
  };
  // ⑩ 小石头从左边跑过来：镜头往左带去接他（她的视线方向，她留在画面右边不出画），再收成窗里的老钟、小石头、她三个人，慢慢推近
  //    （取景的中心和倍数用弹簧追：小石头跑到跟前一下停住时，镜头不跟着一顿）
  const kidFit = smoothTrack(
    (t) => {
      const hx = chenAt(t).x;
      const kx = kidAt(t).x;
      const d = Math.max(1, hx - kx);
      const z = Math.min(1.55, Math.max(1.4, 860 / d));
      return [Math.max((hx + kx) / 2 - 40, hx + 110 - 480 / z), z];
    },
    T.stop - 0.6,
    T.r0 + 0.2,
    7,
  );
  const kidCam: CamFn = (t) => {
    const [cx, z] = kidFit(t);
    return aim(cx, -380, 540, 1040, z * (1 + 0.04 * E.io(ph(t, T.pat, T.r0))));
  };
  const DRUM_KICK = (t: number) => 1 + 0.045 * Math.exp(-(t - T.drum) / 0.22) * (1 - Math.exp(-(t - T.drum) / 0.05));
  const groundChain = chain([
    [T.land + 0.25, brickCam, lin],
    [PUSH1, brickCam, lin],
    [T.drum, still({ ...brickEnd, z: brickEnd.z * 1.01 }), lin],
    [T.walk0 + 0.45, walkCam, E.io],
    [T.zhong - 0.45, walkCam, lin],
    // ⑨ 她抬头看见窗里的老钟：镜头顺着视线挤到两个人中间，看得清她在和谁打招呼
    [T.zhong + 0.25, greetCam, E.io],
    [T.stop - 0.2, greetCam, lin],
    [T.kidStop - 0.1, kidCam, E.io],
    [T.r0, kidCam, lin],
  ]);
  // ⑪ 升起来拉出全城：街上的一点从画面中间滑到最底下，倍数对数插值，先慢后快，卡小节停稳
  const K = (() => {
    const startCam = groundChain(T.r0);
    const A: V2 = [chenAt(T.r0).x - 80, -400];
    return { startCam, A, s0: toScreen(startCam, A[0], A[1]) };
  })();
  // 落地那一下画面往下一沉、往前顶 5% 再弹回来（两个人砸在地上的分量）
  const camRaw = (t: number): Cam => {
    const k = camBase(t);
    const a = kick(t, T.land, 0.12);
    return a < 0.001 ? k : { ...k, y: k.y - (16 * a) / k.z, z: k.z * (1 + 0.05 * a) };
  };
  const camBase = (t: number): Cam => {
    // ① 天上（最后往下甩）
    if (t < T.cut) return camS1(t);
    // ② 甩到街上、落到他身上，线性地慢慢逼近
    if (t < T.her) return arriveCam(t);
    // ③ 切到她，跟着她跑完；险：切到公文包砸地的近景，砸地那一下往前顶
    if (t < CASE_CUT) return herCam(t);
    // 远景和跟跑镜头差不多大，硬切像跳了一帧：0.12 秒接过去
    if (t < T.slam) return camLerp(herCam(t), caseFall(t), E.io(ph(t, CASE_CUT, CASE_CUT + 0.12)));
    if (t < RISE0) return caseHold(t);
    // ④⑤ 不切：从近景运镜到跟着两个人跳起、攥住、落下；落地时接上往砖推的镜头
    if (t < HOLD0) return camLerp(caseHold(t), herHold, E.io(ph(t, RISE0, HOLD0)));
    if (t < UP_GO) return herHold;
    if (t < T.launch + 0.24) return camLerp(herHold, actionCam(t), E.soft(ph(t, UP_GO, T.launch + 0.24)));
    if (t < T.land + 0.25) return camLerp(actionCam(t), brickCam(t), E.io(ph(t, T.land + 0.1, T.land + 0.25)));
    // ⑥–⑩ 地上：交砖、鼓点、她走过他、打招呼、小石头
    if (t < T.r0) {
      const k = groundChain(t);
      return t > T.drum ? { ...k, z: k.z * DRUM_KICK(t) } : k;
    }
    // ⑪ 拉出全城
    const { A, startCam, s0 } = K;
    const Z_END = 0.19;
    // 一开始就看得出在慢慢升（余韵，线性那一小份），中间越拉越快，卡小节停稳
    const x = ph(t, T.r0, T.r1);
    const p = 0.12 * E.settle(x) + 0.88 * E.io(Math.pow(x, 1.3));
    const driftK2 = ph(t, T.r1, T.end);
    const z = startCam.z * Math.pow(Z_END / startCam.z, p) * (1 + 0.025 * driftK2);
    return aim(A[0], A[1], s0[0] + (720 - s0[0]) * p, s0[1] + (1790 - s0[1]) * p - 30 * driftK2, z);
  };
  // 平静的段落里镜头像手持一样很轻地呼吸（画面上 3 像素、0.4% 以内），不会有一秒完全不动的死画面；
  // 天上屏着气、他往上飘（镜头一动不动）、跟着跑、险、跳起来拽人这些时候不加
  const calm = (t: number) =>
    fade(t, T.land + 0.3, T.land + 0.8) * (1 - fade(t, T.r0 + 0.2, T.r0 + 1.0));
  const breathe = (c: Cam, t: number): Cam => {
    const k = calm(t);
    if (k <= 0) return c;
    const dx = k * (3 * Math.sin(t * 0.83 + 0.4) + 2 * Math.sin(t * 1.37 + 2.1));
    const dy = k * (2.5 * Math.sin(t * 0.71 + 1.3) + 1.5 * Math.sin(t * 1.53));
    return { ...c, x: c.x + dx / c.z, y: c.y + dy / c.z, z: c.z * (1 + k * 0.004 * Math.sin(t * 0.57 + 0.8)) };
  };
  const camAt = (t: number): Cam => {
    const key = Math.round(t * 1000);
    const hit = memo.get(key);
    if (hit) return hit;
    const c = breathe(camRaw(t), t);
    if (memo.size > 400) memo.clear();
    memo.set(key, c);
    return c;
  };

  /** 跟着她跑、盯着公文包往下坠时背景拖多长（设计像素，横、竖）：画面的速度 ÷ 48 */
  const trackSmear = (t: number): V2 => {
    // 跟着公文包往下坠时竖着拖
    if (t < T.her || t >= T.slam) return [0, 0];
    const a = camAt(t);
    const b = t - 1 / 30 < T.her ? camAt(t + 1 / 30) : camAt(t - 1 / 30);
    const k = (a.z * 30) / 48;
    return [(a.x - b.x) * k, (a.y - b.y) * k];
  };
  const shakeAt = (t: number): [number, number] => {
    let k = 10 * kick(t, T.burn, 0.12) + 20 * kick(t, T.slam, 0.1) + 8 * kick(t, T.grab, 0.1) + 22 * kick(t, T.land, 0.1) + 6 * kick(t, T.drum, 0.12);
    for (let i = 0; i < BURNERS; i++) k += 4 * kick(t, T.beat(BURN_BEAT0 + i), 0.1) * ph(t, T.r0 + 0.5, T.r1);
    return shake(t, k);
  };

  // 光里的女人：像在水里，手臂一节一节地晚一点摆（肩 → 肘 → 手腕），腿慢慢地踢，头发在风里漂
  const womanPose = (t: number) => {
    const s = (f: number, p: number) => Math.sin(t * f + p);
    const fw = 3.4;
    return figurePose(
      {
        ...WOMAN_POSE,
        wind: WIND_SKY * 0.8,
        rot: 4 + 4 * s(1.6, 0),
        lean: -4 + 3 * s(1.2, 1),
        neck: 24 + 4 * s(1.4, 2),
        shoulderL: -128 + 10 * s(fw, 0),
        elbowL: -14 + 14 * s(fw, -0.9),
        wristL: -10 + 18 * s(fw, -1.8),
        shoulderR: 122 - 10 * s(fw * 0.92, 1),
        elbowR: 16 - 14 * s(fw * 0.92, 0.1),
        wristR: 10 - 18 * s(fw * 0.92, -0.8),
        ...legL(-10 + 9 * s(2.6, 0.4), -26 - 10 * (1 + s(2.6, -0.5)), -60),
        ...legR(8 + 9 * s(2.6, 2.4), -36 - 10 * (1 + s(2.6, 1.5)), -60),
      },
      t,
      lookOf(WOMAN),
    );
  };
  // 满天往上飘的人：同一种慢慢的摆，各人错开
  const floatPose = (spec: (typeof crowd)[number]["spec"], t: number, ph0: number) => {
    const s = (f: number, p: number) => Math.sin(t * f + ph0 + p);
    return figurePose(
      {
        ...FLOAT_POSE,
        wind: WIND_SKY,
        rot: 8 * s(0.7, 0),
        neck: 18 + 4 * s(0.9, 1),
        shoulderL: -110 + 10 * s(1.3, 0),
        elbowL: -20 + 12 * s(1.3, -0.9),
        shoulderR: 104 - 10 * s(1.2, 1),
        elbowR: 22 - 12 * s(1.2, 0.1),
        ...legL(-6 + 6 * s(1.5, 0.3), -30 - 8 * (1 + s(1.5, -0.6)), -60),
        ...legR(6 + 6 * s(1.5, 2.2), -40 - 8 * (1 + s(1.5, 1.4)), -60),
      },
      t + ph0,
      lookOf(spec),
    );
  };

  // ——— 画一帧（t 是画面里的时间：公文包砸地前那一下慢镜头已经算进去了） ———
  const drawFrame = (g: CanvasRenderingContext2D, t: number) => {
    const cam = camAt(t);
    const sh = shakeAt(t);
    const zl = (D = 1) => cam.z / D;
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    drawCity(
      g,
      base,
      cam,
      t,
      (D) => {
        if (D === 4 || D === 2.2) {
          // 远处天上也有人在往上飘：逆光的小剪影
          const v = viewOf(cam, D);
          for (const f of skyFloaters) {
            if (f.D !== D) continue;
            const y = f.y - f.v * t;
            if (f.x < v.x0 - 300 || f.x > v.x1 + 300 || y < v.y0 - 600 || y > v.y1 + 300) continue;
            // 身上一团暖光：远看像一盏盏灯，近了才看出是人
            const gr = g.createRadialGradient(f.x, y - f.h * 0.45, 0, f.x, y - f.h * 0.45, f.h * 0.7);
            gr.addColorStop(0, "rgba(255,226,170,0.5)");
            gr.addColorStop(1, "rgba(255,210,190,0)");
            g.fillStyle = gr;
            g.fillRect(f.x - f.h, y - f.h * 1.2, f.h * 2, f.h * 1.5);
            drawSilhouette(g, f.x, y, f.h, t, f.ph, D === 4 ? 0.4 : 0.62);
          }
        }
        if (D === WALKER_D && t < 4.6) {
          const v = viewOf(cam, D);
          for (const w of walkers) {
            const s = walkerAt(w, t);
            if (s.x < v.x0 - 200 || s.x > v.x1 + 200) continue;
            drawPerson(g, w.spec, s.pose, s.x, 0, zl(D));
          }
        }
      },
      sh,
    );
    applyCam(g, base, cam, 1, sh);
    const view = viewOf(cam, 1);
    // 最高那栋楼（她住在顶层）、老钟家（一楼窗后是老钟）
    if (TOWER.x < view.x1 && TOWER.x + TOWER.w > view.x0) {
      drawBlock(g, TOWER, cam, 1, 2, 3.2);
      if (view.y1 > TOWER_ROOF - 600 && view.y0 < TOWER_ROOF + 200) drawRoof(g, t);
    }
    if (HOUSE.x0 < view.x1 + 100 && HOUSE.x1 > view.x0 - 100) {
      drawHouse(g, t);
      if (WIN.x + WIN.w / 2 > view.x0 && WIN.x - WIN.w / 2 < view.x1) {
        const z = zhongMove(t);
        g.save();
        g.beginPath();
        g.rect(WIN.x - WIN.w / 2, WIN.top, WIN.w, WIN.sill - WIN.top);
        g.clip();
        // 屋里的地面比街高一点：窗台以下被墙挡住，只露出胸口以上
        drawPerson(g, OLD, z.pose, WIN.x - 20, -10, zl(), { hold: { L: cupHold } });
        g.restore();
      }
      drawWindowFront(g);
    }
    drawStreet(g, cam);
    // 跟着她跑：镜头横着走得很快（贴地拍靴子时每帧 160 像素），背景按 1/48 秒快门拖一下，不然一闪一闪的；盯着公文包往下坠时竖着拖
    const [smx, smy] = trackSmear(t);
    if (Math.hypot(smx, smy) > 3) {
      hctx.setTransform(1, 0, 0, 1, 0, 0);
      hctx.clearRect(0, 0, width, height);
      hctx.drawImage(g.canvas, 0, 0);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      const n = 9;
      const px = (smx * width) / W;
      const py = (smy * height) / H;
      for (let i = 1; i < n; i++) {
        g.globalAlpha = 1 / (i + 1);
        g.drawImage(hbuf, (i / (n - 1) - 0.5) * px, (i / (n - 1) - 0.5) * py);
      }
      g.restore();
    }
    // 满天往上飘的人（远时是逆光的剪影，镜头擦过时画完整的人）
    for (const p of crowd) {
      const y = crowdY(p, t);
      if (y === null) continue;
      if (p.x < view.x0 - 400 || p.x > view.x1 + 400 || y - 700 > view.y1 || y + 300 < view.y0) continue;
      // 天上的人画小一些（离得远）：全景里才不会比楼还大
      const k = CROWD_K;
      const px = 590 * k * cam.z;
      if (px < 170) drawSilhouette(g, p.x, y, 590 * k * p.spec.scale, t, p.ph, 0.7);
      else {
        g.save();
        g.translate(p.x, y);
        g.scale(k, k);
        drawPerson(g, p.spec, floatPose(p.spec, t, p.ph), 0, 280 * p.spec.scale, zl() * k);
        g.restore();
      }
    }
    // 光里的女人：从头顶开始一截一截化成光和浮尘
    if (t < T.burn + BURN_DUR + 0.05) {
      const h = womanHip(t);
      const pose = womanPose(t);
      const rootY = h[1] - (pose.hip?.[1] ?? -280.5) * WOMAN.scale;
      g.save();
      if (t > T.burn) {
        const line = W_HEAD - 200 + (W_FEET + 400 - W_HEAD) * ((t - T.burn) / BURN_DUR);
        g.beginPath();
        g.rect(h[0] - 2000, line, 4000, 4000);
        g.clip();
      }
      drawPerson(g, WOMAN, pose, h[0], rootY, zl());
      g.restore();
    }
    // 公文包（拎着的时候在近处那只手下面；扔出去以后在他和她之间）
    const bc = caseAt(t);
    // ——— 地上的影子：人站在地上才有分量（离地越高越淡、越小）；掉下来的公文包的影子越落越实——先告诉观众它会砸在哪 ———
    const c = chenAt(t);
    const zr = zRootAt(t);
    if (t >= T.cut) {
      if (c.x > view.x0 - 300 && c.x < view.x1 + 300) {
        const j = jointsOf(c.pose);
        const h = Math.max(0, -Math.max(j.ankleL[1], j.ankleR[1]) - 64);
        groundShadow(g, c.x + (j.ankleL[0] + j.ankleR[0]) / 2 + 16, 125 / (1 + h / 260), 0.26 / (1 + h / 200));
      }
      const zj = castJoints(ZHOU, zr.pose);
      const zh = Math.max(0, -(zr.y + Math.max(zj.ankleL[1], zj.ankleR[1])) - 60);
      const sit = t >= T.land;
      groundShadow(g, sit ? zr.x + 80 : zr.x + (zj.ankleL[0] + zj.ankleR[0]) / 2 + 16, sit ? 175 : 115 / (1 + zh / 260), sit ? 0.26 : 0.26 / (1 + zh / 200));
      if (t >= T.drop) {
        const bh = Math.max(0, -(bc.y + CASE.h / 2));
        const near = Math.max(0, 1 - bh / 900);
        groundShadow(g, bc.x + 10, 70 + 40 * near, t < T.slam ? 0.34 * near * near : 0.26);
      }
      if (t > kid0 - 0.2) {
        const k = kidAt(t);
        if (k.x > view.x0 - 300 && k.x < view.x1 + 300) {
          const kj = castJoints(STONE, k.pose);
          const kh = Math.max(0, -Math.max(kj.ankleL[1], kj.ankleR[1]) - 40);
          g.save();
          g.translate(0, KID_Y);
          groundShadow(g, k.x + (kj.ankleL[0] + kj.ankleR[0]) / 2 + 12, 80 / (1 + kh / 200), 0.24 / (1 + kh / 150));
          g.restore();
        }
      }
    }
    const brickPos = { p: null as V2 | null };
    // 砖落进手里先暖一点，鼓进来那一拍整个亮起来
    const warm = () => E.out(ph(t, T.take - 0.02, T.take + 0.45));
    const worldM = g.getTransform();
    const caseHold: HoldFn = (c, _hand, _mir, info) => {
      if (info.layer !== "back") return;
      c.save();
      c.setTransform(worldM);
      drawBriefcase(c, bc.x, bc.y, bc.r, bc.open);
      c.restore();
    };
    // 落地以后他坐在她前面（靠镜头一点）：先画她，再画他；她往前走时从他身后经过。托着的砖等两个人都画完再画
    const late: (() => void)[] = [];
    const drawHer = () => {
      if (c.x < view.x0 - 400 || c.x > view.x1 + 400) return;
      const hasBrick = t >= T.pull && t < T.take;
      g.save();
      g.translate(c.x, 0);
      drawChengtuo(g, c.pose, { line: 1 / Math.sqrt(cam.z), hold: hasBrick ? { L: brickHold(() => 0, brickPos, late) } : undefined });
      g.restore();
    };
    const drawHim = () => {
      if (t < T.cut) return;
      drawPerson(g, ZHOU, zr.pose, zr.x, zr.y, zl(), t >= T.take ? { hold: { L: brickHold(warm, brickPos, late) } } : t < T.drop ? { hold: { L: caseHold } } : {});
    };
    if (t >= T.drop) {
      // 掉得越快、身后拖的几道速度线越长（擦过她身边那一下看得出有多快、多沉）
      if (t < T.slam) {
        const v = G * (t - T.drop);
        const len = Math.min(320, v * 0.12);
        if (len > 20) {
          g.save();
          g.strokeStyle = "rgba(90,70,60,0.35)";
          g.lineCap = "round";
          g.lineWidth = 4;
          g.beginPath();
          for (const dx of [-CASE.w * 0.32, 0, CASE.w * 0.32]) {
            const top = bc.y - CASE.h / 2 - 18;
            g.moveTo(bc.x + dx, top);
            g.lineTo(bc.x + dx, top - len * (dx === 0 ? 1 : 0.7));
          }
          g.stroke();
          g.restore();
        }
      }
      // 掉着的时候画在人前面（擦过他的鞋、她的手），砸到地上以后在人后面
      if (t >= T.slam) drawBriefcase(g, bc.x, bc.y, bc.r, bc.open);
      drawPapers(g, t);
    }
    if (t >= T.land) {
      drawHer();
      drawHim();
    } else {
      drawHim();
      drawHer();
    }
    for (const f of late) f();
    if (t >= T.drop && t < T.slam) drawBriefcase(g, bc.x, bc.y, bc.r, bc.open);
    // 小石头
    if (t > kid0 - 0.2) {
      const k = kidAt(t);
      if (k.x > view.x0 - 300 && k.x < view.x1 + 300) drawPerson(g, STONE, k.pose, k.x, KID_Y, zl());
    }
    // 砸地的一下：拍起一小圈尘土
    if (t >= T.slam && t < T.slam + 1.2) {
      const a = t - T.slam;
      const r = seeded(8);
      for (let i = 0; i < 16; i++) {
        const dir = r() < 0.5 ? -1 : 1;
        const sp = 90 + r() * 260;
        const x = X_LAND + dir * (40 + sp * (1 - Math.exp(-a / 0.25)) * 0.6);
        const y = -8 - (30 + r() * 80) * (1 - Math.exp(-a / 0.2)) + 40 * a * a;
        const s = (8 + r() * 16) * (0.6 + a);
        g.globalAlpha = Math.max(0, 0.5 * (1 - a / 1.2));
        g.fillStyle = r() < 0.5 ? "#d8c9ba" : "#c6b5a6";
        g.beginPath();
        g.arc(x, y, s, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    // 刹车：前面那只铁靴往前滑，靴底扬起灰
    if (t >= T_BRAKE && t < T_BRAKE + 0.7) {
      const a = t - T_BRAKE;
      const r = seeded(13);
      const x0 = c.x - 150;
      for (let i = 0; i < 10; i++) {
        const born = r() * 0.18;
        const age = a - born;
        if (age < 0) continue;
        const x = x0 + 60 - r() * 120 + 160 * (1 - Math.exp(-age / 0.3)) * (r() - 0.2);
        const y = -6 - (20 + r() * 60) * (1 - Math.exp(-age / 0.25)) + 30 * age * age;
        g.globalAlpha = Math.max(0, 0.45 * (1 - age / 0.5));
        g.fillStyle = r() < 0.5 ? "#d8c9ba" : "#c6b5a6";
        g.beginPath();
        g.arc(x, y, (7 + r() * 12) * (0.6 + age * 1.5), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    // 两个人落地：她的铁靴扬起一小圈尘土
    if (t >= T.land && t < T.land + 0.9) {
      const a = t - T.land;
      const r = seeded(19);
      for (let i = 0; i < 14; i++) {
        const dir = r() < 0.5 ? -1 : 1;
        const x = c.x + dir * (30 + (80 + r() * 200) * (1 - Math.exp(-a / 0.25)) * 0.6);
        const y = -8 - (30 + r() * 70) * (1 - Math.exp(-a / 0.2)) + 40 * a * a;
        const s = (8 + r() * 16) * (0.6 + a);
        g.globalAlpha = Math.max(0, 0.42 * (1 - a / 0.9));
        g.fillStyle = r() < 0.5 ? "#d8c9ba" : "#c6b5a6";
        g.beginPath();
        g.arc(x, y, s, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    // 女人化成的光：先是彩色的碎光，再变成暖色的浮尘慢慢落下（白底上也看得见）
    if (t > T.burn - 0.01 && t < T.cut) {
      g.save();
      for (const p of burnBits) {
        const a = t - p.t0;
        if (a < 0) continue;
        const k = 1 - Math.exp(-a / 0.4);
        const x = p.x + p.vx * 0.4 * k + 30 * Math.sin(a * 2 + p.hue);
        const y = p.y + p.vy * 0.4 * k + 50 * a * a;
        const s = p.s * (1 - 0.4 * Math.min(1, a));
        const tw = 0.65 + 0.35 * Math.sin(a * 6 + p.hue);
        g.globalAlpha = Math.max(0, Math.min(1, 1.5 - a * 0.3)) * tw;
        const hue = a < 0.5 ? p.hue : 30;
        const sat = a < 0.5 ? 85 : 45;
        g.fillStyle = `hsl(${hue}, ${sat}%, ${a < 0.5 ? 72 : 78}%)`;
        g.save();
        g.translate(x, y);
        g.rotate(a * 2 + p.hue);
        g.beginPath();
        g.moveTo(-s * 0.5, 0);
        g.lineTo(0, -s * 0.5);
        g.lineTo(s * 0.5, 0);
        g.lineTo(0, s * 0.5);
        g.closePath();
        g.fill();
        g.restore();
      }
      g.restore();
    }
    // 近景：比人离镜头更近的一层（虚一点）
    if (t >= T.cut) {
      applyCam(g, base, cam, FG_D, sh);
      const fv = viewOf(cam, FG_D);
      for (const f of FOREGROUND) {
        if (f.x < fv.x0 - 300 || f.x > fv.x1 + 300) continue;
        drawForegroundItem(g, f.kind, f.x, t);
      }
      applyCam(g, base, cam, 1, sh);
    }
    drawMotes(g, cam, t, 1, 1, 0.85);
    applyCam(g, base, cam, 0.7, sh);
    drawMotes(g, cam, t + 3.1, 0.7, 1.8, 0.5);
    // 光：斜照进来的暖光（离白越近越淡）、暖色、颗粒、暗角
    drawSunbeams(g, base, cam, t, clamp01(1 - (-cam.y - 3000) / 4000));
    // 砖暖起来：只把亮处提暖（soft-light），砖本身一小团光
    if (brickPos.p && t >= T.take - 0.05) {
      const w = warm();
      const [bx, by] = brickPos.p;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.save();
      g.globalCompositeOperation = "soft-light";
      const R = 520 * (width / W) * (0.6 + 0.4 * w);
      const gr = g.createRadialGradient(bx, by, 0, bx, by, R);
      gr.addColorStop(0, `rgba(255,170,80,${0.85 * w})`);
      gr.addColorStop(1, "rgba(255,170,80,0)");
      g.fillStyle = gr;
      g.fillRect(bx - R, by - R, R * 2, R * 2);
      g.globalCompositeOperation = "lighter";
      const r2 = 120 * (width / W);
      const g2 = g.createRadialGradient(bx, by, 0, bx, by, r2);
      g2.addColorStop(0, `rgba(255,190,110,${0.35 * w})`);
      g2.addColorStop(1, "rgba(255,190,110,0)");
      g.fillStyle = g2;
      g.fillRect(bx - r2, by - r2, r2 * 2, r2 * 2);
      g.restore();
    }
    drawGrade(g, base, grain, 1, 0.16);
    // 白、碰到白的光圈、闪一下（白不在纸上：画在颗粒之后）
    let flash = 0.5 * kick(t, T.burn, 0.14);
    for (let i = 0; i < BURNERS; i++) flash += 0.08 * kick(t, T.beat(BURN_BEAT0 + i), 0.12) * ph(t, T.r0 + 0.5, T.r1);
    drawWhite(g, base, cam, t, flash);
    if (t < T.cut) drawBurst(g, base, cam, WX, W_HEAD, t - T.burn, 1.3);
    for (const p of crowd) if (p.tb < 1e8 && t >= p.tb) drawBurst(g, base, cam, p.x, whiteEdge(p.x, t), t - p.tb, 0.45);
  };

  return {
    canvas,
    render(wallT) {
      const t = wallT;
      // 竖向拖影：按每帧镜头的竖向位移（画面像素），慢的跟镜不拖；切镜头那一帧、拉出全城不拖
      // 切镜头那一帧按切过去以后的镜头算（往下甩：切到街上那一帧也拖着）
      const t0 = wallT - 1 / 30;
      const cutFrame = t >= T.cut && t0 < T.cut;
      const c1 = camAt(t);
      const c0 = cutFrame ? camAt(t + 1 / 30) : camAt(t0);
      const dy = (cutFrame ? c0.y - c1.y : c1.y - c0.y) * c1.z;
      // 砸地那一下要看清：前后不拖
      const nearSlam = t > T.slam - 0.03 && t < T.slam + 0.35;
      // 只在往下甩的时候拖；跟着跑、跳起来拽人（要看清动作）、推近、拉出全城不拖
      const falling = t > T.whip && t < T.cut + 0.25;
      const blur = !falling || nearSlam ? 0 : Math.min(260, Math.max(0, Math.abs(dy) - 30) * 0.9);
      if (blur < 4) {
        drawFrame(ctx, t);
      } else {
        drawFrame(bctx, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(buf, 0, 0);
        const n = 9;
        const px = (blur * height) / H;
        for (let i = 1; i < n; i++) {
          ctx.globalAlpha = 1 / (i + 1);
          ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * px);
        }
        ctx.globalAlpha = 1;
      }
      for (const n of notes) drawNote(ctx, base, n, wallT);
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
      hbuf.width = hbuf.height = 1;
    },
  };
}
