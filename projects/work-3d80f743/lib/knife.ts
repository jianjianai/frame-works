// 妈妈那把小折刀（副歌一她割断红绳的那把；主歌二沉沉坐在窗框上攥着的也是它，lib/sill.ts）。副歌一的人和东西在 lib/mother.ts。

import { INK } from "./world";

/** 那把小折刀：木柄、一截亮的刀刃（在她手心里；割断以后脱手，翻着掉到街上） */
export function drawKnife(g: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.lineJoin = "round";
  g.fillStyle = "#8a5a3c";
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  g.beginPath();
  g.roundRect(-30, -6, 34, 12, 4);
  g.fill();
  g.stroke();
  g.fillStyle = "#e9edf2";
  g.beginPath();
  g.moveTo(4, -5);
  g.lineTo(38, -2);
  g.lineTo(44, 2);
  g.lineTo(4, 5);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}
