// 开场光里的女人（第一个镜头，留人的关键；用户 2026-10-19：「这个人建模需要好一点，漂亮一点」）：
// 衣服是平常的上衣和裤子（用户：「正常衣服和裤子就好，裙子需要有风和失重效果，难画」）——米白的上衣外面一件浅玫瑰色的长开衫
// （素材库 cast-wear 的 cardigan：门襟一条罗纹边和一排小白扣子、罗纹下摆和袖口、袋口罗纹的小贴袋）、浅蓝的裤子、白色的帆布鞋（素材库的 sneaker，露出脚踝；光脚时脚趾画出来像爪子，不好看）；
// 头发借主角秤砣那套（用户亲手定过稿的线稿，风里、失重的样子都调到用户说「完美」），换成暖棕色：她在失重里头发像在水里一样漂起来；
// 耳边一朵小白花。颜色、衣服、花和主角都不一样，认得出不是一个人。只写外观（Look），不改素材库。

import { type CastSpec, castLook } from "@materials/剪纸角色/code/cast";
import { CHENGTUO, COLORS } from "@materials/剪纸角色/code/chengtuo-draw";
import type { HeadView, Look, Rig } from "@materials/剪纸角色/code/figure";
import type { Ink } from "@materials/剪纸角色/code/rig";

const HAIR = { hair: "#61402f", hairShade: "#4c3125", hairHi: "#7d5747" };

/** 用秤砣的头发画法，临时换成她的发色（画完换回来） */
function withHair<T>(fn: () => T): T {
  const keep = { hair: COLORS.hair, hairShade: COLORS.hairShade, hairHi: COLORS.hairHi };
  Object.assign(COLORS, HAIR);
  try {
    return fn();
  } finally {
    Object.assign(COLORS, keep);
  }
}

function backHair(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink) {
  withHair(() => CHENGTUO.backHair?.(ctx, rig, ink));
}

function frontHair(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink) {
  withHair(() => CHENGTUO.frontHair?.(ctx, h, ink));
  // 耳边一朵小白花（五片花瓣、鹅黄的芯）
  const f = h.place([-40, -30]);
  const pr = 6.5;
  ctx.lineWidth = ink.lw * 0.55;
  ctx.strokeStyle = ink.line;
  for (let k = 0; k < 5; k++) {
    const ang = (k / 5) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.arc(f[0] + Math.cos(ang) * pr, f[1] + Math.sin(ang) * pr, pr * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = "#fffaf4";
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(f[0], f[1], pr * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "#f4cf6a";
  ctx.fill();
  ctx.stroke();
}

/** 衣服：米白的上衣、浅玫瑰色的长开衫、浅蓝的裤子、白色帆布鞋（头发自己画） */
const SPEC: CastSpec = {
  name: "光里的女人",
  scale: 0.98,
  colors: {
    skin: "#fde5d6",
    skinShade: "#f2cbb6",
    blush: "245,150,160",
    top: "#f7f0e6",
    topShade: "#e9dfd1",
    bottom: "#a9bcd8",
    bottomShade: "#93a7c6",
  },
  hair: "none",
  hairColor: HAIR.hair,
  coat: { kind: "cardigan", color: "#eaaeab", shade: "#d89896", long: 46, trim: "#e09f9c", button: "#fffaf4" },
  shoes: { color: "#fbf8f3", shade: "#e6e0d6", sole: "#f1ebe1", style: "sneaker" },
};
const BASE = castLook(SPEC);

export const WOMAN_LOOK: Look = { ...BASE, backHair, frontHair };

/** 她的身高（相对秤砣） */
export const WOMAN_SCALE = SPEC.scale;
