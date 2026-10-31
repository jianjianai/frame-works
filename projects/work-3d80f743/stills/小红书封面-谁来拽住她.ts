// 小红书封面 3:4 的第三张，和 小红书封面.ts、小红书封面-最沉.ts 三张 PK（比点击率）。
// 打法：提问 + 情绪。字是抖音的标题「她拽住了全城飘起来的人 / 可谁来拽住她？」：前半句交代她是做什么的，后半句把好奇心
// 放到她自己身上；画面是 0:37.45 夜里的楼顶，千斤抱着砖、她搂着千斤，两个人闭着眼哭着笑，中间那块「活下去」亮着暖光——
// 她在拽住别人，自己也在哭，正好接上「可谁来拽住她？」。两张脸是三张里最大的（第一张是全身的动作，第二张是她一个人飘起来）。
// 不剧透（前半段）。竖屏成片放大 1.15 倍，头顶上那片夜里的天放字。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, loadFont, shot } from "./抖音封面画法";
import { bloom, type Doc, filmFrame, nightLine } from "./小红书封面画法";

export const still: Still = { width: 1080, height: 1440 };

/** 两个人都闭着眼哭着笑、砖刚亮起来（设计坐标：头顶 y 530、两张脸 430,770 / 740,790，砖 x 410–660、y 1020–1090，
 *  千斤的鞋 x 160 起、y 到 1360；两个人横着占满了竖屏的宽） */
const T_GLOW = 37.45;
/** 封面 1 像素 = 设计的 1/Z；设计 (FX, FY) 落在封面中心：取设计 x 90–1030、y 266–1518（两张脸左右居中，她的大衣右边
 *  裁掉一点；下沿是千斤的鞋和红线，不留空的楼顶），头顶上留 290 放字 */
const Z = 1.15;
const FX = 560;
const FY = 892;

/** 砖在封面上的位置（亮光从这里散开） */
const BRICK: [number, number] = [540 + (535 - FX) * Z, 720 + (1055 - FY) * Z];

/** 夜里的调子：四周压进深紫，顶上再暗一点托住字；砖那里再亮一层暖光，整张画面的光从砖上来 */
function grade(g: CanvasRenderingContext2D) {
  g.save();
  g.translate(520, 780);
  g.scale(1, 1.3);
  const edge = g.createRadialGradient(0, 0, 380, 0, 0, 760);
  edge.addColorStop(0, "rgba(28,20,44,0)");
  edge.addColorStop(0.6, "rgba(28,20,44,0.38)");
  edge.addColorStop(1, "rgba(28,20,44,0.85)");
  g.fillStyle = edge;
  g.fillRect(-1000, -1000, 2000, 2000);
  g.restore();
  const top = g.createLinearGradient(0, 0, 0, 340);
  top.addColorStop(0, "rgba(24,16,36,0.85)");
  top.addColorStop(0.55, "rgba(24,16,36,0.45)");
  top.addColorStop(1, "rgba(24,16,36,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1080, 340);
  g.save();
  g.globalCompositeOperation = "screen";
  const glow = g.createRadialGradient(...BRICK, 0, ...BRICK, 260);
  glow.addColorStop(0, "rgba(255,200,120,0.22)");
  glow.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 1080, 1440);
  g.restore();
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  const k = options.width / 1080;
  const font = "cover" as const;
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      await loadFont(font);
      // 成片按封面需要的大小再密一点画（缩小时线条更干净）
      const q = 1.4 * Z * k;
      const main = (await import("../timelines/main/visual.json")).default as unknown as Doc;
      const frame = await filmFrame(options, main, 1080 * q, 1920 * q, T_GLOW, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(k, 0, 0, k, 0, 0);
      shot(g, frame, q, FX, FY, 540, 720, Z, [0, 0, 1080, 1440], "contrast(1.16)");
      bloom(g, k);
      grade(g);
      nightLine(g, k, FONTS[font].family, "她拽住了全城飘起来的人", "拽住", 540, 84, 60);
      nightLine(g, k, FONTS[font].family, "可谁来拽住她？", "拽住她", 540, 196, 120);
    })().catch((error) => {
      job = null;
      throw error;
    }));
  return {
    canvas,
    prepareFrame: (_time, { signal }) => draw(signal),
    render: () => draw(new AbortController().signal),
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
