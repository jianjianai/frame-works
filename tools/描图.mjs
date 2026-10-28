// 从平涂的参考图描配角的头：脸、耳朵、眼珠、鼻子、嘴、头发后面那片、刘海，写进作品的
// public/ref/<角色>-线稿.svg（正面）、<角色>-侧面线稿.svg（3/4 朝左）的「身体」图层（每条线有 id，用户可以在编辑器里改）。
// 用法（在作品文件夹里）：node <工具目录>/描图.mjs <角色> [--debug]（--debug 只出调试图：头发后面那片淡紫、脸的整圈肉色、刘海棕色，不写 SVG）
//   SVG 先用 线稿生成.mjs 生成；这里会把身体图层里的线整个换掉——用户改过线就别再跑。
//   角色的配置在作品的 production/线稿配置.mjs：ref、lines、trace（split 正面和 3/4 之间的竖线、head 头部那一条的上下、
//   faceTop / faceBottom 脸那块皮肤的盒子顶和底不超过多少、neckTop 脖子那块的盒子顶不低于多少、neckRow 量脖子中心的那一行、
//   isHair / isSkin / isMark 头发、皮肤、鼻嘴的颜色；可选：isEye 眼珠的颜色（不写同头发：眼珠和头发一样深时）、
//   brows: true 描眉毛（写 brow-l / brow-r；眉毛是比头发还深的细线、挨着刘海时给 browBox 框住两条眉毛：{ front: [[x0, y0, x1, y1], [...]], side: [...] }）、pieceSmooth 单独的几块头发顺多狠（默认 1.5）、earRound: true 耳朵取凸包、faceRound: true 脸取凸包（圆脸，去掉像素描出来的小起伏）、earBox 框里的皮肤就是耳朵（耳垂和脸颊连成一块、耳朵里面偏深时；{ front: [[左耳框], [右耳框]], side: [框] }）、eyeBox / noseBox / mouthBox 只在框里找眼睛、鼻子、嘴（{ front: [x0, y0, x1, y1], side: […] }）、
//   backClose 后面那片闭运算的半径（头发和脸之间留了细缝时）、hairMin 面积够这么大的几块头发都算头发（盘发的髻有自己的描边）、fringePad 刘海往脸外面多扩几像素（默认 2，按参考图大小放大；额头上透出一道细弧线时加大）、tieBox 发圈的框（{ front: [x0, y0, x1, y1], side: […] }：挨着它的几块头发是马尾，写 hair-tail；框里不是皮肤、头发、底色的是发圈，写 hair-tie）、neckX: [正面, 3/4] 直接给脖子中心（脖子被领子挡住量不准时）、bald: true 秃顶（头的皮肤整个就是脸，不描刘海和后面那片，
//   头发是单独的几块 hair-1、hair-2…，压在脸和耳朵上））、coat: { isCoat(颜色, x, y), rows } 敞怀外衣（开衫）的颜色（可以按位置分：下摆缝的一条边和头发同色时只在那几行算）和它在参考图里的上下几行：描两片前襟的门襟和下摆
//   （写 coat-l / coat-r：门襟上端 → 下摆外角，线稿换算.mjs 接上主角外套的肩、侧缝）。pants: { isPants, rows } 裤子的颜色和它的上下几行：描正面两条裤腿（写 leg-l / leg-r，
//   线稿换算.mjs 只取宽窄、绕着主角的胯膝脚踝重新摆）。颜色用 看颜色.mjs 看；跑 --debug 看分得对不对再写。
// 参考图和主角的线稿用同一套横线：按头顶、膝两条线对到线稿；横着按脖子对齐：正面脖子中心对中线 229.5，
// 3/4 对主角 3/4 脖子的中心 218.05（线稿 y 278–288 是直的）——打出来的「脖子中心」填进配置的 views.cx。
// 只描头（给了 coat 再描外衣的两片前襟，给了 pants 再描裤腿）：别的衣服、鞋用素材库的通用版型（或用户另画）。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { WORK, configOf, loadImage, mask, components, close, open, dilate, and, or, not, fillHoles, outline, smoothLoop, resampleLoop, debugPNG } from "./描图工具.mjs";

const sum = (p) => p[0] + p[1] + p[2];
const who = process.argv[2];
const cfg = await configOf(who, "用法：node <工具目录>/描图.mjs <角色> [--debug]");
if (!cfg.trace) throw new Error(`production/线稿配置.mjs 里 ${who} 没有 trace（描图的配置）`);
const C = { ...cfg.trace, ref: cfg.ref, lines: cfg.lines };
const root = WORK;
const DEBUG = process.argv.includes("--debug");
const DEBUG_DIR = path.join(os.tmpdir(), "frame-描图");
if (DEBUG) fs.mkdirSync(DEBUG_DIR, { recursive: true });
const REF = path.join(root, C.ref);
const K = (600 - 141.43) / (C.lines[1] - C.lines[0]);
const img = await loadImage(REF);
const { W, H, px } = img;
const [Y0, Y1] = C.head;
const inHead = (y) => y >= Y0 && y <= Y1;
const isHair = C.isHair;
const isSkin = C.isSkin;
const isMark = (p) => C.isMark(p) && !isHair(p);

function trace(view) {
  const [xa, xb] = view === "front" ? [0, C.split] : [C.split, W];
  const inView = (x, y) => x >= xa && x < xb && inHead(y);
  const hairM = mask(W, H, (x, y) => inView(x, y) && isHair(px(x, y)));
  const skinM = mask(W, H, (x, y) => inView(x, y) && isSkin(px(x, y)));
  const hairComp = components(hairM);
  // 头发：最大的那块；配置给了 hairMin 就把面积够大的几块都并进来（盘发的髻有自己的描边，是单独的一块）
  // （只要上沿在脸以上的：衣服颜色和头发一样深时别把衣领并进来）
  // tieBox：发圈把马尾和头发隔成两块：挨着发圈框的那几块头发是马尾（单独写 hair-tail，画在最后面），
  // 框里不是皮肤、不是底色、不是头发的是发圈（hair-tie，压在马尾顶上）；后面那片不连马尾（连上的话 3/4 时从后脑一路连到肩后，像披肩）
  const tieB = C.tieBox?.[view];
  const nearTie = (c) => tieB && c.box[0] <= tieB[2] + 10 && c.box[2] >= tieB[0] - 10 && c.box[1] <= tieB[3] + 10 && c.box[3] >= tieB[1] - 10;
  const tailComps = tieB ? hairComp.slice(1).filter((c) => c.area >= (C.hairMin ?? 300) && nearTie(c)) : [];
  const hairBig = (C.hairMin ? hairComp.filter((c, i) => i === 0 || (c.area >= C.hairMin && c.box[1] < C.faceTop)) : [hairComp[0]]).filter((c) => !tailComps.includes(c));
  const hair = close(hairBig.reduce((a, c) => or(a, c.mask), hairComp[0].mask), 2);
  const tieM = tieB ? mask(W, H, (x, y) => x >= tieB[0] && x <= tieB[2] && y >= tieB[1] && y <= tieB[3] && !isSkin(px(x, y)) && !isHair(px(x, y)) && sum(px(x, y)) > 250 && sum(px(x, y)) < 600) : null;
  const skinComp = components(skinM).filter((c) => c.area > 25);
  // 脸：面积最大、在头发下面的那块；脖子在下巴下面
  let face = skinComp.find((c) => c.box[1] < C.faceTop && c.box[3] < C.faceBottom);
  if (C.bald) {
    // 秃顶：眼镜的框和横梁把脸的皮肤切成上下几块，头部那几块大的（不是耳朵、脖子）合起来算脸
    const parts = skinComp.filter((c) => c.area > 400 && c.box[1] < C.faceTop && c.box[3] < C.faceBottom);
    const m = parts.reduce((a, c) => or(a, c.mask), face.mask);
    const box = [0, 1, 2, 3].map((k) => (k < 2 ? Math.min : Math.max)(...parts.map((c) => c.box[k])));
    face = { mask: m, area: parts.reduce((a, c) => a + c.area, 0), box };
  }
  let fb = face.box;
  const ears = skinComp.filter((c) => c !== face && c.box[1] > fb[1] && c.box[3] < fb[3] + 4 && (c.box[2] < fb[0] + 6 || c.box[0] > fb[2] - 6));
  // 配置给了 earBox（{ side: [x0, y0, x1, y1] }，参考图像素）：框里的皮肤就是这只耳朵（耳垂和脸颊连成一块、开运算断不开时），
  // 闭运算补上耳朵里的阴影和耳廓那道线，脸扣掉它
  // 可以是一个框或几个框（正面两只耳朵）；耳朵里面那块偏深的粉不在皮肤颜色里，闭运算 + 填洞把它补上（不然只剩一圈细边）
  const earBs = C.earBox?.[view];
  const earList = earBs ? (Array.isArray(earBs[0]) ? earBs : [earBs]) : [];
  if (earList.length) {
    ears.length = 0;
    let all = null;
    for (const earB of earList) {
      const boxM = mask(W, H, (x, y) => x >= earB[0] && x <= earB[2] && y >= earB[1] && y <= earB[3]);
      // 框里只留最大的一块（框角上碰到的一点脸颊、刘海缝里的皮肤会被当成耳朵：描轮廓只走第一块）
      const earM = components(and(fillHoles(close(and(skinM, boxM), 5)), boxM))[0].mask;
      ears.push({ mask: earM, area: 0, box: earB });
      all = all ? or(all, earM) : earM;
    }
    const rest = components(and(face.mask, not(dilate(all, 1))));
    // 秃顶的脸是眼镜切开的上下几块合起来的：几块大的都留着
    const keep = C.bald ? rest.filter((c) => c.area > 400) : [rest[0]];
    const box = [0, 1, 2, 3].map((k) => (k < 2 ? Math.min : Math.max)(...keep.map((c) => c.box[k])));
    face = { mask: keep.reduce((a, c) => or(a, c.mask), keep[0].mask), area: keep.reduce((a, c) => a + c.area, 0), box };
    fb = face.box;
  }
  if (!ears.length) {
    // 3/4：耳朵前面那道弧线没封口，耳朵和脸连成一块皮肤。开运算把细的连接断开，右边脸外面那块是耳朵
    const parts = components(open(face.mask, 2)).filter((c) => c.area > 20);
    const ear = parts.find((c) => c.box[0] > (fb[0] + fb[2]) / 2 && c.box[3] - c.box[1] < 60 && c !== parts[0]);
    if (ear) {
      const earM = and(face.mask, dilate(ear.mask, 2));
      const faceM = and(face.mask, not(earM));
      ears.push({ mask: earM, area: 0, box: ear.box });
      // 秃顶的脸本来就是上下几块合起来的：耳朵扣掉以后几块都留着，不只留最大的
      if (C.bald) {
        const ps = components(faceM).filter((c) => c.area > 400);
        const box = [0, 1, 2, 3].map((k) => (k < 2 ? Math.min : Math.max)(...ps.map((c) => c.box[k])));
        face = { mask: ps.reduce((a, c) => or(a, c.mask), ps[0].mask), area: ps.reduce((a, c) => a + c.area, 0), box };
      } else face = { ...components(faceM)[0] };
      fb = face.box;
    }
  }
  const neck = skinComp.find((c) => c.box[1] >= C.neckTop && c !== face);
  // 眼睛：在脸里面的两块。默认是头发颜色的（小孩的眼珠和头发一样深）；给了 isEye 按它找，开运算去掉细的描边（眼镜框、眼线）
  const inFace = (c) => c.area > 40 && c.area < 900 && c.box[0] > fb[0] && c.box[2] < fb[2] && c.box[1] > fb[1] + 10 && c.box[3] < fb[3];
  // isEye 只在脸的皮肤围起来的洞里找（刘海、镜框外面的不算）；先闭运算把脸边上的小缺口（眼镜腿、碎发尖）封上
  const holes = C.isEye ? and(fillHoles(close(face.mask, 6)), not(face.mask)) : null;
  let eyeCand = C.isEye ? components(open(and(mask(W, H, (x, y) => inView(x, y) && C.isEye(px(x, y))), holes), 2)) : hairComp.slice(1).filter((c) => !hairBig.includes(c));
  // 戴眼镜的：镜片伸出脸边，眼睛不在洞里——改在脸的盒子里找，开运算去掉镜框，留下圆的那几块
  if (C.isEye && eyeCand.filter(inFace).length < 2) {
    const round = (c) => {
      const w = c.box[2] - c.box[0] + 1;
      const h = c.box[3] - c.box[1] + 1;
      return w / h > 0.45 && w / h < 1.8;
    };
    eyeCand = components(open(mask(W, H, (x, y) => inView(x, y) && x > fb[0] && x < fb[2] && y > fb[1] && y < fb[3] && C.isEye(px(x, y))), 2)).filter(round);
  }
  // 配置给了 eyeBox（{ front: [x0, y0, x1, y1], side: […] }）就在框里找（3/4 远处那只眼睛贴着脸边、不在洞里）
  const eb = C.eyeBox?.[view];
  if (eb) eyeCand = components(open(mask(W, H, (x, y) => x >= eb[0] && x <= eb[2] && y >= eb[1] && y <= eb[3] && (C.isEye ?? isHair)(px(x, y))), 2));
  // 多出来的（眉毛、皱纹）：留最大的两块
  let eyes = eb ? eyeCand : eyeCand.filter(inFace);
  if ((C.isEye || eb) && eyes.length > 2) eyes = [...eyes].sort((p, q) => q.area - p.area).slice(0, 2);
  eyes.sort((p, q) => p.box[0] - q.box[0]);
  if (eyes.length !== 2)
    throw new Error(`${view} 找到 ${eyes.length} 只眼睛（要 2 只）：调 isEye / faceTop 再试。脸的盒子 ${fb}，候选（面积@盒子）：${eyeCand.slice(0, 8).map((c) => c.area + "@" + c.box).join("  ")}`);
  // 嘴那一笔中间颜色浅，断成几截：先横着连上（闭运算）再分块
  const markTop = C.noseBox ? fb[1] : eyes[0].box[3] + 2;
  const markM = mask(W, H, (x, y) => inView(x, y) && x > fb[0] + 4 && x < fb[2] - 4 && y > markTop && y < fb[3] - 3 && isMark(px(x, y)));
  const marks = components(and(close(markM, 3), dilate(markM, 3))).filter((c) => c.area >= 3);
  marks.sort((p, q) => p.box[1] - q.box[1]);
  // 配置给了 noseBox / mouthBox（{ front: [x0, y0, x1, y1], side: […] }，参考图像素）就只在框里找：眼镜框、法令纹会被当成鼻子嘴
  const inBox = (c, b) => {
    const cx = (c.box[0] + c.box[2]) / 2;
    const cy = (c.box[1] + c.box[3]) / 2;
    return cx >= b[0] && cx <= b[2] && cy >= b[1] && cy <= b[3];
  };
  const nb = C.noseBox?.[view];
  const mb = C.mouthBox?.[view];
  // 框里单独分块（整张脸一起分块时，眼镜框、皱纹会把鼻子嘴连成一大块）
  const markJ = and(close(markM, 3), dilate(markM, 3));
  const boxed = (b) => components(and(markJ, mask(W, H, (x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]))).filter((c) => c.area >= 2);
  const noseCand = nb ? boxed(nb).sort((p, q) => q.area - p.area) : marks;
  const mouthCand = mb ? boxed(mb) : marks;
  if (!noseCand.length || !mouthCand.length) throw new Error(`${view} 没找到鼻子或嘴：调 isMark / noseBox / mouthBox。候选：${marks.map((c) => c.area + "@" + c.box).join("  ")}`);
  const nose = noseCand[0];
  const mouth = mouthCand.reduce((a, c) => (c.box[2] - c.box[0] > a.box[2] - a.box[0] ? c : a), mouthCand[0]);

  // 眉毛（brows: true）：眼睛上面、头发颜色的细长一块，每只眼睛取最近的那块
  const eyeTop0 = Math.min(...eyes.map((c) => c.box[1]));
  let brows = [];
  if (C.brows) {
    const cand = hairComp.filter((c) => c.area >= 12 && c.area < 500 && c.box[3] <= eyeTop0 + 2 && c.box[1] > eyeTop0 - 45 && c.box[2] - c.box[0] > 1.6 * (c.box[3] - c.box[1]) && c.box[0] > fb[0] - 4 && c.box[2] < fb[2] + 4);
    brows = eyes.map((e) => {
      const ex = (e.box[0] + e.box[2]) / 2;
      return cand.reduce((a, c) => (!a || Math.abs((c.box[0] + c.box[2]) / 2 - ex) < Math.abs((a.box[0] + a.box[2]) / 2 - ex) ? c : a), null);
    });
    // 配置给了 browBox（{ front: [左眉框, 右眉框], side: […] }）：眉毛是比头发还深的细线、挨着刘海尖时，在框里找细长的深色块（最大的那块）
    const bb = C.browBox?.[view];
    if (bb)
      brows = bb.map((b) => {
        const m = mask(W, H, (x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && sum(px(x, y)) < 260);
        const long = components(m).filter((c) => c.box[2] - c.box[0] > 1.8 * (c.box[3] - c.box[1]));
        return long.sort((p, q) => q.area - p.area)[0] ?? null;
      });
    if (brows.some((b) => !b) || brows[0] === brows[1]) {
      // 眉毛和刘海连在一起时找不出来：这一面不写眉毛（眉毛跟着眼睛放），不算错
      console.error(`${view} 眉毛没找全（可能和刘海连在一起），这一面不写 brow-l / brow-r`);
      brows = [];
    }
  }
  if (C.bald) return traceBald({ view, hairComp, skinComp, face, fb, ears, eyes, brows, nose, mouth, neck, xa, xb });

  // 脸的整圈：看得见的皮肤（往外扩到描边中间）里，挨着头发的那段（发际线）换成一个圆顶（藏在头发底下）
  // 眼睛也算脸（3/4 远处那只眼睛贴着脸边，不算进来脸就缺一块）
  // 闭运算把眼线贴着脸边的那道小缺口补上
  const faceVis = close(dilate(eyes.reduce((m, c) => or(m, c.mask), face.mask), 2), 4);
  const hairNear = dilate(hair, 3);
  let fo = smoothLoop(outline(faceVis), 2);
  // 发际线：挨着头发、又在眼睛上面的那段（眼睛以下挨着头发的是脸边：头发在脸旁边，不在脸上面）
  const eyeTop = Math.min(...eyes.map((c) => c.box[1]));
  const onHair = fo.map(([x, y]) => y < eyeTop - 2 && hairNear.m[Math.round(y) * W + Math.round(x)] === 1);
  // 最长的一段不挨头发的（下巴、两颊）
  let best = [0, 0];
  for (let i = 0; i < fo.length; i++) {
    if (onHair[i]) continue;
    let j = i;
    while (!onHair[(j + 1) % fo.length] && j - i < fo.length) j++;
    if (j - i > best[1] - best[0]) best = [i, j];
    if (j >= fo.length) break;
    i = j;
  }
  const jaw = [];
  for (let k = best[0]; k <= best[1]; k++) jaw.push(fo[k % fo.length]);
  // 顺时针：下巴那段从右边上端走到左边上端
  const E1 = jaw[jaw.length - 1];
  const E0 = jaw[0];
  const fw = fb[2] - fb[0];
  const chin = Math.max(...jaw.map((p) => p[1]));
  const top = chin - 1.2 * fw;
  // 圆顶：左上端 → 头顶 → 右上端（三次曲线，两头竖直）
  const domeN = 40;
  const [L, R] = E1[0] < E0[0] ? [E1, E0] : [E0, E1];
  const h = (Math.min(L[1], R[1]) - top) / 0.75;
  const bez = (a, b, c, d, t) => [0, 1].map((k) => (1 - t) ** 3 * a[k] + 3 * (1 - t) ** 2 * t * b[k] + 3 * (1 - t) * t * t * c[k] + t ** 3 * d[k]);
  const from = jaw[jaw.length - 1];
  const to = jaw[0];
  const dome = Array.from({ length: domeN - 1 }, (_, i) => bez(from, [from[0], from[1] - h], [to[0], to[1] - h], to, (i + 1) / domeN));
  // faceRound：脸取凸包再顺一顺（小孩圆圆的脸：像素描出来的脸颊线有小起伏，贴着耳朵还有一个缺口；用户 2026-10-28：「脸右边坑坑洼洼的，改圆一点」）
  const faceFull = C.faceRound ? smoothLoop(resampleLoop(convexHull([...jaw, ...dome]), 160), 3) : smoothLoop([...jaw, ...dome], 1.5);
  const faceFullM = mask(W, H, (x, y) => inside(faceFull, x, y));

  // 头发后面那片：头发 ∪ 脸在嘴上面的那块，填洞，外轮廓
  const yCut = (eyes[0].box[3] + mouth.box[1]) / 2;
  // backClose：头发和脸之间隔着参考图的描边，留下一道通到外面的细缝（填洞填不上）时，闭运算把它封上
  const backM0 = or(dilate(hair, 1), and(faceFullM, mask(W, H, (x, y) => y < yCut)));
  const backM = fillHoles(C.backClose ? close(backM0, C.backClose) : backM0);
  const back = smoothLoop(outline(components(backM)[0].mask), 1.5);
  // 刘海：头发 ∩ 脸的整圈（往外扩一点盖住脸的描边）
  // 往脸外面多扩一点（2 像素按常见参考图的大小算：大图按比例多扩），刘海的上沿不压在脸上，不然描边在额头上留一道弧线
  // fringePad 给了就按它（参考图像素）：脸的描边在刘海边上透出一道细线时再多扩一点
  const fringeM = and(dilate(hair, 1), dilate(faceFullM, C.fringePad ?? Math.max(2, Math.round(1.4 / K))));
  const fringe = smoothLoop(outline(components(fringeM)[0].mask), 1.5);

  const earLines = ears.map((c) => earLine(c));
  const neckC = neckCenter(neck, xa, xb, view);
  if (DEBUG)
    debugPNG(path.join(DEBUG_DIR, `${who}-${view}.png`), W, H, [
      [backM, [200, 190, 230]],
      [faceFullM, [250, 220, 200]],
      [fringeM, [120, 80, 60]],
    ]);
  // 马尾、发圈（有 tieBox 时）
  const tail = tailComps.length ? smoothLoop(outline(dilate(close(tailComps.reduce((a, c) => or(a, c.mask), tailComps[0].mask), 2), 2)), 2) : null;
  const tieC = tieM ? components(close(tieM, 2))[0] : null;
  const tie = tieC ? smoothLoop(outline(dilate(tieC.mask, 2)), 2) : null;
  return { face: faceFull, ears: earLines, eyes: eyes.map(eyeBox), brows: brows.map(blob), nose: ends(nose), mouth: ends(mouth), back, fringe, pieces: [], neckC, fb, tail, tie };
}
/** 脖子中心：对齐用（参考图 neckRow 那一行，下巴描边下面；主角的脖子在线稿 y 278–288 是直的）。
 *  脖子一边有阴影（不算皮肤色），量皮肤会偏：从脖子盒子的中间往两边找描边（最深的那几格） */
function neckCenter(neck, xa, xb, view) {
  // 脖子被领子、下巴的阴影挡住量不准时，配置里直接给 neckX: [正面, 3/4]（参考图像素）
  if (C.neckX) return C.neckX[view === "front" ? 0 : 1];
  const row = C.neckRow;
  const mid = Math.round((neck.box[0] + neck.box[2]) / 2);
  const isInk = (x) => sum(px(x, row)) < 300;
  let l = mid;
  while (l > xa && !isInk(l)) l--;
  let r = mid;
  while (r < xb - 1 && !isInk(r)) r++;
  return (l + r + 1) / 2;
}
const eyeBox = (c) => {
  const [x0, y0, x1, y1] = c.box;
  return { cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, rx: (x1 - x0 + 1) / 2 + 0.5, ry: (y1 - y0 + 1) / 2 + 0.5 };
};
/** 一小块（眉毛）的轮廓：往外扩到描边中间 */
const blob = (c) => smoothLoop(outline(dilate(c.mask, 1)), 1);
function ends(c) {
  const pts = [];
  for (let i = 0; i < W * H; i++) if (c.mask.m[i]) pts.push([i % W, (i / W) | 0]);
  const l = pts.reduce((a, p) => (p[0] < a[0] ? p : a));
  const r = pts.reduce((a, p) => (p[0] > a[0] ? p : a));
  const mid = pts.filter((p) => Math.abs(p[0] - (l[0] + r[0]) / 2) < 1.5).reduce((a, p) => (p[1] > a[1] ? p : a), [0, -1]);
  return [l, mid[1] >= 0 ? mid : [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2], r].map(([x, y]) => [x + 0.5, y + 0.5]);
}
/**
 * 秃顶（bald: true）：头的皮肤（连头顶）整个就是脸——闭运算把头发压在脸边的缺口、镜片里的皮肤补上；
 * 不描刘海和后面那片；挨着脸边、比眉毛大的几块头发是单独的几块（两鬓的白发），压在脸和耳朵上
 */
function traceBald({ view, hairComp, skinComp, face, fb, ears, eyes, brows, nose, mouth, neck, xa, xb }) {
  const faceVis = fillHoles(close(dilate(eyes.reduce((m, c) => or(m, c.mask), face.mask), 2), 6));
  // 秃顶的头基本是凸的：参考图里两鬓的头发压着头的边，皮肤的轮廓在那里往里缺一块——转身到一半头发和缺口错开就露出来。取凸包
  // 凸包会把耳朵根那块也包进来（耳朵画在脸后面，就被盖住了）：凸包再扣掉耳朵
  const hull = convexHull(outline(faceVis));
  const hullM = mask(W, H, (x, y) => inside(hull, x + 0.5, y + 0.5));
  const faceM2 = ears.reduce((m, c) => and(m, not(dilate(c.mask, 1))), hullM);
  const faceFull = smoothLoop(resampleLoop(outline(components(faceM2)[0].mask), 160), 2);
  // 挨着脸边、竖着长的几块（眉毛是扁的）；3/4 远处那一撮只露出细细一条
  const pieces = hairComp.filter((c) => c.area > 80 && c.box[3] - c.box[1] > 15 && (c.box[0] < fb[0] + 10 || c.box[2] > fb[2] - 10) && c.box[3] < fb[3]).sort((p, q) => p.box[0] - q.box[0]);
  // pieceSmooth：单独的几块头发描出来的边按像素一抖一抖的（眼镜腿、耳朵把下沿切得坑坑洼洼），顺得更狠一点
  //（用户 2026-10-28：老钟 3/4「这里坑坑洼洼的，优化一下」）；耳朵扣掉以后再顺，顺完往外扩回描边中间
  const pieceLines = pieces.map((c) => {
    const m = C.pieceSmooth ? close(c.mask, Math.round(C.pieceSmooth)) : close(c.mask, 2);
    return smoothLoop(outline(dilate(m, 1)), C.pieceSmooth ?? 1.5);
  });
  const earLines = ears.map((c) => earLine(c));
  if (DEBUG)
    debugPNG(path.join(DEBUG_DIR, `${who}-${view}.png`), W, H, [
      [faceVis, [250, 220, 200]],
      ...pieces.map((c) => [c.mask, [150, 150, 150]]),
      ...ears.map((c) => [c.mask, [240, 170, 150]]),
      ...eyes.map((c) => [c.mask, [40, 40, 40]]),
      ...brows.map((c) => [c.mask, [90, 90, 90]]),
    ]);
  return { face: faceFull, ears: earLines, eyes: eyes.map(eyeBox), brows: brows.map(blob), nose: ends(nose), mouth: ends(mouth), back: null, fringe: null, pieces: pieceLines, neckC: neckCenter(neck, xa, xb, view), fb };
}
/**
 * 敞怀外衣的两片前襟（配置给了 coat）：外衣颜色的两大块（每块连着它外侧的袖子），往外扩 2 像素到描边中间，
 * 从门襟上端（最上面那一行靠里的那头）沿门襟往下、沿下摆往外走，走到下摆外角开始往上拐（或者被手挡住）为止。
 * 只描门襟和下摆：肩、袖窿、侧缝在胳膊底下，换算时接主角外套的（线稿换算.mjs）
 */
function traceCoat(view) {
  const [xa, xb] = view === "front" ? [0, C.split] : [C.split, W];
  const [y0, y1] = C.coat.rows;
  const m = close(mask(W, H, (x, y) => x >= xa && x < xb && y >= y0 && y <= y1 && C.coat.isCoat(px(x, y), x, y)), 1);
  const parts = components(m).slice(0, 2).sort((a, b) => a.box[0] - b.box[0]);
  if (parts.length < 2) throw new Error(`${view} 外衣只找到 ${parts.length} 块（要两片前襟）：调 coat.isCoat / coat.rows`);
  return parts.map((c, k) => {
    // 轮廓是顺时针的：左边那片顺着走、右边那片倒着走，从门襟上端出发都是先沿门襟往下
    let loop = outline(dilate(c.mask, 2));
    if (k === 1) loop = loop.reverse();
    const top = Math.min(...loop.map((p) => p[1]));
    const inner = (a, b) => (k === 0 ? b[0] > a[0] : b[0] < a[0]);
    let i0 = -1;
    loop.forEach((p, i) => {
      if (p[1] <= top + 1 && (i0 < 0 || inner(loop[i0], p))) i0 = i;
    });
    const yMax = c.box[3] + 2;
    const path = [];
    let hem = false;
    for (let n = 0; n < loop.length; n++) {
      const p = loop[(i0 + n) % loop.length];
      if (p[1] >= yMax - 3) hem = true;
      if (hem && p[1] < yMax - 8) break;
      path.push(p);
    }
    return smoothLoop(path, 2, false);
  });
}
/**
 * 裤子（配置给了 pants，只描正面）：裤子颜色的那一大块往外扩 2 像素到描边中间，一行一行找两条裤腿的外沿和里沿
 * （裆以上两条腿连成一段：里沿是正中 cx），连成两圈闭合的轮廓：画面左那条腿外沿从上往下、裤脚、里沿从下往上到裆、正中往上。
 * 换算时只用宽窄（每一行离这条腿中线多远），绕着主角的胯、膝、脚踝重新摆（线稿换算.mjs）
 */
function traceLegs(cx) {
  const [y0, y1] = C.pants.rows;
  const m0 = close(mask(W, H, (x, y) => x < C.split && y >= y0 && y <= y1 && C.pants.isPants(px(x, y))), 2);
  const m = dilate(components(m0)[0].mask, 2);
  const rows = [];
  for (let y = y0 - 2; y <= y1 + 2; y++) {
    const runs = [];
    let st = -1;
    for (let x = 0; x <= C.split; x++) {
      const v = x < C.split && m.m[y * W + x] === 1;
      if (v && st < 0) st = x;
      if (!v && st >= 0) {
        if (x - st > 3) runs.push([st, x]);
        st = -1;
      }
    }
    if (!runs.length) continue;
    // 裆以下正中 cx 不在裤子里；两条腿的里沿是离正中最近的那两头（裤兜、缝线会把一条腿再切成几段）
    const split = !runs.some(([a, b]) => a <= cx && b > cx);
    const lIn = Math.max(...runs.filter(([, b]) => b <= cx).map(([, b]) => b));
    const rIn = Math.min(...runs.filter(([a]) => a >= cx).map(([a]) => a));
    rows.push({ y, l: [runs[0][0], lIn], r: [rIn, runs[runs.length - 1][1]], split });
  }
  // 裤腰：从上往下第一行盖住正中的（再往上是上衣下摆边上零碎的几块）；裆：最后一行盖住正中的下面那一行
  const first = rows.findIndex((r) => !r.split);
  const last = rows.findLastIndex((r) => !r.split);
  if (first < 0 || last === rows.length - 1) throw new Error("裤子没分成两条腿：调 pants.isPants / pants.rows");
  rows.splice(0, first);
  const ci = last - first + 1;
  const top = rows[0].y;
  const crotch = rows[ci].y;
  const bottom = rows[rows.length - 1].y + 1;
  const legs = [];
  for (const k of [0, 1]) {
    const outer = rows.map((r) => [k ? r.r[1] : r.l[0], r.y + 0.5]);
    const inner = rows.slice(ci).map((r) => [k ? r.r[0] : r.l[1], r.y + 0.5]);
    const ring = [[outer[0][0], top], ...outer, [outer[outer.length - 1][0], bottom], [inner[inner.length - 1][0], bottom], ...inner.reverse(), [cx, crotch], [cx, top]];
    // 先按 1 像素一个点加密（几个角上点很稀，直接顺会把角切掉一大块）
    const per = ring.reduce((a, p, i) => a + Math.hypot(p[0] - ring[(i + 1) % ring.length][0], p[1] - ring[(i + 1) % ring.length][1]), 0);
    legs.push(smoothLoop(resampleLoop(k ? ring.reverse() : ring, Math.round(per)), 1.5));
  }
  return legs;
}
/** 耳朵的轮廓（往外扩到描边中间）；earRound 时取凸包再顺一顺 */
const earLine = (c) => (C.earRound ? smoothLoop(resampleLoop(convexHull(outline(dilate(c.mask, 3))), 60), 2) : smoothLoop(outline(dilate(c.mask, 3)), 1.5));
/** 凸包（Andrew 单调链），顺时针（y 朝下） */
function convexHull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)].reverse();
}
function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ——— 参考图像素 → 线稿坐标 ———
const NECK_SVG = { front: 229.5, side: (202.8 + 233.3) / 2 };
const toSvg = (view, neckC) => ([x, y]) => [NECK_SVG[view] + (x - neckC) * K, 141.43 + (y - C.lines[0]) * K];

/** 折线 → SVG 路径（闭合的用 Catmull-Rom 转三次曲线，大约每 step 个线稿单位一个节点，好在编辑器里改） */
function pathD(pts, closed, step = 5) {
  const L = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const n = Math.max(closed ? 6 : 2, Math.round(L / step));
  const q = resampleLoop(pts, n, closed);
  const f = (v) => v.toFixed(2);
  if (q.length === 2 || (!closed && q.length < 3)) return `M${f(q[0][0])},${f(q[0][1])} L${q.slice(1).map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}`;
  const at = (i) => q[closed ? (i + q.length) % q.length : Math.max(0, Math.min(q.length - 1, i))];
  let d = `M${f(q[0][0])},${f(q[0][1])}`;
  const last = closed ? q.length : q.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + " Z" : d;
}
const ellipseD = (e, map) => {
  const pts = Array.from({ length: 24 }, (_, i) => [e.cx + e.rx * Math.cos((i / 24) * Math.PI * 2), e.cy + e.ry * Math.sin((i / 24) * Math.PI * 2)]).map(map);
  return pathD(pts, true, 3);
};

const STYLE = 'fill="#00a0ff" fill-opacity="0.07" stroke="#0060c0" stroke-opacity="0.8"';
function pathsFor(view) {
  const t = trace(view);
  const map = toSvg(view, t.neckC);
  const P = (id, pts, closed, step) => `  <path id="${id}" d="${pathD(pts.map(map), closed, step)}" ${STYLE}/>`;
  const out = [];
  if (t.back) out.push(P("hair-back", t.back, true, 4));
  if (t.fringe) out.push(P("fringe", t.fringe, true, 3));
  if (t.tail) out.push(P("hair-tail", t.tail, true, 4));
  if (t.tie) out.push(P("hair-tie", t.tie, true, 3));
  out.push(P("face", t.face, true, 5));
  // 单独的几块头发（秃顶两鬓）：按从左到右 hair-1、hair-2…
  t.pieces.forEach((pc, i) => out.push(P(`hair-${i + 1}`, pc, true, 3)));
  // 耳朵：正面按左右，3/4 只有近处那只（画面右）
  t.ears.sort((a, b) => a[0][0] - b[0][0]);
  if (view === "front") {
    out.push(P("ear-l", t.ears[0], true, 3), P("ear-r", t.ears[t.ears.length - 1], true, 3));
  } else out.push(P("ear-r", t.ears[t.ears.length - 1], true, 3));
  // 眼睛：画面左那只是 eye-l
  out.push(`  <path id="eye-l" d="${ellipseD(t.eyes[0], map)}" ${STYLE}/>`, `  <path id="eye-r" d="${ellipseD(t.eyes[t.eyes.length - 1], map)}" ${STYLE}/>`);
  out.push(P("nose", t.nose, false, 1), P("mouth", t.mouth, false, 2));
  if (t.brows.length) out.push(P("brow-l", t.brows[0], true, 2), P("brow-r", t.brows[1], true, 2));
  // 外衣的两片前襟：门襟上端 → 下摆外角（画面左那片 coat-l，3/4 时是远的那片），和头一样按脖子对齐
  if (C.coat) traceCoat(view).forEach((pts, k) => out.push(P(k ? "coat-r" : "coat-l", pts, false, 6)));
  // 裤子的两条腿（只描正面：3/4 的裤腿和正面是同一块，跟着骨头摆）：画面左那条 leg-l
  if (C.pants && view === "front") traceLegs(t.neckC).forEach((pts, k) => out.push(P(k ? "leg-r" : "leg-l", pts, true, 6)));
  console.error(view, "脖子中心（参考图）", t.neckC, "眼睛", t.eyes.length, "耳朵", t.ears.length, "眉毛", t.brows.length, "单独的头发", t.pieces.length, "外衣", C.coat ? 2 : 0);
  return out.join("\n");
}

// 写进 SVG 的「身体」图层（原来这一层里的线整个换掉；文件由 线稿生成.mjs 先生成）。--debug 只出调试图、不写
if (DEBUG) for (const v of ["front", "side"]) pathsFor(v);
else for (const [view, file, layer] of [
  ["front", `${who}-线稿.svg`, "body"],
  ["side", `${who}-侧面线稿.svg`, "side-body"],
]) {
  const f = path.join(root, "public/ref", file);
  const svg = fs.readFileSync(f, "utf8");
  const re = new RegExp(`(<g class="layer" id="${layer}"[^>]*>\\s*<title>[^<]*</title>)[\\s\\S]*?(\\n </g>)`);
  if (!re.test(svg)) throw new Error(file + " 里没有图层 " + layer);
  fs.writeFileSync(f, svg.replace(re, `$1\n${pathsFor(view)}$2`));
  console.error("写好", file);
}
