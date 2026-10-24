// 第二幕「千斤」（主歌一 + 导歌一，16.8–40 秒）。一个镜头一个镜头做，用户确认一个再做下一个（2026-10-19）。
// 分镜见 分镜表.md。图层 offset = start：模块里的时间就是作品的绝对时间。
//   ① 16.0–18.0「反乌托邦中的争夺」哑铃店（lib/shop.ts）：第一幕停在整座城上，镜头顺着最高那栋楼越扎越快地扎下来（第一幕画），
//      16.51 落在楼脚的哑铃店门口；第二幕从落定以后接着画：门外排着低头的队，千斤的妈妈和队头的男人同时抓住最大的那只——
//      「争」他往回一拽（镜头一惊），「夺」她一把夺到怀里（一顿）；镜头线性慢推（压抑），夺到以后越推越快地扎进她怀里的哑铃。
//      用户 2026-10-19：「这个新做的片段我很满意，继续保持」。
//   ② 17.9–19.8「把愿望敲碎成粉末」千斤家门口（lib/home.ts）：同一只哑铃溶过来；她弯腰把它放在铁桩旁边「咚」，
//      镜头一边退开一边顺着铁桩上的红线往上抬，落在「门口仰着头的妈妈—红线—半空里抱着膝盖的女儿」一竖条上，几乎不动（窒息）。
//   ③ 19.8–21.86「心灵也被挂上门锁」：妈妈一把一把把她拽下来（踩底鼓），把哑铃上的铁链锁到她脚踝上「咔」。
//   ④ 21.86–24.0「看不清灯火」：妈妈松手、转身进门，门「嘭」（底鼓）；「火」门灯灭、帘子拉上；她闭上眼飘起来，
//      哑铃被铁链拖离地面、吊在脚下（她的浮力比最重的哑铃还大）；红线绷直（最后一下底鼓）一下把她拽住，音乐空掉的那一拍里悬在那儿。
//   ⑤ 24.0–26.0「但我还想做些什么」（lib/home.ts）：鼓整套进来，红线绷断；她吊着哑铃慢慢往上飘，低头望着家门、手朝门伸下去又收回来；
//      镜头跟着慢慢升起来，门口沉到画面最下面。（2026-10-20 用户重排：原来红线在④就断了，开锁在⑤）
//   ⑥ 26.0–27.8「其实还想要说很多」（lib/sky.ts）：切到高空，她吊着哑铃悬住，拔下发卡开锁「咔」（底鼓），
//      铁链连着哑铃掉下去，她张开手越飘越快；镜头推到锁上一顿，再跟着她往上退开，露出头顶的白和最高那栋楼的楼顶。
//   ⑦ 27.8–29.79「请你等等我」（lib/roof.ts，和⑥是一个镜头，不切）：楼顶上收床单的沉沉看见她，一惊，冲出去在她碰到白之前
//      从身后抱住，两个人在天上带着惯性慢慢往左飘、往下落，29.01 千斤在半空里转过身来抱住她；镜头两人越近推得越近，抱住一震，跟着飘、退开一点。
//   ⑧ 29.79–31.97「请你等等我」第二句（lib/roof.ts 的 HUG_T，还是同一个镜头）：30.01 两个人一起坐着落到千斤家楼顶上（不站着落地），
//      「等等我」在她耳边说；天黑下来，城里的窗一组组亮（lib/night.ts），镜头越推越慢地推近两张脸。31.97 切进她的屋子（lib/room.ts）。
//   ⑨ 31.97–33.9「两块五的签字笔」（lib/write.ts）：在屋里推到桌上，笔杆上「2.5元」的价签；「签、字、笔」写出「活、下、去」。
//   ⑩ 33.9–35.88「东拼西凑的词句」：贴着地上一排排写好的砖往左滑，退开：搁板上、地上码满了砖，台灯下坐着看「活下去」的她。
//   ⑪ 35.88–37.8「妄想用它拯救你」（lib/give.ts，切回夜里的楼顶，⑧ 那两个抱着坐着的人）：千斤抬起头，沉沉从外套兜里掏出「活下去」
//      放进她手里；砖一沉，暖暖地亮起来，千斤哭着笑了。（2026-10-20 用户改；原来她冲出门、跳过来把砖放进漂成风筝的千斤手里）
//   ⑫ 37.79–39.39「顺便拯救我自己」（lib/room.ts 的 TWELVE_T，切回她的屋子）：脱掉铁靴「咚、咚」，飘起来躺进天花板上的床里，脚绳拉直。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { E, H, W, applyCam, ph, shake, spinBlur, toScreen, viewOf } from "../lib/cam";
import { QJ_HOME, drawStreet, drawTinted, makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { drawShopShade, drawShopSpill, makeShop, shopCam, shopLook, shopShake } from "../lib/shop";
import { HOME_T, drawHomeDusk, drawHomeLights, homeCam, homeLook, homeShake, makeHome } from "../lib/home";
import { SKY_T, makeSky, skyCam, skyLook, skyShake } from "../lib/sky";
import { GIVE_T, QJ_ROOF, RAIL_TOP, ROOF_T, drawQjRail, makeRoof, roofCam, roofShake } from "../lib/roof";
import { makeGive } from "../lib/give";
import { DUSK_PRE, NIGHT_T, duskAt } from "../lib/night";
import { tenCam, twelveCam, writeCam } from "../lib/write";
import { makeStage } from "../lib/stage";
import { TEN_T, TWELVE_T } from "../lib/room";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // 溶镜头时先把上一镜画在这里
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const shop = makeShop();
  const home = makeHome();
  const sky = makeSky();
  const roof = makeRoof(sky);
  const give = makeGive(roof);

  const { drawWorld, drawAir, drawInside } = makeStage(base, grain);

  // ——— ① 哑铃店 ———
  const drawShop = (g: CanvasRenderingContext2D, t: number) => {
    const cam = shopCam(t, shop.bigAt);
    const sh = shake(t, shopShake(t));
    drawWorld(g, cam, t, sh, (D) => {
      if (D === shop.WALK_D) shop.drawWalkers(g, t, cam);
    });
    shop.drawFront(g, t);
    drawStreet(g, cam);
    drawShopShade(g, base, t);
    applyCam(g, base, cam, 1, sh);
    drawShopSpill(g);
    shop.drawShadows(g, t);
    shop.drawPeople(g, t, cam.z);
    drawAir(g, cam, t, sh, shopLook(t));
  };

  // ——— ② 千斤家门口 ———
  /** 哑铃店那一帧里哑铃在画面上的位置和倍数（溶镜头时家门口的镜头照着它） */
  const shopMatch = (t: number) => {
    const c = shopCam(t, shop.bigAt);
    const d = shop.bigAt(t);
    const [sx, sy] = toScreen(c, d.x, d.y);
    return { sx, sy, z: c.z };
  };
  const drawHome = (g: CanvasRenderingContext2D, t: number) => {
    const cam = homeCam(t, home, shopMatch);
    const sh = shake(t, homeShake(t));
    drawWorld(g, cam, t, sh);
    home.drawFront(g, t);
    drawStreet(g, cam);
    drawShopShade(g, base, t);
    drawHomeDusk(g, base, t);
    applyCam(g, base, cam, 1, sh);
    drawHomeLights(g, t);
    home.drawPeople(g, t, cam.z, base);
    drawAir(g, cam, t, sh, homeLook(t));
  };

  // ——— ⑥⑦⑧ 高空：一个镜头（开锁 → 往上飘 → 楼顶上的沉沉扑出去抱住 → 慢慢飘到千斤家楼顶 → 坐下来抱着，天黑下来） ———
  const drawHigh = (g: CanvasRenderingContext2D, t: number) => {
    const six = t >= ROOF_T.cut;
    const night = t >= NIGHT_T.start;
    // ⑥⑦ 起就是傍晚（天、楼按 duskAt 暗下来）；人身上的那层色等落到楼顶前后（29.6–30.1）再慢慢蒙上
    const dusk = t >= DUSK_PRE.t0;
    const tintK = E.io(ph(t, 29.6, 30.1));
    const eleven = t >= GIVE_T.start;
    // ⑧ 天黑下来：这一帧的天色（画完复原，别的镜头不受影响）
    if (dusk) setDusk(...duskAt(t));
    try {
      const cam = eleven ? give.cam(t) : six ? roofCam(t, roof, sky) : skyCam(t, sky);
      const sh = shake(t, eleven ? give.shakeK(t) : six ? roofShake(t) : skyShake(t));
      // 远处满天往上飘的人：画在各自那一层的楼后面、空气前面
      const setCam = (D: number) => applyCam(g, base, cam, D, sh);
      drawWorld(g, cam, t, sh, (D) => {
        if (D === 4) sky.drawFar(g, t, 4, 99, setCam);
        else if (D === 2.2) sky.drawFar(g, t, 2.2, 4, setCam);
      });
      applyCam(g, base, cam, 1, sh);
      // 千斤家楼顶的栏杆和人（黄昏、夜里一起蒙上那层色，人蒙得浅一点，看得清）
      const people = (gg: CanvasRenderingContext2D) => {
        if (viewOf(cam, 1).y1 > QJ_ROOF - 300) drawQjRail(gg);
        if (six) roof.drawPeople(gg, t, cam.z, (g3) => sky.drawPeople(g3, t, cam.z));
        else {
          sky.drawPeople(gg, t, cam.z);
          roof.drawChen(gg, t, cam.z);
        }
        if (eleven) give.draw(gg, t, cam.z);
      };
      if (tintK > 0) drawTinted(g, [QJ_HOME.x - 520, RAIL_TOP - 820, QJ_HOME.x + QJ_HOME.w + 1200, QJ_ROOF + 40], people, (0.85 - 0.3 * roof.hugLight(t)) * tintK);
      else people(g);
      // ⑧ 抱在一起的两个人身上的暖光、⑪ 砖暖起来的光（画在夜色上面）
      if (six) roof.drawHugGlow(g, t);
      if (eleven) give.drawGlowOver(g, t);
      drawAir(g, cam, t, sh, skyLook(t), night ? E.io(ph(cam.z, 2, 6)) : 0);
    } finally {
      if (dusk) setDusk(0);
    }
  };

  return {
    canvas,
    render(t) {
      // ⑫ 切回她的屋子
      if (t >= TWELVE_T.start) {
        drawInside(ctx, t, twelveCam(t));
        // 转场：最后又转起来、越转越快，按 1/48 秒快门转着拖一下
        if (t > TWELVE_T.end - 0.2) spinBlur(ctx, buf, bctx, ((twelveCam(t + 0.004).r - twelveCam(t - 0.004).r) / 0.008) / 48);
        return;
      }
      // ⑪ 切回夜里的楼顶
      if (t >= GIVE_T.start) {
        drawHigh(ctx, t);
        return;
      }
      // ⑨⑩ 切进她的屋子（窗正好铺满画面的取景，只画屋里）
      if (t >= NIGHT_T.inside) {
        drawInside(ctx, t, t >= TEN_T.start ? tenCam(t) : writeCam(t));
        return;
      }
      if (t >= SKY_T.cut) {
        drawHigh(ctx, t);
        return;
      }
      if (t < HOME_T.dissolve0) {
        drawShop(ctx, t);
        return;
      }
      drawHome(ctx, t);
      if (t < HOME_T.dissolve1) {
        // 同一只哑铃、同一个位置：哑铃店慢慢溶成她家门口
        drawShop(bctx, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1 - E.io(ph(t, HOME_T.dissolve0, HOME_T.dissolve1));
        ctx.drawImage(buf, 0, 0);
        ctx.globalAlpha = 1;
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
