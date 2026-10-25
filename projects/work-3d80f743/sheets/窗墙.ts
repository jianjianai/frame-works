// 检查页（不在时间轴上）：主歌二①–④ 屋里对着窗那面墙（lib/winwall.ts）。0 正着看　1 倒着看（她的世界）　2 正着退远一点（看得见地上）
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import type { Cam } from "../lib/cam";
import { makeGrain, prepareCity, setDusk } from "../lib/world";
import { loadHandFont } from "../lib/note";
import { drawWinwall } from "../lib/winwall";

export const sample: Sample = { duration: 3 };

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  return {
    canvas,
    render(time) {
      const shot = Math.max(0, Math.min(2, Math.floor(time)));
      const cams: Cam[] = [
        { x: 560, y: 900, z: 1.25, r: 0 },
        { x: 560, y: 900, z: 1.25, r: Math.PI },
        { x: 560, y: 1250, z: 0.85, r: 0 },
      ];
      setDusk(1, 1);
      try {
        drawWinwall(ctx, base, grain, cams[shot], 72.5);
      } finally {
        setDusk(0);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
