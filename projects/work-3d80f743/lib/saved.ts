// 间奏里被她拽下来的两个人（lib/grow.ts）：高潮的人链里会回来（lib/link.ts），穿出场时的衣服。单独放一个文件，五③不用把间奏那一整套加载进来。

import { CAST, type CastSpec } from "@materials/剪纸角色/code/cast";
import { ZHOULEI_FACE0, ZHOULEI_FACE3 } from "@materials/剪纸角色/code/cast-face-art";

/** 扎马尾的女学生：高马尾、碎刘海，浅蓝的运动校服（白色立领、拉链、袖子上两道白杠） */
export const STUDENT: CastSpec = {
  name: "扎马尾的女学生",
  scale: 0.9,
  // 骨架、头的大小和主角一样，只按 scale 缩放；脸是主角的（年轻的女孩）
  colors: { ...CAST.年轻人.colors, top: "#bcd5ec", topShade: "#a6c2dd", bottom: "#3f4a6b", bottomShade: "#353e5a" },
  hair: "highpony",
  hairColor: "#2f2e33",
  hairTie: "#e06c7a",
  top: { kind: "polo", trim: "#f7f5f0" },
  brows: { kind: "soft", color: "#2f2e33" },
  shoes: { color: "#f2efe8", shade: "#ddd8ce", sole: "#e8e2d6", style: "sneaker", sock: "#f2efe8" },
};
/** 戴眼镜的大叔：方框眼镜，棕色夹克（翻领、拉链、胸袋）里面一件衬衫，西裤 */
export const UNCLE: CastSpec = {
  name: "戴眼镜的大叔",
  scale: 1.04,
  // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图「男人」描的（周磊的脸）
  face0: ZHOULEI_FACE0,
  face3: ZHOULEI_FACE3,
  colors: { ...CAST.周磊.colors, top: "#d9d3c6", topShade: "#c9c2b3", bottom: "#4b4340", bottomShade: "#3f3835" },
  hair: "short",
  hairColor: "#3a3539",
  glasses: "#3a3539",
  glassesShape: "square",
  top: { kind: "shirt" },
  coat: { kind: "jacket", color: "#8b6b4f", shade: "#76593f", size: 1.02, trim: "#6e533b" },
  brows: { kind: "thick", color: "#3a3539" },
  pants: { crease: true },
  shoes: { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
};
