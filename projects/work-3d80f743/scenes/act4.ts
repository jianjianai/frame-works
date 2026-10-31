// 主歌二（72.02 起，故事「夜里，沉沉家」）。一个镜头一个镜头做，用户确认一个再做下一个。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ①–④ 72.02–79.56（lib/nightwin.ts，2026-10-25 用户重新设计）：镜头在屋里对着窗那面墙，一个镜头到底。
//   ① 倒着看（她的世界）：她坐在窗的上框上，攥着小刀压在脚踝边的脚绳上，整句犹豫，「生活」闭上眼。
//   ② 「做」脚绳一拉，她被扯离窗框转过去一半，刀甩出手往上掉；「诺」第二下：镜头和她一起转回正，往后拉远到两个人（地上拽绳子的小石头露出来）。
//   ③ 他接着两把拽，上前抱住她的腿，她踩进铁靴「咚」。
//   ④ 他就地跪下捡起脚边的刀，「默」从窗口扔出去，两个人不说话。
//   ⑤ 79.56–81.87「但我还想做些什么」（lib/sill.ts 的 KNOT_T）：切进屋里，近景：他跪在椅子边把红绳绕在她的脚绳上，「么」一拉勒紧；
//      镜头往上抬：她浮在半空低头看他，慢慢伸下手来。
//   ⑥ 81.87–83.85「其实还想要说很多」（lib/sill.ts 的 FLOAT_T）：他够不着她的手，脱掉缝着铅的外套飘起来，「很」两只手攥在一起。
//   ⑦ 83.85–85.8「请你等等我」（lib/bed.ts）：时间往后跳一点。镜头接着往上抬，一边抬一边溶成仰头看天花板：两张倒钉着的床并排，
//      两个人隔着床中间的缝牵着手，系在一起的两根绳子垂下去；她拉一下床头的拉线开关，「咔」灯灭了，只剩窗外透过铁栏的冷光。
//   ⑧ 85.8–88.02「请你等等我」第二句（lib/bed.ts 的 DAWN_T，同一个镜头）：一夜过去，冷光移走、淡下去；天亮，晨光从脚那头爬到两张脸上，
//      88.02 小石头先睁开眼。镜头很慢地往后退。
// ⑤ 起屋子从 lib/stage.ts 的 drawInside 画（和第二幕同一套）；屋里不画她（room.ts 的 setRoomAway），⑤ 的她、他由 lib/sill.ts 画进去。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { setRoomAway } from "../lib/room";
import { KNOT_T, roomAwayAt, sillCam } from "../lib/sill";
import { drawNightWindow } from "../lib/nightwin";
import { BED_T, bedCam, bedMix, drawCeiling, tiltPx } from "../lib/bed";
import { H, W, setLens, syncFrame } from "../lib/cam";
import { lensAt } from "../lib/wide";

/** lens：横屏取景用哪张表（回忆 scenes/recall.ts 里画那一夜用 "act4mem"，见 lib/wide.ts） */
export async function createScene({ width, height }: SceneOptions, lens = "act4"): Promise<Scene> {
  syncFrame(width, height);
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawAir, drawInside } = makeStage(base, grain);
  // ⑦ 溶成仰头看天花板时，仰头看的画面先画在这里，再按溶的程度盖上去
  const over = document.createElement("canvas");
  over.width = width;
  over.height = height;
  const overCtx = over.getContext("2d")!;

  return {
    canvas,
    render(t) {
      syncFrame(width, height);
      setLens(lensAt(lens, t));
      setDusk(1, 1);
      setRoomAway(roomAwayAt(t));
      try {
        const k = t >= BED_T.start ? bedMix(t) : 0;
        if (k < 1) {
          if (t < KNOT_T.start) {
            // ①–④ 屋里对着窗那面墙（lib/nightwin.ts，自己的镜头）
            drawNightWindow(ctx, base, grain, t);
          } else {
            // ⑤ 起镜头在屋里（对着门、桌子那面墙）
            let cam = sillCam(t);
            // ⑦ 接着⑥往上抬（和仰头看的画面一起走）
            if (t > BED_T.start) cam = { ...cam, y: cam.y - tiltPx(t) / cam.z };
            drawInside(ctx, t, cam);
          }
        }
        if (k > 0) {
          const g = k < 1 ? overCtx : ctx;
          const bc = bedCam(t);
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.fillStyle = "#1c1820";
          g.fillRect(0, 0, width, height);
          drawCeiling(g, base, t, bc);
          setDusk(1, 1);
          drawAir(g, bc, t, [0, 0], skyLook(t), 1);
          if (k < 1) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = k;
            ctx.drawImage(over, 0, 0);
            ctx.restore();
          }
        }
      } finally {
        setRoomAway(null);
        setDusk(0);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      over.width = over.height = 1;
    },
  };
}
