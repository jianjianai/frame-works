// 主歌二（72.02 起，故事「夜里，沉沉家」）。一个镜头一个镜头做，用户确认一个再做下一个。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 72.02–73.89「忍着想要挣脱的生活」（lib/sill.ts）：小节线上硬切到夜里，最高那栋楼顶层她那扇窗亮着，窗外头顶就是白；
//      她没穿铁靴，飘起来坐在窗框上，光着的腿垂在窗外，脚绳从屋里椅子后腿绷直拉过窗台拴在她脚踝上；她攥着小折刀抵在绳子上，
//      「生活」闭上眼。镜头从窗外远处一路慢慢推向她。
//   ② 73.89–75.93「做出不想做的承诺」（lib/sill.ts 的 KNOCK_T，同一个镜头）：两下敲门，她一惊转头；门慢慢开了，小石头站在门口，
//      攥着被割断的红绳；「承诺」她手一松，刀掉在屋里的地上。镜头接着慢慢推，顺着她的视线挪向门。
//   ③ 75.93–77.94「列车上坐错站的乘客」（lib/sill.ts 的 THROW_T，同一个镜头）：他冲过屋子捡起刀，朝着窗外把刀从她身边扔出去，
//      刀闪着光翻着掉进夜里；「的乘客」他转过身攥住她的手。镜头跟着他挪回她身边，顺着刀往下看一点。
//   ④ 77.94–79.56「困惑着沉默」（lib/sill.ts 的 SHUT_T，同一个镜头）：他往回一拉，她浮回屋里；他冲到窗的左边，「默」把铁栅栏门「哐」地关上。
//      镜头慢慢往后退，退回①开头的取景。
//   ⑤ 79.56–81.87「但我还想做些什么」（lib/sill.ts 的 KNOT_T）：切进屋里，近景：他跪在椅子边把红绳绕在她的脚绳上，「么」一拉勒紧；
//      镜头往上抬：她浮在半空低头看他，慢慢伸下手来。
//   ⑥ 81.87–83.85「其实还想要说很多」（lib/sill.ts 的 FLOAT_T）：他够不着她的手，脱掉缝着铅的外套飘起来，「很」两只手攥在一起。
//   ⑦ 83.85–85.8「请你等等我」（lib/bed.ts）：时间往后跳一点。镜头接着往上抬，一边抬一边溶成仰头看天花板：两张倒钉着的床并排，
//      两个人隔着床中间的缝牵着手，系在一起的两根绳子垂下去；她拉一下床头的拉线开关，「咔」灯灭了，只剩窗外透过铁栏的冷光。
//   ⑧ 85.8–88.02「请你等等我」第二句（lib/bed.ts 的 DAWN_T，同一个镜头）：一夜过去，冷光移走、淡下去；天亮，晨光从脚那头爬到两张脸上，
//      88.02 小石头先睁开眼。镜头很慢地往后退。
// 城、她那扇窗、窗里的屋子从 lib/stage.ts 画（和第二幕同一套）；屋里不画她（room.ts 的 setRoomAway），她坐在窗框上另画。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { applyCam, shake } from "../lib/cam";
import { makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { setRoomAway } from "../lib/room";
import { KNOT_T, cageAt, drawSill, roomAwayAt, sillCam } from "../lib/sill";
import { setCage } from "../lib/night";
import { BED_T, bedCam, bedMix, drawCeiling, tiltPx } from "../lib/bed";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir, windowCovers, drawInside } = makeStage(base, grain);
  // ⑦ 溶成仰头看天花板时，仰头看的画面先画在这里，再按溶的程度盖上去
  const over = document.createElement("canvas");
  over.width = width;
  over.height = height;
  const overCtx = over.getContext("2d")!;

  return {
    canvas,
    render(t) {
      const sh = shake(t, 0);
      setDusk(1, 1);
      setRoomAway(roomAwayAt(t));
      setCage(cageAt(t));
      try {
        const k = t >= BED_T.start ? bedMix(t) : 0;
        if (k < 1) {
          let cam = sillCam(t);
          // ⑦ 接着⑥往上抬（和仰头看的画面一起走）
          if (t > BED_T.start) cam = { ...cam, y: cam.y - tiltPx(t) / cam.z };
          if (t >= KNOT_T.start || windowCovers(cam)) {
            // 在屋里（⑤ 起镜头一直在屋里；窗盖住整个画面时也只画屋里，和第二幕进屋以后一样）
            drawInside(ctx, t, cam);
          } else {
            drawWorld(ctx, cam, t, sh, undefined, 0);
            applyCam(ctx, base, cam, 1, sh);
            drawSill(ctx, t, cam.z);
            drawAir(ctx, cam, t, sh, skyLook(t), 0, 0);
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
        setCage(-0.32);
        setDusk(0);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      over.width = over.height = 1;
    },
  };
}
