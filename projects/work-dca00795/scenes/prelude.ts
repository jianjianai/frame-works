// 前奏 0:00–0:16.013（一镜到底，用户定的顺序：死亡 → 主角救人 → 城市整体 → 买哑铃）。
// 0.0–0.513 屏息：首帧贴在飘进强光的女人身上（张着手、闭眼笑、眼泪往上飘、脚踝一截断红绳），镜头只推近 3%，微微歪。
// 0.513     她碰到白：彩色光环炸开、一闪，从头到脚化成五颜六色的火星，变成灰；镜头被光推开 25%，画面回正。
// 1.15–2.013 坠：镜头像那团灰一样往下掉，先慢后快、快到街面刹住（楼和窗糊成一道道），2.013 落在飘着的周磊身上，冲过一点再落回。
// 2.0–3.23  逼近：线性慢推（紧张），画外的铁靴一声比一声近。
// 3.23–4.013 公文包从他指间滑下去（手离地 2.9 米，按重力 0.78 秒落地），镜头跟着它坠、一路转到正对街边。
// 4.013     她从画面右边冲进来，铁靴砸在公文包旁边，石板裂开（她的第一个镜头是脚和声音）。
// 4.15–4.85 镜头从铁靴往上抬：她转过身仰着头，他在头顶，两个人同框；4.85 她一蹲，镜头凑近半步。
// 5.24–6.26 起跳，5.59 在空中抓住他的脚踝，两个人还往上走一点，然后带着铁靴的分量越落越快；6.013 铁靴砸进石板；6.26 他膝盖着地。
// 6.3–7.45  她跪下，从靴筒里抽出一块砖（很沉），镜头跟着砖往上走，砖转平、递到他手里。
// 7.45–8.35 「活下去」落进他手里：手一坠，砖暖了起来；镜头越推越慢；他看着砖，再抬头看她，哭着笑了。
// 8.35–8.9  她冲他笑一下，站起来——脚跟离地了一下（伏笔：送出一块砖，她轻了）；镜头往后舒一口气。
import * as THREE from "three";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { sectionScene, filmText, type Stage } from "../stage/stage";
import { shot, mixShot, applyShot, kick, shake, type Shot } from "../stage/camera";
import { DAY } from "../world/palette";
import { WHITE_Y } from "../world/city";
import { buildStreet, STREET, SPOTS } from "../world/street";
import { Puppet, E, ph, lerp, clamp01, gait, type Step } from "../rig3d/puppet";
import { express, addDissolve } from "../rig3d/vrm";
import { buildWoman, buildZhouLei, briefcase } from "../cast3d/extras";
import { buildChengtuo } from "../cast3d/chengtuo";
import { brickMesh } from "../rig3d/parts";
import { BRICK } from "../cast3d/boots";
import { apply, mixLimbs, type Limbs } from "../cast3d/moves";
import { lightRings, sparks, floatingTears } from "../fx/burn";
import { crackDecal, dustRing } from "../fx/impact";

const ZL = SPOTS.zhouLei.clone().setZ(-4.0).setY(2.45);
/** 周磊往上飘的速度（米/秒） */
const RISE = 0.12;
const WOMAN = new THREE.Vector3(40, WHITE_Y - 3.6, -3.2);
const T_BURN = 0.513;
const T_FALL0 = 1.15;
const T_LAND = 2.013;
const T_SLAM = 4.013;
const T_JUMP = 5.24;
const T_CATCH = 5.59;
const T_DOWN = 6.013;
const T_KNEES = 6.26;
const T_GIVE = 7.45;
const G = 9.8;
/** 她砸下铁靴的地方（公文包旁边，周磊身后），朝 −x 跑进来 */
const SLAM = new THREE.Vector3(40.45, 0, -4.75);
/** 落地以后她站的地方、他跪的地方（两个人沿 x 面对面，隔 0.75 米） */
const HER = new THREE.Vector3(40.3, 0, -4.7);
const HIM = new THREE.Vector3(39.55, 0, -4.55);

export function createScene(options: SceneOptions): Promise<Scene> {
  return sectionScene(options, async (stage: Stage) => {
    stage.buildWorld(DAY, (b) => !(b.x + b.w / 2 > STREET.x0 - 4 && b.x - b.w / 2 < STREET.x1 + 4 && Math.abs(b.z) - b.d / 2 < 15));
    const street = buildStreet(3);
    stage.scene.add(street.group);
    const [woman, zl, ct] = await Promise.all([buildWoman(), buildZhouLei(), buildChengtuo()]);
    const pw = new Puppet(woman.model, woman.footLift);
    const pz = new Puppet(zl.model, zl.footLift);
    const pc = new Puppet(ct.model, ct.footLift);
    stage.scene.add(woman.model.root, zl.model.root, ct.model.root);
    const dis = addDissolve(woman.model);
    const rings = lightRings(7);
    const spark = sparks(1100);
    const tears = floatingTears(6);
    stage.scene.add(rings.mesh, spark.points, tears.group);
    const bag = briefcase();
    stage.scene.add(bag);
    const brick = brickMesh(BRICK[0], BRICK[2], BRICK[1]);
    stage.scene.add(brick);
    const handBrick = ct.boots![0].bricks[0]; // 左靴正前面那块（她跪下以后从左靴里抽出来）
    const crack1 = crackDecal(1.6, 11), crack2 = crackDecal(2.4, 23);
    const dust1 = dustRing(1.4), dust2 = dustRing(2.2);
    stage.scene.add(crack1.mesh, crack2.mesh, dust1.mesh, dust2.mesh);

    // ================================================================ 开场的女人
    const posePw = (t: number) => {
      pw.reset();
      pw.place(WOMAN.clone().add(new THREE.Vector3(0, 0.22 * t, 0)), 0.15);
      pw.hips([0, 0, 0], [-0.08, 0.03, 0]);
      pw.spine(-0.22, 0.04, 0.05);
      pw.look([0.42, 0.05, -0.08]);
      const H = pw.hipHeight;
      pw.arm("L", pw.local(-0.62, H + 0.92, 0.12), pw.local(-0.9, H + 0.2, -0.3));
      pw.arm("R", pw.local(0.58, H + 0.98, 0.05), pw.local(0.9, H + 0.2, -0.3));
      pw.wrist("L", [0, 0, 0.25]);
      pw.wrist("R", [0, 0, -0.25]);
      pw.leg("L", pw.local(-0.11, 0.1, -0.06), undefined, -0.7);
      pw.leg("R", pw.local(0.07, 0.24, -0.18), undefined, -0.8);
      pw.fingers("L", 0.25);
      pw.fingers("R", 0.25);
      express(woman.model, { blink: 1, fun: 0.75, sorrow: 0.15 });
      woman.hair?.(t, 1);
    };

    // ================================================================ 秤砣
    const H = pc.hipHeight;
    // 跑进来：每 0.208 秒一步（画外的铁靴），最后一步 4.013 砸下去
    const RUN: Step[] = [];
    {
      const ts = [2.604, 2.813, 3.021, 3.229, 3.438, 3.646, 3.854, T_SLAM];
      ts.forEach((tt, i) => {
        const side = i % 2 === 0 ? "R" : "L";
        const x = SLAM.x + (ts.length - 1 - i) * 1.15 - (i === ts.length - 1 ? 0 : 0.2);
        const z = SLAM.z + (side === "R" ? -0.13 : 0.13);
        RUN.push({ t: tt, at: new THREE.Vector3(x, 0, z), side: side as "L" | "R" });
      });
    }
    const runRoot = (t: number) => {
      // 根节点沿 x 匀速跑，最后一步刹住
      const x0 = RUN[0].at.x + 0.6, x1 = SLAM.x;
      const k = ph(t, RUN[0].t - 0.2, T_SLAM);
      return new THREE.Vector3(lerp(x0, x1, 1 - Math.pow(1 - k, 1.35)), 0, SLAM.z);
    };
    const CROUCHED: Limbs = {
      hips: [0, -0.3, -0.05],
      hipsRot: [0.42, 0, 0],
      spine: [0.16, 0, 0],
      look: [0.62, 0, 0],
      handL: [-0.3, H - 0.42, -0.34],
      handR: [0.3, H - 0.42, -0.34],
      elbowL: [-0.4, H - 0.1, -0.6],
      elbowR: [0.4, H - 0.1, -0.6],
      footL: [-0.13, 0.1, 0.06],
      footR: [0.13, 0.1, 0.0],
      fingersL: 0.6,
      fingersR: 0.6,
    };
    const REACH: Limbs = {
      hips: [0, 0.02, 0],
      hipsRot: [-0.06, 0, 0],
      spine: [-0.2, -0.12, 0],
      look: [0.75, 0.05, 0],
      handR: [0.1, H + 1.0, 0.18],
      elbowR: [0.5, H + 0.6, -0.3],
      handL: [-0.34, H - 0.05, -0.12],
      footL: [-0.1, 0.18, -0.12],
      footR: [0.08, 0.3, -0.2],
      toeL: -0.5,
      toeR: -0.6,
      fingersR: 0.8,
      fingersL: 0.5,
    };
    const LAND: Limbs = {
      hips: [0, -0.3, 0.06],
      hipsRot: [0.3, 0, 0],
      spine: [0.3, 0, 0],
      look: [0.1, 0, 0],
      handL: [-0.45, H - 0.25, 0.25],
      handR: [0.18, H + 0.35, 0.2],
      elbowR: [0.5, H, -0.2],
      footL: [-0.2, 0.1, 0.1],
      footR: [0.19, 0.1, -0.06],
      fingersR: 0.85,
    };
    /** 抓住的那一刻：她的根节点要在哪、朝哪，右手才正好握住他的左脚踝（迭代三次） */
    let catchSol: { root: THREE.Vector3; yaw: number } | null = null;
    const catchSolve = () => {
      if (catchSol) return catchSol;
      pz.reset();
      floatPose(T_CATCH);
      const A = pz.at("leftFoot");
      const yaw = Math.atan2(A.x - SLAM.x, A.z - SLAM.z);
      const root = new THREE.Vector3(SLAM.x + (A.x - SLAM.x) * 0.6, A.y - H - 0.95, SLAM.z + (A.z - SLAM.z) * 0.6);
      for (let i = 0; i < 4; i++) {
        pc.reset();
        pc.place(root, yaw);
        apply(pc, REACH);
        const hnd = pc.at("rightHand");
        root.add(A.clone().sub(hnd).add(new THREE.Vector3(0, 0.05, 0)));
      }
      catchSol = { root: root.clone(), yaw };
      return catchSol;
    };
    /** 她在 t 时刻的根节点位置、朝向、肢体 */
    const herAt = (t: number): { pos: THREE.Vector3; yaw: number; limbs: Limbs; expr: Record<string, number>; float: number } => {
      // ---- 跑
      if (t < T_SLAM) {
        const g = gait(t, RUN, 0.2, 0.22);
        const ph2 = Math.sin(((t - RUN[0].t) / 0.208) * Math.PI);
        const toL = (v: THREE.Vector3) => {
          // 世界 → 她的人物坐标（朝 −x：前 = −x，右 = −z）
          const d = v.clone().sub(runRoot(t));
          return [-d.z, v.y, -d.x] as [number, number, number];
        };
        return {
          pos: runRoot(t),
          yaw: -Math.PI / 2,
          limbs: {
            hips: [0, -0.06 + g.bob * 0.05, 0],
            hipsRot: [0.24, 0, 0.06 * ph2],
            spine: [0.14, 0, -0.12 * ph2],
            look: [0.05, 0, 0],
            footL: toL(g.L.pos),
            footR: toL(g.R.pos),
            toeL: -0.4 * g.L.air,
            toeR: -0.4 * g.R.air,
            handL: [-0.24, H - 0.02 + 0.12 * ph2, 0.3 * ph2],
            handR: [0.24, H - 0.02 - 0.12 * ph2, -0.3 * ph2],
            elbowL: [-0.5, H, -0.5],
            elbowR: [0.5, H, -0.5],
            fingersL: 0.75,
            fingersR: 0.75,
          },
          expr: { angry: 0.25 },
          float: 0,
        };
      }
      // 站定、转身面向他（朝 +z 偏 −x），仰头
      const faceHim = Math.atan2(ZL.x - SLAM.x, ZL.z - SLAM.z);
      const standUp: Limbs = { spine: [-0.14, 0, 0], look: [0.62, 0, 0], handL: [-0.23, H - 0.12, 0.02], handR: [0.23, H - 0.12, 0.02] };
      if (t < T_JUMP) {
        const impact = Math.exp(-(t - T_SLAM) / 0.12);
        const turn = E.smooth(ph(t, 4.12, 4.5));
        const crouch = E.io(ph(t, 4.85, T_JUMP));
        const base = mixLimbs(
          { hips: [0, -0.12, 0], hipsRot: [0.25, 0, 0], spine: [0.2, 0, 0], look: [-0.1, 0, 0], footL: [-0.16, 0.1, 0.28], footR: [0.14, 0.1, -0.12], handL: [-0.4, H - 0.2, 0.2], handR: [0.4, H - 0.2, 0.2] },
          standUp,
          E.out2(ph(t, T_SLAM + 0.05, 4.5)),
        );
        const crouched: Limbs = {
          hips: [0, -0.3, -0.05],
          hipsRot: [0.42, 0, 0],
          spine: [0.16, 0, 0],
          look: [0.62, 0, 0],
          handL: [-0.3, H - 0.42, -0.34],
          handR: [0.3, H - 0.42, -0.34],
          elbowL: [-0.4, H - 0.1, -0.6],
          elbowR: [0.4, H - 0.1, -0.6],
          footL: [-0.13, 0.1, 0.06],
          footR: [0.13, 0.1, 0.0],
          fingersL: 0.6,
          fingersR: 0.6,
        };
        const l = mixLimbs(base, crouched, crouch);
        if (l.hips) l.hips[1] -= 0.06 * impact;
        return { pos: SLAM.clone(), yaw: lerp(-Math.PI / 2, faceHim, turn), limbs: l, expr: { surprised: 0.25 * (1 - turn), angry: 0.35 * crouch }, float: 0 };
      }
      // 起跳 → 抓住 → 往上冲一点 → 越落越快 → 砸地
      if (t < T_DOWN + 0.3) {
        const C = catchSolve();
        let pos: THREE.Vector3;
        if (t < T_CATCH) {
          // 抛物线：正好在 5.59 把右手送到他的脚踝
          const s = t - T_JUMP, T = T_CATCH - T_JUMP;
          const v0 = (C.root.y + 0.5 * G * T * T) / T;
          pos = SLAM.clone().lerp(C.root, s / T);
          pos.y = v0 * s - 0.5 * G * s * s;
        } else {
          // 抓住以后两个人还往上走 0.12 米，然后带着铁靴的分量越落越快
          const apexT = T_CATCH + 0.12;
          const y = t < apexT ? C.root.y + 0.12 * E.out2((t - T_CATCH) / 0.12) : Math.max(0, (C.root.y + 0.12) * (1 - Math.pow(ph(t, apexT, T_DOWN), 2)));
          pos = C.root.clone().lerp(HER, E.io(ph(t, T_CATCH, T_DOWN)));
          pos.y = y;
        }
        const yaw = t < T_CATCH ? C.yaw : lerp(C.yaw, -Math.PI / 2 + 0.15, E.smooth(ph(t, T_DOWN, T_DOWN + 0.3)));
        // 起跳时从蹲着 0.12 秒伸展成够的姿势；落地以后是砸下去的蹲姿
        let l: Limbs;
        if (t < T_DOWN) l = mixLimbs(CROUCHED, REACH, E.out3(ph(t, T_JUMP, T_JUMP + 0.14)));
        else {
          l = { ...LAND };
          const imp = Math.exp(-(t - T_DOWN) / 0.1);
          if (l.hips) l.hips = [l.hips[0], l.hips[1] - 0.06 * imp, l.hips[2]];
        }
        return { pos, yaw, limbs: l, expr: { angry: 0.6 }, float: 0 };
      }
      // 跪下，从左靴里抽出一块砖，递到他手里
      const kneel: Limbs = {
        hips: [0, -0.47, 0.02],
        hipsRot: [0.1, 0, 0],
        spine: [0.26, 0, 0],
        look: [-0.3, 0, 0],
        footL: [-0.14, 0.1, 0.32],
        kneeL: [-0.14, H, 1.2],
        footR: [0.12, 0.1, -0.5],
        kneeR: [0.12, -0.2, 0.6],
        toeR: 0.9,
      };
      const kk = E.io(ph(t, T_DOWN + 0.3, 6.75));
      const base = mixLimbs({ hips: [0, -0.3, 0.06], hipsRot: [0.3, 0, 0], spine: [0.3, 0, 0], look: [0.1, 0, 0], footL: [-0.2, 0.1, 0.1], footR: [0.19, 0.1, -0.06], handL: [-0.3, H - 0.2, 0.2], handR: [0.22, H - 0.15, 0.2] }, kneel, kk);
      // 手：左手伸进左靴（靴口在左膝旁边），抽出砖，两只手捧着往前送
      const bootTop: [number, number, number] = [-0.16, 0.5, 0.35];
      const front: [number, number, number] = [-0.02, H - 0.2, 0.5];
      const give: [number, number, number] = [-0.02, H - 0.16, 0.62];
      const reachK = E.io(ph(t, 6.45, 6.8));
      const pullK = E.io(ph(t, 6.85, 7.15));
      const giveK = E.soft(ph(t, 7.05, T_GIVE));
      let handL: [number, number, number] = [-0.3, H - 0.2, 0.2];
      handL = lerp3(handL, bootTop, reachK);
      handL = lerp3(handL, front, pullK);
      handL = lerp3(handL, give, giveK);
      const handR: [number, number, number] = lerp3([0.22, H - 0.15, 0.2], [0.07, give[1] - 0.02, give[2]], E.io(ph(t, 6.95, T_GIVE)));
      const stand = E.io(ph(t, 8.45, 8.9));
      const l: Limbs = {
        ...base,
        handL,
        handR,
        elbowL: [-0.5, H - 0.3, 0.0],
        elbowR: [0.5, H - 0.3, 0.0],
        wristL: [0, 0, lerp(0, 0.6, pullK)],
        wristR: [0, 0, -0.5 * giveK],
        fingersL: t < 6.9 ? lerp(0.2, 0.75, reachK) : lerp(0.75, 0.4, giveK),
        fingersR: 0.4,
        look: t < 7.6 ? [-0.32, 0.05, 0] : [-0.12, -0.1, 0.05],
      };
      // 站起来（8.45–8.9）：脚跟离地了一下
      const up: Limbs = { spine: [-0.04, 0, 0], look: [-0.1, -0.15, 0], handL: [-0.21, H - 0.14, 0.05], handR: [0.21, H - 0.14, 0.05], toeL: 0, toeR: 0 };
      const lift = Math.sin(Math.PI * ph(t, 8.6, 8.95)) * 0.06;
      const ll = mixLimbs(l, up, stand);
      if (stand > 0.9 && lift > 0) {
        ll.footL = [-0.1, 0.1 + lift, 0.02];
        ll.footR = [0.1, 0.1 + lift, 0.02];
        ll.toeL = 0.35 * lift * 10;
        ll.toeR = 0.35 * lift * 10;
      }
      const smile = ph(t, 8.2, 8.5);
      return { pos: HER.clone().add(new THREE.Vector3(0, lift, 0)), yaw: -Math.PI / 2 + 0.15, limbs: ll, expr: { fun: 0.8 * smile, sorrow: 0.15 * (1 - smile) }, float: 0 };
    };
    const lerp3 = (a: [number, number, number], b: [number, number, number], k: number): [number, number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    const poseCt = (t: number) => {
      const h = herAt(t);
      pc.reset();
      pc.place(h.pos, h.yaw);
      apply(pc, h.limbs);
      express(ct.model, h.expr);
      ct.update(t, { float: h.float });
    };

    // ================================================================ 周磊
    // 公文包离手的时刻：按手的高度和重力反推（迭代两次，手的高度又取决于时刻）
    let T_DROP = T_SLAM - 0.8;
    for (let i = 0; i < 3; i++) {
      pz.reset();
      floatPoseRaw(T_DROP);
      const hy = pz.at("rightHand").y - 0.2 - 0.145;
      T_DROP = T_SLAM - Math.sqrt((2 * hy) / G);
    }
    function floatPoseRaw(t: number, open = 0) {
      const bob = Math.sin(t * 1.4) * 0.03 + RISE * (t - 2);
      pz.place(ZL.clone().add(new THREE.Vector3(0, bob, 0)), 0.35);
      pz.hips([0, 0, 0], [0.16, 0.04, 0.05]);
      pz.spine(0.32, -0.05, 0.06);
      pz.look([-0.6, 0.08, 0.08]);
      const Hz = pz.hipHeight;
      pz.arm("L", pz.local(-0.36, Hz - 0.02, 0.2), pz.local(-0.7, Hz + 0.1, -0.4));
      pz.arm("R", pz.local(0.32, Hz - 0.08, 0.16), pz.local(0.7, Hz + 0.1, -0.4));
      pz.wrist("L", [0, 0, 0.35]);
      pz.fingers("L", 0.35);
      pz.fingers("R", lerp(0.85, 0.15, open));
      pz.leg("L", pz.local(-0.15, 0.1, 0.12), pz.local(-0.2, 0.6, 1), -0.55);
      pz.leg("R", pz.local(0.1, 0.24, -0.1), pz.local(0.2, 0.6, 1), -0.75);
    }
    const floatPose = (t: number) => floatPoseRaw(t, ph(t, T_DROP - 0.12, T_DROP + 0.05));
    const posePz = (t: number) => {
      pz.reset();
      if (t < T_CATCH) {
        floatPose(t);
        express(zl.model, { sorrow: 0.75 });
        return;
      }
      // 被抓住脚踝：他的左脚踝在她右手里（先摆一遍量出脚踝在哪，再整个人挪过去）；她落地以后被拽下来，6.26 膝盖着地
      const Hz = pz.hipHeight;
      if (t < T_KNEES) {
        const hanging = (tt: number) => {
          poseCt(tt);
          const hand = pc.at("rightHand");
          const yaw = lerp(0.35, Math.PI / 2, E.io(ph(tt, T_CATCH, T_KNEES)));
          const doPose = (pos: THREE.Vector3) => {
            pz.reset();
            pz.place(pos, yaw);
            pz.hips([0, 0, 0], [0.05, 0, 0]);
            pz.spine(0.05, 0, 0);
            pz.look([-0.45, 0, 0]);
            pz.leg("L", pz.local(-0.12, 0.08, 0.0), pz.local(-0.12, 0.6, 1), -0.3);
            pz.leg("R", pz.local(0.14, 0.32, -0.1), pz.local(0.14, 0.6, 1), -0.6);
            pz.arm("L", pz.local(-0.42, Hz + 0.25, 0.05), pz.local(-0.7, Hz, -0.3));
            pz.arm("R", pz.local(0.42, Hz + 0.25, 0.05), pz.local(0.7, Hz, -0.3));
            pz.fingers("L", 0.3);
            pz.fingers("R", 0.3);
          };
          const guess = hand.clone().add(new THREE.Vector3(0, -0.12, 0));
          doPose(guess);
          const ank = pz.at("leftFoot");
          guess.add(hand.clone().sub(ank).add(new THREE.Vector3(0, -0.03, 0)));
          doPose(guess);
          return guess;
        };
        if (t < T_DOWN) {
          hanging(t);
        } else {
          // 被往下拽：从落地那一刻挂着的位置，越拽越快，跪到她面前
          const from = hanging(T_DOWN);
          const k = E.in2(ph(t, T_DOWN, T_KNEES));
          pz.reset();
          pz.place(from.clone().lerp(HIM, k), lerp(lerp(0.35, Math.PI / 2, E.io(ph(T_DOWN, T_CATCH, T_KNEES))), Math.PI / 2, k));
          pz.hips([0, lerp(0, -0.52, k), 0], [lerp(0.05, 0.25, k), 0, 0]);
          pz.spine(lerp(0.05, 0.3, k), 0, 0);
          pz.look([lerp(-0.45, 0.1, k), 0, 0]);
          pz.leg("L", pz.local(-0.12, lerp(0.08, 0.1, k), lerp(0, -0.5, k)), pz.local(-0.12, -0.1, 1), lerp(-0.3, 1.0, k));
          pz.leg("R", pz.local(0.12, lerp(0.32, 0.1, k), lerp(-0.1, -0.5, k)), pz.local(0.12, -0.1, 1), lerp(-0.6, 1.0, k));
          pz.arm("L", pz.local(-0.38, lerp(Hz + 0.25, Hz - 0.2, k), 0.12), pz.local(-0.7, Hz, -0.3));
          pz.arm("R", pz.local(0.38, lerp(Hz + 0.25, Hz - 0.2, k), 0.12), pz.local(0.7, Hz, -0.3));
          pz.fingers("L", 0.3);
          pz.fingers("R", 0.3);
        }
        express(zl.model, { surprised: 0.75 });
        return;
      }
      // 跪着：手慢慢摊开接砖；接住以后手一坠；看砖，再抬头看她，哭着笑
      pz.place(HIM, Math.PI / 2);
      const settle = Math.exp(-(t - T_KNEES) / 0.12);
      pz.hips([0, -0.52 - 0.04 * settle, 0], [0.22, 0, 0]);
      pz.spine(0.3, 0, 0);
      const open = E.io(ph(t, 6.9, 7.35));
      const got = t >= T_GIVE ? 1 : 0;
      const dip = t >= T_GIVE ? Math.exp(-(t - T_GIVE) / 0.18) * Math.sin((t - T_GIVE) * 18) * 0.03 + 0.05 * (1 - Math.exp(-(t - T_GIVE) / 0.08)) : 0;
      const handY = lerp(Hz - 0.5, Hz - 0.3, open) - dip;
      pz.leg("L", pz.local(-0.12, 0.1, -0.5), pz.local(-0.12, -0.1, 1), 1.0);
      pz.leg("R", pz.local(0.12, 0.1, -0.5), pz.local(0.12, -0.1, 1), 1.0);
      pz.arm("L", pz.local(-0.07, handY, lerp(0.25, 0.36, open)), pz.local(-0.5, Hz - 0.5, 0));
      pz.arm("R", pz.local(0.07, handY, lerp(0.25, 0.36, open)), pz.local(0.5, Hz - 0.5, 0));
      pz.wrist("L", [0, 0, lerp(0.2, 0.9, open)]);
      pz.wrist("R", [0, 0, lerp(-0.2, -0.9, open)]);
      pz.fingers("L", lerp(0.4, 0.15, open) + 0.3 * got);
      pz.fingers("R", lerp(0.4, 0.15, open) + 0.3 * got);
      // 看：先看她手里的砖，接住以后低头看砖，7.95 抬头看她
      const lookUp = E.io(ph(t, 7.85, 8.15));
      pz.look([lerp(-0.45, 0.25, lookUp), lerp(0, -0.15, lookUp), 0]);
      const cry = ph(t, T_GIVE, 7.9);
      const laugh = ph(t, 8.0, 8.3);
      express(zl.model, { surprised: 0.6 * (1 - cry), sorrow: 0.7 * cry, joy: 0.55 * laugh });
    };
    /** 公文包：先在他右手里，松手以后按重力掉（落地正好在 T_SLAM），之后躺在地上 */
    let dropFrom: THREE.Vector3 | null = null;
    const placeBag = (t: number) => {
      if (t < T_DROP) {
        pz.reset();
        floatPose(t);
        bag.position.copy(pz.at("rightHand")).add(new THREE.Vector3(0, -0.2, 0));
        bag.rotation.set(0, 0.1, 0.05);
        return bag.position;
      }
      if (!dropFrom) {
        pz.reset();
        floatPose(T_DROP);
        dropFrom = pz.at("rightHand").add(new THREE.Vector3(0, -0.2, 0));
      }
      const dt = Math.min(t - T_DROP, T_SLAM - T_DROP);
      const h = dropFrom.y - 0.145;
      const g = (2 * h) / Math.pow(T_SLAM - T_DROP, 2);
      bag.position.set(dropFrom.x + 0.05 * dt, Math.max(0.145, dropFrom.y - 0.5 * g * dt * dt), dropFrom.z + 0.12 * dt);
      const lie = t >= T_SLAM ? 1 : 0;
      bag.rotation.set(0.6 * dt + lie * 0.0, 0.1 + 0.4 * dt, 0.05 + 1.2 * dt);
      if (t >= T_SLAM) {
        // 落地以后倒下躺平
        const k = E.out2(ph(t, T_SLAM, T_SLAM + 0.25));
        bag.rotation.set(lerp(0.6 * dt, Math.PI / 2, k), 0.1 + 0.4 * dt, lerp(0.05 + 1.2 * dt, 0.3, k));
        bag.position.y = lerp(0.145, 0.05, k);
      }
      return bag.position;
    };
    /** 她手里的砖：抽出来以前在靴子里（显示靴子里那块），之后跟着左手，7.45 落进他手里 */
    const placeBrick = (t: number) => {
      const out = t >= 6.85;
      handBrick.visible = !out;
      brick.visible = out;
      if (!out) return;
      if (t < T_GIVE) {
        const hand = pc.at("leftHand");
        brick.position.copy(hand).add(new THREE.Vector3(0, -0.02, 0));
        const flat = E.io(ph(t, 7.05, 7.4));
        brick.rotation.set(lerp(0, -Math.PI / 2 + 0.25, flat), -Math.PI / 2 + 0.15, 0);
      } else {
        const l = pz.at("leftHand"), r = pz.at("rightHand");
        brick.position.copy(l).lerp(r, 0.5).add(new THREE.Vector3(0.02, 0.035, 0));
        brick.rotation.set(-Math.PI / 2 + 0.25, -Math.PI / 2 + 0.15, 0);
      }
    };

    // ================================================================ 镜头
    posePw(0);
    const S0 = shot(pw.at("upperChest"), 0.5, 0.36, 2.9, 0, 0.13, -0.03, 40);
    const S_PUSH = { ...S0, fh: S0.fh * 0.97 };
    const S_BACK = { ...S_PUSH, fh: S_PUSH.fh * 1.25, roll: 0 };
    pz.reset();
    floatPose(T_LAND);
    const zChest = pz.at("upperChest");
    const S_ZL = shot(zChest, 0.56, 0.4, 7.2, 1.0, 0.24, 0, 42);
    const S_ZL2 = { ...S_ZL, fh: 6.0 };
    const fall = (u: number) => (u < 0.55 ? 0.62 * Math.pow(u / 0.55, 2) : 0.62 + 0.38 * E.out3((u - 0.55) / 0.45));
    // 铁靴砸下来的取景：正对街边（yaw 0.3），靴子在画面中下
    const S_BOOT = shot(SLAM.clone().add(new THREE.Vector3(-0.3, 0.3, 0)), 0.5, 0.66, 2.6, 0.3, -0.04, 0, 42);
    // 抬上去：机位放低，从她身后斜着往上看——她在下面仰着头，他在头顶（两个人同框）
    const S_UP = shot(new THREE.Vector3(40.25, 2.05, -4.45), 0.5, 0.56, 3.7, 0.18, 0.32, 0, 46);
    const S_CROUCH = { ...S_UP, fh: S_UP.fh * 0.965 };
    const camAt = (t: number): Shot => {
      if (t < T_BURN) return mixShot(S0, S_PUSH, E.smooth(t / T_BURN));
      if (t < T_FALL0) return mixShot(S_PUSH, S_BACK, E.out3(ph(t, T_BURN, T_BURN + 0.55)));
      if (t < T_LAND + 0.3) {
        const u = ph(t, T_FALL0, T_LAND);
        const k = fall(u);
        const s = mixShot(S_BACK, S_ZL, k);
        s.fh *= Math.exp(1.1 * Math.sin(Math.PI * Math.min(1, k)));
        s.P.y += t < T_LAND ? 0.35 * k * k : 0.35 * (1 - E.out3(ph(t, T_LAND, T_LAND + 0.3)));
        return s;
      }
      if (t < T_DROP) return mixShot(S_ZL, S_ZL2, (t - T_LAND - 0.3) / (T_DROP - T_LAND - 0.3));
      if (t < T_SLAM) {
        // 跟着公文包往下坠，一路转到正对街边
        const u = ph(t, T_DROP, T_SLAM);
        const follow = shot(placeBag(t).clone(), 0.5, 0.6, 3.4, lerp(1.0, 0.3, E.io(u)), lerp(0.2, -0.04, u), 0, 42);
        const s = mixShot(S_ZL2, follow, E.in2(u) * 0.8 + 0.2 * u);
        return mixShot(s, S_BOOT, E.in3(u) * 0.6);
      }
      if (t < 4.15) return S_BOOT;
      if (t < 4.85) return mixShot(S_BOOT, S_UP, E.soft(ph(t, 4.15, 4.85)));
      if (t < T_JUMP) return mixShot(S_UP, S_CROUCH, E.io(ph(t, 4.85, T_JUMP)));
      if (t < T_DOWN + 0.3) {
        // 跟着两个人（比人慢 0.06 秒）
        poseCt(t - 0.06);
        const mid = pc.at("head").lerp(pz.at("hips"), 0.45);
        poseCt(t);
        const follow = shot(mid, 0.5, 0.48, 4.9, 0.2, 0.1, 0, 42);
        const s = mixShot(S_CROUCH, follow, E.io(ph(t, T_JUMP, T_JUMP + 0.3)));
        // 落地：往下一沉、推近 5%
        const d = t >= T_DOWN ? 1 - Math.exp(-(t - T_DOWN) / 0.08) : 0;
        s.P.y -= 0.18 * d * Math.exp(-(t - T_DOWN) / 0.5);
        s.fh *= 1 - 0.05 * d;
        return s;
      }
      // 情绪运镜递砖（不切）：落到她的靴子 → 跟着砖往上、递进他手里 → 从砖慢慢抬到他的脸（越推越慢）→ 往后舒一口气看见她笑
      const landShot = (() => {
        poseCt(T_DOWN + 0.3);
        posePz(T_DOWN + 0.3);
        return shot(pc.at("head").lerp(pz.at("hips"), 0.45), 0.5, 0.48, 4.0, 0.18, 0.1, 0, 46);
      })();
      poseCt(t);
      posePz(t);
      const ankle = pc.at("leftFoot"), knee = pc.at("leftLowerLeg");
      const bootTop = ankle.clone().lerp(knee, 0.8);
      const bootShot = shot(bootTop, 0.5, 0.55, 1.15, 0.4, -0.22, 0, 40);
      if (t < 6.85) return mixShot(landShot, bootShot, E.soft(ph(t, T_DOWN + 0.3, 6.85)));
      placeBrick(t);
      const bp = brick.position.clone();
      if (t < T_GIVE) {
        const k = E.io(ph(t, 6.85, T_GIVE));
        const s = shot(bp, 0.5, 0.55, lerp(1.15, 1.3, k), lerp(0.4, 1.05, k), lerp(-0.22, -0.06, k), 0, 40);
        return mixShot(bootShot, s, E.out2(ph(t, 6.85, 7.0)));
      }
      const head = pz.at("head");
      const up = E.io(ph(t, 7.7, 8.25));
      const toFace = shot(bp.clone().lerp(head, up), 0.5, lerp(0.55, 0.46, up), lerp(1.3, 0.98, E.out3(ph(t, T_GIVE, 8.35))), 1.05, lerp(-0.06, 0.02, up), 0, 40);
      if (t < 8.35) return toFace;
      const mid = head.clone().lerp(pc.at("head"), 0.5);
      const exhale = shot(mid, 0.5, 0.5, 2.5, 0.55, 0.0, 0, 42);
      return mixShot(toFace, exhale, E.soft(ph(t, 8.35, 8.95)));
    };
    const tmpCam = new THREE.PerspectiveCamera();
    const camY = (sh: Shot) => {
      applyShot(tmpCam, sh, stage.aspect);
      return tmpCam.position.y;
    };
    let captured = false;

    return (t: number) => {
      let blurY = 0;
      if ((t > T_FALL0 && t < T_LAND + 0.25) || (t > T_DROP && t < T_SLAM)) {
        const s0 = camAt(t - 1 / 30), s1 = camAt(t);
        blurY = Math.min(260, (Math.abs(camY(s1) - camY(s0)) / s1.fh) * stage.height * 0.5);
      }
      // ---- 开场的女人
      woman.model.root.visible = t < T_BURN + 0.56;
      if (woman.model.root.visible) posePw(Math.min(t, T_BURN + 0.6));
      dis.uDisTime.value = t * 1.5;
      dis.uCut.value = t >= T_BURN ? lerp(WOMAN.y + 2.7, WOMAN.y - 0.25, E.in2(ph(t, T_BURN, T_BURN + 0.5))) : 1e6;
      if (t >= T_BURN - 0.001 && !captured) {
        posePw(T_BURN);
        spark.capture(woman.model, T_BURN, 0.5);
        captured = true;
        posePw(Math.min(t, T_BURN + 0.6));
      }
      // ---- 街上
      ct.model.root.visible = t > 3.3;
      placeBag(t);
      if (ct.model.root.visible) poseCt(t);
      posePz(t);
      if (ct.model.root.visible) placeBrick(t);
      else brick.visible = false;
      // 裂纹和一圈灰：4.013 一下，6.013 一下（更重）
      crack1.update(t - T_SLAM, SLAM.clone().add(new THREE.Vector3(-0.1, 0.012, 0.05)));
      dust1.update(t - T_SLAM, SLAM);
      crack2.update(t - T_DOWN, HER.clone().add(new THREE.Vector3(0, 0.014, 0)));
      dust2.update(t - T_DOWN, HER);
      // ---- 镜头
      const s = camAt(t);
      s.fh *= 1 - kick(t, T_LAND, 0.02, 0.12);
      // 砸地：抖（4.013 轻一点，6.013 重）
      const sh1 = shake(t, 0.04 * kick(t, T_SLAM, 1, 0.09), 22, 3);
      const sh2 = shake(t, 0.07 * kick(t, T_DOWN, 1, 0.12), 20, 7);
      s.P.x += sh1.x + sh2.x;
      s.P.y += sh1.y + sh2.y;
      applyShot(stage.camera, s, stage.aspect);
      // ---- 特效
      spark.update(t, stage.height * 0.9);
      if (woman.model.root.visible) rings.update(t - T_BURN, stage.camera, pw.at("upperChest"));
      else rings.update(t - T_BURN, stage.camera, rings.mesh.position);
      const hb = pw.bone("head");
      hb.updateMatrixWorld(true);
      const eyes = [new THREE.Vector3(0.045, 0.06, -0.07), new THREE.Vector3(-0.045, 0.06, -0.07)].map((v) => hb.localToWorld(v));
      tears.update(t, eyes, new THREE.Vector3(0, 1, 0), woman.model.root.visible && t < T_BURN + 0.1 ? 1 : 0);
      // ---- 光：碰到白的一闪；砖落进他手里那一下暖光涌上来，暗角松开
      const flash = t >= T_BURN ? 0.3 * Math.exp(-(t - T_BURN) / 0.14) : 0;
      const warm = clamp01((t - T_GIVE) / 0.5) * (1 - clamp01((t - 9.2) / 0.8));
      stage.draw(
        t,
        {
          flash,
          flashColor: "#fff6ea",
          blur: [0, blurY],
          bloom: 0.6 + 0.4 * clamp01(1 - (t - 1)) + 0.25 * warm,
          tint: "#ffd9a8",
          tintK: 0.18 * warm,
          vig: 0.22 - 0.1 * warm,
        },
        (ctx, S) => {
          const a = 1 - ph(t, 2.6, 3.0);
          filmText(ctx, S, ["这里的人，一绝望就会飘起来", "飘进天上的强光，就会化成灰"], stage.width / 2 / S, (stage.height * 0.74) / S, { size: 50, alpha: a });
          // 4.55 起：城里都说，她是最沉的人（镜头抬过周磊以后再上）
          const b = ph(t, 4.55, 5.0) * (1 - ph(t, 12.4, 12.9));
          filmText(ctx, S, ["城里都说，", "她是最沉的人"], stage.width / 2 / S, (stage.height * 0.16) / S, { size: 52, alpha: b });
        },
      );
    };
  });
}
