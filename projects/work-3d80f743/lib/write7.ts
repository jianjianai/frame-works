// 四⑦ 第三声「活下去」（121.89–125.82；活 ~122.0、下 ~122.5、去 ~124.0 拖到 125.8）：
// 121.89 从网里仰脸朝着白的她切回街上：他站在她的铁靴里，抱着那块「活下去」仰着头，挂着泪。
// 「活」他低头，把砖翻到背面、横搁在他插在近处那只铁靴靴口上的「妈妈，明天见」上头当桌子（在他腰的高度），微微低下身子，
// 从兜里掏出她给他的那支两块五的笔（三⑧）；「下」一笔一笔写「沉沉，明天见」（小孩的字，和三⑧「妈妈，明天见」同一个人写的）；
// 「去」写完，直起身把砖举过头顶朝着她——和四②举「妈妈，明天见」一模一样的动作，往上挣了一下，可这次脚跟离不了地，
// 她的铁靴把他拽在街上。镜头慢慢退开，他小小的一个举着砖站在铁靴里（五：他从靴子里走出来，飞上去找她）。
// 坐标是世界坐标；他的动作、两只手、砖在 lib/coatoff.ts，砖背面的字在 lib/write5.ts，时刻在 lib/t7.ts。

import { type Cam, E, aim, camLerp, ph } from "./cam";
import { WRITE7_T } from "./t7";
import { rimBrick7, stoneC4 } from "./coatoff";

type V2 = [number, number];
const T = WRITE7_T;
export { WRITE7_T };

/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/** 写到第几个字了（0–5，连续的）：镜头跟着它往右挪，不跟笔尖来回划的那几下 */
const progress = (t: number) => 5 * E.io(ph(t, T.chars[0][0], T.chars[5][1]));

/**
 * 四⑦的镜头：切过来是他仰着头的半身（2.5 倍，脸和抱在胸口的砖）；低头、搁砖时柔和起步、一路减速地往下推到砖、两只手和他低着的脸上
 * （3.8 倍），跟着写到第几个字往右挪一点；写完直起身把砖举起来，柔和起步、一路减速地退开（0.85 倍），他小小的一个举着砖站在铁靴里，
 * 脚边是妈妈的外套；叠手持呼吸
 */
export function cam7(t: number): Cam {
  const [bx, by] = breath(t);
  const root = stoneC4(t).root;
  const z0 = 2.5;
  const a = aim(root[0] - 25 + bx / z0, root[1] - 270 + by / z0, 540, 1040, z0);
  const z1 = 3.8;
  const rim = rimBrick7();
  const b = aim(rim[0] - 22 + 10 * progress(t) + bx / z1, rim[1] - 58 + by / z1, 540, 1000, z1);
  let c = camLerp(a, b, E.settle(ph(t, T.down0 - 0.02, T.down1 + 0.5)));
  const z2 = 0.85;
  const wide = aim(root[0] - 40 + bx / z2, root[1] - 300 + by / z2, 540, 1040, z2);
  c = camLerp(c, wide, E.settle(ph(t, T.up0, T.end + 0.1)));
  return c;
}
