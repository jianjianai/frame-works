// 五「引力」（故事「街上。小石头穿着沉沉的铁靴跺了一下地，这是全片最重的一下，地面裂开一个大坑。然后他从靴子里走出来，
// 举着那块砖，飞上去找她」……）。一个镜头一个镜头做，用户确认一个再做下一个。
// 2026-10-20 全片按草稿的节奏重排：五①–④ 挪进四声「活下去」（作品 114–130，全曲最响），跺地落在静音后的第一声「活」上，
// 尾奏整段给五⑤。图层 offset 比 start 多 20 秒：下面和 lib/ 里写的都是模块时间（作品时间 + 20），134.02 跺地 = 作品 114.02。
//   ① 129.87–136.02 最后一句「在这反乌托邦里」（lib/stomp.ts）：从白的边上的她切回街上；他把砖抱在胸口，抬起远处那只铁靴，
//      134.02 全片最重的一下跺下去，街面陷下去一个大坑、裂缝一路裂开；他从铁靴里飘出来，把砖举过头顶飘起来。
//   ② 136.02–140.02 尾奏两小节（lib/chain.ts）：天上的风把他往右带，从老钟家窗口上方飘过；138.02 老钟踩上窗台扑出去抓住他的脚踝，
//      吊在他脚下一起被带起来；镜头退开，街两边的门一扇扇打开，人们走上街抬头看。
//   ③ 140.02–144.02 尾奏第三、四小节（lib/link.ts）：街上的人朝老钟脚下跑过去，一个跳起来抓住上一个人的脚踝——周磊、千斤、阿满、
//      老太太（年轻人托上去）、年轻人，前奏里的大叔、女学生从街两头跑来接上；人链一节节往上长，最后整条离开街面越升越快。
//   ④ 144.02–148.02 尾奏第五、六小节（lib/meet.ts）：人链越升越慢，升到白的边上；他把砖翻过来递给她，她接过来、翻过来看见
//      「沉沉，明天见」，147.02 砖发出全片最强的暖光，发梢化成的光停下来；她哭着笑，抱住他。
//   ⑤ 150.02–172 最后一镜（作品 130.02–152，lib/land.ts、lib/t55.ts；音乐 148 停）：一镜到底。抱着他慢慢往下落，人链从上往下
//      一个个松手、像一朵花往下开；镜头退到整座城，砖那团暖光像一盏灯落回城里，松了手的人先落回街上；镜头推下去，她光着脚落在坑边
//      （她那双铁靴还立在坑里），千斤把手放在她肩上、周磊把手放在他背上；她低头看一眼坑里的铁靴，镜头顺着低下去、挪到她的脚，
//      她往前一步，168.52「咚」（作品 148.52，音乐停了以后）；淡出。
// 世界和四一样（同一条街：她家那栋楼、千斤家那栋楼、老钟家和左右两栋邻居、天上那张网；早上的天色）；人和东西从四的那几个文件接着画
// （lib/coatoff.ts 他和砖、lib/boots5.ts 铁靴、lib/dive.ts 她、lib/brick6.ts 网、lib/morning8.ts 老钟家）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { applyCam, clamp01, shake, viewOf } from "../lib/cam";
import { cageAt, diveHer, drawDiveHer, drawHugPair } from "../lib/dive";
import { drawNeighbors } from "../lib/hug4";
import { drawKidBoots } from "../lib/boots5";
import { drawNet4, drawNet4Far, drawNet4Front } from "../lib/brick6";
import { STONE_LAND_X, drawCoat4, drawCoatGround, drawGiftStay, stoneC4 } from "../lib/coatoff";
import { drawZhongHouse } from "../lib/morning8";
import { cam51, drawCrater, drawCraterFront, drawStompBurst, stompFlash, stompShake } from "../lib/stomp";
import { CHAIN_T, cam52, drawCrowd, drawDoors } from "../lib/chain";
import { LINK_T, cam53, drawLink } from "../lib/link";
import { GIVE_T, cam54, drawGiveBrick, drawGiveBrickOver, drawGiveGlow, drawHairLight5 } from "../lib/meet";
import { cam55, drawFade } from "../lib/land";
import { LAND_T } from "../lib/t55";
import { ZHONG_NEIGHBORS } from "../lib/dawn";
import { drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { setCage, setHomeLamp } from "../lib/night";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  // 人这一层还有老钟家左右那两栋（老钟家本身由 drawZhongHouse 画）
  const { drawWorld, drawAir } = makeStage(base, grain, ZHONG_NEIGHBORS);

  /** 画 t 那一刻（模块时间） */
  const renderAt = (ctx: CanvasRenderingContext2D, t: number) => {
    const give = t >= GIVE_T.start;
    const cam = t >= LAND_T.start ? cam55(t) : give ? cam54(t) : t >= LINK_T.start ? cam53(t) : t >= CHAIN_T.start ? cam52(t) : cam51(t);
    const sh = shake(t, stompShake(t));
    // ⑤ 一镜到底落回街上（镜头退到整座城时街也在画面里，地上的东西从这里起照街上那样画）
    const street = t >= LAND_T.start;
    // 早上（四⑧太阳出来以后的天色，亮着的窗都灭了）；她家那扇窗台灯灭着、铁栅栏门开着（她撞开的）
    setDusk(0.28, 0);
    setHomeLamp(0);
    setCage(cageAt(t));
    drawWorld(ctx, cam, t, sh, (D) => drawNet4Far(ctx, t, D, cam.z), clamp01((0.62 - cam.z) / 0.3));
    applyCam(ctx, base, cam, 1, sh);
    drawZhongHouse(ctx, t, cam);
    if (viewOf(cam, 1).y1 > -400) drawStreet(ctx, cam);
    // 四④拉上窗帘的那几扇窗（楼的一部分）
    drawNeighbors(ctx, t);
    applyCam(ctx, base, cam, 1, sh);
    // ② 街两边的门一扇扇打开
    drawDoors(ctx, t);
    // 坑和裂缝（街面、墙上）在人前面画
    drawCrater(ctx, t, cam.z);
    // ② 走上街、抬头看的人（③ 跑去抓人的那几个由人链画，这里只剩哑铃店里的人）
    drawCrowd(ctx, t, cam, t >= LINK_T.start);
    // ④ 起红绳、绳结画在人链后面（他们从网中间升过去）
    if (give) {
      drawNet4(ctx, t, cam);
      drawNet4Front(ctx, t, cam);
    }
    const s = stoneC4(t);
    const hug = t >= GIVE_T.hug0 + 0.1;
    if (street) {
      // ⑤ 地上的先画（他妈妈那件外套、坑里立着的铁靴和插在靴口上的那块、坑的前沿），人站在它们前面
      drawTinted(ctx, [STONE_LAND_X - 900, -760, STONE_LAND_X + 860, 160], (gg) => {
        drawCoatGround(gg, t);
        drawKidBoots(gg, t, cam.z, () => drawGiftStay(gg, t));
      }, 0.85);
      drawCraterFront(ctx, t, cam.z);
      // 她还在天上时人链里的人全画在她后面；她落地以后比她靠后的
      drawLink(ctx, t, cam, "back");
    } else {
      // ③ 人链：跑过去、跳起来、一个抓住一个的脚踝
      drawLink(ctx, t, cam);
      if (!give) drawNet4(ctx, t, cam);
      // ④ 抱住以后他画在她的身子和近处那只手臂之间（砖夹在两个人中间），坑里的铁靴单独画
      drawTinted(ctx, [s.root[0] - 520, s.root[1] - 760, s.root[0] + 520, Math.max(s.root[1] + 200, 160)], (gg) => {
        if (!hug) drawCoat4(gg, t, cam.z);
        drawKidBoots(gg, t, cam.z);
      }, 0.85);
      // 坑的前沿压在靴底前面；碎块、灰、震波
      drawCraterFront(ctx, t, cam.z);
      drawStompBurst(ctx, t, cam.z);
    }
    // 她在白的边上（镜头升到天上时才看得见）；⑤ 抱着他落回街上
    const h = diveHer(t);
    const v = viewOf(cam, 1);
    if (h.chest[1] + 700 > v.y0 && h.chest[1] - 600 < v.y1) {
      const box: [number, number, number, number] = [h.chest[0] - 600, h.chest[1] - 600, h.chest[0] + 600, h.chest[1] + 900];
      if (hug)
        drawTinted(ctx, box, (gg) => drawHugPair(gg, t, cam.z, (cc) => {
          drawGiveBrick(cc, t);
          drawCoat4(cc, t, cam.z, !street);
        }), 0.85);
      else drawTinted(ctx, box, (gg) => drawDiveHer(gg, t, cam.z), 0.85);
    }
    // ⑤ 她落地以后比她靠前的人（放在她肩上、他背上的手压在上面）
    if (street) drawLink(ctx, t, cam, "front");
    // ④ 她那块砖：抱住以前画在所有人上面（两个人的手都捏在两头后面）
    if (give && !hug) drawGiveBrickOver(ctx, t);
    if (!give) drawNet4Front(ctx, t, cam);
    drawAir(ctx, cam, t, sh, skyLook(t), 0, stompFlash(t));
    // ④ 她发梢化成的光（画在白上面）、砖的暖光
    if (give) {
      applyCam(ctx, base, cam, 1, sh);
      drawHairLight5(ctx, t);
      drawGiveGlow(ctx, base, cam, t);
    }
    // ⑤ 最后淡出
    drawFade(ctx, base, t);
  };

  return {
    canvas,
    render(t) {
      try {
        renderAt(ctx, t);
      } finally {
        setDusk(0);
        setHomeLamp(null);
        setCage(-0.32);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
