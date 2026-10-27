// 点赞引导和评论话题（用户 2026-10-27：「添加上：结尾 点赞引导，和评论区话题」）。画面不再淡黑。
// 用户又说「引导显示时间太短，读不完」，选了：点赞挪到落回人间那段（人链松手、像花一样落下来：配「身边一直有个拽住你的人」，停 4 秒），
// 评论题留在结尾（跺脚的反应过后出来，片尾加长 1.5 秒到 153.5，停 4 秒，留到最后一帧）。
// 做法照经验库「剧情音乐短片」的 结尾与引导.md：
//   点赞：画面中间模拟一次双击（两圈波纹 + 爱心弹出 + 两声轻响），配一句和剧情挂钩的祝福（人链：「身边一直有个拽住你的人」）；
//   评论：问一个能站队的问题（以前的「回看第几秒」回答的人很少）：「你是拽人的，还是被拽的？」——片子里每个人都在拽人或被拽，
//   看的人自己也是其中一种，一个词就能表态、会带出自己的经历。同一道题写进置顶评论。
// 字用设定字那一套（思源宋体粗体、深暖棕、关键词暖赭红、米白光；public/fonts 的子集已经重截进这几句的字），放在抖音安全区里（中心 x 515，上 ≥ 250）。

import { type Note, drawNoteAt } from "./note";
import { E, clamp01, ph } from "./cam";

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
const LIKE: Note = { text: "点赞的人，身边一直有个拽住你的人", accent: "拽住你", x: 515, y: 330, size: 48, in: 0, out: 999 };
// 评论题用户又说「还是有点不够简洁……差点意思」，从 7 个里挑了 5：一行问题 + 一行小字（原来「她给他铁靴，自己飘走 / 是救他，还是丢下他？」）
const ASK: Note[] = [
  { text: "你是拽人的，还是被拽的？", accent: ["拽人的", "被拽的"], x: 515, y: 430, size: 56, in: 0, out: 999 },
  { text: "评论区站个队", x: 490, y: 522, size: 42, in: 0, out: 999 },
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
  g.fillRect(0, y0, 1080, y1 - y0);
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
    heart(g, X + (LIKE.x + 150 - X) * fly, Y + (LIKE.y + 10 - Y) * fly, s * (1 - 0.55 * fly), 1 - ph(t, GUIDE.tap[1] + 0.75, GUIDE.tap[1] + 1.05));
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
  g.translate(640 + bob * 0.6, 522 + bob * 0.6);
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
  backdrop(g, base, la, 230, 440);
  doubleTap(g, base, t);
  drawNoteAt(g, base, LIKE, la, 16 * (1 - lin) - 12 * out);
  if (t < GUIDE.ask) return;
  // 评论：结尾，留到最后一帧
  backdrop(g, base, E.out(ph(t, GUIDE.ask, GUIDE.ask + 0.4)), 330, 610);
  ASK.forEach((n, i) => {
    const a = E.out(ph(t, GUIDE.ask + 0.08 * i, GUIDE.ask + 0.08 * i + 0.4));
    drawNoteAt(g, base, n, a, 18 * (1 - a));
  });
  arrow(g, base, E.out(ph(t, GUIDE.ask + 0.3, GUIDE.ask + 0.6)), t);
}
