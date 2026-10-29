// 小红书版（时间轴 xhs）第一幕的 App 界面，小红书深色模式：笔记详情（标题、日期、「共 N 条评论」、底栏的说点什么和
// 赞 / 收藏 / 评论）、带小红书角标的通知、个人主页（小红书号、关注 / 粉丝 / 获赞与收藏、笔记 / 收藏 / 赞过）、
// 关注列表、评论和@、分享面板里的拉黑。ui.ts 的 vid* 在 xhs 时间轴转到这里。
// 镜头、黄框和点击用到的位置和抖音版一样：第一条评论、「评论和@」入口（INBOX_AT）、她那一行、消息列表的行高和
// 「瘦了」的位置、「拉黑」（BLOCK_AT）、确认框和「确认」；只有「1 关注」排在最前面，位置在 ui.ts 的 followsAt。
import { clamp } from "@frame/engine/math";
import { Ctx, F, measure, rr, text } from "@materials/s0rrow/code/draw";
import { SH, SW, statusBar } from "@materials/s0rrow/code/phone";
import { socialButton, socialHomeBar, socialIcon } from "@materials/s0rrow/code/social";
import {
  ACC_A, HER, HISTORY, MENU_AT, ROW_A, ROW_H, bubbleIcon, grayAvatar, guideBox, heartIcon, herAvatar, say,
  type BannerOpts, type BlockOpts, type CommentsOpts, type Guide, type PostOpts, type ProfileOpts,
} from "./ui";
import { words } from "./platform";

const BG = "#141416";
const CARD = "#232327";
const LINE = "rgba(255,255,255,0.08)";
const INK = "#ececf0";
const GREY = "#8a8a91";
const DIM = "#606067";
const RED = "#ff2442";
const TOPIC = "#86a9dd";
/** the 小红书号 on his profile: the creator's own account (user 2026-10-29), so viewers can look it up */
export const XHS_ID = "63663279405";

// ---------------------------------------------------------------- small pieces
/** 收藏's outline star. (x, y) = centre. */
export function starIcon(c: Ctx, x: number, y: number, size: number, color: string) {
  const s = size / 30;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.lineWidth = 2.4;
  c.lineJoin = "round";
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 6 : 13.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    i ? c.lineTo(r * Math.cos(a), r * Math.sin(a) + 1) : c.moveTo(r * Math.cos(a), r * Math.sin(a) + 1);
  }
  c.closePath();
  c.stroke();
  c.restore();
}
/** the pen in 「说点什么…」 */
function penIcon(c: Ctx, x: number, y: number, size: number, color: string) {
  const s = size / 30;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(Math.PI / 4);
  c.strokeStyle = color;
  c.lineWidth = 2.2;
  c.lineJoin = "round";
  rr(c, -3.5, -12, 7, 18, 1.5);
  c.stroke();
  c.beginPath();
  c.moveTo(-3.5, 6);
  c.lineTo(0, 12);
  c.lineTo(3.5, 6);
  c.stroke();
  c.restore();
}
/** the app's icon: the red rounded square with 小红书 in white (on notifications, over the sender's avatar) */
export function xhsBadge(c: Ctx, x: number, y: number, size: number) {
  c.save();
  c.shadowColor = "rgba(0,0,0,0.35)";
  c.shadowBlur = size * 0.2;
  c.fillStyle = RED;
  rr(c, x - size / 2, y - size / 2, size, size, size * 0.24);
  c.fill();
  c.shadowColor = "transparent";
  text(c, "小红书", x, y + size * 0.02, { size: size * 0.27, font: F.ui, weight: 700, fill: "#fff" });
  c.restore();
}
/** a count beside an icon, or the action's name while it is 0 (the way 小红书 shows 赞 / 收藏 / 评论) */
const countOr = (n: number, name: string) => (n > 0 ? String(n) : name);

/** The note's bottom bar: 「说点什么…」 on the left, 赞 / 收藏 / 评论 with their counts on the right. */
function noteBar(c: Ctx, likes: number, stars: number, comments: number) {
  c.fillStyle = BG;
  c.fillRect(0, 1160, SW, 120);
  c.fillStyle = LINE;
  c.fillRect(0, 1160, SW, 1);
  c.fillStyle = CARD;
  rr(c, 24, 1178, 236, 56, 28);
  c.fill();
  penIcon(c, 54, 1206, 24, "#9a9aa1");
  say(c, "说点什么…", 74, 1206, 23, { color: "#9a9aa1" });
  const items: [(c: Ctx, x: number, y: number, s: number, col: string) => void, string][] = [
    [heartIcon, countOr(likes, "赞")],
    [starIcon, countOr(stars, "收藏")],
    [bubbleIcon, countOr(comments, "评论")],
  ];
  items.forEach(([icon, label], i) => {
    const x = 290 + i * 102;
    icon(c, x + 14, 1206, 30, INK);
    say(c, label, x + 36, 1207, 22, { color: INK });
  });
  socialHomeBar(c);
}

// ---------------------------------------------------------------- the note
/** Her note: the author bar, the picture (a red dot under it while there are more), title, topic, date and place,
 *  「共 N 条评论」 and the comments; with `details` the bottom bar. Comment rows sit where the 抖音版 has them. */
export function xhsPost(c: Ctx, o: PostOpts) {
  const big = o.big ? 1.3 : 1;
  const compact = o.showComments || !!o.comments?.length;
  c.fillStyle = BG;
  c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.42 });
  socialIcon(c, "back", 40, 120, 30, INK);
  herAvatar(c, 104, 120, 28);
  say(c, o.author ?? HER, 146, 120, 28 * big, { color: INK, weight: 500 });
  socialIcon(c, "share", 556, 120, 30, INK);
  const px = 0, py = 170, pw = SW, ph = o.photoH ?? (compact ? 400 : 640);
  c.save();
  c.beginPath(); c.rect(px, py, pw, ph); c.clip();
  if (o.photoZoom && o.photoZoom.k > 1.001) {
    const { k, fx, fy } = o.photoZoom;
    const cx = px + pw * fx, cy = py + ph * fy;
    c.translate(px + pw / 2, py + ph / 2);
    c.scale(k, k);
    c.translate(-cx, -cy);
  }
  o.photo(c, px, py, pw, ph);
  c.restore();
  const pages = compact ? 1 : 2;
  if (pages > 1) {
    socialButton(c, 512, py + 18, 66, 36, `1/${pages}`, { fill: "rgba(0,0,0,0.45)", size: 19, radius: 18 });
    for (let i = 0; i < pages; i++) {
      c.fillStyle = i ? "#55555c" : RED;
      c.beginPath(); c.arc(300 - 9 * (pages - 1) + i * 18, py + ph + 16, 4, 0, Math.PI * 2); c.fill();
    }
  }
  const shown = (o.comments ?? []).filter((cm) => (cm.pop ?? 1) > 0);
  const count = o.count ?? (compact ? shown.length : 6);
  const ty = py + ph + 50;
  say(c, o.caption, 36, ty, 36 * big, { color: INK, weight: 700 });
  if (compact) {
    say(c, o.ago + "  上海", 36, ty + 50, 22 * big, { color: GREY });
    c.fillStyle = LINE;
    c.fillRect(36, ty + 90, SW - 72, 1);
    say(c, "共 " + count + " 条评论", 36, ty + 128, 24 * big, { color: GREY });
    if (o.details) {
      say(c, words().inbox, 538, ty + 128, 22, { color: "#b4b4bb", align: "right" });
      socialIcon(c, "chevron", 561, ty + 128, 20, GREY);
      if (shown.length) {
        c.fillStyle = RED;
        c.beginPath(); c.arc(538 - measure(c, words().inbox, 22, F.ui, 400) - 14, ty + 127, 4.5, 0, Math.PI * 2); c.fill();
      }
    }
    let cy = ty + 180;
    if (!shown.length) say(c, "还没有评论哦，快来抢首评", SW / 2, cy + 40, 26 * big, { color: GREY, align: "center" });
    (o.comments ?? []).forEach((cm, i) => {
      const k = clamp(cm.pop ?? 1);
      if (k <= 0) return;
      const e = 1 - Math.pow(1 - k, 3);
      c.save(); c.globalAlpha *= e; c.translate(-36 * (1 - e), 0);
      if (i === 0 && o.mark !== undefined) guideBox(c, 24, cy - 26, SW - 48, 132 * big, o.mark);
      grayAvatar(c, 58, cy + 34 * big, 30 * big);
      say(c, cm.name, 104, cy, 23 * big, { color: GREY });
      say(c, cm.text, 104, cy + 46 * big, 34 * big, { color: INK, weight: 700, rose: cm.rose });
      const when = say(c, cm.ago ?? "刚刚", 104, cy + 92 * big, 21 * big, { color: DIM });
      if (o.details) {
        say(c, "回复", 104 + when + 22, cy + 92 * big, 21, { color: "#a0a0a7" });
        heartIcon(c, 551, cy + 34 * big, 24, "#7a7a82");
        say(c, "赞", 551, cy + 64 * big, 17, { color: "#7a7a82", align: "center" });
      }
      c.restore();
      cy += 140 * big;
    });
  } else {
    // a long note: its topic in 小红书's link blue, then the date and place, then 「共 N 条评论」 and the comment prompt
    const topic = "#" + o.caption.replace(/[～~！!。]/g, "");
    say(c, topic + "  #日常", 36, ty + 52, 26 * big, { color: TOPIC });
    say(c, o.ago + "  上海", 36, ty + 100, 22 * big, { color: GREY });
    c.fillStyle = LINE;
    c.fillRect(36, ty + 136, SW - 72, 1);
    say(c, "共 " + count + " 条评论", 36, ty + 180, 24 * big, { color: GREY });
    if (o.details) {
      herAvatar(c, 58, ty + 246, 22);
      c.fillStyle = CARD;
      rr(c, 92, ty + 224, SW - 128, 44, 22);
      c.fill();
      say(c, "爱评论的人运气都不差", 114, ty + 246, 21, { color: DIM });
    }
  }
  if (o.details) noteBar(c, o.likes ?? 23, compact ? 0 : 4, count);
}

// ---------------------------------------------------------------- the notification
/** The notification for a new comment: the sender's grey avatar with the 小红书 badge on its corner. The body sits where
 *  the 抖音版's does (140, y + 112), for the cut into her memory. */
export function xhsBanner(c: Ctx, k: number, o: BannerOpts) {
  if (k <= 0) return;
  const e = 1 - Math.pow(1 - clamp(k), 3);
  const big = o.big ? 1.25 : 1, h = 172 * big, y = -h + (84 + h) * e;
  c.save();
  c.shadowColor = "rgba(0,0,0,0.5)"; c.shadowBlur = 24; c.shadowOffsetY = o.details ? 8 : 0;
  c.fillStyle = "rgba(42,42,46,0.97)"; rr(c, 18, y, SW - 36, h, 30); c.fill();
  c.shadowColor = "transparent"; c.shadowOffsetY = 0;
  if (o.details) { c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1; c.stroke(); }
  if (o.reply) herAvatar(c, 82, y + h / 2, 40 * big);
  else grayAvatar(c, 82, y + h / 2, 40 * big);
  xhsBadge(c, 82 + 30 * big, y + h / 2 + 30 * big, 30 * big);
  const what = o.reply ? "回复了你" : o.big ? "评论了你" : "评论了你的笔记";
  say(c, o.name + " " + what, 140, y + 50 * big, (o.details ? 24 : 27) * big, { color: "#c9c9cf" });
  if (o.details) say(c, "现在", 554, y + 25, 17, { color: "#93939a", align: "right" });
  say(c, o.body, 140, y + 112 * big, 44 * big, { color: "#fff", weight: 700, rose: o.rose });
  c.restore();
}

// ---------------------------------------------------------------- his profile
/** His page: the grey avatar, the name and 小红书号, 「还没有简介」, then 关注 / 粉丝 / 获赞与收藏 (1 / 0 / 0, numbers over
 *  their names), the 关注 + 私信 row (folds over to 「已拉黑」), the 笔记 / 收藏 / 赞过 tabs and an empty 笔记. */
export function xhsProfile(c: Ctx, o: ProfileOpts) {
  c.fillStyle = BG; c.fillRect(0, 0, SW, SH);
  const g = c.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, "#33343c"); g.addColorStop(1, BG);
  c.fillStyle = g; c.fillRect(0, 0, SW, 640);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 40, 120, 30, "#fff");
  socialIcon(c, "share", MENU_AT[0] - 66, MENU_AT[1], 30, "#fff");
  socialIcon(c, "more", MENU_AT[0], MENU_AT[1], 34, "#fff");
  if ((o.menu ?? 0) > 0) {
    c.fillStyle = "rgba(255,255,255," + (0.18 * (o.menu ?? 0)).toFixed(3) + ")";
    c.beginPath(); c.arc(MENU_AT[0], MENU_AT[1], 40, 0, Math.PI * 2); c.fill();
  }
  grayAvatar(c, 116, 276, 76);
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 3;
  c.beginPath(); c.arc(116, 276, 79, 0, Math.PI * 2); c.stroke();
  say(c, o.name, 220, 246, 36, { color: "#fff", weight: 700 });
  say(c, words().accountId + XHS_ID, 220, 300, 21, { color: "#a9a9b1" });
  say(c, "还没有简介", 40, 376, 24, { color: GREY });
  // 关注 leads, the way 小红书 orders them; 「1 关注」 is where followsAt() says
  const stats: [string, string, number][] = [["1", "关注", 96], ["0", "粉丝", 216], ["0", "获赞与收藏", 372]];
  for (const [n, l, x] of stats) {
    say(c, n, x, 436, 38, { color: "#fff", weight: 700, align: "center" });
    say(c, l, x, 476, 22, { color: "#a9a9b1", align: "center" });
  }
  guideBox(c, 46, 410, 100, 86, o.pulse ?? 0);
  const blocked = clamp(o.blocked ?? 0);
  const fold = (k: number, draw: () => void) => {
    c.save();
    c.translate(0, 547);
    c.scale(1, Math.max(0.001, k));
    c.translate(0, -547);
    draw();
    c.restore();
  };
  if (blocked >= 0.5) {
    const k = 1 - Math.pow(1 - (blocked - 0.5) * 2, 2);
    fold(k, () => socialButton(c, 36, 512, 528, 70, "已拉黑", { fill: "#2a2a2f", color: "#b7b7bf", size: 28, radius: 35 }));
    c.save();
    c.globalAlpha *= k;
    say(c, words().blockedHint, SW / 2, 616, 21, { color: GREY, align: "center" });
    c.restore();
  } else {
    fold(1 - Math.pow(blocked * 2, 2), () => {
      socialButton(c, 36, 512, 396, 70, "关注", { fill: RED, color: "#fff", size: 29, radius: 35 });
      socialButton(c, 450, 512, 114, 70, "私信", { fill: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.35)", color: "#fff", size: 26, radius: 35 });
    });
  }
  // 笔记 / 收藏 / 赞过, a red line under 笔记
  const tabs: [string, number][] = [["笔记", 150], ["收藏", 300], ["赞过", 450]];
  tabs.forEach(([label, x], i) => say(c, label, x, 691, 28, { color: i ? "#808088" : "#fff", weight: i ? 400 : 700, align: "center" }));
  socialIcon(c, "lock", 300 + 44, 691, 18, "#808088");
  c.fillStyle = RED; rr(c, 126, 722, 48, 5, 2.5); c.fill();
  c.fillStyle = LINE; c.fillRect(0, 746, SW, 1);
  // no notes at all (the empty page is part of the clue): a blank notebook
  c.save();
  c.translate(300, 846);
  c.fillStyle = "#1f1f23";
  c.beginPath(); c.arc(0, 0, 58, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#5c5c64"; c.lineWidth = 3; c.lineJoin = "round";
  rr(c, -20, -26, 40, 52, 5); c.stroke();
  c.lineCap = "round";
  for (const ly of [-12, 0, 12]) { c.beginPath(); c.moveTo(-10, ly); c.lineTo(10, ly); c.stroke(); }
  c.restore();
  say(c, words().noWorks, SW / 2, 942, 28, { color: "#b4b4bc", weight: 700, align: "center" });
  say(c, words().noWorksHint, SW / 2, 988, 22, { color: DIM, align: "center" });
  socialHomeBar(c);
}

/** His 关注 list: the 关注 / 粉丝 tabs, and only her in it. Her row is where the 抖音版's is. */
export function xhsFollowing(c: Ctx, o: { pulse?: Guide; time: string }) {
  c.fillStyle = BG; c.fillRect(0, 0, SW, SH);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 40, 120, 30, "#fff");
  say(c, "关注", 250, 118, 32, { color: "#fff", weight: 700, align: "center" });
  say(c, "粉丝", 350, 118, 30, { color: "#808088", align: "center" });
  c.fillStyle = RED; rr(c, 230, 146, 40, 5, 2.5); c.fill();
  socialIcon(c, "search", 552, 120, 28, GREY);
  c.fillStyle = LINE; c.fillRect(0, 174, SW, 1);
  herAvatar(c, 90, 260, 50);
  say(c, HER, 166, 240, 34, { color: "#fff", weight: 700 });
  socialButton(c, 166 + measure(c, HER, 34, F.ui, 700) + 14, 223, 50, 34, "我", { fill: RED, size: 22, radius: 7 });
  say(c, "今天也要开心呀", 166, 288, 25, { color: GREY });
  guideBox(c, 30, 196, SW - 60, 130, o.pulse ?? 0);
  c.fillStyle = LINE; c.fillRect(166, 336, 398, 1);
  say(c, "— 没有更多了 —", SW / 2, 398, 22, { color: DIM, align: "center" });
  socialHomeBar(c);
}

// ---------------------------------------------------------------- 评论和@
/** 消息 → 评论和@: one row per comment — the grey avatar, his name and 「评论了你的笔记」, the comment, the date with a
 *  回复 pill, her note's picture on the right. Same row height and order as the 抖音版 (the fling lands on 瘦了). */
export function xhsComments(c: Ctx, o: CommentsOpts) {
  c.fillStyle = BG; c.fillRect(0, 0, SW, SH);
  c.save(); c.beginPath(); c.rect(0, 176, SW, 1050); c.clip();
  HISTORY.forEach(({ text: body, date, photo }, i) => {
    const y = 200 + i * ROW_H - o.scroll;
    if (y < 45 || y > SH + 40) return;
    c.save(); c.globalAlpha *= 1 - clamp(o.gone ?? 0);
    if (o.press && i === ROW_A) {
      c.fillStyle = "rgba(255,255,255," + (0.08 * o.press).toFixed(3) + ")";
      c.fillRect(0, y - 20, SW, ROW_H);
    }
    if (i < 2) {
      c.fillStyle = "rgba(255,36,66,0.05)"; c.fillRect(0, y - 14, SW, ROW_H);
      c.fillStyle = RED; c.beginPath(); c.arc(17, y + 43, 4, 0, Math.PI * 2); c.fill();
    }
    grayAvatar(c, 64, y + 46, 36);
    const nw = say(c, ACC_A, 122, y + 15, 24, { color: "#c4c4cb" });
    say(c, "评论了你的笔记", 122 + nw + 12, y + 16, 20, { color: DIM });
    say(c, body, 122, y + 66, 36, { color: INK, weight: 700, rose: true });
    say(c, date, 122, y + 111, 22, { color: GREY });
    c.fillStyle = CARD; rr(c, 382, y + 94, 82, 34, 17); c.fill();
    say(c, "回复", 423, y + 111, 19, { color: "#b4b4bb", align: "center" });
    c.save(); rr(c, 492, y + 7, 76, 104, 9); c.clip();
    c.translate(492, y + 7); c.scale(76 / 600, 104 / 800);
    photo(c, 0, 0, 600, 800); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1;
    rr(c, 492, y + 7, 76, 104, 9); c.stroke();
    c.fillStyle = LINE; c.fillRect(122, y + 134, 446, 1);
    c.restore();
  });
  for (const [row, k] of o.marks ?? []) {
    const y = 200 + row * ROW_H - o.scroll;
    guideBox(c, 20, y - 6, SW - 150, ROW_H - 24, k);
  }
  const total = HISTORY.length * ROW_H + 60, view = 1050;
  const barH = Math.max(60, (view * view) / total);
  const barY = 176 + (o.scroll / Math.max(1, total - view)) * (view - barH);
  c.fillStyle = "rgba(255,255,255,0.28)"; rr(c, SW - 12, barY, 4, barH, 2); c.fill();
  const endY = 200 + HISTORY.length * ROW_H - o.scroll + 18;
  say(c, "— 没有更多了 —", SW / 2, endY, 21, { color: DIM, align: "center" });
  c.restore();
  c.fillStyle = BG; c.fillRect(0, 0, SW, 176);
  statusBar(c, { time: o.time, airplane: false, battery: 0.41 });
  socialIcon(c, "back", 37, 120, 28, INK);
  say(c, words().inbox, SW / 2, 120, 32, { color: "#fff", weight: 700, align: "center" });
  c.fillStyle = LINE; c.fillRect(0, 175, SW, 1);
  socialHomeBar(c, { background: BG });
}

// ---------------------------------------------------------------- block
/** a round action in the share panel: (x, y) = the circle's centre */
function roundAction(c: Ctx, x: number, y: number, label: string, glyph: (c: Ctx) => void, o: { fill?: string; color?: string; hot?: number } = {}) {
  const hot = o.hot ?? 0;
  c.fillStyle = o.fill ?? "#2e2e33";
  c.beginPath(); c.arc(x, y, 40, 0, Math.PI * 2); c.fill();
  if (hot > 0) {
    c.fillStyle = `rgba(255,36,66,${(0.35 * hot).toFixed(3)})`;
    c.beginPath(); c.arc(x, y, 40, 0, Math.PI * 2); c.fill();
  }
  c.save();
  c.translate(x, y);
  c.strokeStyle = c.fillStyle = "#fff";
  c.lineWidth = 3.2; c.lineCap = "round"; c.lineJoin = "round";
  glyph(c);
  c.restore();
  say(c, label, x, y + 68, 21, { color: o.color ?? "#b4b4bb", align: "center" });
}

/** The 「···」 panel: 分享至 (微信好友, 朋友圈, QQ, 复制链接), then the round actions 举报 / 拉黑 / 设置备注 — 拉黑 on
 *  BLOCK_AT — and 取消; then the confirm (its 「确认」 where the 抖音版's 「拉黑」 is) and 「已拉黑」. */
export function xhsBlock(c: Ctx, o: BlockOpts) {
  if (o.sheet > 0) {
    c.save();
    c.fillStyle = "rgba(0,0,0," + (0.5 * clamp(o.sheet)).toFixed(3) + ")"; c.fillRect(0, 0, SW, SH);
    const e = 1 - Math.pow(1 - clamp(o.sheet), 3), y = SH - 840 * e;
    c.fillStyle = "#1f1f23"; rr(c, 0, y, SW, 900, 30); c.fill();
    say(c, "分享至", SW / 2, y + 40, 24, { color: GREY, align: "center" });
    const share: [string, string, (c: Ctx) => void][] = [
      ["微信好友", "#07c160", (k) => {
        k.beginPath(); k.ellipse(-6, -4, 14, 11, 0, 0, Math.PI * 2); k.fill();
        k.beginPath(); k.ellipse(9, 7, 11, 9, 0, 0, Math.PI * 2); k.fill();
        k.fillStyle = "#07c160"; k.beginPath(); k.arc(-11, -5, 2, 0, Math.PI * 2); k.arc(-1, -5, 2, 0, Math.PI * 2); k.fill();
      }],
      ["朋友圈", "#2db55d", (k) => {
        k.beginPath(); k.arc(0, 0, 15, 0, Math.PI * 2); k.stroke();
        for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; k.beginPath(); k.moveTo(6 * Math.cos(a), 6 * Math.sin(a)); k.lineTo(15 * Math.cos(a + 0.9), 15 * Math.sin(a + 0.9)); k.stroke(); }
      }],
      ["QQ", "#12b7f5", (k) => {
        k.beginPath(); k.ellipse(0, -2, 11, 14, 0, 0, Math.PI * 2); k.fill();
        k.beginPath(); k.ellipse(0, 13, 15, 4, 0, 0, Math.PI * 2); k.fill();
      }],
      ["复制链接", "#3a3a40", (k) => {
        k.rotate(-Math.PI / 4);
        rr(k, -17, -6, 20, 12, 6); k.stroke();
        rr(k, -3, -6, 20, 12, 6); k.stroke();
      }],
    ];
    share.forEach(([label, fill, glyph], i) => roundAction(c, 90 + i * 140, y + 120, label, glyph, { fill }));
    c.fillStyle = LINE; c.fillRect(32, y + 220, SW - 64, 1);
    // the actions: 拉黑 right on BLOCK_AT (746 when the panel is up)
    const ay = y + 306;
    roundAction(c, 150, ay, "举报", (k) => {
      k.beginPath(); k.moveTo(0, -15); k.lineTo(15, 12); k.lineTo(-15, 12); k.closePath(); k.stroke();
      k.beginPath(); k.moveTo(0, -5); k.lineTo(0, 3); k.stroke();
      k.beginPath(); k.arc(0, 8, 1.6, 0, Math.PI * 2); k.fill();
    });
    roundAction(c, 300, ay, "拉黑", (k) => {
      k.beginPath(); k.arc(0, 0, 15, 0, Math.PI * 2); k.stroke();
      k.beginPath(); k.moveTo(-10.5, -10.5); k.lineTo(10.5, 10.5); k.stroke();
    }, { hot: o.hot, color: "#fff" });
    roundAction(c, 450, ay, "设置备注", (k) => {
      k.rotate(Math.PI / 4);
      rr(k, -4.5, -16, 9, 24, 2); k.stroke();
      k.beginPath(); k.moveTo(-4.5, 8); k.lineTo(0, 15); k.lineTo(4.5, 8); k.stroke();
    });
    c.fillStyle = "#18181b"; c.fillRect(0, y + 690, SW, 12);
    say(c, "取消", SW / 2, y + 745, 32, { color: INK, align: "center" });
    socialHomeBar(c); c.restore();
  }
  if (o.confirm > 0 && o.done <= 0) {
    const k = clamp(o.confirm);
    c.save(); c.globalAlpha *= k;
    c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(0, 0, SW, SH);
    c.translate(SW / 2, 620); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
    c.fillStyle = "#2a2a2f"; rr(c, -250, -156, 500, 312, 24); c.fill();
    say(c, "确认拉黑该用户？", 0, -90, 34, { color: "#fff", weight: 700, align: "center" });
    say(c, "拉黑后，对方将无法关注你、", 0, -34, 23, { color: "#a6a6ae", align: "center" });
    say(c, "评论你的笔记和给你发私信", 0, 2, 23, { color: "#a6a6ae", align: "center" });
    c.fillStyle = LINE; c.fillRect(-250, 50, 500, 1); c.fillRect(0, 50, 1, 106);
    say(c, "取消", -120, 100, 32, { color: "#ddd", align: "center" });
    say(c, "确认", 120, 100, 32, { color: RED, weight: 700, align: "center" });
    c.restore();
  }
  if (o.done > 0) {
    const k = clamp(o.done);
    c.save(); c.globalAlpha *= Math.min(1, k * 3) * (1 - clamp((k - 0.8) / 0.2));
    c.fillStyle = "rgba(58,58,64,0.97)"; rr(c, SW / 2 - 130, 596, 260, 80, 18); c.fill();
    socialIcon(c, "check", 225, 636, 29, "#a2e7c1");
    say(c, "已拉黑", 326, 636, 32, { color: "#fff", weight: 700, align: "center" });
    c.restore();
  }
}
