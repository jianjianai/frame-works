// 间奏里被她拽下来的两个人（lib/grow.ts）：高潮的人链里会回来（lib/link.ts），穿出场时的衣服。单独放一个文件，五③不用把间奏那一整套加载进来。

import { CAST, type CastSpec } from "@materials/剪纸角色/code/cast";

export const STUDENT: CastSpec = {
  name: "扎马尾的女学生",
  scale: 0.9,
  colors: { ...CAST.年轻人.colors, top: "#bcd5ec", topShade: "#a6c2dd", bottom: "#3f4a6b", bottomShade: "#353e5a" },
  collar: true,
  hair: "ponytail",
  hairColor: "#2f2e33",
  shoes: { color: "#f2efe8", shade: "#ddd8ce", sole: "#e8e2d6", style: "sneaker", sock: "#f2efe8" },
};
export const UNCLE: CastSpec = {
  name: "戴眼镜的大叔",
  scale: 1.04,
  width: 1.08,
  colors: { ...CAST.周磊.colors, top: "#d9d3c6", topShade: "#c9c2b3", bottom: "#4b4340", bottomShade: "#3f3835" },
  collar: false,
  hair: "short",
  hairColor: "#3a3539",
  glasses: "#3a3539",
  coat: { color: "#8b6b4f", shade: "#76593f", size: 1.02 },
  shoes: { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
};
