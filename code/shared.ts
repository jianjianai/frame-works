import { Ctx } from "./draw";
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
}
/** The birthday desk: same framing in the cold open (act 1) and when the story loops back (act 4). */
export function birthdayDesk(ctx: Ctx, abs: number, o: DeskShot) {
  bedroom(ctx, abs, 1);
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
  cupcake(ctx, 390, 1170, 0.8, abs, o.lit, o.smoke ?? 0);
  phone(ctx, 860, 1200, 0.2, -0.32, (c) => {
    lockScreen(c, { time: o.phoneTime ?? "23:58", airplane: true });
    if ((o.phoneOn ?? 1) < 1) {
      c.fillStyle = `rgba(0,0,0,${1 - (o.phoneOn ?? 1)})`;
      c.fillRect(0, 0, 600, 1280);
    }
  });
  const lit = o.lit;
  if (lit > 0.01) lightPool(ctx, 390, 920, 1050 * (0.6 + 0.4 * lit), o.dark ?? 0.86);
  else {
    ctx.fillStyle = `rgba(3,4,12,${o.dark ?? 0.94})`;
    ctx.fillRect(-60, -60, 1200, 2040);
  }
}
