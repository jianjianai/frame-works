// 主歌二 1:11.97–1:27.93：他看见了她的秘密 → 「咚」 → 电车上拽回阿满（她自己也离了地）→ 千斤给邻居吊砖 → 他学她跺脚 → 等等我
import { type C, type Cam, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, dissolve, clamp, mix } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST, lightWell, tram, FLOOR, WELL } from "./world";
import { street, qinRoom } from "./sets";
import { qinFloatSleep } from "./chorus1";
import { bootFull } from "./pre1";
import { hand } from "./props";

export const kidSit = (o: Partial<Fig> = {}): Fig => ({ x: -330, y: -64, grounded: false, kind: "kid", facing: 1, legL: 1.4, legR: 1.3, kneeL: 1.3, kneeR: 1.2, head: 0.5, rim: 0.7, eyes: "open", barefoot: true, bell: true, ...o });

// ---------- S31 71.97–73.83：早上。小石头看见她贴在天花板下，抓着绳子把自己拽下来；她把手指竖在嘴边 ----------
const s31: Shot = {
  a: 71.97,
  b: 73.83,
  draw(c, t) {
    const k = kcam(t, [[71.97, { x: -230, y: -260, z: 2.05 }], [73.83, { x: -260, y: -190, z: 2.7 }, E.io]]);
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: 0.2, boots: 1, glare: 1 });
    const pulls = (t - 72.1) / 0.26;
    const down = t < 72.1 ? 0 : clamp(Math.floor(pulls) / 3 + E.io(pulls % 1) / 3);
    const p = 0.55 * (1 - down);
    const sit = E.io(ph(t, 72.9, 73.15));
    if (sit <= 0) {
      const fig = qinFloatSleep(t, p, { eyes: "open" });
      const pre = pose(fig);
      const h: Pt = [mix(pre.anR[0], BEDPOST[0], 0.5), mix(pre.anR[1], BEDPOST[1], 0.5)];
      const j = figure(c, { ...fig, hR: h, hL: [h[0] + 26, h[1] - 8 + Math.sin(pulls * Math.PI) * 12] }, t);
      rope(c, BEDPOST, j.anR, 0, 3.2);
    } else {
      const shh = E.io(ph(t, 73.15, 73.5));
      const sj = pose({ x: -180, y: -62, grounded: false, kind: "qin", facing: -1, legL: -1.3, legR: -1.2, kneeL: 1.4, kneeR: 1.3, head: 0.0, barefoot: true, boots: false });
      figure(c, { x: -180, y: -62, grounded: false, kind: "qin", facing: -1, legL: -1.3, legR: -1.2, kneeL: 1.4, kneeR: 1.3, head: 0.0, hR: shh > 0 ? [mix(sj.handR[0], sj.head[0] - 4, shh), mix(sj.handR[1], sj.head[1] + 8, shh)] : undefined, barefoot: true, boots: false, rim: 0.7, eyes: "open" }, t);
      rope(c, BEDPOST, sj.anR, 26, 3.2);
    }
    figure(c, kidSit({ head: sit > 0 ? 0.1 : 0.9, eyes: "wide" }), t);
    c.restore();
    vignette(c, 0.5);
  },
};

// ---------- S32 73.83–75.87：她把昨晚写的那块「活下去」塞进靴子，他盯着看；脚跺进去：「咚」 ----------
const s32: Shot = {
  a: 73.83,
  b: 75.87,
  draw(c, t) {
    if (t < 74.45) {
      bootFull(c, t, ph(t, 73.9, 74.15));
      // 他的眼睛在画面边上看着
      c.save();
      c.translate(W - 170, 330);
      c.scale(5.5, 5.5);
      figure(c, { x: 0, y: 0, grounded: false, kind: "kid", facing: -1, head: -0.6, rim: 0.7, eyes: "wide", alpha: 0.95 }, t);
      c.restore();
      return;
    }
    const k = jolt(kcam(t, [[74.45, { x: -150, y: -160, z: 2.9 }], [75.87, { x: -100, y: -210, z: 2.5 }, E.io]]), shake(t, 10 * kick(t, 75.013, 0.12), 3));
    c.save();
    applyCam(c, k);
    const into = E.io(ph(t, 74.45, 74.95));
    qinRoom(c, t, { night: 0.15, boots: into > 0.5 ? undefined : 1, glare: 1 });
    const stand = E.out(ph(t, 75.0, 75.25));
    figure(
      c,
      stand > 0
        ? { x: mix(-120, -60, stand), y: 0, kind: "qin", facing: 1, lean: 0.05, head: 0.0, rim: 0.7, eyes: "open", aL: -0.4 + stand * 0.2 }
        : { x: mix(-180, -110, into), y: -62 + into * 8, grounded: false, kind: "qin", facing: 1, legL: mix(1.35, 0.3, into), legR: mix(1.25, 0.2, into), kneeL: mix(1.4, 0.5, into), kneeR: mix(1.3, 0.4, into), lean: 0.2, head: -0.4, boots: into > 0.5, barefoot: into <= 0.5, rim: 0.7 },
      t,
    );
    figure(c, kidSit({ x: -300, head: 0.2 }), t);
    if (t > 75.013) {
      c.fillStyle = `rgba(245,232,236,${0.75 * Math.exp(-(t - 75.013) * 3)})`;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.arc(-60 + (i - 2.5) * 30 * (1 + (t - 75) * 2), -6, 10 + (t - 75) * 20, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    vignette(c, 0.5);
  },
};

// ---------- S33/S34 75.87–79.98：电车上，阿满贴着车顶的网飘着，一车人低头看脚 ----------
const PASSENGERS = [-560, -380, -40, 140, 440, 620];
function passengers(c: C, t: number) {
  PASSENGERS.forEach((x, i) =>
    figure(c, { x, y: -112, grounded: false, kind: i % 2 ? "man" : "woman", facing: i % 2 ? 1 : -1, legL: 1.35, legR: 1.25, kneeL: 1.4, kneeR: 1.3, head: -0.8, lean: 0.12, aL: 0.5, aR: 0.6, bendL: -0.9, bendR: -0.9, tone: 0.25 + (i % 3) * 0.08, rim: 0.4 }, t),
  );
}
const manAt = (t: number, down: number): Fig => ({
  x: mix(-120, -200, down),
  y: mix(-345, -110, down),
  grounded: false,
  kind: "worker",
  facing: -1,
  lean: mix(-1.35, -0.1, down),
  float: 0.9 * (1 - down),
  legL: mix(1.4, 0.2, down),
  legR: mix(1.5, -0.1, down),
  kneeL: 0.2,
  kneeR: 0.1,
  aL: mix(Math.PI - 0.5, 0.2, down),
  aR: mix(Math.PI + 0.4, -0.2, down),
  head: mix(0.4, -0.5, down),
  eyes: down > 0.5 ? "open" : "closed",
  rim: 0.5,
});
const camTram = (t: number): Cam =>
  kcam(t, [
    [75.87, { x: -200, y: -230, z: 1.45 }],
    [77.85, { x: -260, y: -230, z: 1.6 }, E.io],
    [78.7, { x: -330, y: -170, z: 2.3 }, E.io],
    [79.98, { x: -250, y: -220, z: 1.7 }, E.io],
  ]);
const s33: Shot = {
  a: 75.87,
  b: 79.98,
  draw(c, t) {
    const k = jolt(camTram(t), shake(t, 2.5, 1));
    street(c, { ...k, x: k.x - 2600 + (t - 75.87) * 600 }, t, {});
    c.save();
    applyCam(c, k);
    tram(c, t, {});
    passengers(c, t);
    const down = E.io(ph(t, 78.9, 79.6));
    const mj = figure(c, manAt(t, down), t);
    // 她：从车门冲进来 → 抓住他的鞋 → 自己的靴跟离地 → 一只脚勾住座椅腿 → 把他拽下来
    const run = ph(t, 75.95, 76.55);
    const grab = t > 76.6;
    const lift = E.io(ph(t, 77.9, 78.55)) * (1 - E.io(ph(t, 78.9, 79.5))) * 70;
    const hook = t > 78.55 && t < 79.5;
    if (!grab) {
      const w = walk(t * 2.4, 0.6);
      figure(c, { x: mix(-760, -330, run), y: 0, kind: "qin", facing: 1, lean: 0.25, legL: w.legL, legR: w.legR, kneeL: w.kneeL + 0.3, kneeR: w.kneeR + 0.3, head: 0.7, rim: 0.8, eyes: "wide" }, t);
    } else {
      const target: Pt = [mj.anL[0] + 4, mj.anL[1] + 6];
      figure(c, { x: -330, y: -lift, kind: "qin", facing: 1, lean: -0.25 - 0.15 * down, legL: hook ? 0.9 : -0.3, kneeL: hook ? 1.9 : 0.3, legR: 0.25, kneeR: 0.3, hR: target, hL: [target[0] - 4, target[1] + 26], head: 0.9, rim: 0.8, eyes: "wide" }, t);
    }
    // 小石头在车门口看着她的脚
    figure(c, { x: -700, y: 0, kind: "kid", facing: 1, head: lift > 10 ? -0.4 : 0.4, rim: 0.7, eyes: "wide", bell: true }, t);
    c.restore();
    vignette(c, 0.45);
  },
};

// ---------- S35 79.98–81.78：九十八层，千斤写好一块砖，放进篮子顺着天井吊给楼下的邻居 ----------
const QF = -(WELL.floors - 1) * FLOOR - 14; // 千斤那一层的走廊
const s35: Shot = {
  a: 79.98,
  b: 81.78,
  draw(c, t) {
    const k = kcam(t, [[79.98, { x: 220, y: QF - 120, z: 2.6 }], [81.78, { x: 120, y: QF + 260, z: 1.25 }, E.io]]);
    c.save();
    applyCam(c, k);
    lightWell(c, k, t, { lights: 0.1 });
    const lower = E.io(ph(t, 80.4, 81.6));
    figure(c, { x: 330, y: QF, kind: "girl", facing: -1, legL: -1.2, kneeL: 1.6, legR: -1.0, kneeR: 1.5, lean: -0.15, head: -0.7, hL: [262, QF - 100], hR: [270, QF - 92], stone: 0.6, rim: 0.7, eyes: "open" }, t);
    const by = mix(QF - 60, QF + 2 * FLOOR - 120, lower);
    rope(c, [265, QF - 98], [200, by - 40], 0, 2);
    c.fillStyle = "#b07d5e";
    c.fillRect(176, by - 40, 48, 36);
    stone(c, 200, by - 44, 10, "", 0.8);
    // 楼下伸出来一只手
    const reach = E.out(ph(t, 81.0, 81.6));
    figure(c, { x: 330, y: QF + 2 * FLOOR, kind: "old", facing: -1, lean: 0.2, hL: [mix(270, 215, reach), QF + 2 * FLOOR - 110], head: 0.6, rim: 0.6, tone: 0.2 }, t);
    c.restore();
    vignette(c, 0.5);
  },
};

// ---------- S36 81.78–83.79：灰街上，小石头学她跺脚走路，一步比一步响 ----------
const X2 = -5200;
const s36: Shot = {
  a: 81.78,
  b: 83.79,
  draw(c, t) {
    const qx = X2 + (t - 81.78) * 150;
    const k = { x: qx - 70, y: -170, z: 2.6 };
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const w = walk((t - 0.013) / 1.0, 0.36);
    figure(c, { x: qx, y: -w.bob * 0.5, kind: "qin", facing: 1, lean: 0.05, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, aL: w.aL, hR: [qx - 10, -150 - w.bob * 0.5], broom: 2.6, head: 0.1, rim: 0.7 }, t);
    const kw = walk((t - 0.013) / 1.0, 0.55);
    const stomp = Math.max(0, Math.sin(((t - 0.013) / 0.5) * Math.PI)) ** 4;
    figure(c, { x: qx - 190, y: -kw.bob, kind: "kid", facing: 1, lean: -0.05, legL: kw.legL * 1.3, legR: kw.legR * 1.3, kneeL: kw.kneeL + stomp * 0.6, kneeR: kw.kneeR + stomp * 0.6, aL: -0.5, aR: 0.5, head: 0.3, rim: 0.7, eyes: "open", bell: true }, t);
    c.restore();
    ash(c, t, k, { n: 0.4 });
    vignette(c, 0.45);
  },
};

// ---------- S37/S38 83.79–87.93：远处有人的脚步声没了，她拔腿就跑；他追，摔在灰里；她回来，朝他伸出手 ----------
const qinRun = (t: number) => kf(t, [[83.79, X2 + 300], [84.0, X2 + 300], [86.1, X2 + 900, E.out2], [86.4, X2 + 900], [87.0, X2 + 520, E.io]]);
const kidRun = (t: number) => kf(t, [[83.79, X2 + 110], [84.3, X2 + 110], [85.9, X2 + 380, E.out2]]);
const s37: Shot = {
  a: 83.79,
  b: 87.93,
  draw(c, t) {
    const k = kcam(t, [
      [83.79, { x: X2 + 300, y: -200, z: 2.3 }],
      [85.0, { x: X2 + 450, y: -260, z: 1.7 }, E.io],
      [86.4, { x: X2 + 520, y: -170, z: 2.2 }, E.io],
      [87.93, { x: X2 + 460, y: -120, z: 3.0 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const qx = qinRun(t);
    const running = t > 84.0 && t < 86.1;
    const back = t > 86.4;
    const w = walk(t * 2.3, running ? 0.6 : back ? 0.35 : 0);
    const turn = t > 86.2;
    const kneel = E.io(ph(t, 86.95, 87.3));
    figure(c, { x: qx, y: 0, kind: "qin", facing: turn ? -1 : 1, lean: running ? 0.25 : 0.05 + 0.2 * kneel, legL: kneel > 0 ? mix(w.legL, -1.1, kneel) : w.legL, legR: w.legR, kneeL: kneel > 0 ? mix(w.kneeL, 1.9, kneel) : w.kneeL, kneeR: w.kneeR, head: t < 84.0 ? 0.3 : 0.1, aR: kneel > 0 ? -1.2 * kneel : undefined, hR: t > 87.0 ? [kidRun(t) + 40, -60 - 20 * (1 - kneel)] : undefined, rim: 0.75, eyes: "open" }, t);
    // 他：追 → 摔 → 抬头 → 抓住她的手
    const fall = E.in2(ph(t, 85.85, 86.05));
    const kx = kidRun(t);
    const up = E.io(ph(t, 87.3, 87.7));
    if (fall <= 0) {
      const kw = walk(t * 2.8, t > 84.3 ? 0.6 : 0);
      figure(c, { x: kx, y: 0, kind: "kid", facing: 1, lean: 0.2, legL: kw.legL, legR: kw.legR, kneeL: kw.kneeL, kneeR: kw.kneeR, aR: 1.4, head: 0.5, rim: 0.7, eyes: "open", bell: true }, t);
    } else {
      figure(c, { x: kx, y: -8, grounded: false, kind: "kid", facing: 1, lean: mix(0.2, 1.35, fall) - up * 0.9, legL: 1.2 * (1 - up) + 0.8 * up, legR: 1.0, kneeL: 0.6 + up * 1.2, kneeR: 0.3 + up, head: 0.9 * fall, hR: t > 87.0 ? [kx + 40, -60 - 20 * (1 - kneel)] : [kx + 50, -10], rim: 0.7, eyes: "open", tears: 0.6, bell: true }, t);
    }
    c.restore();
    ash(c, t, k, { n: 0.45 });
    vignette(c, 0.45 + 0.1 * ph(t, 86.5, 87.9));
  },
};

export const verse2Shots: Shot[] = [s31, s32, s33, s35, s36, s37];
void dissolve;
void hand;
void H;
