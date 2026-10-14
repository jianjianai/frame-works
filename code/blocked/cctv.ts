/**
 * 门卫室监控屏的四路画面（《屏蔽》work-73c8f9bc）：01 大门、02 厂区、03 门卫室、04 道路——深夜的雪里空无一人，
 * 只有门卫室那一路里坐着他；道路那一路的雪地上只有一串脚印。黑白偏冷绿、扫描线、噪点、REC 和时间。
 * 画在 boothBack({ detailed: true }) 之后、同一套坐标里，盖住监控屏上原来的简笔画面；特写时用 camera 推到屏上（CCTV_SCREEN、feedRect）。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, F, beginFrame, camera, hash, loadFonts, text } from "../draw";
import { boothBack, gateNight } from "./booth";
import { drawDad } from "./dad";

/** the monitor's screen on boothBack's desk (its units) */
export const CCTV_SCREEN = { x: 143, y: 774, w: 275, h: 196 };
const FW = 134,
  FH = 94;
/** feed i (0..3, two by two) on that screen */
export const feedRect = (i: number) => ({ x: 143 + (i % 2) * 138, y: 774 + Math.floor(i / 2) * 98, w: FW, h: FH });

export interface CctvOptions {
  /** the time stamped on every feed, e.g. "02:49:52" */
  time?: string;
  /** the four labels */
  labels?: string[];
  /** him in feed 03, drawn in boothBack's full-frame units (default: his back, sitting at the desk) */
  guard?: (c: Ctx) => void;
}

/** a full-frame 1080×1920 picture, its rect `src` cropped into a feed */
function crop(c: Ctx, scene: (k: Ctx) => void, [sx, sy, sw, sh]: [number, number, number, number]) {
  c.save();
  c.scale(FW / sw, FH / sh);
  c.translate(-sx, -sy);
  scene(c);
  c.restore();
}

/** The four CCTV pictures over the monitor of a detailed boothBack (same transform as the booth). */
export function cctvFeeds(c: Ctx, abs: number, o: CctvOptions = {}) {
  const labels = o.labels ?? ["01 大门", "02 厂区", "03 门卫室", "04 道路"];
  // backDetails: in grey the back of a plain head reads as a blank face; the hair's texture keeps it a back
  const guard = o.guard ?? ((k: Ctx) => drawDad(k, 510, 1170, 1.12, { view: "back", coat: true, backDetails: true }));
  // the screen between the feeds (covers the booth's own simple pictures and their time)
  c.fillStyle = "#0d1517";
  c.fillRect(CCTV_SCREEN.x, CCTV_SCREEN.y, CCTV_SCREEN.w, CCTV_SCREEN.h);
  for (let i = 0; i < 4; i++) {
    const r = feedRect(i);
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.translate(r.x, r.y);
    c.fillStyle = "#26353a";
    c.fillRect(0, 0, r.w, r.h);
    if (i === 0) crop(c, (k) => gateNight(k, abs, 0), [0, 430, 1080, 758]);
    else if (i === 1) crop(c, (k) => gateNight(k, abs, -170), [60, -30, 975, 684]);
    else if (i === 2)
      crop(c, (k) => {
        boothBack(k, abs);
        guard(k);
      }, [-40, 640, 1160, 812]);
    else crop(c, (k) => gateNight(k, abs, 130), [0, 1080, 1080, 758]);
    // the CCTV look: no colour, a cold green-grey cast, lifted blacks
    c.globalCompositeOperation = "saturation";
    c.fillStyle = "#808080";
    c.fillRect(0, 0, r.w, r.h);
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "rgb(176,214,202)";
    c.fillRect(0, 0, r.w, r.h);
    c.globalCompositeOperation = "screen";
    c.fillStyle = "rgba(26,50,50,0.65)";
    c.fillRect(0, 0, r.w, r.h);
    c.globalCompositeOperation = "source-over";
    // scan lines, flickering noise, a dark rim
    c.fillStyle = "rgba(6,18,20,0.18)";
    for (let y = 1; y < r.h; y += 2.4) c.fillRect(0, y, r.w, 0.7);
    const f = Math.floor(abs * 12);
    for (let j = 0; j < 36; j++) {
      c.fillStyle = `rgba(222,240,232,${(0.07 + 0.12 * hash(f * 3.1 + j + i * 50)).toFixed(3)})`;
      c.fillRect(hash(f + j * 7.3 + i) * r.w, hash(f * 1.7 + j * 3.9 + i) * r.h, 0.7, 0.7);
    }
    const v = c.createRadialGradient(r.w / 2, r.h / 2, r.h * 0.3, r.w / 2, r.h / 2, r.w * 0.72);
    v.addColorStop(0, "rgba(3,10,12,0)");
    v.addColorStop(1, "rgba(3,10,12,0.55)");
    c.fillStyle = v;
    c.fillRect(0, 0, r.w, r.h);
    // label, a blinking REC, the time
    text(c, labels[i], 4, 7.5, { size: 6.5, font: F.ui, fill: "#d8e8e0", align: "left" });
    if (Math.floor(abs * 2) % 2 === 0) {
      c.fillStyle = "#e2493b";
      c.beginPath();
      c.arc(r.w - 20, 7.5, 1.9, 0, Math.PI * 2);
      c.fill();
    }
    text(c, "REC", r.w - 4, 7.5, { size: 5.5, font: F.ui, fill: "#d8e8e0", align: "right" });
    text(c, o.time ?? "02:49", r.w - 4, r.h - 6, { size: 6, font: F.ui, fill: "#d8e8e0", align: "right" });
    c.restore();
  }
}

const cctvOptions = z.object({
  time: z.string().default("02:49:52").describe("每路画面右下角的时间"),
  zoom: z.number().min(1).max(8).default(3.5).describe("预览里推到监控屏的倍数（1 是整个岗亭背影）"),
});

export const resources = defineResources({
  cctvFeeds: resource({
    kind: "ui",
    title: "门卫室监控屏（四路空画面）",
    description:
      "门卫室桌上监控屏的四路画面：01 大门、02 厂区、03 门卫室、04 道路，深夜下雪、空无一人，只有门卫室那一路里坐着他（guard 自己画，默认是背影），道路那一路的雪地上只有一串脚印。黑白偏冷绿、扫描线、闪烁噪点、REC 和时间。画在 boothBack({ detailed: true }) 之后、同一套坐标里；表现他一个人守夜时用 camera 推到屏上（CCTV_SCREEN、feedRect(2) 是门卫室那一路）。",
    tags: ["监控", "门卫室", "保安", "孤独", "夜班", "屏幕", "雪夜"],
    usage: "boothBack(ctx, abs, { detailed: true }); cctvFeeds(ctx, abs, { time: \"02:49:52\", guard: (k) => drawDad(k, 510, 1170, 1.12, { view: \"back\", coat: true, backDetails: true }) })",
    params: cctvOptions,
    preview: {
      width: 1080,
      height: 1920,
      duration: 2,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        ctx.save();
        camera(ctx, 280, 872, p.zoom, 0, 260, -112);
        boothBack(ctx, t, { detailed: true });
        cctvFeeds(ctx, t, { time: p.time });
        ctx.restore();
      },
    },
  }),
});
