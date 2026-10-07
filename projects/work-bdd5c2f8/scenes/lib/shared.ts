import { Ctx, glow } from "./draw";
import { KidPose, drawKid } from "./kid";
import { lockScreen, phone } from "./phone";
import { bedroom, cupcake, desk, lightPool } from "./sets";

export interface DeskShot {
  lit: number; // candle 0..1
  smoke?: number;
  kid?: KidPose;
  phoneTime?: string;
  phoneOn?: number; // screen brightness 0..1
  dark?: number; // darkness strength around the light
  /** "scene" = everything except the candle's flame and warm light; "flame" = only those. Draw the scene through
   *  grade() (his grey world) and the flame on top in colour — the candle is the only warm thing in his room. */
  layer?: "all" | "scene" | "flame";
  /** 0..1 the clue outside the window: phone lights and a pink banner down on the street (they're already there) */
  clue?: number;
}
/** The birthday desk: same framing in the cold open (act 1) and when the story loops back (act 4). */
export function birthdayDesk(ctx: Ctx, abs: number, o: DeskShot) {
  const layer = o.layer ?? "all";
  const lit = o.lit;
  const r = 1050 * (0.6 + 0.4 * lit);
  if (layer !== "flame") {
    bedroom(ctx, abs, 1, o.clue ?? 0);
    drawKid(ctx, 600, 810, 1.1, {
      body: "bust",
      arms: "table",
      hat: true,
      look: [-0.55, 0.7],
      tilt: -0.05,
      headY: Math.sin(abs * 1.6) * 3,
      ...o.kid,
    });
    desk(ctx, 1080);
    cupcake(ctx, 390, 1170, 0.8, abs, lit, o.smoke ?? 0, 1, layer === "scene" ? "body" : "all");
    phone(ctx, 860, 1200, 0.2, -0.32, (c) => {
      lockScreen(c, { time: o.phoneTime ?? "23:58", airplane: true });
      if ((o.phoneOn ?? 1) < 1) {
        c.fillStyle = `rgba(0,0,0,${1 - (o.phoneOn ?? 1)})`;
        c.fillRect(0, 0, 600, 1280);
      }
    });
    if (lit > 0.01) lightPool(ctx, 390, 920, r, o.dark ?? 0.86, layer === "scene" ? "rgba(0,0,0,0)" : undefined);
    else {
      ctx.fillStyle = `rgba(3,4,12,${o.dark ?? 0.94})`;
      ctx.fillRect(-60, -60, 1200, 2040);
    }
  }
  if (layer === "flame" && lit > 0.01) {
    // the candle's warm light on everything around it, then the flame itself
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 390, 920, r * 0.8, "rgba(255,170,70,0.28)");
    ctx.restore();
    cupcake(ctx, 390, 1170, 0.8, abs, lit, 0, 1, "flame");
  }
}
