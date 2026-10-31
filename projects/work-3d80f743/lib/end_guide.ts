// 点赞引导和评论话题（用户 2026-10-27：「添加上：结尾 点赞引导，和评论区话题」）。画面不再淡黑。
// 用户又说「引导显示时间太短，读不完」，选了：点赞挪到落回人间那段（人链松手、像花一样落下来：配「身边一直有个拽住你的人」，停 4 秒），
// 评论题留在结尾（跺脚的反应过后出来，片尾加长 1.5 秒到 153.5，停 4 秒，留到最后一帧）。
// 做法照经验库「剧情音乐短片」的 结尾与引导.md：
//   点赞：画面中间模拟一次双击（两圈波纹 + 爱心弹出 + 两声轻响），配一句和剧情挂钩的祝福（人链：「身边一直有个拽住你的人」）；
//   评论：问一个能站队的问题（以前的「回看第几秒」回答的人很少）：「你是拽人的，还是被拽的？」——片子里每个人都在拽人或被拽，
//   看的人自己也是其中一种，一个词就能表态、会带出自己的经历。同一道题写进置顶评论。
// 字用设定字那一套（思源宋体粗体、深暖棕、关键词暖赭红、米白光；public/fonts 的子集已经重截进这几句的字），放在抖音安全区里（中心 x 515，上 ≥ 250）。

import { type Note, drawNoteAt } from "./note";
import { E, LANDSCAPE, W, clamp01, ph } from "./cam";

export const GUIDE = {
  /** 双击：两下（人链松手、光退完以后，她抱着他刚开始往下落） */
  tap: [141.2, 141.33] as [number, number],
  /** 点赞那句淡进来、开始淡出（落地前淡完，落地、放下他、跺脚的画面上没有字） */
  like: 141.4,
  likeOut: 145.3,
  /** 评论那两行淡进来（跺下去、他吓一跳以后），留到最后一帧 */
  ask: 149.4,
};

// 用户 2026-10-27 从几个方案里挑的：点赞 C「点赞的人，身边一直有个拽住你的人」
const LIKE_DOUYIN: Note = { text: "点赞的人，身边一直有个拽住你的人", accent: "拽住你", x: 515, y: 330, size: 48, in: 0, out: 999 };
// B 站横屏（用户 2026-10-30 同意换成 B 站的说法）：「一键三连」，放在画面上面正中（两个人在下面往下落）；
// 字体是另截的子集（note.ts 的 font: "bili"）；B 站没有右边那列按钮，评论区在视频下面，箭头往下指
const LIKE_BILI: Note = { text: "一键三连的人，身边一直有个拽住你的人", accent: "拽住你", x: 515, y: 330, size: 48, in: 0, out: 999, wx: 960, wy: 150, wsize: 46, font: "bili" };
const likeNote = () => (LANDSCAPE ? LIKE_BILI : LIKE_DOUYIN);
// 评论题用户又说「还是有点不够简洁……差点意思」，从 7 个里挑了 5：一行问题 + 一行小字（原来「她给他铁靴，自己飘走 / 是救他，还是丢下他？」）
const ASK: Note[] = [
  { text: "你是拽人的，还是被拽的？", accent: ["拽人的", "被拽的"], x: 515, y: 430, size: 56, in: 0, out: 999, wx: 960, wy: 150, wsize: 54 },
  { text: "评论区站个队", x: 490, y: 522, size: 42, in: 0, out: 999, wx: 940, wy: 236, wsize: 40 },
];
/** 字后面一片柔和的暖白（y0–y1），把字从楼面的窗、晾的衣服上托出来 */
function backdrop(g: CanvasRenderingContext2D, base: DOMMatrix, a: number, y0: number, y1: number) {
  if (a <= 0.003) return;
  g.save();
  g.setTransform(base);
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, "rgba(255,246,232,0)");
  gr.addColorStop(0.22, `rgba(255,246,232,${0.5 * a})`);
  gr.addColorStop(0.78, `rgba(255,246,232,${0.5 * a})`);
  gr.addColorStop(1, "rgba(255,246,232,0)");
  g.fillStyle = gr;
  g.fillRect(0, y0, W, y1 - y0);
  g.restore();
}
function heart(g: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  if (a <= 0.003 || s <= 0.01) return;
  g.save();
  g.globalAlpha = a;
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.moveTo(0, 30);
  g.bezierCurveTo(-60, -10, -40, -60, 0, -30);
  g.bezierCurveTo(40, -60, 60, -10, 0, 30);
  g.fillStyle = "#ff4f6a";
  g.shadowColor = "rgba(255,120,140,0.6)";
  g.shadowBlur = 24;
  g.fill();
  g.shadowBlur = 0;
  g.lineWidth = 3 / s;
  g.strokeStyle = "rgba(120,30,50,0.55)";
  g.stroke();
  g.restore();
}
/** 空处模拟一次双击：每一下一圈波纹，第二下爱心弹出来，再飞进「点赞的人……」那句里淡掉（不压在人身上） */
function doubleTap(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  // 落回人间那段：她抱着他在画面中上部往下落，双击放在右边空着的天上
  const X = 790;
  const Y = 610;
  const lx = LIKE_DOUYIN.x;
  const ly = LIKE_DOUYIN.y;
  g.save();
  g.setTransform(base);
  for (const t0 of GUIDE.tap) {
    const u = t - t0;
    if (u < 0 || u > 0.6) continue;
    g.strokeStyle = `rgba(255,255,255,${0.75 * (1 - u / 0.6)})`;
    g.lineWidth = 6;
    g.beginPath();
    g.arc(X, Y, 50 + u * 380, 0, Math.PI * 2);
    g.stroke();
  }
  const u = t - GUIDE.tap[1];
  if (u > 0) {
    const pop = E.out(clamp01(u / 0.18));
    const s = 2.4 * (pop + 0.25 * Math.sin(Math.PI * clamp01(u / 0.3)));
    const fly = E.io(ph(t, GUIDE.tap[1] + 0.32, GUIDE.tap[1] + 0.95));
    heart(g, X + (lx + 150 - X) * fly, Y + (ly + 10 - Y) * fly, s * (1 - 0.55 * fly), 1 - ph(t, GUIDE.tap[1] + 0.75, GUIDE.tap[1] + 1.05));
  }
  g.restore();
}
// ——— B 站：一键三连（长按点赞，三个一起转一圈，灰的一起点亮成蓝的）———
// 用户 2026-10-30：「把一键三连换成我从 b 站官网掏过来的一模一样的，一开始是灰色，点亮是蓝色」：
// 三个图标的路径照抄 B 站视频页工具栏的 SVG（点赞 36×36，投币、收藏 28×28，页面上都按 36 显示），颜色照 B 站：没点是灰 #61666d，点亮是蓝 #00aeec
const BILI_GRAY = "#61666d";
const BILI_BLUE = "#00aeec";
const BILI_ICON = {
  like: { box: 36, d: "M9.77234 30.8573V11.7471H7.54573C5.50932 11.7471 3.85742 13.3931 3.85742 15.425V27.1794C3.85742 29.2112 5.50932 30.8573 7.54573 30.8573H9.77234ZM11.9902 30.8573V11.7054C14.9897 10.627 16.6942 7.8853 17.1055 3.33591C17.2666 1.55463 18.9633 0.814421 20.5803 1.59505C22.1847 2.36964 23.243 4.32583 23.243 6.93947C23.243 8.50265 23.0478 10.1054 22.6582 11.7471H29.7324C31.7739 11.7471 33.4289 13.402 33.4289 15.4435C33.4289 15.7416 33.3928 16.0386 33.3215 16.328L30.9883 25.7957C30.2558 28.7683 27.5894 30.8573 24.528 30.8573H11.9911H11.9902Z" },
  coin: { box: 28, d: "M14.045 25.5454C7.69377 25.5454 2.54504 20.3967 2.54504 14.0454C2.54504 7.69413 7.69377 2.54541 14.045 2.54541C20.3963 2.54541 25.545 7.69413 25.545 14.0454C25.545 17.0954 24.3334 20.0205 22.1768 22.1771C20.0201 24.3338 17.095 25.5454 14.045 25.5454ZM9.66202 6.81624H18.2761C18.825 6.81624 19.27 7.22183 19.27 7.72216C19.27 8.22248 18.825 8.62807 18.2761 8.62807H14.95V10.2903C17.989 10.4444 20.3766 12.9487 20.3855 15.9916V17.1995C20.3854 17.6997 19.9799 18.1052 19.4796 18.1052C18.9793 18.1052 18.5738 17.6997 18.5737 17.1995V15.9916C18.5667 13.9478 16.9882 12.2535 14.95 12.1022V20.5574C14.95 21.0577 14.5444 21.4633 14.0441 21.4633C13.5437 21.4633 13.1382 21.0577 13.1382 20.5574V12.1022C11.1 12.2535 9.52148 13.9478 9.51448 15.9916V17.1995C9.5144 17.6997 9.10883 18.1052 8.60856 18.1052C8.1083 18.1052 7.70273 17.6997 7.70265 17.1995V15.9916C7.71158 12.9487 10.0992 10.4444 13.1382 10.2903V8.62807H9.66202C9.11309 8.62807 8.66809 8.22248 8.66809 7.72216C8.66809 7.22183 9.11309 6.81624 9.66202 6.81624Z" },
  fav: { box: 28, d: "M19.8071 9.26152C18.7438 9.09915 17.7624 8.36846 17.3534 7.39421L15.4723 3.4972C14.8998 2.1982 13.1004 2.1982 12.4461 3.4972L10.6468 7.39421C10.1561 8.36846 9.25639 9.09915 8.19315 9.26152L3.94016 9.91102C2.63155 10.0734 2.05904 11.6972 3.04049 12.6714L6.23023 15.9189C6.96632 16.6496 7.29348 17.705 7.1299 18.7605L6.39381 23.307C6.14844 24.6872 7.62063 25.6614 8.84745 25.0119L12.4461 23.0634C13.4276 22.4951 14.6544 22.4951 15.6359 23.0634L19.2345 25.0119C20.4614 25.6614 21.8518 24.6872 21.6882 23.307L20.8703 18.7605C20.7051 17.705 21.0339 16.6496 21.77 15.9189L24.9597 12.6714C25.9412 11.6972 25.3687 10.0734 24.06 9.91102L19.8071 9.26152Z" },
} as const;
type BiliKind = keyof typeof BILI_ICON;
const biliPaths = new Map<BiliKind, Path2D>();
/** 画一个图标：中心在 (x, y)，s 是 B 站页面上一个像素（36 宽）放大多少；lit 0 灰 → 1 蓝 */
function icon(g: CanvasRenderingContext2D, kind: BiliKind, x: number, y: number, s: number, a: number, lit: number) {
  if (a <= 0.003 || s <= 0.01) return;
  const { box, d } = BILI_ICON[kind];
  let p = biliPaths.get(kind);
  if (!p) biliPaths.set(kind, (p = new Path2D(d)));
  g.save();
  g.globalAlpha = a;
  g.translate(x, y);
  g.scale(s * (36 / box), s * (36 / box));
  g.translate(-box / 2, -box / 2);
  // 灰的时候一圈淡淡的白光（天上是亮的，托一下），点亮时换成蓝光
  g.shadowColor = `rgba(255,255,255,${0.7 * (1 - lit)})`;
  g.shadowBlur = 10 * s;
  g.fillStyle = BILI_GRAY;
  g.fill(p, "evenodd");
  if (lit > 0.003) {
    g.globalAlpha = a * lit;
    g.shadowColor = "rgba(0,174,236,0.6)";
    g.shadowBlur = 14 * s;
    g.fillStyle = BILI_BLUE;
    g.fill(p, "evenodd");
  }
  g.restore();
}
/** 空处模拟一次「一键三连」：三个灰图标弹出来，长按点赞时三个外面各一圈蓝进度一起走满，一起点亮成蓝的，再飞进「拽住你」三个字里淡掉 */
function tripleTap(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  // 落回人间那段：她抱着他在画面中上部往下落，三连放在右边空着的天上
  const X = 1450;
  const Y = 470;
  const t0 = GUIDE.tap[0];
  const full = t0 + 0.5;
  // 飞进去的地方：「拽住你」三个字，一个图标落进一个字（46 号字、字距 0.06：一个字 48.76；整句 18 个字，「住」是第 15 个）。
  // 从右边的天直着往左上飞，路线在两个人的右边，不从人身上过
  const adv = 46 * 1.06;
  const tx = 960 - (18 * adv) / 2 + 14 * adv + 23;
  const ty = (LIKE_BILI.wy ?? LIKE_BILI.y) + 4;
  const S = 3.4;
  const GAP = 150;
  if (t < t0) return;
  g.save();
  g.setTransform(base);
  const fly = E.io(ph(t, full + 0.35, full + 0.9));
  const gone = 1 - ph(t, full + 0.7, full + 0.95);
  const lit = E.out(clamp01((t - full) / 0.12));
  // 三个依次弹出来（灰的）
  const popAt = (i: number) => {
    const u = clamp01((t - t0 - 0.04 * i) / 0.18);
    return E.out(u) + 0.15 * Math.sin(Math.PI * clamp01((t - t0 - 0.04 * i) / 0.3));
  };
  // 点亮那一下三个一起跳一下
  const bump = t > full ? 0.22 * Math.sin(Math.PI * clamp01((t - full) / 0.25)) : 0;
  const at = (i: number): [number, number] => {
    const dx = (i - 1) * GAP;
    return [X + dx + (tx + (i - 1) * adv - X - dx) * fly, Y + (ty - Y) * fly];
  };
  // 长按：三个外面各一圈蓝进度一起走满（满了扩开淡掉）
  const press = clamp01((t - t0 - 0.05) / (full - t0 - 0.05));
  const ringA = t < full ? 1 : 1 - clamp01((t - full) / 0.2);
  if (ringA > 0.003) {
    const R = 62 + (t > full ? 10 * E.out(clamp01((t - full) / 0.2)) : 0);
    g.lineCap = "round";
    g.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      const [cx, cy] = at(i);
      const pa = clamp01(popAt(i));
      g.strokeStyle = `rgba(255,255,255,${0.4 * ringA * pa})`;
      g.beginPath();
      g.arc(cx, cy, R, 0, Math.PI * 2);
      g.stroke();
      if (press > 0) {
        g.strokeStyle = `rgba(0,174,236,${0.95 * ringA * pa})`;
        g.beginPath();
        g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * press);
        g.stroke();
      }
    }
  }
  const kinds: BiliKind[] = ["like", "coin", "fav"];
  kinds.forEach((k, i) => {
    const [cx, cy] = at(i);
    icon(g, k, cx, cy, S * (popAt(i) + bump) * (1 - 0.6 * fly), gone, lit);
  });
  // 点亮的那一下：每个图标周围几颗蓝色碎光往外散
  const sp = t - full;
  if (sp > 0 && sp < 0.45) {
    const q = sp / 0.45;
    for (let j = 0; j < 3; j++) {
      const [cx, cy] = at(j);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.4 * j;
        const d = 70 + 70 * E.out(q);
        g.fillStyle = `rgba(${i % 2 ? 120 : 0},${i % 2 ? 214 : 174},${i % 2 ? 255 : 236},${0.85 * (1 - q)})`;
        g.beginPath();
        g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 4 * (1 - q) + 1.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.restore();
}

/** 往右下指着评论按钮那一列的小箭头（画的，不用 emoji） */
function arrow(g: CanvasRenderingContext2D, base: DOMMatrix, a: number, t: number) {
  if (a <= 0.003) return;
  const bob = 6 * Math.sin(t * 6);
  g.save();
  g.setTransform(base);
  g.globalAlpha = a;
  // 横屏：评论区在视频下面，箭头往下指
  if (LANDSCAPE) {
    g.translate(1098, 226 + bob);
    g.rotate(0.55);
  } else g.translate(640 + bob * 0.6, 522 + bob * 0.6);
  g.lineCap = "round";
  g.lineJoin = "round";
  const path = () => {
    g.beginPath();
    g.moveTo(0, -18);
    g.quadraticCurveTo(40, -12, 58, 26);
    g.moveTo(36, 22);
    g.lineTo(60, 30);
    g.lineTo(66, 4);
  };
  g.strokeStyle = "rgba(255,250,242,0.95)";
  g.lineWidth = 13;
  path();
  g.stroke();
  g.strokeStyle = "#b4472f";
  g.lineWidth = 6;
  path();
  g.stroke();
  g.restore();
}

export function drawEndGuide(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  if (t < GUIDE.tap[0]) return;
  // 点赞：落回人间那段（淡进来、落地前淡出）
  const lin = E.out(ph(t, GUIDE.like, GUIDE.like + 0.35));
  const out = ph(t, GUIDE.likeOut, GUIDE.likeOut + 0.45);
  const la = lin * (1 - out * out * (3 - 2 * out));
  if (LANDSCAPE) backdrop(g, base, la, 60, 240);
  else backdrop(g, base, la, 230, 440);
  if (LANDSCAPE) tripleTap(g, base, t);
  else doubleTap(g, base, t);
  drawNoteAt(g, base, likeNote(), la, 16 * (1 - lin) - 12 * out);
  if (t < GUIDE.ask) return;
  // 评论：结尾，留到最后一帧
  if (LANDSCAPE) backdrop(g, base, E.out(ph(t, GUIDE.ask, GUIDE.ask + 0.4)), 50, 320);
  else backdrop(g, base, E.out(ph(t, GUIDE.ask, GUIDE.ask + 0.4)), 330, 610);
  ASK.forEach((n, i) => {
    const a = E.out(ph(t, GUIDE.ask + 0.08 * i, GUIDE.ask + 0.08 * i + 0.4));
    drawNoteAt(g, base, n, a, 18 * (1 - a));
  });
  arrow(g, base, E.out(ph(t, GUIDE.ask + 0.3, GUIDE.ask + 0.6)), t);
}
