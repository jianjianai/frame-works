/**
 * 爸爸（《屏蔽》work-73c8f9bc）：五十多岁的夜班保安。花白短发和鬓角、厚眉、带鱼尾纹和眼袋的眼睛、鼻唇沟、下巴上的胡茬，
 * 老花镜，保安大檐帽（金色帽徽和帽绳），深蓝制服（浅蓝衬衫、领带、肩章、胸前的徽章），肩上披着带毛领的军大衣。
 * 正面 / 背影，几种手的动作（垂着、两手捧手机、一根手指打字、捂嘴），年轻版（黑发、白衬衫，用在旧合照里）。
 * drawDad(ctx, x, y, s, pose)：(x, y) = 头中心，s = 1 时脸宽约 236（和 kid.ts 的主角一样大）。手一律是简单的圆手。
 * 和 kid.ts 同一套画法；打光（手机照脸、轮廓光）用 draw.ts 的 figureMask / onFigure / rimLight 在外面加。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, Pt, beginFrame, blob, curve, hash, inkLine, lerp2, oval, paint, poly, rbox, shaded, tubePts } from "../draw";
import { phoneBack } from "../phone";

const point = z.tuple([z.number(), z.number()]);

export const dadPose = z.object({
  view: z.enum(["front", "back"]).default("front").describe("正面 / 背影"),
  body: z.enum(["head", "bust"]).default("bust").describe("只画头 / 半身"),
  backDetails: z.boolean().default(false).describe("背影精细纹理：帽子拼缝、花白短发、毛领、大衣肩线和半腰带"),
  frontDetails: z.boolean().default(false).describe("正面近景：帽徽织纹、老花镜五金、鬓角、制服缝线与毛领，保留圆手"),
  screenReflection: z.number().min(0).max(1).default(0).describe("精细老花镜里的局部屏幕倒影，保留瞳孔，不用整片光晕"),
  eyes: z.enum(["open", "tired", "wide", "shut", "teary", "down", "happy"]).default("tired").describe("眼睛：tired 熬夜的厚眼皮、down 低头看手机、teary 含泪、happy 笑眯眼"),
  look: point.optional().describe("瞳孔看向 [x, y]，各 -1..1"),
  brows: z.enum(["flat", "sad", "up", "worried"]).optional().describe("眉毛；不写时跟着眼睛（teary→sad，wide→up）"),
  mouth: z.enum(["flat", "frown", "o", "smile", "laugh", "wobble", "press"]).default("flat").describe("嘴：press 抿嘴、wobble 忍着哭、laugh 大笑"),
  tears: z.number().min(0).max(1).default(0).describe("眼泪流下来的长度"),
  tilt: z.number().min(-0.6).max(0.6).default(0).describe("歪头（弧度）"),
  headY: z.number().min(-80).max(80).default(0).describe("头相对身体上下移（低头、叹气）"),
  glasses: z.boolean().optional().describe("老花镜（默认戴，年轻版不戴）"),
  cap: z.boolean().optional().describe("保安帽（默认戴，年轻版不戴）"),
  coat: z.boolean().optional().describe("披着带毛领的军大衣（正面默认不披，背影默认披）"),
  young: z.boolean().default(false).describe("年轻版：黑发、光滑的脸、白衬衫、不戴帽子和眼镜（旧合照里）"),
  arms: z.enum(["down", "phone", "type", "mouth", "none"]).default("down").describe("手：垂着（不画）/ 两手捧手机 / 一根手指打字 / 右手捂嘴、左手低低拿着手机"),
  tap: z.number().min(0).max(1).default(0).describe("打字的手指按下去（arms: type）"),
  mouthK: z.number().min(0).max(1).default(1).describe("arms: mouth 时右手从手机抬到嘴边的进度（0 还捧着手机，1 捂住嘴）：做抬手、放下的动画，不要在两种手势之间直接切换"),
  seed: z.number().int().default(4100).describe("抖动线条的种子"),
});
/** drawDad's pose. `holding` is drawn between the sleeves and the hands (the phone in his hands). */
export type DadPose = z.input<typeof dadPose> & {
  /** drawn between the arms and the hands (the phone in his hands) */
  holding?: (c: Ctx) => void;
};

const D = {
  skin: "#eac49a",
  skinSh: "#d4a874",
  skinDeep: "#b88859",
  youngSkin: "#f1d2a6",
  hair: "#a3a5ab",
  hairDk: "#717379",
  youngHair: "#2a2220",
  brow: "#4a4643",
  cap: "#1f2b47",
  capDk: "#141c31",
  visor: "#0d121f",
  gold: "#e2b64a",
  goldDk: "#a9822c",
  uni: "#2b3b5a",
  uniDk: "#1d2943",
  shirt: "#bccde3",
  tie: "#18213a",
  coat: "#5a6a3c",
  coatDk: "#434f2c",
  fur: "#cfba8f",
  furDk: "#a68f66",
  whiteShirt: "#f4f2ea",
  iris: "#3a2a1f",
  irisHi: "#6b5038",
  eyeWhite: "#f5f0e4",
};

const FACE: Pt[] = [
  [-62, -104], [-106, -70], [-118, -16], [-117, 40], [-108, 86], [-84, 116], [-46, 132], [0, 137],
  [46, 132], [84, 116], [108, 86], [117, 40], [118, -16], [106, -70], [62, -104], [0, -112],
];

// ---------------------------------------------------------------- face parts
const OPEN: Record<string, [number, number]> = {
  // [openness, slant (+ = inner corner up = sad)]
  open: [0.66, 0],
  tired: [0.4, 0.3],
  wide: [0.98, 0],
  teary: [0.6, 1],
  down: [0.42, 0],
};

function eye(c: Ctx, cx: number, cy: number, side: number, p: DadPose, seed: number) {
  const st = p.eyes ?? "tired";
  const lineCol = C.ink;
  if (st === "shut" || st === "happy") {
    if (st === "happy") inkLine(c, [[cx - 28, cy + 8], [cx, cy - 6], [cx + 28, cy + 8]], seed, 5);
    else inkLine(c, [[cx - 28, cy + 2], [cx - 4, cy + 10], [cx + 26, cy + 4]].map(([x, y]) => [cx + (x - cx) * side, y]) as Pt[], seed, 5);
    // laughing / shut eyes still crinkle
    for (let k = 0; k < 3; k++) inkLine(c, [[cx + 32 * side, cy - 4 + k * 8], [cx + 44 * side, cy - 8 + k * 10]], seed + 4 + k, 2.2, "rgba(150,100,60,0.7)");
    inkLine(c, [[cx - 18 * side, cy + 24], [cx + 16 * side, cy + 24]], seed + 9, 2, "#b08a66");
    return;
  }
  const [open, slant0] = OPEN[st] ?? OPEN.tired;
  const slant = slant0 * 7;
  const look = st === "down" ? [p.look?.[0] ?? 0, 0.9] : (p.look ?? [0, 0]);
  const w = 29;
  const inner = cx - w * side,
    outer = cx + w * side;
  const upTop = cy - 20 * open;
  const lower: Pt[] = [[outer, cy + 4], [cx + 13 * side, cy + 13], [cx - 11 * side, cy + 14], [inner, cy + 4]];
  const upper: Pt[] = [[inner, cy + 3 - slant * 0.3], [cx - 13 * side, upTop - slant * 0.9], [cx + 11 * side, upTop + slant * 0.4 + 2], [outer, cy + 5]];
  const region = () => blob(c, [...lower, ...upper], seed, 0.6);
  c.save();
  region();
  c.fillStyle = D.eyeWhite;
  c.fill();
  c.clip();
  const ir = st === "wide" ? 13 : 14;
  const ix = cx + look[0] * 9,
    iy = cy + 4 + look[1] * 5 + (st === "wide" ? -2 : 0);
  c.fillStyle = D.iris;
  c.beginPath();
  c.arc(ix, iy, ir, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = D.irisHi;
  c.beginPath();
  c.arc(ix, iy + 4, ir * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
  c.fill();
  c.fillStyle = C.ink;
  c.beginPath();
  c.arc(ix, iy, ir * 0.45, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(ix - 4, iy - 5, st === "teary" ? 5.5 : 3.8, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(ix + 4, iy + 4, st === "teary" ? 3 : 1.8, 0, Math.PI * 2);
  c.fill();
  if (st === "teary") {
    c.fillStyle = "rgba(170,220,255,0.6)";
    c.fillRect(cx - 40, cy + 6, 80, 12);
  }
  // the heavy upper lid's shadow
  curve(c, upper.map(([x, y]) => [x, y + 7]) as Pt[], seed + 4, 0.6);
  c.lineWidth = 10;
  c.strokeStyle = "rgba(120,90,60,0.25)";
  c.stroke();
  c.restore();
  curve(c, upper, seed + 1, 0.6);
  paint(c, null, lineCol, 6);
  inkLine(c, [lerp2(lower[0], lower[1], 0.1), lower[1], lower[2]], seed + 3, 2.4);
  // the fold above a tired, heavy lid
  inkLine(c, [[cx - 22 * side, Math.min(cy - 10, upTop - 6) - slant * 0.9], [cx + 4 * side, Math.min(cy - 14, upTop - 9) - slant * 0.4], [cx + 28 * side, cy - 4]], seed + 5, 2.6, "#a8825a");
  if (p.young) return;
  // crow's feet and the bags under the eyes (years of night shifts)
  for (let k = 0; k < 3; k++) inkLine(c, [[cx + 33 * side, cy - 2 + k * 7], [cx + 45 * side, cy - 6 + k * 9]], seed + 6 + k, 2, "rgba(150,100,60,0.65)");
  inkLine(c, [[cx - 20 * side, cy + 24], [cx - 2 * side, cy + 30], [cx + 20 * side, cy + 24]], seed + 9, 2.2, "#ad8763");
  inkLine(c, [[cx - 12 * side, cy + 33], [cx + 12 * side, cy + 34]], seed + 10, 1.8, "rgba(170,130,95,0.6)");
}

function brow(c: Ctx, cx: number, cy: number, side: number, p: DadPose, seed: number) {
  const st = p.brows ?? (p.eyes === "teary" ? "sad" : p.eyes === "wide" ? "up" : "flat");
  const [yi, yo] = st === "sad" ? [-10, 6] : st === "worried" ? [-6, 3] : st === "up" ? [-14, -10] : [0, -1];
  const inner: Pt = [cx - 26 * side, cy + yi],
    outer: Pt = [cx + 26 * side, cy + yo];
  // thick and bushy, greying at the ends
  curve(c, [inner, [cx, (inner[1] + outer[1]) / 2 - 4], outer], seed, 0.9);
  c.lineCap = "round";
  c.strokeStyle = p.young ? "#2a2220" : D.brow;
  c.lineWidth = 11;
  c.stroke();
  if (!p.young)
    for (let k = 0; k < 4; k++) {
      const q = lerp2(inner, outer, 0.45 + k * 0.15);
      inkLine(c, [[q[0], q[1] - 3], [q[0] + 5 * side, q[1] - 6]], seed + 3 + k, 2, "rgba(220,220,220,0.7)");
    }
}

function mouth(c: Ctx, p: DadPose, seed: number) {
  const m = p.mouth ?? "flat";
  const x = 2,
    y = 112;
  switch (m) {
    case "frown":
      inkLine(c, [[x - 20, y + 6], [x, y - 1], [x + 20, y + 6]], seed, 4.4);
      break;
    case "press":
      inkLine(c, [[x - 18, y + 1], [x + 18, y + 1]], seed, 5);
      inkLine(c, [[x - 8, y + 9], [x + 8, y + 9]], seed + 1, 2.2, "#a97c58");
      break;
    case "wobble":
      inkLine(c, [[x - 22, y + 5], [x - 11, y - 2], [x, y + 4], [x + 11, y - 2], [x + 22, y + 5]], seed, 4);
      break;
    case "smile":
      inkLine(c, [[x - 24, y - 4], [x - 9, y + 6], [x + 9, y + 6], [x + 24, y - 4]], seed, 4.6);
      break;
    case "o":
      oval(c, x, y + 4, 11, 14, seed, 0.6);
      paint(c, "#6b2c2c", C.ink, 4);
      break;
    case "laugh": {
      const pts: Pt[] = [[x - 30, y - 6], [x, y - 2], [x + 30, y - 6], [x + 22, y + 22], [x, y + 30], [x - 22, y + 22]];
      blob(c, pts, seed, 0.9);
      paint(c, "#5e2228", null);
      c.save();
      blob(c, pts, seed, 0.9);
      c.clip();
      c.fillStyle = "#fffaf0";
      c.fillRect(x - 32, y - 12, 64, 11);
      oval(c, x, y + 28, 16, 9, seed + 2, 0.6);
      paint(c, "#e06a6a", null);
      c.restore();
      blob(c, pts, seed, 0.9);
      paint(c, null, C.ink, 4.4);
      break;
    }
    default:
      inkLine(c, [[x - 17, y + 1], [x + 17, y]], seed, 4.4);
  }
}

function glasses(c: Ctx, seed: number, detail = false, reflection = 0) {
  for (const side of [-1, 1]) {
    const gx = side * 50;
    rbox(c, gx - 37, 18, 74, 44, 14, seed + side, 0.6);
    paint(c, detail ? "rgba(190,216,226,0.04)" : "rgba(210,232,255,0.16)", "#1a1a1e", 3.6);
    inkLine(c, [[gx - 22, 26], [gx - 10, 22]], seed + 3 + side, detail ? 1.2 : 2.4, detail ? "rgba(223,233,219,.35)" : "rgba(255,255,255,0.75)");
    if (detail) {
      c.save();rbox(c,gx-34,20,68,40,12,seed+side,.3);c.clip();
      const tint=c.createLinearGradient(gx-30,20,gx+31,62);
      tint.addColorStop(0,"rgba(185,206,220,.015)");tint.addColorStop(1,"rgba(98,145,159,.08)");
      c.fillStyle=tint;c.fillRect(gx-37,18,74,44);
      // Small phone reflections at the outer bottom corner, clear of the pupils.
      if (reflection>0) {
        c.globalAlpha*=reflection;
        poly(c,[[gx+side*20,40],[gx+side*28,38],[gx+side*27,55],[gx+side*19,57]],seed+30+side,.12);
        paint(c,"rgba(189,222,235,.35)",null);
        inkLine(c,[[gx+side*21,44],[gx+side*26,43]],seed+34+side,.8,"rgba(228,244,243,.65)",.1);
        inkLine(c,[[gx+side*21,48],[gx+side*25,47]],seed+36+side,.7,"rgba(213,236,239,.45)",.1);
      }
      c.restore();
      inkLine(c,[[gx-28,59],[gx,62],[gx+27,59]],seed+20+side,1.05,"rgba(150,172,174,.55)",.2);
      oval(c,side*84,29,2,2,seed+22+side,.1);paint(c,"#a2b1ad",null);
      oval(c,side*15,44,3,5,seed+24+side,.15);paint(c,"rgba(197,190,166,.25)","#918979",.7);
    }
    // temple arm to the ear
    inkLine(c, [[side * 87, 30], [side * 112, 26]], seed + 5 + side, 3.2, "#1a1a1e");
  }
  curve(c, [[-13, 34], [0, 28], [13, 34]], seed + 8, 0.5);
  paint(c, null, "#1a1a1e", 3.4);
}

function cap(c: Ctx, seed: number, detail = false) {
  // crown, wider than the head
  shaded(c, () => blob(c, [[-126, -56], [-140, -108], [-104, -158], [0, -176], [104, -158], [140, -108], [126, -56]], seed, 1.1), D.cap, () => {
    blob(c, [[40, -170], [140, -112], [128, -56], [70, -60]], seed + 1, 1);
    paint(c, D.capDk, null);
    inkLine(c, [[-90, -146], [-30, -166], [30, -168]], seed + 2, detail ? 2.8 : 5, "rgba(255,255,255,0.12)");
    if(detail) {
      for(const side of [-1,1]) {
        inkLine(c,[[side*68,-163],[side*80,-124],[side*90,-83]],seed+31+side,1.9,"rgba(5,14,27,.48)",.25);
        inkLine(c,[[side*72,-163],[side*84,-124],[side*94,-83]],seed+34+side,.8,"rgba(126,145,158,.22)",.2);
        for(let i=0;i<3;i++){oval(c,side*(104+i*5),-109+i*8,1.3,1.3,seed+38+side+i,.1);paint(c,"#0d1b2c","#5b6976",.45);}
      }
      for(let i=0;i<60;i++) {
        const x=-125+hash(seed+i*7.3)*250,y=-172+hash(seed+i*3.7)*111;
        inkLine(c,[[x,y],[x+2.8,y+1]],seed+45+i,.65,"rgba(152,170,184,.10)",.1);
      }
    }
  }, C.ink, 5.5);
  // band with the gold cord
  poly(c, [[-124, -80], [124, -80], [122, -54], [-122, -54]], seed + 3, 0.7);
  paint(c, D.capDk, C.ink, 4);
  inkLine(c, [[-118, -70], [0, -64], [118, -70]], seed + 4, 4, D.gold);
  for (const side of [-1, 1]) {
    oval(c, side * 116, -68, 7, 7, seed + 5 + side, 0.4);
    paint(c, D.gold, C.ink, 2);
  }
  // visor: glossy, curving down at the middle
  blob(c, [[-120, -54], [0, -42], [120, -54], [106, -26], [0, -14], [-106, -26]], seed + 7, 0.8);
  paint(c, D.visor, C.ink, 4.5);
  inkLine(c, [[-80, -40], [0, -31], [70, -38]], seed + 8, 3, "rgba(255,255,255,0.28)");
  // badge: a gold shield with a star
  poly(c, [[-22, -128], [22, -128], [20, -100], [0, -86], [-20, -100]], seed + 9, 0.6);
  paint(c, D.gold, C.ink, 3);
  poly(c, [[0, -122], [5, -110], [17, -110], [7, -103], [11, -91], [0, -98], [-11, -91], [-7, -103], [-17, -110], [-5, -110]], seed + 10, 0.3);
  paint(c, D.goldDk, null);
  if(detail) {
    inkLine(c,[[-109,-58],[0,-48],[108,-58]],seed+112,1.2,"rgba(161,155,121,.24)",.2);
    inkLine(c,[[-99,-31],[0,-21],[98,-31]],seed+113,.9,"rgba(148,157,155,.27)",.2);
    for(let i=0;i<26;i++) {
      const x=-104+i*8.1,y=-64-6*Math.pow(x/118,2);
      inkLine(c,[[x,y-1.4],[x+2,y+1.2]],seed+115+i,.8,i%2?"#bea55d":"#6c612f",.1);
    }
    poly(c,[[-17,-123],[17,-123],[15,-103],[0,-92],[-15,-103]],seed+145,.2);paint(c,null,"#ead08a",.9);
    for(const side of [-1,1]) {
      for(let j=0;j<4;j++) {
        const y=-119+j*6,x=side*(13-j*.7);
        inkLine(c,[[x,y],[x-side*3,y-3]],seed+150+j+side*8,.9,"#f0d695",.1);
      }
      oval(c,side*116,-68,3,3,seed+171+side,.1);paint(c,"#f1d68b","#8c793f",.5);
    }
  }
}

function headFront(c: Ctx, p: DadPose, seed: number) {
  const young = !!p.young;
  const skin = young ? D.youngSkin : D.skin;
  const hairCol = young ? D.youngHair : D.hair;
  const hasCap = p.cap ?? !young;
  // hair behind the head (sides and back)
  if (!hasCap) {
    shaded(c, () => blob(c, [[-124, 10], [-128, -60], [-96, -116], [0, -134], [96, -116], [128, -60], [124, 10], [110, -40], [-110, -40]], seed + 1, 1.4), hairCol, null, C.ink, 5);
  } else {
    blob(c, [[-126, 16], [-128, -50], [-112, -60], [112, -60], [128, -50], [126, 16], [112, -20], [-112, -20]], seed + 1, 1.2);
    paint(c, D.hairDk, C.ink, 4.5);
  }
  // ears
  for (const side of [-1, 1]) {
    oval(c, side * 118, 36, 18, 28, seed + 2 + side, 0.9);
    paint(c, skin, C.ink, 4.5);
    inkLine(c, [[side * 116, 24], [side * 124, 36], [side * 117, 50]], seed + 4 + side, 2.4, D.skinDeep);
  }
  // face, shaded on the right, the jaw squarer than the boy's
  shaded(c, () => blob(c, FACE, seed + 6, 1.1), skin, () => {
    blob(c, [[56, 132], [102, 86], [122, 20], [150, 90], [80, 160]], seed + 7, 1);
    paint(c, "rgba(196,140,86,0.32)", null);
    if (!young) {
      // stubble on the jaw and chin
      c.fillStyle = p.frontDetails ? "rgba(87,87,78,0.20)" : "rgba(90,86,84,0.32)";
      for (let i = 0; i < (p.frontDetails ? 48 : 70); i++) {
        const a = Math.PI * (0.08 + 0.84 * hash(seed + i * 3.3));
        const r = 84 + hash(seed + i * 1.7) * 44;
        const sx = Math.cos(a) * r * 0.95,
          sy = 30 + Math.sin(a) * r * 0.82;
        if (sy < 92 || (Math.abs(sx) < 30 && sy < 128 && sy > 100)) continue;
        c.beginPath();
        c.arc(sx, sy, 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }
  }, C.ink, 5.5);
  if (!young) {
    // forehead lines under the brim, nasolabial folds
    inkLine(c, [[-48, -16], [0, -21], [48, -16]], seed + 8, 2.2, "rgba(160,110,70,0.55)");
    if (!hasCap) inkLine(c, [[-40, -36], [0, -40], [40, -36]], seed + 9, 2.2, "rgba(160,110,70,0.5)");
    for (const side of [-1, 1]) inkLine(c, [[side * 26, 86], [side * 38, 104], [side * 34, 122]], seed + 10 + side, 2.6, "rgba(160,110,70,0.6)");
  }
  brow(c, -50, 8, -1, p, seed + 12);
  brow(c, 50, 8, 1, p, seed + 13);
  eye(c, -50, 40, -1, p, seed + 14);
  eye(c, 50, 40, 1, p, seed + 24);
  // nose: a broad tip and its shadow
  oval(c, 10, 80, 16, 8, seed + 30, 0.5);
  paint(c, "rgba(196,142,92,0.45)", null);
  inkLine(c, [[6, 48], [14, 72]], seed + 31, 3);
  inkLine(c, [[-16, 78], [-8, 87], [8, 88], [17, 79]], seed + 32, 3.4);
  mouth(c, p, seed + 34);
  if (p.tears) {
    c.save();
    c.globalAlpha *= Math.min(1, p.tears * 1.6);
    for (const side of [-1, 1]) {
      const len = 20 + p.tears * 70;
      const x0 = side * 44;
      curve(c, [[x0, 56], [x0 + side * 4, 56 + len * 0.5], [x0 - side, 56 + len]], seed + 40 + side, 0.8);
      paint(c, null, "#9fd8ff", 7);
      oval(c, x0, 60 + len, 5, 7, seed + 42 + side, 0.4);
      paint(c, "#bfe6ff", null);
    }
    c.restore();
  }
  if (p.glasses ?? !young) glasses(c, seed + 50, !!p.frontDetails, p.screenReflection ?? 0);
  if (hasCap) {
    // the brim's shadow on the forehead
    const g = c.createLinearGradient(0, -40, 0, 20);
    g.addColorStop(0, "rgba(40,24,10,0.35)");
    g.addColorStop(1, "rgba(40,24,10,0)");
    c.save();
    blob(c, FACE, seed + 6, 1.1);
    c.clip();
    c.fillStyle = g;
    c.fillRect(-140, -40, 280, 60);
    c.restore();
    // grey sideburns peeking under the cap
    for (const side of [-1, 1]) {
      blob(c, [[side * 104, -52], [side * 122, -50], [side * 120, 6], [side * 108, 2]], seed + 60 + side, 0.7);
      paint(c, D.hair, C.ink, 3);
      inkLine(c, [[side * 112, -40], [side * 114, -6]], seed + 62 + side, 1.8, D.hairDk);
      if(p.frontDetails) {
        c.save();blob(c,[[side*104,-52],[side*122,-50],[side*120,6],[side*108,2]],seed+60+side,.7);c.clip();
        for(let i=0;i<19;i++) {
          const x=side*(106+hash(seed+i*3.2)*15),y=-48+hash(seed+i*7.3)*49;
          inkLine(c,[[x,y],[x-side*1.6,y+6]],seed+200+i+side*22,.8,i%3?"#d0d0c7":"#696f73",.1);
        }
        c.restore();
      }
    }
    cap(c, seed + 70, !!p.frontDetails);
  } else {
    // neat short hair on top
    shaded(c, () => blob(c, [[-118, -30], [-112, -84], [-60, -122], [10, -128], [80, -114], [118, -76], [120, -28], [92, -60], [30, -70], [-40, -66], [-96, -56]], seed + 80, 1.2), hairCol, () => {
      for (let i = 0; i < 6; i++) inkLine(c, [[-80 + i * 32, -110], [-74 + i * 32, -78]], seed + 81 + i, 2, young ? "#4a3a30" : D.hairDk);
      inkLine(c, [[-60, -108], [-10, -120], [40, -116]], seed + 90, 5, "rgba(255,255,255,0.18)");
    }, C.ink, 5);
  }
}

function headBack(c: Ctx, p: DadPose, seed: number) {
  const hasCap = p.cap ?? true;
  for (const side of [-1, 1]) {
    oval(c, side * 116, 30, 17, 27, seed + side, 0.9);
    paint(c, D.skin, C.ink, 4.5);
  }
  // back of the head: grey crew cut, the nape
  shaded(c, () => blob(c, [[-118, -40], [-120, 40], [-96, 104], [-56, 132], [56, 132], [96, 104], [120, 40], [118, -40], [0, -60]], seed + 3, 1.2), D.hair, () => {
    for (let i = 0; i < 14; i++) inkLine(c, [[-90 + i * 13, 40 + hash(seed + i) * 40], [-88 + i * 13, 70 + hash(seed + i * 2) * 30]], seed + 4 + i, 1.8, D.hairDk);
    if (p.backDetails) {
      for (let i=0;i<45;i++) {
        const x=-105+hash(seed+i*3.1)*210,y=-13+hash(seed+i*7.9)*120;
        inkLine(c,[[x,y],[x-2,y+7]],seed+170+i,1.2,i%3?"rgba(214,217,213,.28)":"rgba(63,68,77,.25)",.2);
      }
      inkLine(c,[[-70,110],[-38,122],[39,122],[70,110]],seed+217,2.5,"rgba(63,66,77,.26)",.4);
    }
    blob(c, [[-60, 104], [60, 104], [52, 140], [-52, 140]], seed + 20, 0.8);
    paint(c, D.skinSh, null);
  }, C.ink, 5);
  if (hasCap) {
    shaded(c, () => blob(c, [[-128, -40], [-140, -96], [-104, -150], [0, -168], [104, -150], [140, -96], [128, -40]], seed + 30, 1.1), D.cap, () => {
      inkLine(c, [[-80, -140], [0, -158], [80, -140]], seed + 31, 5, "rgba(255,255,255,0.1)");
      if (p.backDetails) {
        inkLine(c, [[-78,-142],[-89,-109],[-85,-66]], seed+100,2,"rgba(8,15,29,.45)",.3);
        inkLine(c, [[78,-142],[91,-109],[87,-66]], seed+101,2,"rgba(8,15,29,.45)",.3);
        inkLine(c, [[0,-156],[3,-106],[0,-67]], seed+102,1.5,"rgba(108,130,159,.22)",.2);
        for(let i=0;i<16;i++){
          const x=-90+hash(seed+i*4.3)*180,y=-133+hash(seed+i*2.1)*62;
          inkLine(c,[[x,y],[x+3,y+1]],seed+105+i,.8,"rgba(148,162,181,.09)",.1);
        }
      }
    }, C.ink, 5.5);
    poly(c, [[-128, -62], [128, -62], [126, -36], [-126, -36]], seed + 32, 0.7);
    paint(c, D.capDk, C.ink, 4);
    inkLine(c, [[-120, -50], [0, -46], [120, -50]], seed + 33, 3.4, D.gold);
    // the visor's edges just showing at the sides
    for (const side of [-1, 1]) {
      poly(c, [[side * 126, -40], [side * 146, -30], [side * 128, -24]], seed + 34 + side, 0.5);
      paint(c, D.visor, C.ink, 3);
    }
  }
}

// ---------------------------------------------------------------- body
function roundHand(c: Ctx, x: number, y: number, r: number, skin: string, seed: number, detail = false) {
  oval(c, x, y, r, r * 1.05, seed, 0.8);
  paint(c, skin, C.ink, 4.5);
  c.save();
  oval(c, x, y, r, r * 1.05, seed, 0.8);
  c.clip();
  oval(c, x + r * 0.5, y + r * 0.5, r * 0.7, r * 0.6, seed + 1, 0.6);
  paint(c, "rgba(180,120,70,0.3)", null);
  if(detail) {
    inkLine(c,[[x-r*.36,y+r*.18],[x-r*.04,y+r*.3],[x+r*.23,y+r*.2]],seed+4,1,"rgba(132,96,62,.42)",.15);
    inkLine(c,[[x-r*.34,y+r*.51],[x-r*.06,y+r*.57]],seed+5,.8,"rgba(136,100,68,.30)",.1);
    oval(c,x-r*.34,y-r*.31,r*.26,r*.13,seed+6,.15,-.3);paint(c,"rgba(246,214,174,.16)",null);
  }
  c.restore();
}

function sleeve(c: Ctx, from: Pt, elbow: Pt, wrist: Pt, color: string, dark: string, seed: number, detail = false) {
  const spine = [from, lerp2(from, elbow, 0.5), elbow, lerp2(elbow, wrist, 0.5), wrist];
  shaded(c, () => blob(c, tubePts(spine, [70, 64, 58, 54, 50], true, true), seed, 1), color, () => {
    blob(c, tubePts(spine.map(([x, y]) => [x + 14, y + 6]) as Pt[], [40, 36, 32, 30, 28], true, true), seed + 1, 1);
    paint(c, dark, null);
    if(detail) {
      const side=from[0]<0?-1:1;
      inkLine(c,[[elbow[0]-side*15,elbow[1]-32],[elbow[0]+side*14,elbow[1]-11],[elbow[0]+side*19,elbow[1]+8]],seed+20,2,"rgba(10,21,35,.5)",.3);
      inkLine(c,[[elbow[0]-side*18,elbow[1]-23],[elbow[0]+side*4,elbow[1]-7]],seed+21,1.2,"rgba(123,150,171,.22)",.2);
      for(let i=0;i<22;i++){
        const t=hash(seed+i*4.3),q=lerp2(from,elbow,t);
        inkLine(c,[[q[0]-18+hash(i*3.3)*35,q[1]],[q[0]-16+hash(i*3.3)*35,q[1]+2]],seed+25+i,.65,"rgba(139,163,179,.08)",.1);
      }
    }
  }, C.ink, 5);
  // cuff
  const a = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
  const nx = Math.cos(a + Math.PI / 2) * 26,
    ny = Math.sin(a + Math.PI / 2) * 26;
  inkLine(c, [[wrist[0] - nx - Math.cos(a) * 14, wrist[1] - ny - Math.sin(a) * 14], [wrist[0] + nx - Math.cos(a) * 14, wrist[1] + ny - Math.sin(a) * 14]], seed + 2, 3, "rgba(0,0,0,0.35)");
  if(detail) {
    inkLine(c,[[wrist[0]-nx-Math.cos(a)*20,wrist[1]-ny-Math.sin(a)*20],[wrist[0]+nx-Math.cos(a)*20,wrist[1]+ny-Math.sin(a)*20]],seed+51,1.1,"rgba(147,167,172,.3)",.2);
    oval(c,wrist[0]+nx*.65-Math.cos(a)*16,wrist[1]+ny*.65-Math.sin(a)*16,3,3,seed+52,.15);paint(c,"#657b87","#142735",.9);
  }
}

function torsoFront(c: Ctx, p: DadPose, seed: number) {
  const young = !!p.young;
  // the greatcoat's back, behind everything
  if (p.coat && !young) {
    shaded(c, () => blob(c, [[-232, 640], [-246, 330], [-214, 214], [-130, 172], [130, 172], [214, 214], [246, 330], [232, 640]], seed, 1.4), D.coat, () => {
      blob(c, [[120, 180], [246, 330], [232, 640], [150, 640]], seed + 1, 1.2);
      paint(c, D.coatDk, null);
    }, C.ink, 6);
  }
  // neck
  blob(c, [[-46, 100], [46, 100], [52, 180], [-52, 180]], seed + 2, 1);
  paint(c, young ? "#e3be8e" : D.skinSh, C.ink, 5);
  const T: Pt[] = [[-72, 152], [-152, 190], [-180, 262], [-184, 600], [0, 620], [184, 600], [180, 262], [152, 190], [72, 152], [0, 170]];
  if (young) {
    shaded(c, () => blob(c, T, seed + 3, 1.2), D.whiteShirt, () => {
      blob(c, [[60, 160], [190, 220], [190, 620], [100, 620]], seed + 4, 1.2);
      paint(c, "rgba(150,160,190,0.25)", null);
    }, C.ink, 5.5);
    // open collar
    for (const side of [-1, 1]) {
      poly(c, [[side * 8, 160], [side * 70, 150], [side * 60, 210], [side * 14, 230]], seed + 5 + side, 0.8);
      paint(c, D.whiteShirt, C.ink, 4);
    }
    return;
  }
  shaded(c, () => blob(c, T, seed + 3, 1.2), D.uni, () => {
    blob(c, [[60, 160], [190, 220], [190, 620], [96, 620], [110, 300]], seed + 4, 1.2);
    paint(c, D.uniDk, null);
    if(p.frontDetails) {
      for(let i=0;i<100;i++){
        const x=-177+hash(seed+i*8.3)*354,y=178+hash(seed+i*4.7)*430;
        inkLine(c,[[x,y],[x+2.5,y+1]],seed+260+i,.65,"rgba(145,168,188,.09)",.1);
      }
      inkLine(c,[[-127,244],[-140,382],[-136,565]],seed+361,1.6,"rgba(8,21,33,.42)",.3);
      inkLine(c,[[127,244],[140,382],[136,565]],seed+362,1.6,"rgba(8,21,33,.42)",.3);
      inkLine(c,[[4,272],[4,590]],seed+363,1.2,"rgba(120,144,166,.25)",.2);
      inkLine(c,[[-149,583],[0,598],[149,583]],seed+364,1.4,"rgba(132,154,165,.22)",.3);
      for(const side of [-1,1]) {
        inkLine(c,[[side*93,533],[side*118,562],[side*135,567]],seed+365+side,2,"rgba(9,23,39,.48)",.3);
        inkLine(c,[[side*92,538],[side*111,562]],seed+368+side,1.1,"rgba(102,139,167,.21)",.2);
      }
    }
  }, C.ink, 5.5);
  // shirt and tie in the V, lapels over them
  poly(c, [[-46, 152], [46, 152], [0, 270]], seed + 6, 0.7);
  paint(c, D.shirt, C.ink, 4);
  poly(c, [[-12, 170], [12, 170], [18, 248], [0, 272], [-18, 248]], seed + 7, 0.6);
  paint(c, D.tie, C.ink, 3.5);
  for (const side of [-1, 1]) {
    poly(c, [[side * 74, 148], [side * 12, 162], [0, 272], [side * 46, 236]], seed + 8 + side, 0.8);
    paint(c, D.uni, C.ink, 4);
    if(p.frontDetails) {
      inkLine(c,[[side*65,156],[side*53,220],[side*9,259]],seed+375+side,1.1,"rgba(136,159,176,.28)",.25);
      inkLine(c,[[side*68,160],[side*56,221]],seed+378+side,.8,"rgba(8,20,36,.35)",.2);
    }
  }
  // buttons, chest badge, epaulettes
  for (let i = 0; i < 3; i++) {
    oval(c, 0, 320 + i * 82, 9, 9, seed + 12 + i, 0.4);
    paint(c, D.gold, C.ink, 2.5);
  }
  poly(c, [[74, 290], [118, 290], [116, 330], [96, 346], [76, 330]], seed + 16, 0.6);
  paint(c, D.gold, C.ink, 3);
  if(p.frontDetails) {
    poly(c,[[80,296],[112,296],[110,327],[96,338],[82,327]],seed+381,.2);paint(c,null,"#cbbb80",1);
    poly(c,[[96,301],[99,309],[108,309],[101,315],[104,324],[96,319],[89,324],[91,315],[85,309],[93,309]],seed+382,.2);paint(c,"#8b7138",null);
    inkLine(c,[[-138,319],[-74,319],[-76,342],[-134,342],[-138,319]],seed+383,1.4,"rgba(102,136,157,.30)",.25);
    inkLine(c,[[-131,348],[-128,380],[-84,380],[-81,348]],seed+384,1.2,"rgba(10,25,42,.45)",.25);
  }
  inkLine(c, [[-140, 330], [-70, 330]], seed + 17, 3, "rgba(0,0,0,0.35)");
  for (const side of [-1, 1]) {
    poly(c, [[side * 112, 176], [side * 176, 196], [side * 172, 222], [side * 108, 202]], seed + 18 + side, 0.6);
    paint(c, D.uniDk, C.ink, 3.5);
    oval(c, side * 124, 192, 6, 6, seed + 20 + side, 0.3);
    paint(c, D.gold, null);
  }
  if (p.coat) {
    // the coat's fronts hanging off the shoulders, with the fur collar
    for (const side of [-1, 1]) {
      shaded(c, () => blob(c, [[side * 246, 330], [side * 214, 214], [side * 150, 182], [side * 120, 250], [side * 150, 640], [side * 236, 640]], seed + 22 + side, 1.2), D.coat, () => {
        if (side > 0) {
          blob(c, [[200, 220], [246, 330], [236, 640], [190, 640]], seed + 24, 1);
          paint(c, D.coatDk, null);
        }
        inkLine(c, [[side * 190, 400], [side * 196, 520]], seed + 26 + side, 2.4, "rgba(0,0,0,0.25)");
        if(p.frontDetails) {
          inkLine(c,[[side*205,252],[side*221,351],[side*209,442],[side*219,602]],seed+390+side,2.2,"rgba(30,43,27,.46)",.3);
          inkLine(c,[[side*174,389],[side*180,478],[side*185,581]],seed+393+side,1.5,"rgba(167,164,112,.25)",.3);
          inkLine(c,[[side*160,488],[side*190,505],[side*211,493]],seed+396+side,2,"rgba(23,40,27,.48)",.3);
          inkLine(c,[[side*164,496],[side*185,510],[side*202,508]],seed+399+side,1,"rgba(184,175,126,.23)",.2);
          for(let i=0;i<50;i++) {
            const x=side*(136+hash(seed+i*3.8)*104),y=240+hash(seed+i*7.6)*381;
            inkLine(c,[[x,y],[x+side*2,y+3]],seed+410+i+side*60,.8,"rgba(184,190,143,.13)",.1);
          }
        }
      }, C.ink, 5.5);
      // fur lapel along the opening
      const fur: Pt[] = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        const bx = side * (150 - 30 * u + (k % 2 ? 10 : 0)),
          by = 176 + u * 190;
        fur.push([bx, by]);
      }
      for (let k = 8; k >= 0; k--) {
        const u = k / 8;
        fur.push([side * (196 - 34 * u), 196 + u * 170]);
      }
      blob(c, fur, seed + 28 + side, 1.6);
      paint(c, D.fur, C.ink, 4);
      for (let k = 0; k < 5; k++) inkLine(c, [[side * (170 - k * 6), 210 + k * 32], [side * (160 - k * 6), 222 + k * 32]], seed + 30 + k + side * 7, 2, D.furDk);
      if(p.frontDetails) {
        c.save();blob(c,fur,seed+28+side,1.6);c.clip();
        for(let i=0;i<41;i++) {
          const t=hash(seed+i*5.7),x=side*(161-t*30+hash(i*3.9)*24),y=189+t*170;
          inkLine(c,[[x,y],[x-side*(3+hash(i)*4),y+5+hash(i+4)*5]],seed+550+i+side*45,1.1,i%3?"#e1c79b":"#98815c",.2);
        }
        c.restore();
      }
    }
  }
}

function torsoBack(c: Ctx, p: DadPose, seed: number) {
  blob(c, [[-46, 100], [46, 100], [52, 180], [-52, 180]], seed + 2, 1);
  paint(c, D.skinSh, C.ink, 5);
  const coat = p.coat ?? true;
  shaded(c, () => blob(c, [[-238, 640], [-250, 330], [-216, 212], [-130, 168], [130, 168], [216, 212], [250, 330], [238, 640]], seed, 1.4), coat ? D.coat : D.uni, () => {
    blob(c, [[110, 180], [250, 330], [238, 640], [140, 640]], seed + 1, 1.2);
    paint(c, coat ? D.coatDk : D.uniDk, null);
    // seam down the back, a fold
    inkLine(c, [[0, 230], [4, 640]], seed + 3, 2.4, "rgba(0,0,0,0.3)");
    inkLine(c, [[-120, 380], [-96, 560]], seed + 4, 2.2, "rgba(0,0,0,0.2)");
    if (p.backDetails) {
      // The shoulder yoke, sleeve seams and a half-belt show how the heavy wool hangs.
      inkLine(c, [[-192,227],[-99,258],[0,267],[99,258],[192,227]], seed+40,3.2,"rgba(27,35,28,.46)",.5);
      inkLine(c, [[-190,233],[-97,264],[0,273],[98,264],[192,233]], seed+41,1.4,"rgba(166,164,116,.3)",.4);
      for(const side of [-1,1]) {
        inkLine(c, [[side*182,234],[side*168,342],[side*180,453],[side*210,579]],seed+42+side,3.3,"rgba(25,34,26,.42)",.6);
        inkLine(c, [[side*144,298],[side*132,345],[side*146,402]],seed+45+side,9,"rgba(13,24,24,.09)",.7);
        inkLine(c, [[side*112,522],[side*125,578],[side*160,628]],seed+48+side,2.4,"rgba(171,167,115,.16)",.4);
        inkLine(c, [[side*163,477],[side*184,464],[side*192,443]],seed+51+side,2,"rgba(22,31,28,.36)",.4);
      }
      blob(c,[[-130,455],[-4,468],[131,455],[128,492],[0,504],[-128,492]],seed+54,.6);
      paint(c,coat?"#4b5a34":"#283955","#263326",2.2);
      inkLine(c,[[-116,463],[0,477],[119,464]],seed+55,1.1,"rgba(187,178,124,.32)",.3);
      inkLine(c,[[-115,487],[0,498],[117,486]],seed+56,1.1,"rgba(17,26,23,.4)",.3);
      for(const side of [-1,1]) {
        oval(c,side*109,478,5.5,5.5,seed+59+side,.2);paint(c,"#877b4d","#243022",1.5);
        inkLine(c,[[side*109-2,477],[side*109+2,479]],seed+62+side,.7,"#c2ae71",.1);
      }
      // Low-contrast wool flecks, clipped to the coat by shaded().
      for(let i=0;i<85;i++){
        const x=-224+hash(seed+i*3.7)*448,y=225+hash(seed+i*6.3)*395;
        inkLine(c,[[x,y],[x+2,y+3]],seed+70+i,.8,"rgba(191,190,144,.095)",.15);
      }
      inkLine(c,[[-214,624],[0,639],[214,624]],seed+160,1.7,"rgba(140,147,101,.2)",.4);
    }
  }, C.ink, 6);
  if (coat) {
    // the fur collar round the back of the neck
    const fur: Pt[] = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (1.05 + (k / 12) * 0.9);
      fur.push([Math.cos(a) * (172 + (k % 2 ? 12 : 0)), 210 + Math.sin(a) * (64 + (k % 2 ? 8 : 0))]);
    }
    for (let k = 12; k >= 0; k--) {
      const a = Math.PI * (1.05 + (k / 12) * 0.9);
      fur.push([Math.cos(a) * 118, 222 + Math.sin(a) * 34]);
    }
    blob(c, fur, seed + 6, 1.4);
    paint(c, D.fur, C.ink, 4.5);
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * (1.12 + k * 0.12);
      inkLine(c, [[Math.cos(a) * 130, 214 + Math.sin(a) * 40], [Math.cos(a) * 150, 212 + Math.sin(a) * 52]], seed + 7 + k, 2, D.furDk);
      if (p.backDetails) for(let j=0;j<3;j++) {
        const f=a+(j-1)*.025;
        inkLine(c,[[Math.cos(f)*134,214+Math.sin(f)*44],[Math.cos(f)*159,213+Math.sin(f)*56]],seed+180+k*3+j,1.1,j===1?"#e3cca1":"#8f7d5c",.3);
      }
    }
  }
}

function arms(c: Ctx, p: DadPose, seed: number, stage: "sleeves" | "hands") {
  const a = p.arms ?? "down";
  if (a === "down" || a === "none") return;
  const skin = p.young ? D.youngSkin : D.skin;
  const col = p.young ? D.whiteShirt : D.uni,
    dk = p.young ? "#d6d6d0" : D.uniDk;
  const t = p.tap ?? 0;
  if (a === "phone" || a === "type") {
    // forearms come forward from under the coat to hold the phone at the chest
    const L: [Pt, Pt, Pt] = [[-150, 300], [-156, 470], [-60, 420]];
    const R: [Pt, Pt, Pt] = a === "type" ? [[150, 300], [150, 460], [p.frontDetails ? 89 : 52, 372 + 12 * t]] : [[150, 300], [156, 470], [60, 420]];
    if (stage === "sleeves") {
      sleeve(c, L[0], L[1], L[2], col, dk, seed, !!p.frontDetails);
      sleeve(c, R[0], R[1], R[2], col, dk, seed + 5, !!p.frontDetails);
      if(p.frontDetails && a==="type") {
        // Screen faces him: the tapping hand is on the far side of the phone.
        roundHand(c,94,366+12*t,29,skin,seed+12,true);
        blob(c,tubePts([[86,344+12*t],[63,318+14*t]],[19,17],true,true),seed+14,.4);paint(c,skin,C.ink,3.4);
        inkLine(c,[[81,342+12*t],[86,344+12*t]],seed+18,1,"rgba(147,98,63,.35)",.1);
      }
      p.holding?.(c);
      return;
    }
    roundHand(c, p.frontDetails ? -83 : -62, 430, 34, skin, seed + 10, !!p.frontDetails);
    if (a === "type" && p.frontDetails) return;
    if (a === "type") {
      // a pointing finger pressing the screen
      roundHand(c, 54, 366 + 12 * t, 30, skin, seed + 12);
      blob(c, tubePts([[44, 344 + 12 * t], [30, 318 + 14 * t]], [20, 18], true, true), seed + 14, 0.5);
      paint(c, skin, C.ink, 3.6);
    } else roundHand(c, 62, 430, 34, skin, seed + 12);
    return;
  }
  if (a === "mouth") {
    // his right hand comes up off the phone and presses over his mouth (mouthK 0 → 1), the left lowers the phone;
    // at 0 it is exactly the two-handed "phone" pose, so the change of gesture can be animated
    const k = Math.min(1, Math.max(0, p.mouthK ?? 1));
    const det = !!p.frontDetails;
    const mix = (a0: Pt, a1: Pt): Pt => [a0[0] + (a1[0] - a0[0]) * k, a0[1] + (a1[1] - a0[1]) * k];
    // the right forearm swings up in an arc (its elbow drops out a little on the way) instead of sliding straight
    const lift = Math.sin(k * Math.PI);
    const L: [Pt, Pt, Pt] = [[-150, 300], mix([-156, 470], [-156, 480]), mix([-60, 420], [-60, 470])];
    const R: [Pt, Pt, Pt] = [mix([150, 300], [150, 320]), [156 + (190 - 156) * k + 26 * lift, 470 + 14 * lift], [60 + (44 - 60) * k + 34 * lift, 420 + (150 - 420) * k]];
    if (stage === "sleeves") {
      sleeve(c, L[0], L[1], L[2], col, dk, seed, det);
      // the right arm is behind the phone while it still holds it, in front of it once the hand has come away
      if (k < 0.12) {
        sleeve(c, R[0], R[1], R[2], col, dk, seed + 5, det);
        p.holding?.(c);
      } else {
        p.holding?.(c);
        sleeve(c, R[0], R[1], R[2], col, dk, seed + 5, det);
      }
      return;
    }
    roundHand(c, (det ? -83 : -62) + (det ? 21 : 0) * k, 430 + 48 * k, 34, skin, seed + 10, det);
    roundHand(c, R[2][0] + 2 * (1 - k) - 24 * k, R[2][1] + 10 * (1 - k) - 32 * k, 34 + 10 * k, skin, seed + 12);
    if (k > 0.8) {
      c.save();
      c.globalAlpha *= (k - 0.8) / 0.2;
      for (let j = 0; j < 3; j++) inkLine(c, [[-6 + j * 16, 84], [-4 + j * 16, 104]], seed + 14 + j, 2, D.skinDeep);
      c.restore();
    }
  }
}

/** Dad, head centre at (x, y), s = 1 → face ≈ 236 wide. */
export function drawDad(c: Ctx, x: number, y: number, s: number, p: DadPose = {}) {
  const seed = p.seed ?? 4100;
  const back = p.view === "back";
  const body = p.body ?? "bust";
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (body === "bust") {
    if (back) torsoBack(c, p, seed + 200);
    else torsoFront(c, p, seed + 200);
  }
  if (!back && body === "bust") arms(c, p, seed + 300, "sleeves");
  c.save();
  c.translate(0, p.headY ?? 0);
  c.rotate(p.tilt ?? 0);
  if (back) headBack(c, p, seed);
  else headFront(c, p, seed);
  c.restore();
  if (!back && body === "bust") arms(c, p, seed + 300, "hands");
  c.restore();
}

export const resources = defineResources({
  dad: resource({
    kind: "character",
    title: "爸爸（夜班保安）",
    description:
      "五十多岁的夜班保安爸爸：花白鬓角、老花镜、保安大檐帽、深蓝制服，可以披带毛领的军大衣；正面 / 背影、几种表情和手（捧手机、一根手指打字、捂嘴），young 是年轻时的他（黑发白衬衫，放进旧合照）。手里的手机用 holding 画（在袖子和手之间），例如 holding: (k) => phoneBack(k, -10, 400, 150, 270, -0.08)。frontDetails 开启帽子织纹/帽徽缝线、灰白鬓角、眼镜五金与局部屏幕反射、制服毛领与袖口；打字的手位于手机屏幕一侧，仍用简单圆手。从捧手机到捂嘴的动作用 arms: \"mouth\" + mouthK 0→1 连续过渡（0 就是捧手机的姿势），不要两种手势直接切换。screenReflection 控制镜片里的小块倒影，不盖瞳孔。夜里被手机照亮的脸：先画他，再用 figureMask + onFigure 叠屏幕光、rimLight 加轮廓光。",
    tags: ["爸爸", "父亲", "保安", "门卫", "老人", "中年", "夜班", "军大衣", "老花镜", "人物"],
    usage: "drawDad(ctx, x, y, s, { coat, eyes, mouth, arms, tap, view, young, holding })  // (x, y) 头中心，s = 1 脸宽约 236",
    params: dadPose,
    presets: {
      夜班: { coat: true },
      看手机: { coat: true, arms: "phone", eyes: "down", brows: "worried" },
      一根手指打字: { coat: true, arms: "type", tap: 1, eyes: "down", brows: "worried", mouth: "press" },
      愣住: { coat: true, arms: "phone", eyes: "wide", mouth: "o" },
      捂嘴哭: { coat: true, arms: "mouth", eyes: "teary", brows: "sad", tears: 0.8 },
      笑着哭: { coat: true, arms: "phone", eyes: "happy", mouth: "laugh", tears: 0.6 },
      背影: { view: "back" },
      精细值班背影: { view: "back", coat: true, backDetails: true },
      精细值班近景: { frontDetails: true, screenReflection: .8, coat: true, arms: "type", eyes: "down", brows: "worried", mouth: "press" },
      年轻时: { young: true, eyes: "happy", mouth: "laugh" },
    },
    preview: {
      width: 700,
      height: 1200,
      duration: 2,
      time: 0.5,
      background: "#2b2e3d",
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const hands = p.view !== "back" && (p.arms === "phone" || p.arms === "type" || p.arms === "mouth");
        drawDad(ctx, 350, 300, 1, {
          ...p,
          tap: p.arms === "type" ? 0.5 + 0.5 * Math.sin(t * 9) : p.tap,
          holding: hands ? (k) => (p.arms === "mouth" ? phoneBack(k, -70, 470, 130, 240, 0.1, 0, { detailed: p.frontDetails, caseColor: "#252d35", cameraColor: "#343e47" }) : phoneBack(k, -10, 400, 150, 270, -0.08, 0, { detailed: p.frontDetails, caseColor: "#252d35", cameraColor: "#343e47" })) : undefined,
        });
      },
    },
  }),
});
