// B 站封面 4:3「千线」（海报几版之一，共用画法见 B站海报画法.ts）。
// 夜里满城的人往天上的强光里飘（这里的人一绝望就会飘起来、碰到白就化成灰），每个人脚上拴着一根红绳，红绳全攥在楼顶上
// 一个女孩举起的拳头里——她穿着插着砖的铁靴，仰着头，一个人把全城往下拽。字「城里人都说，她是 / 最沉的人」：
// 画面先让人看见「这么多人在飘、只有她站着」，字再点一句「最沉」，为什么是她、绳子那头的人怎么了，点进去才知道。
// 构图：天顶是成片里那片白（下沿起伏、一圈彩光，碰到就化成灰），往上飘的人背着白是暗的剪影，越高越小；红绳从右边她的拳头里
// 一根根扇开、伸到他们脚上（线都指向她）；她迎着光仰头，头发和围巾被风吹到身后；字在左下城市上空的暗处。白的下沿放在 y 150：
// 裁成 16:9 时上沿还看得见一线白。片子里没有这一幕（成片是她一个个去拽、红绳拴在各家窗上），这是把两件事
// 合成一张海报。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { passerby } from "@materials/剪纸角色/code/cast";
import { coverScene } from "./B站封面画法";
import { bloom } from "./小红书封面画法";
import {
  type V2,
  floatPose,
  grain,
  heroine,
  litFigure,
  loadPosterFont,
  motes,
  person,
  posterLine,
  radial,
  seeded,
  silhouette,
  skyline,
  dissolve,
  thread,
  vertical,
  vignette,
  whiteCeiling,
} from "./B站海报画法";

export const still: Still = { width: 1440, height: 1080 };

/** 天顶的白的下沿 */
const WHITE_Y = 150;
/** 她：两脚之间的地面、倍数（铁靴底在 16:9 的下沿 945 以内：裁成 16:9 也看得见整双铁靴） */
const HER: V2 = [1060, 936];
const HER_S = 1.0;

/** 夜空：白下面被照得发亮的冷紫，往下是深蓝紫，城市上空一层暗暗的紫红 */
function sky(g: CanvasRenderingContext2D) {
  vertical(g, [0, 0, 1440, 1080], [
    [0, "#8e86cf"],
    [0.16, "#7a71be"],
    [0.3, "#4c468b"],
    [0.52, "#2c2959"],
    [0.75, "#1f1b43"],
    [1, "#2c1f3e"],
  ]);
}

/** 往上飘的人：近的三个用骨架画（背着光：蒙一层夜色、脚下更暗、迎光一道细边、背后一圈虚的光），中间的用成片的剪影，
 *  最远的一大片小剪影贴着光（不拴绳）。返回红绳拴的地方（脚踝），由远到近 */
/** 最远：贴着白的下沿一大片小剪影，越靠近白越小、越淡（不拴绳） */
function farCrowd(g: CanvasRenderingContext2D) {
  const r = seeded(31);
  for (let i = 0; i < 72; i++) {
    const x = -20 + r() * 1480;
    const u = Math.pow(r(), 1.5);
    const y = WHITE_Y + 34 + u * 300;
    if (x > 1180 && y > 260) continue;
    const h = 6 + u * 22 + r() * 4;
    silhouette(g, x, y, h, r() * 6, 0.25 + 0.5 * u + 0.15 * r(), "46,38,86", 0.25);
  }
}

function crowd(g: CanvasRenderingContext2D, k: number): [V2, number][] {
  const feet: [V2, number][] = [];
  // 中间：大一点的剪影，拴着红绳（[x, y, 身高]，越高越远越小）
  const mids: [number, number, number][] = [
    [470, 230, 40], [140, 250, 44], [270, 330, 54], [650, 290, 52], [880, 245, 42], [1160, 270, 40],
    [440, 400, 66], [110, 440, 76], [720, 450, 64],
  ];
  mids.forEach(([x, y, h], i) => {
    silhouette(g, x, y, h, i * 1.7, 0.95, "32,24,62", 0.5);
    const s = h / 140;
    feet.push([[x - 9 * s, y + 86 * s], h]);
  });
  // 近的：三个路人（骨架）——[脚的位置 x, y、倍数、路人号、朝向]
  const near: [number, number, number, number, number][] = [
    [800, 380, 0.22, 1, 0.35],
    [570, 560, 0.28, 6, -0.45],
    [300, 590, 0.32, 3, 0.55],
  ];
  near.forEach(([x, y, s, n, face], i) => {
    const p = person(passerby(n), floatPose(face, i % 2 ? -1 : 1));
    litFigure(g, k, (h) => p.draw(h, x, y, s), {
      tint: ["#2a2450", 0.5],
      shade: ["#1a1434", 0.7],
      top: y - 560 * s,
      bottom: y,
      rim: ["#efeaff", 0.6],
      dir: [0.6, 1.8],
      aura: ["#bdb4ff", 0.28, 10],
    });
    feet.push([p.at(x, y, s, "ankleR"), 600 * s]);
  });
  return feet;
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k) => {
    await loadPosterFont();
    sky(g);
    skyline(g, 7, [
      [1000, 90, 230, "#2c2244", 0.05, "rgba(64,46,90,0.55)"],
      [1045, 50, 170, "#211933", 0.08, "rgba(40,28,60,0.4)"],
      [1080, 30, 110, "#160f24", 0.1, null],
    ]);
    farCrowd(g);
    // 暗角只压背景（城、远处的人），白和人后画
    vignette(g, 720, 420, 460, 1050, "rgb(40,24,56)", 0.7);
    const cols: [number, number][] = [[60, 70], [330, 110], [610, 60], [860, 120], [1150, 80]];
    const edge = whiteCeiling(g, WHITE_Y, 760, 1, cols);
    motes(g, 620, WHITE_Y + 120, 700, 140, 5, 0.6);
    // 几个刚碰到白的人，正散成光点
    [[205, 15, 3], [690, 12, 8], [1060, 16, 11], [455, 10, 14]].forEach(([x, r, sd]) => dissolve(g, x, edge(x) + 6, r, sd));
    const feet = crowd(g, k);
    const her = heroine({
      face: -0.72,
      expression: "坚定",
      neck: 34,
      lean: -6,
      lookX: -0.4,
      lookY: -1,
      shoulderR: 162,
      elbowR: 10,
      wristR: 0,
      handR: "grip",
      shoulderL: -12,
      elbowL: 24,
      handL: "fist",
      hipR: 14,
      kneeR: -10,
      ankleR: -4,
      hipL: -12,
      kneeL: -6,
      ankleL: 18,
      wind: 1.1,
    });
    const fist = her.at(...HER, HER_S, "palmR");
    // 红绳：从她的拳头扇出去，越远越细，中间稍微垂一点
    for (const [f, h] of feet) {
      const d = Math.hypot(f[0] - fist[0], f[1] - fist[1]);
      thread(g, fist, f, Math.max(1.1, Math.min(2.6, h / 70)), d * 0.05, true, 0.8);
    }
    // 她站的楼顶：右边一截暗的，上沿迎着光有一线亮
    g.fillStyle = "#120c1e";
    g.fillRect(800, HER[1] - 2, 700, 200);
    g.fillStyle = "rgba(200,190,250,0.32)";
    g.fillRect(800, HER[1] - 2, 700, 2);
    litFigure(g, k, (h) => her.draw(h, ...HER, HER_S), {
      tint: ["#3a3272", 0.12],
      shade: ["#2a1c44", 0.55],
      top: HER[1] - 420,
      bottom: HER[1],
      rim: ["#f2eeff", 0.7],
      dir: [1.2, 2.2],
      aura: ["#b9b0ff", 0.32, 16],
    });
    // 拳头那里红绳攥成一把，亮一点
    radial(g, ...fist, 70, [
      [0, "rgba(255,120,100,0.28)"],
      [1, "rgba(255,120,100,0)"],
    ]);
    bloom(g, k);
    posterLine(g, k, { text: "城里人都说，她是", x: 380, y: 655, size: 62, tracking: 0.12 });
    posterLine(g, k, { text: "最沉的人", accent: "最沉", x: 380, y: 785, size: 150, tracking: 0.08 });
    grain(g, 0.05);
  });
}
