// 四①「如果伤到你也请你忘记」（105.99–108.02；如 105.93 果 106.13 伤 106.33 到 106.53 你 106.73 也 106.93 请 107.13 你 107.33 忘 107.53 记 107.73，
// 约每字 0.2 秒；106.02、107.02 重拍）：天快亮。镜头从三⑨塞满砖的铁靴往上抬，抬的时候溶成仰头看天花板（和主歌二⑦⑧同一个画面、同一套坐标）：
// 两张倒钉着的床，她睡着，两个人隔着床缝还牵着手；他醒着，侧着身子蜷在被子里看着她。他轻轻把手从她手里抽出来，她的手指动了一下又松开，
// 空着的手还伸在缝上；他的手伸到被子里自己的脚踝那儿，把红绳拽下来——绳头从被子底下滑出来，顺着绳子掉下去；他最后看她一眼。
// 镜头抬完以后很慢地凑近她睡着的脸和那只空着的手。
// 屋子那边照三⑨的画法（lib/write5.ts 的 fullAway、lessonCam），仰头看的画面照主歌二的画法（lib/bed.ts 的 drawCeiling，换上这里的两个人和灯光）。

import { type MoveKey, type PoseIn, CHENGTUO } from "@materials/剪纸角色/code/chengtuo";
import { lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, ph } from "./cam";
import { ARMS, live } from "./motion";
import { legL, legR } from "./poses";
import { pose } from "./dawn";
import { CLASP, type CeilingCast, HER, HER_BED, HIS_BED, STONE_BED, placeHer, placeHim } from "./bed";
import { lessonCam } from "./write5";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const UNTIE_T = {
  start: 105.99,
  /** 溶成仰头看的天花板（时间跳到天快亮） */
  mix0: 105.99,
  mix1: 106.35,
  /** 镜头往上抬：从三⑨的取景柔和起步，溶完最快，一路减速 */
  tilt1: 106.95,
  /** 他把手从她手里抽出来（慢慢地，怕弄醒她） */
  slip0: 106.42,
  slip1: 106.84,
  /** 她的手指动了一下又松开 */
  twitch: 106.86,
  /** 他的手伸到被子里自己的脚踝那儿，攥住红绳往外一拽，绳头滑出来、掉下去 */
  reach1: 107.12,
  pull: 107.2,
  fall1: 107.52,
  /** 最后看她一眼 */
  look0: 107.42,
  look1: 107.72,
  /** 镜头凑近她的脸和空着的手 */
  push0: 107.3,
  end: 108.0,
};
const U = UNTIE_T;

/** 屋子那边往上抬了多少（画面像素）：两个画面一起用这一个量，溶的时候往同一个方向、同样快地走 */
const TILT_PX = 760;
const tiltPx = (t: number) => TILT_PX * E.settle(ph(t, U.start, U.tilt1));
/** 仰头看的画面盖上来多少 */
export const untieMix = (t: number) => E.soft(ph(t, U.mix0, U.mix1));

// ——— 两个人（天花板坐标） ———
/** 她睡着（和主歌二⑧最后一样，脸朝着他那边）；他抽走手以后手指动一下又松开，空着的手还伸在缝上 */
const herMove = live(
  [
    { t: 105.6, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: { ...HER.睡, headTurn: 0.5, smile: 0.5 } },
    { t: U.twitch - 0.04, p: { ...HER.睡, headTurn: 0.5, smile: 0.5 } },
    { t: U.twitch + 0.08, ease: "out", p: { ...HER.睡, headTurn: 0.46, smile: 0.4, handL: "fist" } },
    { t: U.twitch + 0.3, ease: "inOut", p: { ...HER.睡, headTurn: 0.48, smile: 0.4, handL: "relax" } },
    { t: 110, p: { ...HER.睡, headTurn: 0.48, smile: 0.4, handL: "relax" } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 191, springs: ARMS, follow: 0 },
);
/** 他醒着：侧着身子朝她蜷在被子里（腿收在被子里），看着她；最后那一眼忍着哭 */
const HIM_AWAKE = pose(0, { face: -0.55, headTurn: -0.05, ground: false, ...legR(96, -118, 0), ...legL(90, -110, 0), neck: 0, expression: "平常", smile: 0.1, blush: 0.4, lookX: -0.75, lookY: 0.05 }, () => ({
  shoulderL: 10,
  elbowL: 10,
  wristL: 0,
  handL: "relax",
  shoulderR: -30,
  elbowR: -20,
  wristR: 0,
  handR: "grip",
}));
const himMove = live(
  [
    { t: 105.6, x: 0, p: HIM_AWAKE },
    // 抽手：咬着嘴唇（忍着哭），手松开
    { t: U.slip0, p: HIM_AWAKE },
    { t: U.slip0 + 0.2, ease: "inOut", p: { ...HIM_AWAKE, expression: "忍着哭", handR: "relax" } },
    // 伸到脚踝那儿攥住红绳
    { t: U.reach1, ease: "inOut", p: { ...HIM_AWAKE, expression: "忍着哭", handR: "grip", lookX: -0.3, lookY: 0.6 } },
    { t: U.look0, p: { ...HIM_AWAKE, expression: "忍着哭", handR: "relax", lookX: -0.3, lookY: 0.6 } },
    // 最后看她一眼
    { t: U.look1, ease: "inOut", p: { ...HIM_AWAKE, expression: "含泪", lookX: -0.8, lookY: 0.05 } },
    { t: 110, p: { ...HIM_AWAKE, expression: "含泪", lookX: -0.8, lookY: 0.05 } },
  ] as MoveKey[],
  { look: lookOf(STONE_BED), base: { wind: 0 }, idle: true, seed: 193, springs: ARMS, follow: 0 },
);

/** 这一刻仰头看的画面里的两个人、灯光（天快亮：冷光差不多散了）、他的红绳解下来了多少 */
export function untieCast(t: number): CeilingCast {
  // 她：近处那只手一直伸在缝上（他抽走以后空着），远处那只在被子里
  const her = placeHer({ ...herMove(t).pose }, CLASP, [HER_BED.x0 + 70, -120]);
  // 他：先攥着她的手 → 抽回胸前 → 伸到被子里自己的脚踝那儿（在被子上面找到红绳）→ 攥着绳头一拽、松开，手收回来
  const chest: V2 = [HIS_BED.x0 + 70, -190];
  const probe = placeHim({ ...himMove(t).pose }, CLASP, [HIS_BED.x1 - 50, -150]);
  const ankle = probe.ankleR;
  let hand: V2 = CLASP;
  if (t > U.slip0) hand = mix(CLASP, chest, E.io(ph(t, U.slip0, U.slip1)));
  if (t > U.slip1) hand = mix(chest, [ankle[0] + 6, ankle[1] - 4], E.io(ph(t, U.slip1, U.reach1)));
  if (t > U.pull) hand = mix([ankle[0] + 6, ankle[1] - 4], [ankle[0] + 20, ankle[1] + 22], E.out(ph(t, U.pull, U.pull + 0.12)));
  if (t > U.look0) hand = mix([ankle[0] + 20, ankle[1] + 22], chest, E.io(ph(t, U.look0, U.look1)));
  const him = placeHim({ ...himMove(t).pose }, hand, [HIS_BED.x1 - 50, -150]);
  // 侧着身子（face −0.55）时素材库把这只手臂当成远处那只画在身子后面：写 layer front，画在被子外面
  him.pose.armR = { ...(him.pose.armR as object), layer: "front" } as PoseIn["armR"];
  // 天快亮：冷光散了，屋里一点点亮起来，晨光从脚那头往上爬（按主歌二⑧天亮那几秒的灯光，爬不到她的脸上）
  return { her, him, lightT: 87.05 + 0.25 * ph(t, U.start, U.end), untie: ph(t, U.pull, U.fall1) };
}

/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/** 屋子那边（三⑨的镜头）往上抬：对准点往上挪「抬了的像素 ÷ 倍数」 */
export function roomTiltCam(t: number): Cam {
  const c = lessonCam(t);
  return { ...c, y: c.y - tiltPx(t) / c.z };
}
/**
 * 仰头看的镜头（天花板坐标）：和屋子那边一起往上抬（从脚那头顺着绳子往上），落在两张脸、牵着的手和他的脚踝上（2.1 倍）；
 * 抬完以后叠手持呼吸，107.3 起很慢地凑近她睡着的脸和那只空着的手（E.io，凑到 2.5 倍），不往回拉
 */
export function untieCam(t: number): Cam {
  const z0 = 2.1;
  const off = (TILT_PX - tiltPx(t)) / z0;
  const h = ph(t, U.tilt1 - 0.3, U.tilt1 + 0.2);
  const [bx, by] = breath(t);
  const k = E.io(ph(t, U.push0, U.end + 0.5));
  const z = z0 * Math.pow(2.5 / z0, k);
  // 凑近的对准点：她的脸和空着的手中间
  const x = 0 + (-50 - 0) * k;
  const y = -215 + (-257 - -215) * k;
  return { x: x + (h * bx) / z, y: y + off + (h * by) / z, z, r: 0 };
}
