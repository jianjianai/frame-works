// 四「赤脚」（105.99 起，故事「天快亮，沉沉家。小石头趁沉沉睡着，解开两个人的绳结，走了」……）。一个镜头一个镜头做，用户确认一个再做下一个。
// 图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 105.99–108.02「如果伤到你也请你忘记」（lib/untie.ts）：镜头从三⑨塞满砖的铁靴往上抬，抬的时候溶成仰头看天花板（天快亮）：
//      她睡着，两个人隔着床缝牵着手；他醒着，轻轻把手抽出来，她的手指动了一下又松开；他把脚踝上的红绳拽下来，最后看她一眼。
//   ② 108.02–109.95「但若你又找不到意义」（lib/coatoff.ts）：拍子上切到天快亮的街上，她家楼下：他穿着妈妈的外套、拎着「妈妈，明天见」
//      仰头看着白，耸肩把外套脱下来，109.02「咚」掉在地上，两只手把砖举过头顶，飘起来。远景，外套落地往前一顶，跟着他往上抬。
//   ③ 109.95–111.95「希望这首歌能被记起」（lib/dive.ts）：镜头越抬越快，越过他，顺着她家那栋楼甩到顶层她那扇窗；111.02「哐」铁栅栏门被撞开，
//      她穿着铁靴从窗口扑出去、头朝下往下冲，镜头跟着往下甩；111.86 她在半空一把抱住往上飘的他。甩的时候背景竖着拖影，人不拖。
//   ④ 111.95–113.88 过门（lib/hug4.ts，同一个镜头）：她的身子甩过来抱紧他，两个人还是慢慢往上飘；镜头跟着、慢慢退开，
//      她家那栋楼几扇亮着的窗里有人看着他们，一扇接一扇拉上窗帘、灯灭了；她抬头看一眼白，再低头看着他。
//   ⑤ 113.88–117.9 第一声「活下去」（lib/boots5.ts，同一个镜头）：「活」她光脚一只、再一只从铁靴里抽出来，铁靴翻过来套在他脚上；
//      「下」她松手把他往右下一推，光着脚往上飘，低头冲他笑；「去」他「咚」地踩回街面（落在外套旁边），仰着头；
//      镜头把两个人都框着越退越远，一路减速停在远景。
//   ⑥ 117.9–121.89 第二声「活下去」（lib/brick6.ts）：切到他跟前，⑤落地时震出来的砖斜靠在铁靴上；「活」他把自己那块插进铁靴的靴口，
//      笨笨地弯腰捡起来、翻过来——
//      她的字「活下去」；「下」抱到胸口抬头，镜头顺着他的视线往上甩，甩到楼顶右边的红绳网里：她从网中间穿过去，网上的人转头看她；
//      「去」她低头看他一眼，笑一下，再仰起脸朝着白。
//   ⑦ 121.89–125.82 第三声「活下去」（lib/write7.ts）：切回街上仰着头的他；「活」把砖翻到背面搁到铁靴的靴口上，趴下去，掏出那支两块五的笔；
//      「下」一笔一笔写「沉沉，明天见」；「去」直起身把砖举过头顶朝着她（和②一样），往上挣了一下，铁靴把他拽在地上；镜头慢慢退开。
//   ⑧ 125.82–129.87 第四声「活下去」（lib/morning8.ts）：不切，往右沿街摇到老钟家那扇窗，太阳出来、窗一扇扇灭；老钟端着茶杯等不到她，
//      放下茶杯抬头看天；镜头顺着他的视线慢慢升起来，越过整座城、穿过网，到白的边上：她闭上眼睛，张开手，发梢化成一点点光。
//   老钟家和左右两栋邻居（和第一幕、副歌一同一条街）②起一直画着。
//   网（天快亮，夜里被红绳拽住的人还挂着）：③起一直画着（近处这一层在楼顶右边，③④的镜头里看不见；远处几层镜头退到 0.62 倍以下才淡进来）。
// 开头接着三⑨（scenes/act5.ts）：屋子照样从 lib/write5.ts 画（同一个镜头函数 lessonCam，接过去的那一帧一样）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { H, W, applyCam, clamp01, setLens, syncFrame, viewOf } from "../lib/cam";
import { lensAt } from "../lib/wide";
import { DIVE_T, cageAt, diveSmear, drawDiveHer, drawHugPair, diveHer } from "../lib/dive";
import { drawNeighbors } from "../lib/hug4";
import { BOOTS5_T, boots5Cam, drawKidBoots, drawLandDust } from "../lib/boots5";
import { BRICK6_T, cam6, drawNet4, drawNet4Far, drawNet4Front, smear6 } from "../lib/brick6";
import { WRITE7_T, cam7 } from "../lib/write7";
import { MORNING8_T, cam8, drawHerAsh, drawZhongHouse, duskAt8 } from "../lib/morning8";
import { ZHONG_NEIGHBORS } from "../lib/dawn";
import { COAT4_T, coat4Cam, drawCoat4, drawGiftInBoot, drawPen7, drawStone4, drawStoneBricks, stoneC4 } from "../lib/coatoff";
import { fullAway } from "../lib/write5";
import { drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { drawRoom, setRoomAway } from "../lib/room";
import { roomMatrix, setCage, setHomeLamp } from "../lib/night";
import { roomZ } from "../lib/write";
import { drawCeiling } from "../lib/bed";
import { roomTiltCam, untieCam, untieCast, untieMix } from "../lib/untie";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  syncFrame(width, height);
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  // 人这一层还有老钟家左右那两栋（和第一幕、副歌一同一条街；老钟家本身由 drawZhongHouse 画）
  const { drawWorld, drawAir } = makeStage(base, grain, ZHONG_NEIGHBORS);
  // 溶的时候仰头看的画面先画在这里，再按溶的程度盖上去
  const over = document.createElement("canvas");
  over.width = width;
  over.height = height;
  const overCtx = over.getContext("2d")!;
  const fill = (g: CanvasRenderingContext2D) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1c1820";
    g.fillRect(0, 0, width, height);
  };
  // 甩镜时背景竖着拖影：把这一帧拷一份，上下错开叠几层（人画在拖影后面，保持清楚）
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const smearV = (dy: number) => {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = 9;
    const py = (Math.min(260, Math.abs(dy)) * Math.sign(dy) * height) / H;
    for (let i = 1; i < n; i++) {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * py);
    }
    ctx.restore();
  };

  return {
    canvas,
    render(t) {
      syncFrame(width, height);
      setLens(lensAt("act6", t));
      try {
        if (t >= DIVE_T.start) {
          // ③ 顺着她家那栋楼往上甩到窗口，她扑出来往下冲，在半空抱住他（天色、窗、栏门和②一样，栏门「哐」一下甩开）
          const cam = t >= MORNING8_T.start ? cam8(t) : t >= WRITE7_T.start ? cam7(t) : t >= BRICK6_T.start ? cam6(t) : boots5Cam(t);
          // ⑧ 太阳出来，天亮一点，亮着的窗一组组灭掉
          setDusk(...duskAt8(t));
          setHomeLamp(0);
          setCage(cageAt(t));
          // 远处几层的红绳网（副歌一那张，不收）按层画在城里
          drawWorld(ctx, cam, t, [0, 0], (D) => drawNet4Far(ctx, t, D, cam.z), clamp01((0.62 - cam.z) / 0.3));
          applyCam(ctx, base, cam, 1);
          // 老钟家（一楼窗后是老钟，⑧镜头摇到他窗前）
          drawZhongHouse(ctx, t, cam);
          if (viewOf(cam, 1).y1 > -400) drawStreet(ctx, cam);
          // ④ 窗里看着他们、又拉上窗帘的邻居（楼的一部分：一直画着，甩镜时跟着背景一起拖影）
          drawNeighbors(ctx, t);
          const dy = t >= WRITE7_T.start ? 0 : t >= BRICK6_T.start ? smear6(t) : diveSmear(t);
          if (Math.abs(dy) > 3) smearV(dy);
          applyCam(ctx, base, cam, 1);
          // 楼顶右边那张网（人这一层，拖影后面画，和人一样清楚）
          drawNet4(ctx, t, cam);
          const s = stoneC4(t);
          if (t < DIVE_T.catch) {
            drawTinted(ctx, [s.root[0] - 420, s.root[1] - 760, s.root[0] + 420, Math.max(s.root[1] + 150, 120)], (gg) => drawCoat4(gg, t, cam.z), 0.85);
            if (t >= DIVE_T.bang) {
              const h = diveHer(t);
              drawTinted(ctx, [h.chest[0] - 520, h.chest[1] - 560, h.chest[0] + 520, h.chest[1] + 560], (gg) => drawDiveHer(gg, t, cam.z), 0.85);
            }
          } else if (t < BOOTS5_T.release) {
            // 抱住以后：他画在她的身子和近处那只手臂之间（⑤ 她的铁靴留在他脚上）
            const h = diveHer(t);
            drawTinted(ctx, [h.chest[0] - 600, h.chest[1] - 600, h.chest[0] + 600, s.root[1] + 300], (gg) =>
              drawHugPair(gg, t, cam.z, (cc) => {
                drawStone4(cc, t, cam.z);
                drawKidBoots(cc, t, cam.z);
              }), 0.85);
          } else {
            // ⑤ 松手以后各画各的：他穿着铁靴往下坠、「咚」踩回街面（地上是他妈妈那件外套），她光着脚往上飘
            drawTinted(ctx, [s.root[0] - 520, s.root[1] - 760, s.root[0] + 520, Math.max(s.root[1] + 200, 160)], (gg) => {
              drawCoat4(gg, t, cam.z);
              // ⑥ 他把自己那块插进近处那只铁靴的靴口：画在两只铁靴中间
              drawKidBoots(gg, t, cam.z, () => drawGiftInBoot(gg, t));
              // 她那块画在铁靴前面（⑤落地时震出来、⑥他捡起来；⑦起画在他身子前面、近处那只手臂后面）
              drawStoneBricks(gg, t);
              // ⑦ 他手里那支两块五的笔
              drawPen7(gg, t, cam.z);
              drawLandDust(gg, t);
            }, 0.85);
            const h = diveHer(t);
            drawTinted(ctx, [h.chest[0] - 600, h.chest[1] - 600, h.chest[0] + 600, h.chest[1] + 700], (gg) => drawDiveHer(gg, t, cam.z), 0.85);
          }
          // ⑥ 她从后面穿过去的那根红绳、绳结压在她前面
          drawNet4Front(ctx, t, cam);
          drawAir(ctx, cam, t, [0, 0], skyLook(t), 0, 0);
          // ⑧ 发梢碰到白，化成一点点光往白里飘（画在白上面，不然被白盖掉）
          if (t >= MORNING8_T.ash0) {
            applyCam(ctx, base, cam, 1);
            drawHerAsh(ctx, t);
          }
          return;
        }
        if (t >= COAT4_T.start) {
          // ② 天快亮的街上（和第一幕同一条街）：天边发白、还有几扇窗亮着，人蒙上那层晨光的色
          const cam = coat4Cam(t);
          setDusk(0.5, 0.35);
          // 她家那扇窗：台灯灭着，铁栅栏门关着（主歌二④他关上以后一直关着）
          setHomeLamp(0);
          setCage(1);
          drawWorld(ctx, cam, t, [0, 0], undefined, clamp01((0.62 - cam.z) / 0.3));
          applyCam(ctx, base, cam, 1);
          drawZhongHouse(ctx, t, cam);
          drawStreet(ctx, cam);
          drawTinted(ctx, [-3900, -1400, -2900, 120], (gg) => drawCoat4(gg, t, cam.z), 0.85);
          drawAir(ctx, cam, t, [0, 0], skyLook(t), 0, 0);
          return;
        }
        const k = untieMix(t);
        if (k < 1) {
          // 三⑨ 夜里的屋子（台灯亮着）往上抬
          const cam = roomTiltCam(t);
          fill(ctx);
          applyCam(ctx, base, cam, 1);
          const m = roomMatrix();
          ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
          setRoomAway(fullAway(t));
          drawRoom(ctx, t, 1, Math.max(0.45, Math.min(1, 1 / Math.sqrt(roomZ(cam)))));
          setRoomAway(null);
          setDusk(1, 1);
          drawAir(ctx, cam, t, [0, 0], skyLook(t), 1);
        }
        if (k > 0) {
          // 仰头看的天花板：天快亮，屋里暗蓝（夜里的颜色调子）
          const g = k < 1 ? overCtx : ctx;
          const cam = untieCam(t);
          fill(g);
          drawCeiling(g, base, t, cam, untieCast(t));
          setDusk(1, 1);
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
