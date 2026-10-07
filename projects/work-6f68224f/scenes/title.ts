import type { Scene, SceneOptions } from "../../../src/engine/types";
import project from "../project";

// 示例图层：按绝对时间绘制，可任意跳转。可以替换或删除。
export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return {
    canvas,
    render(time) {
      ctx.clearRect(0, 0, width, height);
      const rise = Math.min(1, time / 1.2);
      const eased = 1 - Math.pow(1 - rise, 3);
      ctx.fillStyle = "#e8edf2";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${Math.round(height * 0.09)}px system-ui, sans-serif`;
      ctx.globalAlpha = eased;
      ctx.fillText(project.title, width / 2, height / 2 + (1 - eased) * height * 0.04);
      ctx.globalAlpha = 1;
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
