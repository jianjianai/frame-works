// 四声「活下去」+ 尾奏（113.88–152），2026-10-25 重做（用户：「这段是全片情绪的最高点……是全片泪目的最高点」）。
// 时间点照草稿（3d80f743 的 finale1.ts / finale2.ts），时刻在 lib/fin_t.ts（作品时间；图层 offset = start）。
//   114.013「活」：从一片白里砸出来——他穿着她的铁靴狠狠跺了一下地，全片最重的一下，街面陷下去一个坑；他抬头看天，
//   一只脚、再一只脚从她的铁靴里走出来，光着的脚离了地；风把他带到老钟家窗前——老钟听见了她的脚步声，推开窗扑出来，
//   115.75 一把抓住他的脚踝，另一只手死死扳着窗框；镜头顺着两个人的视线一路升到白的边上：117.55 她睁开眼，低头——
//   117.9 顺着她的视线扎回街上：门一扇扇打开，人们走上街、第一次抬头；118.8 老钟扳不住窗框被拽出了窗；119.35 周磊冲过来抓住老钟的脚踝，
//   她救过的人一个接一个从街两边跑来抓上去（千斤、阿满、老太太、年轻人、大叔、女学生……），每个人胸前挂着她送的砖，鞋留在街上；
//   121.89 镜头贴着人链往上走；126.05 最顶上，他抓住她的脚踝（和开场她抓住周磊上下颠倒）；往后拉：一条从地面连到天上的手；
//   白里的妈妈放下了手；推回去：她低头看着他，他松开手伸上来，129.6 她握住了。
//   129.87「在这反乌托邦里」：整条人链一下子沉了，把她从白里拽出来；一节节落回街上；构图 A：坑里她那双铁靴空着立着——
//   她牵着他从上面落进画面，他先落地，138.013 她光着脚落地。她跪下来；他把她那块「活下去」翻过来，用那支两块五的笔在背面写
//   「沉沉，明天见」，放进她手里——142.013 砖沉得她的手一下坠下去，暖了：第一块写给她的砖。她哭着笑了，抱住他；
//   她救过的人走过来，把手放在她的肩上。她站起来，光着脚往前走了一步：148.013「咚」。拉开：铺满鞋的街上站满了光着脚的人。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, H, W, applyCam, clamp01, E, ph, shake, viewOf } from "../lib/cam";
import { drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { skyLook } from "../lib/sky";
import { makeStage } from "../lib/stage";
import { setCage, setHomeLamp } from "../lib/night";
import { ZHONG_NEIGHBORS } from "../lib/dawn";
import { drawNet4Far } from "../lib/brick6";
import { T9, win } from "../lib/fin_t";
import { drawHer, drawKid, drawStayBoots, endBrick, herAt, herChest, kidAt, warmAt } from "../lib/fin_cast";
import { cam9, cam9Breath, cam9Kick } from "../lib/fin_cam9";
import { drawHairLight, drawMama, drawWarmGlow, mamaRootOf } from "../lib/fin_world";
import { drawZhongHouse, setKidAnkle } from "../lib/fin_zhong";
import { drawChain } from "../lib/fin_chain";
import { drawCrater, drawCraterFront, drawStompBurst, stompFlash, stompShake } from "../lib/fin_crater";
import { drawFinNet, drawFinNetFront } from "../lib/fin_net";

// 老钟攥的地方：他远处那只脚踝
setKidAnkle((t) => kidAt(t).ankleR);

/** 天色：早上，太阳出来了，越来越亮 */
const duskAt = (t: number): [number, number] => {
  const u = E.io(ph(t, 113.88, 132));
  return [0.34 - 0.12 * u, 0.15 * (1 - u)];
};
/** 门一扇扇打开（墙上的门洞，里面一点暖光；门扇往里转开） */
const DOORS: [number, number][] = [
  [-2390, T9.doors[0]],
  [-1015, T9.doors[1]],
  [-1850, T9.doors[2]],
  [-3200, T9.doors[3]],
];
function drawDoors(g: CanvasRenderingContext2D, t: number) {
  for (const [x, at] of DOORS) {
    const k = E.out(ph(t, at - 0.05, at + 0.22));
    if (k <= 0) continue;
    const dw = 110;
    const dh = 230;
    g.save();
    g.fillStyle = "#3b2c29";
    g.fillRect(x - dw / 2, -dh, dw, dh);
    const gr = g.createLinearGradient(0, -dh, 0, 0);
    gr.addColorStop(0, "rgba(255,200,140,0.35)");
    gr.addColorStop(1, "rgba(255,200,140,0.05)");
    g.fillStyle = gr;
    g.fillRect(x - dw / 2, -dh, dw, dh);
    g.fillStyle = "#8a6450";
    g.fillRect(x - dw / 2, -dh, dw * (1 - 0.82 * k), dh);
    g.strokeStyle = "#4a3530";
    g.lineWidth = 4;
    g.strokeRect(x - dw / 2, -dh, dw, dh);
    g.restore();
  }
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const { drawWorld, drawAir } = makeStage(base, grain, ZHONG_NEIGHBORS);
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const mamaCv = { c: null as HTMLCanvasElement | null };
  const smearV = (dy: number) => {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = 9;
    const py = (Math.min(260, Math.abs(dy)) * Math.sign(dy) * height) / 1920;
    for (let i = 1; i < n; i++) {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * py);
    }
    ctx.restore();
  };
  const white = (a: number) => {
    if (a <= 0.003) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const renderAt = (t: number) => {
    const c0 = cam9Breath(t, cam9(t));
    const kk = cam9Kick(t);
    const cam: Cam = { ...c0, z: c0.z * kk.z };
    const sh = shake(t, kk.sh + stompShake(t) * 0);
    setDusk(...duskAt(t));
    setHomeLamp(0);
    setCage(-0.32);
    drawWorld(ctx, cam, t, sh, (D) => drawNet4Far(ctx, t, D, cam.z), clamp01((0.62 - cam.z) / 0.3));
    applyCam(ctx, base, cam, 1, sh);
    drawZhongHouse(ctx, t, cam);
    const v = viewOf(cam, 1);
    if (v.y1 > -400) drawStreet(ctx, cam);
    drawDoors(ctx, t);
    drawCrater(ctx, t, cam.z);
    // 甩镜（升到白的边上、扎回街上、往后拉）时背景竖着拖影，人画在拖影后面
    const cp = cam9(t - 1 / 60);
    const dy = (c0.y - cp.y) * c0.z + Math.log(c0.z / cp.z) * 400;
    if (Math.abs(dy) > 6) smearV(dy * 0.85);
    applyCam(ctx, base, cam, 1, sh);
    const z = cam.z;
    // 网（天上还挂着几个人）：人链从他们中间升上去
    drawFinNet(ctx, t, cam);
    // 坑里的铁靴（他还在里面时画在他后面：脚在靴筒里）
    const k = kidAt(t);
    const out = t >= T9.outR + 0.25;
    if (out && v.y1 > -400) drawTinted(ctx, [k.root[0] - 600, -420, k.root[0] + 600, 120], (gg) => drawStayBoots(gg, t, z), 0.85);
    // 人链、街上的人（她落地以后比她靠前的后画）
    drawChain(ctx, t, cam, t >= T9.land ? "back" : "all");
    if (k.root[1] - 700 < v.y1 && k.root[1] + 200 > v.y0)
      drawTinted(ctx, [k.root[0] - 520, k.root[1] - 700, k.root[0] + 520, k.root[1] + 200], (gg) => {
        drawKid(gg, t, z);
        // 还穿着铁靴：铁靴画在他前面（脚在靴筒里）
        if (!out) drawStayBoots(gg, t, z);
      }, 0.85);
    if (v.y1 > -400) drawCraterFront(ctx, t, z);
    const c = herChest(t);
    if (c[1] + 700 > v.y0 && c[1] - 700 < v.y1) drawTinted(ctx, [c[0] - 640, c[1] - 700, c[0] + 640, c[1] + 760], (gg) => drawHer(gg, t, z), 0.85);
    drawFinNetFront(ctx, t, cam);
    if (t >= T9.land) drawChain(ctx, t, cam, "front");
    drawStompBurst(ctx, t, z);
    drawAir(ctx, cam, t, sh, skyLook(t), 0, stompFlash(t));
    applyCam(ctx, base, cam, 1, sh);
    // 白里的妈妈：朝她张开手 → 他抓住她的脚踝以后放下了手；她被拽回来以后淡掉
    const ma = win(t, 116.2, 116.9, T9.sink, T9.sink + 0.8);
    if (ma > 0.01) drawMama(ctx, t, mamaRootOf(herChest(Math.min(t, T9.sink))), z, ma, mamaCv);
    applyCam(ctx, base, cam, 1, sh);
    // 她发梢化成的光：被拽回来以后不再冒
    if (t < T9.sink + 0.6) drawHairLight(ctx, t, 110.5, T9.sink);
    // 手一沉，砖暖了：全片最强的暖光
    if (t >= T9.heavy) drawWarmGlow(ctx, base, cam, endBrick(t).c, warmAt(t));
    // 静音里白的边上那一镜 → 「咚」：从一片白里砸出来
    white(1 - E.out(ph(t, T9.start, T9.stomp + 0.1)));
  };

  return {
    canvas,
    render(t) {
      try {
        renderAt(t);
      } finally {
        setDusk(0);
        setHomeLamp(null);
        setCage(-0.32);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
void H;
void W;
void herAt;
