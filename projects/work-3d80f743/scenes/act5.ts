// 三「明天见」（88.02 起，故事「早上，沉沉家」……）。一个镜头一个镜头做，用户确认一个再做下一个。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 88.02–89.91「发着光的半平米」（lib/morning.ts）：镜头从主歌二⑧仰头看的天花板往下摇回侧面的屋子，摇的时候溶过去（时间往后跳一点）：
//      早上，他已经起来了，穿着外套站在桌前的地上，一把一把把还睡着的她从天花板的床上拉下来；地上一小块太阳照亮的光里，立着她的两只铁靴。
//   ② 89.91–92.02「胡乱哼唱的旋律」（lib/morning.ts 的 HUM_T，同一个镜头）：她醒了，他把铁靴推到她脚底下、仰头朝她伸手；她犹豫着看一眼窗外，
//      回过头拉住他的手踩进铁靴，91.02「咚」落回地上。镜头慢慢凑近两张脸。
//   ③ 92.02–93.9「但是还想拯救你」（lib/street3.ts）：小节线上切到白天的街上：阿满飘了起来，她跳起来攥住他的脚踝，自己也被带离了地；
//      小石头跑过来从后面抱住她的腿，两个人一起把阿满拽回街面。镜头跟着往上带，再猛地沉回街面。
//   ④ 93.9–95.55「同时拯救我自己」（lib/street4.ts，不切）：镜头往后退、往上升，退到整座城：路口周磊拽下一个飘起来的年轻人、给他砖；
//      街的最西头千斤在家门口把砖递给窗口飘出来的老太太。一条街上两处暖光，头顶是白。
//   ⑤ 95.55–97.98「就请你 / 放心大胆更妄为肆意」（lib/street3.ts 的 WALK_T，镜头 lib/street4.ts 的 walkCam）：镜头从整座城一下扎回她们身上，
//      96.02 副歌二进来时落定；她们往西回家，她一拍一「咚」，小石头跟在后面学她跺脚。
//   ⑥ 97.98–99.96「迈步向前别害怕失去」（lib/street3.ts 的 MISS_T，同一个镜头）：小石头抬头看见白，不跺了，脚跟、脚尖离了地，飘起来；
//      她听见身后没声了，回过身跑回两步牵住他的手，99.52「咚」他落回地上。
//   ⑦ 99.96–101.97「没有犯下任何错的你」（lib/write5.ts）：街上牵着的手溶成夜里台灯下的两只手（溶的时候在画面上同一个地方、一样大）：
//      她坐在椅子上把他抱在腿上，近处那只手绕过来握着他攥笔的手，带他在砖上写「活下去」；镜头一路慢慢推近砖、两只手和两张脸。
//   ⑧ 101.97–103.98「在我心里只用做自己」（lib/write5.ts 的 GIFT_T，同一个镜头）：她松开手、拍一下他攥着笔的拳头（笔给他了），
//      他举起笔看看、抬头看她，她点头；溶过去、时间往后跳一点：他一个人在新砖上写「妈妈，明天见」，她环着他、低头看着。
//   ⑨ 103.98–105.99「这段胡乱拼凑的词语」（lib/write5.ts 的 FULL_T，同一个镜头）：又往后跳一点，他靠在她怀里睡着了；她写完自己那块
//      「活下去」，放下笔、拿起砖竖过来往近处那只铁靴里插——靴筒里塞满了写着字的砖，插不进去；又推一下，停住，看着那块砖。
// 开头接着主歌二⑧（scenes/act4.ts）：仰头看的画面照样从 lib/bed.ts 画（同一个镜头函数 bedCam，接过去的那一帧一样）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { applyCam, clamp01, viewOf } from "../lib/cam";
import { PULL_T, WALK_T, drawPull3, pullCam } from "../lib/street3";
import { SPREAD_T, drawSpread, spreadCam, walkCam } from "../lib/street4";
import { FULL_T, GIFT_T, LESSON_T, fullAway, fullMix, giftAway, giftMix, lessonAway, lessonCam, lessonMix } from "../lib/write5";
import { drawStreet, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { drawRoom, setRoomAway } from "../lib/room";
import { roomMatrix, setCage, setHomeLamp } from "../lib/night";
import { roomZ } from "../lib/write";
import { bedCam, drawCeiling } from "../lib/bed";
import { morningAway, morningCam, morningMix } from "../lib/morning";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir } = makeStage(base, grain);
  // 溶的时候侧面的屋子先画在这里，再按溶的程度盖上去
  const over = document.createElement("canvas");
  over.width = width;
  over.height = height;
  const overCtx = over.getContext("2d")!;
  const fill = (g: CanvasRenderingContext2D) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1c1820";
    g.fillRect(0, 0, width, height);
  };

  return {
    canvas,
    render(t) {
      try {
        if (t >= PULL_T.start) {
          const k = t >= LESSON_T.mix0 ? lessonMix(t) : 0;
          if (k < 1) {
            // ③–⑥ 白天的街上（和第一幕同一套城和楼）：她出门了，她家的灯灭着、铁栅栏门关着；退到整座城时远处那几栋高楼淡进来（和第一幕一样）
            const cam = t >= WALK_T.dive ? walkCam(t) : t >= SPREAD_T.start ? spreadCam(t) : pullCam(t);
            setDusk(0);
            setHomeLamp(0);
            setCage(1);
            drawWorld(ctx, cam, t, [0, 0], undefined, clamp01((0.62 - cam.z) / 0.3));
            applyCam(ctx, base, cam, 1);
            drawStreet(ctx, cam);
            drawPull3(ctx, t, cam.z);
            if (t >= SPREAD_T.start) drawSpread(ctx, t, cam.z, viewOf(cam, 1));
            drawAir(ctx, cam, t, [0, 0], skyLook(t), 0, 0);
          }
          if (k > 0) {
            // ⑦⑧ 夜里的屋子（台灯亮着，夜里的颜色调子）：溶的时候画在另一张画布上盖上去；
            // ⑧ 时间往后跳一点也是这样溶（同一个镜头，屋里换成后来的样子）
            const cam = lessonCam(t);
            const night = (g: CanvasRenderingContext2D, away: ReturnType<typeof lessonAway>) => {
              fill(g);
              applyCam(g, base, cam, 1);
              const m = roomMatrix();
              g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
              setRoomAway(away);
              drawRoom(g, t, 1, Math.max(0.45, Math.min(1, 1 / Math.sqrt(roomZ(cam)))));
              setRoomAway(null);
              setDusk(1, 1);
              drawAir(g, cam, t, [0, 0], skyLook(t), 1);
            };
            const cover = (a: number) => {
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.globalAlpha = a;
              ctx.drawImage(over, 0, 0);
              ctx.restore();
            };
            // 屋里这一刻的样子（铺在下面的）和正在溶上来的那一个（⑧⑨ 往后跳一点）
            const kb = t >= GIFT_T.mix0 ? giftMix(t) : 0;
            const kc = t >= FULL_T.mix0 ? fullMix(t) : 0;
            let under = lessonAway;
            let top: typeof lessonAway | null = null;
            let kt = 0;
            if (kc > 0) [under, top, kt] = kc < 1 ? [giftAway, fullAway, kc] : [fullAway, null, 0];
            else if (kb > 0) [under, top, kt] = kb < 1 ? [lessonAway, giftAway, kb] : [giftAway, null, 0];
            if (k < 1) {
              night(overCtx, under(t));
              cover(k);
            } else {
              night(ctx, under(t));
              if (top) {
                night(overCtx, top(t));
                cover(kt);
              }
            }
          }
          return;
        }
        const k = morningMix(t);
        if (k < 1) {
          // 仰头看的天花板（和主歌二⑧同一套：夜里的颜色调子）
          const bc = bedCam(t);
          fill(ctx);
          drawCeiling(ctx, base, t, bc);
          setDusk(1, 1);
          drawAir(ctx, bc, t, [0, 0], skyLook(t), 1);
        }
        if (k > 0) {
          // 侧面的屋子：早上（灯灭着，窗外的光照进来），白天的颜色调子
          const g = k < 1 ? overCtx : ctx;
          const cam = morningCam(t);
          fill(g);
          applyCam(g, base, cam, 1);
          const m = roomMatrix();
          g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
          setRoomAway(morningAway(t));
          drawRoom(g, t, 0, Math.max(0.45, Math.min(1, 1 / Math.sqrt(roomZ(cam)))));
          setRoomAway(null);
          setDusk(0);
          drawAir(g, cam, t, [0, 0], skyLook(t), 1);
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
        setHomeLamp(null);
        setCage(-0.32);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      over.width = over.height = 1;
    },
  };
}
