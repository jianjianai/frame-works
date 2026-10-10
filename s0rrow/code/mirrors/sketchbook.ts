/**
 * 《mirrors》她的速写本（牛皮纸封面：白猫贴纸、角上的小枫叶；页边 sketchEdges；线圈 sketchSpiral），和举着本子的姿势：
 * holdPose(raise, hide) 从胸前举到鼻子、再举过脸挡住（害羞地笑、脸红、偷看他，挡住后闭眼），heldBook 本子、bookHands 两只手、
 * bookFrame 页面坐标（在本子上画东西）。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, Pt, beginFrame, inkLine, oval, paint, rbox, shaded } from "../draw";
import { drawKid } from "../kid";
import type { KidPose } from "../kid";
import { whiteCatFace } from "./phoneui";
import { mapleLeaf } from "./story";

/** Her sketchbook, shared by the roof shot where she holds it up (act3) and the pages (act4), so the cut between
 *  them matches. Page units: SKETCH_W × SKETCH_H, origin at the top-left corner, spiral along the top. */
export const SKETCH_W = 600;
export const SKETCH_H = 800;

/** the kraft cover: her white-cat sticker (her avatar) on a round label, a little red maple leaf in the corner */
export function sketchCover(c: Ctx, seed = 9541) {
  const w = SKETCH_W,
    h = SKETCH_H;
  shaded(c, () => rbox(c, 0, 0, w, h, 10, seed, 0.6), "#c9a274", () => {
    c.fillStyle = "rgba(120,80,40,0.16)";
    for (let i = 0; i < 60; i++) c.fillRect((i * 137) % w, (i * 211) % h, 4, 4);
    c.fillStyle = "rgba(255,240,210,0.2)";
    c.fillRect(0, 0, w * 0.4, h);
    // a worn edge along the bottom
    c.fillStyle = "rgba(90,60,30,0.14)";
    c.fillRect(0, h - 40, w, 40);
  }, C.ink, 4.5);
  // the sticker
  shaded(c, () => oval(c, w * 0.42, h * 0.42, 150, 150, seed + 1, 0.8), "#fffaf0", () => {
    oval(c, w * 0.42 + 20, h * 0.42 + 24, 140, 136, seed + 2, 0.6);
    paint(c, "rgba(200,180,150,0.25)", null);
  }, C.ink, 4.5);
  whiteCatFace(c, w * 0.42, h * 0.42, 2.6, seed + 3);
  // the leaf, in the bottom-right corner
  mapleLeaf(c, w * 0.8, h * 0.83, 62, 0.4, seed + 4, 1, "#e2483f", 3);
}

/** the pages under the top sheet, their edges showing at the right and bottom */
export function sketchEdges(c: Ctx, seed = 9550) {
  for (let k = 3; k >= 1; k--) {
    c.fillStyle = k === 3 ? "#b98f63" : "#efe8d8";
    rbox(c, k * 2, k * 5, SKETCH_W, SKETCH_H, 6, seed + k, 0.4);
    c.fill();
    c.strokeStyle = "rgba(70,62,52,0.4)";
    c.lineWidth = 2;
    c.stroke();
  }
}

/** the wire spiral along the top edge */
export function sketchSpiral(c: Ctx, seed = 9560) {
  for (let i = 0; i < 12; i++) {
    oval(c, 26 + (i * (SKETCH_W - 52)) / 11, -2, 8, 16, seed + i, 0.3);
    paint(c, null, "#7c7c84", 4.5);
  }
}

// ---------------------------------------------------------------- the book in her hands
/** the book in her head units: BOOK_W × BOOK_H, centred on x = 0; her round hands grip its sides GRIP_AT of the way
 *  down. Its top edge: at her chest, up to her nose (peeking over it), right up over her face (hiding). */
export const BOOK_W = 240;
export const BOOK_H = 320;
export const GRIP_AT = 0.73;
export const TOP_CHEST = 190;
export const TOP_PEEK = 62;
export const TOP_HIDE = -150;
const HAND_X = 126;

/** her arms for a book whose top edge is at `top`; hide 0 → 1 lifts the elbows as it goes up over her face */
export function holdingArms(top: number, hide: number): KidPose {
  const y = top + GRIP_AT * BOOK_H;
  const elbow = (sd: number): Pt => [sd * (146 + 6 * hide), 330 - 68 * hide];
  return { arms: "custom", elbowL: elbow(-1), elbowR: elbow(1), handL: [-HAND_X, y], handR: [HAND_X, y], shapeL: "hidden", shapeR: "hidden" };
}

const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
/** the book's top edge: raise 0 → 1 brings it from her chest to her nose, hide 0 → 1 on up over her face */
export const holdTop = (raise: number, hide: number) => mixN(mixN(TOP_CHEST, TOP_PEEK, raise), TOP_HIDE, hide);
/** her, holding the book (raise / hide as for holdTop): shy smile and blush, peeking at him; eyes shut once hidden */
export function holdPose(raise: number, hide: number, sway = 0): KidPose {
  const peek = raise > 0.55;
  return {
    who: "girl",
    outfit: "cardigan",
    body: "full",
    legs: "stand",
    ...holdingArms(holdTop(raise, hide), hide),
    eyes: hide > 0.3 ? "shut" : peek ? "open" : "happy",
    look: [-0.5, 0.1],
    brows: peek ? "worried" : "flat",
    mouth: "smile",
    blush: 0.35 + 0.45 * raise,
    tilt: -0.06 + sway,
    turn: -0.15,
    headY: 6 * raise + 8 * hide,
  };
}

/** the closed book (her head units) */
export function heldBook(c: Ctx, top: number) {
  c.save();
  c.translate(-BOOK_W / 2, top);
  c.scale(BOOK_W / SKETCH_W, BOOK_H / SKETCH_H);
  sketchEdges(c);
  sketchCover(c);
  sketchSpiral(c);
  c.restore();
}

/** a simple round hand on the book's edge, fingers curled over the front (her head units) */
function bookHand(c: Ctx, x: number, y: number, side: number, seed: number) {
  shaded(c, () => oval(c, x, y, 30, 29, seed, 0.8), "#f6e1c3", () => {
    oval(c, x + 12, y + 14, 24, 18, seed + 1, 0.6);
    paint(c, "rgba(196,150,96,0.35)", null);
  }, C.ink, 4.5);
  for (const dy of [-9, 5]) inkLine(c, [[x + side * 2, y + dy], [x + side * 18, y + dy + 2]], seed + 2 + dy, 2.2, "#c99f75");
}

/** both hands on the book (drawn over it), in her frame (x, y, s = her drawKid) */
export function bookHands(c: Ctx, x: number, y: number, s: number, top: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const hy = top + GRIP_AT * BOOK_H;
  bookHand(c, -HAND_X, hy, -1, 9380);
  bookHand(c, HAND_X, hy, 1, 9386);
  c.restore();
}

/** the page frame (origin top-left of the page, page units) for a book held at `top` by her at (x, y, s) */
export function bookFrame(c: Ctx, x: number, y: number, s: number, top: number) {
  c.translate(x - (BOOK_W / 2) * s, y + top * s);
  c.scale((BOOK_W / SKETCH_W) * s, (BOOK_H / SKETCH_H) * s);
}

// ---------------------------------------------------------------- resources (preview and catalog)
export const resources = defineResources({
  sketchbook: resource({
    kind: "prop",
    title: "速写本（封面）",
    description: "她的速写本：牛皮纸封面上圆形标签里的白猫贴纸、角上的小红枫叶（sketchCover），下面几页的页边（sketchEdges），顶上的线圈（sketchSpiral）。画在 SKETCH_W × SKETCH_H（600×800）的本子坐标里。",
    tags: ["速写本", "本子", "封面", "白猫", "枫叶"],
    usage: "ctx.translate(x, y); ctx.scale(s, s); sketchEdges(ctx); sketchCover(ctx); sketchSpiral(ctx)",
    preview: {
      width: 760,
      height: 960,
      draw(ctx, t) {
        beginFrame(ctx, t);
        ctx.translate(80, 100);
        sketchEdges(ctx);
        sketchCover(ctx);
        sketchSpiral(ctx);
      },
    },
  }),
  holdBook: resource({
    kind: "character",
    title: "女主举着速写本",
    description:
      "她举着本子的姿势：raise 0 → 1 从胸前举到鼻子（害羞地笑、脸红、从本子上面偷看他），hide 0 → 1 再举过脸挡住（挡住后闭眼）；sway 左右轻晃。画法：drawKid(holdPose(raise, hide, sway))，在她的头部坐标里 heldBook(c, holdTop(raise, hide))，再 bookHands(c, x, y, s, top) 画盖在本子上的两只手；bookFrame 给出页面坐标（在本子上画东西）。",
    tags: ["女主", "速写本", "害羞", "偷看", "举着"],
    usage: "const top = holdTop(raise, hide); drawKid(c, x, y, s, holdPose(raise, hide, sway)); c.save(); c.translate(x, y); c.scale(s, s); heldBook(c, top); c.restore(); bookHands(c, x, y, s, top)",
    params: z.object({
      raise: z.number().min(0).max(1).default(0.7).describe("从胸前举到鼻子"),
      hide: z.number().min(0).max(1).default(0).describe("举过脸挡住"),
    }),
    presets: { 胸前: { raise: 0 }, 挡住脸: { raise: 1, hide: 1 } },
    preview: {
      width: 700,
      height: 1000,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const [x, y, s] = [350, 300, 1];
        const top = holdTop(p.raise, p.hide);
        drawKid(ctx, x, y, s, holdPose(p.raise, p.hide, Math.sin(t * 6.5) * 0.03 * p.raise * (1 - p.hide)));
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        heldBook(ctx, top);
        ctx.restore();
        bookHands(ctx, x, y, s, top);
      },
    },
  }),
});
