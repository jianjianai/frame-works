// 检查页（不在时间轴上）：1:34.92–2:32 重做方案的试画，给用户审方案用。
// 0 地图和占位（整条竖线：她的窗 → 抱住 → 停住、交靴 → 老钟窗边 → 楼顶栏杆）　1 楼顶倒挂：她抓住楼顶栏杆，他升到跟前　2 人链远景：随风往左偏、下半截摆
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, CHENGTUO, type PoseIn, drawChengtuo, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, H, W, applyCam, toScreen } from "../lib/cam";
import { INK, TOWER, Y_WHITE, drawStreet, drawTinted, makeGrain, part, prepareCity, rectPath, setDusk } from "../lib/world";
import { makeStage } from "../lib/stage";
import { ZHONG_HOUSE, ZHONG_NEIGHBORS, pose } from "../lib/dawn";
import { TOWER_ROOF, drawHouse, drawHouseWindowFront } from "../lib/props";
import { drawPerson } from "../lib/people";
import { armL, armR, legL, legR } from "../lib/poses";
import { loadHandFont } from "../lib/note";
import { STUDENT, UNCLE } from "../lib/saved";
import { drawHerBrick } from "../lib/write5";
import { setCage, setHomeLamp } from "../lib/night";

type V2 = [number, number];

export const sample: Sample = { duration: 3 };

// ——— 占位（世界坐标，街面 y = 0） ———
/** 他站的地方：老钟家左边那一截墙前面，窗的左边（他妈妈的外套、铁靴、跺出来的坑都在这） */
const X_K = -1900;
/** 抱住：楼的一半，他被风往左带了 300 */
const CATCH: V2 = [-2200, -4270];
/** 她的窗：顶层最右那扇（玻璃中心） */
const HER_WIN: V2 = [-2915, -8290];
/** 楼顶栏杆的右角（栏杆顶） */
const RAIL_TOP = TOWER_ROOF - 96;
const CORNER: V2 = [TOWER.x + TOWER.w - 14, RAIL_TOP];
/** 老钟家一楼那扇窗（中心） */
const ZW = ZHONG_HOUSE.win;
const BS = 1 / 1.22;

const WIND = -0.9;
const SHE_ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: false, bricks: 0 };
const STONE: CastSpec = { ...CAST.小石头, coat: undefined };

/** 楼顶栏杆补到右边的角上（原来只到 x0 + 700） */
function drawRailExt(g: CanvasRenderingContext2D) {
  const y = TOWER_ROOF;
  const x0 = TOWER.x + 700;
  const x1 = TOWER.x + TOWER.w - 10;
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x0, y - 96);
  g.lineTo(x1, y - 96);
  for (let x = x0 + 32; x < x1; x += 46) {
    g.moveTo(x, y);
    g.lineTo(x, y - 96);
  }
  g.moveTo(x1, y);
  g.lineTo(x1, y - 96);
  g.stroke();
  g.strokeStyle = "#a39a96";
  g.lineWidth = 2;
  g.stroke();
}

/** 她倒挂在楼顶栏杆上：两只手攥着栏杆，身子被白往上拽成倒立，脸朝下看着升上来的他 */
const HANG_HER: Angles = pose(0, {
  face: 0.3,
  ground: false,
  rot: 180,
  ...legL(-2, -6, -50),
  ...legR(6, -14, -50),
  neck: 30,
  expression: "忍着哭",
  tears: 1,
  lookX: 0.2,
  lookY: -1,
}, (l) => ({ ...armL(172, 6, 0, "grip", l), ...armR(160, 8, 0, "grip", l) }));

/** 他往上升、两只手把砖举到她跟前（哭着笑） */
const KID_GIVE: Angles = pose(0, {
  face: -0.55,
  ground: false,
  ...legL(-10, -24, -30),
  ...legR(12, -40, -30),
  neck: 30,
  expression: "哭着笑",
  tears: 1,
  lookX: -0.3,
  lookY: -1,
}, (l) => ({ ...armL(150, 30, 0, "grip", l), ...armR(140, 34, 0, "grip", l) }));

/** 吊着的人：两只手举直攥着上面那个人的脚踝，腿垂着，仰着头 */
const hang = (face: number, k: number): Angles =>
  pose(0, {
    face,
    ground: false,
    ...legL(-6 + 4 * Math.sin(k * 1.7), -12 - 8 * Math.cos(k), -30),
    ...legR(8 + 5 * Math.sin(k * 2.3), -20 - 10 * Math.sin(k), -30),
    neck: 24,
    expression: k % 3 === 0 ? "使劲" : k % 3 === 1 ? "哭着笑" : "坚定",
    lookY: -1,
  }, (l) => ({ ...armL(178, 4, 0, "grip", l), ...armR(172, 6, 0, "grip", l) }));

/** 老钟、她救过的人，再加几个十二年里被她拽下来的人（远景里只看得出各不相同） */
const CHAIN: CastSpec[] = [
  CAST.老钟,
  CAST.周磊,
  CAST.千斤,
  CAST.千斤的妈妈,
  CAST.阿满,
  CAST.老太太,
  CAST.年轻人,
  UNCLE,
  STUDENT,
  passerby(3),
  passerby(6),
  passerby(13),
  passerby(20),
  passerby(9),
];

const withWind = (a: Angles, wind = WIND): PoseIn => figurePose({ wind, idle: false, ...a }, 0);

function midPalm(j: ReturnType<typeof castJoints>): V2 {
  return [(j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2];
}

/**
 * 一条人链：从 top（他的脚踝）往下，每个人的两只手攥在上面那个人的脚踝上，身子顺着这一节的方向（th：偏离竖直多少，正 = 下面往右）。
 * lean：整条往右下斜多少（上面在楼顶的角上，下面在老钟家那边）；sway：下半截摆到哪（−1..1），越往下摆得越开、晚一点
 */
function chainAt(top: V2, sway: number, lean: number) {
  const out: { spec: CastSpec; pose: PoseIn; at: V2; pm: V2; th: number }[] = [];
  let above = top;
  const n = CHAIN.length;
  CHAIN.forEach((spec, k) => {
    const d = (k + 1) / n;
    // th：这一节偏离竖直多少（正 = 下面往右），越往下摆得越开、晚一点
    const th = lean + 0.2 * sway * Math.sin(1.2 - k * 0.38) * Math.pow(d, 1.4);
    const face = k % 2 ? 0.45 : -0.45;
    const p = figurePose({ wind: WIND, ...hang(face, k) }, 0, lookOf(spec));
    const j = castJoints(spec, p);
    const pm = midPalm(j);
    const ank = face < 0 ? j.ankleR : j.ankleL;
    const v: V2 = [ank[0] - pm[0], ank[1] - pm[1]];
    // 手心对在上面那个人的脚踝上，整个人绕手心转 th（往右下斜：逆时针）
    const c = Math.cos(-th);
    const sn = Math.sin(-th);
    out.push({ spec, pose: p, at: above, pm, th });
    above = [above[0] + v[0] * c - v[1] * sn, above[1] + v[0] * sn + v[1] * c];
  });
  return out;
}
function drawChainMember(g: CanvasRenderingContext2D, m: ReturnType<typeof chainAt>[number], z: number) {
  g.save();
  g.translate(m.at[0], m.at[1]);
  g.rotate(-m.th);
  drawPerson(g, m.spec, m.pose, -m.pm[0], -m.pm[1], z);
  g.restore();
}

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
  const T = 100;

  /** 世界（天、城、楼、老钟家、街面） */
  const world = (cam: Cam, wide = 0) => {
    setHomeLamp(0);
    setCage(1);
    drawWorld(ctx, cam, T, [0, 0], undefined, wide);
    applyCam(ctx, base, cam, 1);
    drawTinted(ctx, [ZHONG_HOUSE.x0 - 120, ZHONG_HOUSE.top - 260, ZHONG_HOUSE.x1 + 160, 60], (gg) => {
      drawHouse(gg, ZHONG_HOUSE, T);
      drawHouseWindowFront(gg, ZHONG_HOUSE);
    });
    drawRailExt(ctx);
    drawStreet(ctx, cam);
  };

  /** 她倒挂在栏杆角上（两只手掌的中点对在栏杆顶上） */
  const drawHerHang = (z: number) => {
    const p = figurePose({ wind: WIND, float: 1, chestL: "under", chestR: "under", ...HANG_HER }, 0.4, CHENGTUO, SHE_ITEMS);
    const j = jointsOf(p);
    const pm: V2 = [(j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2];
    const root: V2 = [CORNER[0] - 40 - pm[0], CORNER[1] + 10 - pm[1]];
    drawTinted(ctx, [root[0] - 700, root[1] - 900, root[0] + 700, root[1] + 900], (gg) => {
      gg.save();
      gg.translate(root[0], root[1]);
      drawChengtuo(gg, p, { line: 1 / Math.sqrt(Math.max(0.3, z)) });
      gg.restore();
    }, 0.85);
    return { root, head: [root[0] + j.head[0], root[1] + j.head[1]] as V2 };
  };

  /** 他：手里举着她那块砖（「活下去」朝外） */
  const drawKidGive = (root: V2, z: number) => {
    const p = withWind(KID_GIVE);
    const j = castJoints(STONE, p);
    const pm = midPalm(j);
    drawTinted(ctx, [root[0] - 500, root[1] - 800, root[0] + 500, root[1] + 200], (gg) => {
      drawPerson(gg, STONE, p, root[0], root[1], z);
      drawHerBrick(gg, 200, [root[0] + pm[0], root[1] + pm[1] - 6], 0.12, BS, -1);
    }, 0.85);
    return { ankle: [root[0] + j.ankleR[0], root[1] + j.ankleR[1]] as V2 };
  };

  const label = (x: number, y: number, s: string, size = 30, color = "#2b2028", align: CanvasTextAlign = "left") => {
    ctx.setTransform(base);
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textAlign = align;
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(255,248,236,0.92)";
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  };
  const dot = (cam: Cam, p: V2, n: string, color: string) => {
    const [x, y] = toScreen(cam, p[0], p[1]);
    ctx.setTransform(base);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff8ec";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(n, x, y + 9);
    return [x, y] as V2;
  };
  const path = (cam: Cam, pts: V2[], color: string, w = 6, dash = [18, 12]) => {
    ctx.setTransform(base);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.setLineDash(dash);
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const [sx, sy] = toScreen(cam, x, y);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };
  /** 曲线上的点（二次贝塞尔） */
  const curve = (a: V2, c: V2, b: V2, n = 24): V2[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const u = i / n;
      return [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
    });

  const page0 = () => {
    const cam: Cam = { x: -2420, y: -4700, z: 0.194, r: 0 };
    world(cam, 0.7);
    // 人链（淡淡的，表示最后它在哪）
    applyCam(ctx, base, cam, 1);
    ctx.save();
    ctx.globalAlpha = 0.5;
    const her = drawHerHang(cam.z);
    const kidRoot: V2 = [her.head[0] + 120, her.head[1] + 330];
    applyCam(ctx, base, cam, 1);
    const kid = drawKidGive(kidRoot, cam.z);
    applyCam(ctx, base, cam, 1);
    for (const m of chainAt(kid.ankle, 0.6, 0.17)) drawChainMember(ctx, m, cam.z);
    ctx.restore();
    drawAir(ctx, cam, T, [0, 0], { vig: 0.12, warm: 0.9 }, 0, 0);
    // 路线
    const ORANGE = "#e2701f";
    const NAVY = "#24305e";
    path(cam, curve([X_K, -40], [X_K - 40, -2600], CATCH), ORANGE);
    path(cam, curve(HER_WIN, [HER_WIN[0] + 380, -6400], CATCH), NAVY);
    path(cam, curve(CATCH, [CATCH[0] + 40, -1800], [X_K, -120]), "#b0306a", 7, [6, 10]);
    path(cam, curve([X_K + 30, -500], [X_K - 120, -5200], [CORNER[0] + 40, CORNER[1] - 300]), NAVY, 4, [4, 12]);
    dot(cam, HER_WIN, "1", NAVY);
    dot(cam, [X_K, 0], "2", ORANGE);
    dot(cam, CATCH, "3", "#b0306a");
    dot(cam, [X_K + 10, -260], "4", "#b0306a");
    dot(cam, [ZW.x, (ZW.sill + ZW.top) / 2], "5", "#2f7d5b");
    dot(cam, [CORNER[0] + 10, CORNER[1] - 40], "6", NAVY);
    // 说明
    const lines: [string, string][] = [
      ["1", "她的窗 97.92 撞开扑出去"],
      ["2", "他起飞＝落地（老钟窗边）"],
      ["3", "楼的一半抱住 99.02"],
      ["4", "坠到离地一点 100.3 · 交靴"],
      ["5", "老钟从窗里抓住他 114.9"],
      ["6", "楼顶栏杆角：她倒挂 116.4"],
    ];
    ctx.setTransform(base);
    ctx.fillStyle = "rgba(255,248,236,0.86)";
    ctx.fillRect(650, 1060, 410, 350);
    lines.forEach(([n, s], i) => label(665, 1105 + i * 55, `${n} ${s}`, 24));
    label(540, 120, "新的占位：一条竖线上（风往左吹）", 40, "#2b2028", "center");
  };

  const page1 = () => {
    const cam: Cam = { x: -2690, y: -8640, z: 1.08, r: 0 };
    world(cam);
    applyCam(ctx, base, cam, 1);
    const her = drawHerHang(cam.z);
    applyCam(ctx, base, cam, 1);
    drawKidGive([her.head[0] + 150, her.head[1] + 360], cam.z);
    drawAir(ctx, cam, T, [0, 0], { vig: 0.16, warm: 0.9 }, 0, 0);
  };

  const page2 = () => {
    const cam: Cam = { x: -2300, y: -4900, z: 0.205, r: 0 };
    world(cam, 0.8);
    applyCam(ctx, base, cam, 1);
    const her = drawHerHang(cam.z);
    applyCam(ctx, base, cam, 1);
    const kid = drawKidGive([her.head[0] + 150, her.head[1] + 360], cam.z);
    applyCam(ctx, base, cam, 1);
    for (const m of chainAt(kid.ankle, 1, 0.17))
      drawTinted(ctx, [m.at[0] - 600, m.at[1] - 300, m.at[0] + 600, m.at[1] + 900], (gg) => drawChainMember(gg, m, cam.z), 0.85);
    drawAir(ctx, cam, T, [0, 0], { vig: 0.14, warm: 0.9 }, 0, 0);
  };

  return {
    canvas,
    render(time) {
      const page = Math.max(0, Math.min(2, Math.floor(time)));
      setDusk(0.4, 0.22);
      try {
        if (page === 0) page0();
        else if (page === 1) page1();
        else page2();
      } finally {
        setDusk(0);
        setHomeLamp(null);
        setCage(-0.32);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
void H;
void W;
void Y_WHITE;
void part;
void rectPath;
