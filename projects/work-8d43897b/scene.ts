/* All motion is a pure function of absolute film time. No RAF, media, or external assets. */
import { captions } from './captions';
type Mood = 'tired' | 'happy' | 'angry' | 'wonder' | 'blank' | 'calm' | 'resolve';
type HeroPose = { mood?: Mood; walk?: number; reach?: number; lean?: number; squash?: number; gaze?: number; cup?: number; stretch?: number; blink?: number; seated?: boolean; hand?: [number, number] };
const PI = Math.PI;
const TAU = PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => { p = clamp(p); return p * p * (3 - 2 * p); };
const ease = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
const back = (p: number) => { p = clamp(p) - 1; return 1 + 2.5 * p * p * p + 1.5 * p * p; };
const fract = (v: number) => v - Math.floor(v);
const hash = (v: number) => fract(Math.sin(v * 127.1 + 311.7) * 43758.5453123);

export function createScene({ width = 1080, height = 1920, quality = 'high' }: any) {
  const canvas = (typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(width, height)) as HTMLCanvasElement;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  if (!ctx) throw new Error('Canvas2D is required');
  const particleCount = quality === 'low' ? 25 : 56;
  let filmTime = 0;
  let subtitlesVisible = true;
  const C = { ink: '#050b19', blue: '#102039', cyan: '#65f8ef', gold: '#ffc969', cream: '#fff2cc', pink: '#fc77a6', mute: '#4f7185' };

  function rr(x: number, y: number, w: number, h: number, r = 12) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }
  function fillRound(x: number, y: number, w: number, h: number, r: number, color: string | CanvasGradient) {
    rr(x, y, w, h, r); ctx.fillStyle = color; ctx.fill();
  }
  function line(points: number[][], color: string, thickness = 2) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function ellipse(x: number, y: number, rx: number, ry: number, color: string | CanvasGradient) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = color; ctx.fill();
  }
  function glow(x: number, y: number, r: number, color: string, alpha = .4) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(.23, color + '80'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function shadow(x: number, y: number, rx: number, ry: number, alpha = .5) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(x, y, 2, x, y, rx); g.addColorStop(0, '#000915cc'); g.addColorStop(1, '#00091500');
    ellipse(x, y, rx, ry, g); ctx.restore();
  }
  function text(label: string, x: number, y: number, size = 18, color = C.cream) {
    ctx.font = `600 ${size}px "Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(label, x, y);
  }
  function star(x: number, y: number, size: number, color: string, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * PI / 4 - PI / 2; const r = i % 2 ? size * .31 : size; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function dust(t: number, warm = 0, force = 1) {
    ctx.save();
    for (let i = 0; i < particleCount; i++) {
      const x = (hash(i + 1) * 700 + Math.sin(t * .19 + i) * 15) % 700 - 80;
      const y = 100 + fract(hash(i + 100) + t * (.004 + hash(i + 9) * .006)) * 690;
      const a = (.07 + .12 * hash(i + 70)) * (.65 + .35 * Math.sin(t * .8 + i)) * force;
      ctx.globalAlpha = a; ellipse(x, y, 1 + 1.5 * hash(i + 80), 1 + 1.5 * hash(i + 80), warm > .5 ? C.gold : C.cyan);
    }
    ctx.restore();
  }
  function backdrop(_t: number, warmth = 0) {
    const g = ctx.createLinearGradient(0, 0, 500, 960); g.addColorStop(0, '#081425'); g.addColorStop(.55, warmth > .4 ? '#172033' : '#0b172a'); g.addColorStop(1, '#050b15');
    ctx.fillStyle = g; ctx.fillRect(-160, -160, 860, 1280);
    glow(420, 310, 340, warmth > .4 ? '#ffb94f' : '#2ea3bb', warmth > .4 ? .14 : .11);
    glow(80, 620, 300, '#154165', .13);
  }
  function orb(x: number, y: number, size = 9, strength = 1, gold = false) {
    const color = gold ? C.gold : C.cyan; glow(x, y, 48 * strength, color, .23 * strength);
    ellipse(x, y, size * strength, size * strength, gold ? '#ffe5a5' : '#c4ffff');
    ellipse(x - size * .25, y - size * .3, size * .25, size * .25, '#ffffff');
    ctx.save(); ctx.globalAlpha = .4 * strength; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, size * 1.7, -.6 + filmTime, 3.1 + filmTime); ctx.stroke(); ctx.restore();
  }
  function cup(x: number, y: number, s = 1, tilt = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-12, -30, 14, 0); g.addColorStop(0, '#d8f6f2'); g.addColorStop(.55, '#86bcc6'); g.addColorStop(1, '#34576c');
    ctx.beginPath(); ctx.moveTo(-15, -30); ctx.lineTo(15, -30); ctx.lineTo(11, 0); ctx.quadraticCurveTo(0, 5, -11, 0); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ellipse(0, -30, 15, 5, '#e5fcf4'); ellipse(0, -29, 11, 3, '#6198a8');
    line([[14, -24], [24, -22], [23, -8], [12, -8]], '#97c9cf', 4); line([[-9, -23], [-7, -5]], '#ffffff70', 2); ctx.restore();
  }
  function hero(x: number, y: number, s: number, pose: HeroPose = {}) {
    const { mood = 'calm', walk = 0, reach = 0, lean = 0, squash = 0, gaze = 0, cup: hasCup = 0, stretch = 0, blink = 0, seated = false, hand } = pose;
    shadow(x + 4, y + 3, 51 * s, 12 * s, .8);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const gait = Math.sin(walk), bob = Math.abs(gait) * Math.min(Math.abs(walk) > .001 ? 4 : 0, 4);
    ctx.translate(0, -bob); ctx.rotate(lean);
    const legL = seated ? -12 : gait * 14, legR = seated ? 9 : -gait * 14;
    line([[-18, -24], [-23 + legL * .45, -13], [-22 + legL, -2]], '#de9f49', 9);
    line([[18, -24], [23 + legR * .45, -13], [24 + legR, -2]], '#eab65b', 9);
    fillRound(-32 + legL, -8, 24, 13, 7, '#59bcc0'); fillRound(12 + legR, -8, 26, 13, 7, '#71e4d8');
    ctx.save(); ctx.translate(0, -22); ctx.scale(1 + squash * .15, 1 - squash * .13);
    // Rear arm remains visible against the body silhouette.
    const leftLift = stretch * -48 + (seated ? 2 : -gait * 6);
    line([[-33, -40], [-49 - stretch * 8, -26 + leftLift * .4], [-49 - stretch * 14, -13 + leftLift]], '#d59e4c', 9);
    ellipse(-49 - stretch * 14, -13 + leftLift, 6, 7, '#f6c876');
    const bg = ctx.createLinearGradient(-40, -82, 44, 2); bg.addColorStop(0, '#fff2b0'); bg.addColorStop(.42, '#ffce72'); bg.addColorStop(.78, '#e6a547'); bg.addColorStop(1, '#b97634');
    ctx.beginPath(); ctx.moveTo(-35, -58); ctx.bezierCurveTo(-34, -81, -18, -91, 1, -90); ctx.bezierCurveTo(25, -90, 37, -77, 39, -52); ctx.lineTo(41, -14); ctx.quadraticCurveTo(39, 8, 14, 11); ctx.lineTo(-11, 11); ctx.quadraticCurveTo(-39, 7, -39, -15); ctx.closePath(); ctx.fillStyle = bg; ctx.fill();
    ctx.save(); ctx.globalAlpha = .35; ctx.strokeStyle = '#fff3bc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-27, -47); ctx.bezierCurveTo(-28, -74, -16, -82, 3, -82); ctx.stroke(); ctx.restore();
    // A small asymmetric cyan fin distinguishes the original character.
    ctx.beginPath(); ctx.moveTo(25, -80); ctx.quadraticCurveTo(51, -92, 43, -63); ctx.quadraticCurveTo(35, -56, 34, -62); ctx.fillStyle = '#61ddd4'; ctx.fill();
    line([[29, -77], [37, -74]], '#c3fff0', 2);
    const eyeY = -52, eyeOpen = mood === 'tired' || mood === 'blank' ? .42 : 1;
    const blinking = blink > .86 ? .08 : eyeOpen;
    for (const ex of [-14, 15]) {
      ellipse(ex, eyeY, 8.5, 11 * blinking, '#fff3cb'); ellipse(ex + gaze * 2.6, eyeY + (mood === 'tired' ? 3 : 1), 4.6, 7 * blinking, '#172338');
      if (blinking > .6) ellipse(ex + gaze * 2.6 - 1, eyeY - 2, 1.5, 1.8, '#ffffff');
    }
    if (mood === 'angry') { line([[-23, -68], [-7, -63]], '#815b33', 3); line([[7, -63], [24, -68]], '#815b33', 3); }
    else if (mood === 'wonder') { line([[-23, -72], [-8, -76]], '#815b33', 2.5); line([[8, -76], [23, -72]], '#815b33', 2.5); }
    else if (mood === 'tired' || mood === 'blank') { line([[-23, -64], [-8, -66]], '#936b39', 2.2); line([[8, -66], [23, -64]], '#936b39', 2.2); }
    ctx.strokeStyle = '#704b31'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    if (mood === 'happy' || mood === 'calm') ctx.arc(1, -38, mood === 'happy' ? 11 : 7, .18, PI - .18);
    else if (mood === 'wonder') { ctx.ellipse(1, -32, 4, 6, 0, 0, TAU); }
    else if (mood === 'resolve') { ctx.moveTo(-5, -31); ctx.lineTo(8, -33); }
    else { ctx.moveTo(-7, -30); ctx.quadraticCurveTo(0, -34, 8, -30); } ctx.stroke();
    ctx.save(); ctx.globalAlpha = mood === 'happy' ? .34 : .16; ellipse(-26, -35, 9, 5, '#ef775a'); ellipse(28, -35, 9, 5, '#ef775a'); ctx.restore();
    const rightX = hand ? hand[0] : 45 + reach * 34 + stretch * 16 - hasCup * 36;
    const rightY = hand ? hand[1] : -14 - reach * 35 + hasCup * 8 - stretch * 50;
    line([[35, -40], [47 + reach * 17, -26 - reach * 18 - stretch * 30], [rightX, rightY]], '#f3bd65', 10);
    ellipse(rightX, rightY, 6.5, 7, '#ffe29a');
    if (hasCup > .01) cup(rightX + 1 - hasCup * 20, rightY + hasCup * 10, .76, -.2 - hasCup * .2);
    ctx.restore(); ctx.restore();
  }
  function clock(x: number, y: number, t: number, size = 1, amber = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size); shadow(0, 9, 47, 8, .5);
    const g = ctx.createLinearGradient(-41, -28, 41, 28); g.addColorStop(0, '#345466'); g.addColorStop(1, '#101d2c'); fillRound(-45, -27, 90, 54, 13, g);
    rr(-40, -22, 80, 43, 9); ctx.strokeStyle = '#7aacad55'; ctx.lineWidth = 1; ctx.stroke();
    const late = ease(t, 3.3, 6.2); text(late < .5 ? '22:10' : '23:10', 0, 1, 22, amber ? C.gold : '#99d6d4');
    ellipse(-27, -12, 1.2, 1.2, C.gold); ctx.restore();
  }
  function phone(x: number, y: number, w: number, h: number, power = 1, tilt = 0, faceDown = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); shadow(8, h / 2 + 10, w * .85, 15, .8);
    const shell = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); shell.addColorStop(0, '#4b5d6d'); shell.addColorStop(.2, '#19293a'); shell.addColorStop(1, '#050b16');
    fillRound(-w / 2, -h / 2, w, h, Math.min(24, w * .15), shell);
    rr(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3, Math.min(22, w * .14)); ctx.strokeStyle = '#91b1bd55'; ctx.lineWidth = 1.5; ctx.stroke();
    if (faceDown < .8) {
      const screen = ctx.createLinearGradient(0, -h / 2, 0, h / 2); screen.addColorStop(0, '#153643'); screen.addColorStop(.5, '#102c3f'); screen.addColorStop(1, '#092131');
      fillRound(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, Math.min(17, w * .12), screen);
      ctx.save(); rr(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, Math.min(17, w * .12)); ctx.clip();
      glow(0, -h * .1, w * .8, C.cyan, .15 * power);
      for (let i = 0; i < 5; i++) { const yy = -h * .35 + i * h * .18 + Math.sin(filmTime * .8 + i) * 2; line([[-w * .32, yy], [w * .32, yy - 12]], '#65f8ef20', 1); }
      if (power > .05) orb(0, -h * .06, Math.max(3, w * .08), power);
      ctx.restore(); fillRound(-w * .16, -h / 2 + 9, w * .32, 4, 3, '#030915');
    } else { ellipse(0, -h * .27, w * .10, w * .10, '#253b4e'); ellipse(0, -h * .27, w * .055, w * .055, '#547482'); }
    ctx.restore();
  }
  function room(t: number, warm = 0) {
    backdrop(t, warm);
    // Architecture and shafts of light establish one persistent physical room.
    const wall = ctx.createLinearGradient(80, 250, 420, 660); wall.addColorStop(0, '#13213a'); wall.addColorStop(1, '#101827');
    ctx.fillStyle = wall; ctx.beginPath(); ctx.moveTo(-80, 155); ctx.lineTo(525, 130); ctx.lineTo(605, 620); ctx.lineTo(-80, 720); ctx.closePath(); ctx.fill();
    line([[-30, 656], [540, 600]], '#43617730', 2);
    const win = ctx.createLinearGradient(350, 220, 480, 570); win.addColorStop(0, warm > .2 ? '#f6c075' : '#183c56'); win.addColorStop(.6, warm > .2 ? '#679292' : '#102d47'); win.addColorStop(1, '#152c42');
    fillRound(336, 199, 152, 319, 8, '#061020'); fillRound(345, 208, 134, 299, 3, win);
    ctx.save(); rr(345, 208, 134, 299, 3); ctx.clip();
    for (let i = 0; i < 11; i++) { const xx = 345 + i * 15; const hh = 18 + hash(i + 10) * 92; fillRound(xx, 507 - hh, 13, hh, 1, warm > .2 ? '#19394c99' : '#07182b'); }
    glow(432, 280, 150, warm > .2 ? '#ffdf9a' : '#68b8d2', warm > .2 ? .4 : .07);
    ctx.restore(); line([[411, 208], [411, 507]], '#18293c', 7); line([[345, 354], [479, 354]], '#18293c', 6);
    ctx.save(); ctx.globalAlpha = .12 + warm * .18; const ray = ctx.createLinearGradient(420, 310, 120, 780); ray.addColorStop(0, '#ffd483cc'); ray.addColorStop(1, '#ffd48300'); ctx.fillStyle = ray;
    ctx.beginPath(); ctx.moveTo(347, 356); ctx.lineTo(477, 358); ctx.lineTo(370, 800); ctx.lineTo(-80, 800); ctx.closePath(); ctx.fill(); ctx.restore();
    // Sofa: layered upholstery, piping, cast shadows, visible feet.
    shadow(169, 646, 158, 33, .65);
    fillRound(33, 477, 245, 132, 29, '#152940'); fillRound(43, 486, 225, 117, 26, '#294158');
    const seat = ctx.createLinearGradient(0, 563, 0, 638); seat.addColorStop(0, '#395770'); seat.addColorStop(1, '#1b314b'); fillRound(40, 564, 240, 75, 24, seat);
    fillRound(23, 531, 39, 101, 18, '#314d65'); fillRound(262, 531, 37, 101, 18, '#263f58');
    line([[63, 572], [259, 572]], '#7b9aaa38', 2); line([[150, 492], [150, 565]], '#11293c55', 2);
    line([[59, 635], [57, 650]], '#121e2c', 8); line([[258, 635], [264, 646]], '#121e2c', 8);
    // Side table and its small cup remain identifiable in all room scenes.
    shadow(352, 679, 55, 16, .7); ellipse(352, 595, 48, 16, '#456172'); ellipse(352, 589, 48, 14, '#6e8790');
    line([[352, 604], [352, 670]], '#243e50', 12); line([[327, 676], [377, 676]], '#375365', 7);
    clock(99, 445, t, .88, warm < .3);
    dust(t, warm);
  }
  function tunnel(t: number, tint = 0, speed = 1) {
    backdrop(t);
    glow(270, 290, 275, tint > .5 ? '#bc527e' : '#34d6ce', .13);
    // Concentric ribs provide depth without becoming panels.
    for (let i = 0; i < 9; i++) {
      const p = fract(i / 9 + t * .025 * speed), k = p * p;
      ctx.save(); ctx.globalAlpha = .06 + p * .22; ctx.strokeStyle = tint > .5 ? '#cd7cab' : '#78d5d6'; ctx.lineWidth = 1 + k * 5;
      ctx.beginPath(); ctx.ellipse(270, 328 + k * 93, 32 + k * 350, 45 + k * 435, 0, PI * 1.08, PI * 1.92); ctx.stroke(); ctx.restore();
    }
    const floor = ctx.createLinearGradient(0, 360, 0, 810); floor.addColorStop(0, '#153e4b'); floor.addColorStop(.4, '#173845'); floor.addColorStop(1, '#071622');
    ctx.beginPath(); ctx.moveTo(243, 350); ctx.lineTo(297, 350); ctx.lineTo(481, 804); ctx.lineTo(58, 804); ctx.closePath(); ctx.fillStyle = floor; ctx.fill();
    line([[243, 350], [58, 804]], '#55b6b755', 3); line([[297, 350], [481, 804]], '#55b6b755', 3);
    for (let i = 0; i < 15; i++) { const p = fract(i / 15 + t * .1 * speed), k = p * p; const yy = 350 + k * 454, half = 27 + k * 185; line([[270 - half, yy], [270 + half, yy]], '#93dfda25', 1 + p * 2); }
    dust(t);
  }
  function pedestal(x: number, y: number, r: number, color = C.cyan) {
    shadow(x, y + 11, r * 1.35, r * .26, .7); ellipse(x, y + 5, r, r * .28, '#102739'); ellipse(x, y, r, r * .28, '#25485a');
    ctx.strokeStyle = color + '99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r, r * .28, 0, 0, TAU); ctx.stroke();
  }
  function attraction(kind: number, x: number, y: number, s: number, t: number) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    pedestal(0, 10, 65, kind === 1 ? C.pink : C.cyan);
    if (kind === 0) {
      // A balloon creature hops, inflates, and rolls: a tiny complete gag.
      const p = fract(t * .3), hop = Math.max(0, Math.sin(p * TAU)) * 19;
      ctx.save(); ctx.translate(Math.sin(t * 2) * 12, -33 - hop); ctx.rotate(Math.sin(t * 3) * .16); ctx.scale(1 + Math.sin(t * 2) * .1, 1 - Math.sin(t * 2) * .06);
      ellipse(0, 0, 28, 24, '#80e6d8');
      ctx.beginPath(); ctx.moveTo(-24, -11); ctx.lineTo(-28, -37); ctx.lineTo(-7, -22); ctx.moveTo(24, -11); ctx.lineTo(28, -37); ctx.lineTo(7, -22); ctx.fillStyle = '#80e6d8'; ctx.fill();
      ellipse(-10, -3, 3, 5, '#173a44'); ellipse(10, -3, 3, 5, '#173a44'); line([[-5, 7], [0, 11], [5, 7]], '#173a44', 2); ctx.restore();
      line([[-35, -9], [-29, -15]], '#d3fff0', 3); star(38, -62, 10, C.gold, t);
    } else if (kind === 1) {
      // Two opposing shapes visibly argue; no speech bubbles or text are necessary.
      for (const side of [-1, 1]) { const xx = side * (29 + Math.sin(t * 6) * 3); fillRound(xx - 19, -62, 38, 60, 12, side < 0 ? '#e87892' : '#887ccf'); ellipse(xx - 6, -40, 3, 4, '#181c34'); ellipse(xx + 6, -40, 3, 4, '#181c34'); line([[xx - 10, -50], [xx - 3, -47]], '#302546', 3); line([[xx + 3, -47], [xx + 10, -50]], '#302546', 3); }
      line([[-8, -72], [5, -90], [-2, -57], [10, -70]], '#ffd690', 4);
      for (let i = 0; i < 4; i++) { const p = fract(t * .8 + i * .24); ellipse((i % 2 ? -28 : 28) + Math.sin(t + i) * 8, -63 - p * 60, 5 + p * 9, 5 + p * 9, `rgba(252,119,166,${.25 * (1 - p)})`); }
    } else if (kind === 2) {
      // Underdog climbs a real staircase and gains a crown.
      for (let i = 0; i < 4; i++) fillRound(-45 + i * 23, -i * 20, 25, i * 20 + 12, 3, ['#203e52', '#2e6170', '#358688', '#58ada1'][i]);
      const p = fract(t * .18), xx = mix(-34, 38, smooth(p)), yy = -15 - Math.floor(p * 4) * 20;
      ellipse(xx, yy - 13, 11, 16, '#ffda83'); ellipse(xx - 4, yy - 17, 2, 2.5, '#20394a'); ellipse(xx + 4, yy - 17, 2, 2.5, '#20394a');
      star(38, -105, 17, '#ffe595', -.1); glow(38, -105, 60, C.gold, .24);
    } else if (kind === 3) {
      // Landscape: mountain silhouettes and a sun rise out of the conveyor.
      ellipse(19, -66, 23, 23, '#ffd18b'); ctx.beginPath(); ctx.moveTo(-57, 1); ctx.lineTo(-20, -70); ctx.lineTo(15, 1); ctx.moveTo(-8, 1); ctx.lineTo(28, -47); ctx.lineTo(59, 1); ctx.fillStyle = '#5caaa6'; ctx.fill(); line([[-27, -56], [-20, -70], [-11, -52]], '#d6fff1', 4);
    } else {
      // A jewel is always about to be revealed.
      ctx.save(); ctx.translate(0, -39); ctx.rotate(t * .6); ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(30, 0); ctx.lineTo(0, 35); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fillStyle = '#c8a7e8'; ctx.fill(); line([[0, -29], [0, 35]], '#f7e5ff', 2); ctx.restore(); glow(0, -33, 65, '#bda4ff', .14);
    }
    ctx.restore();
  }
  function gate(x: number, y: number, s: number, openness = 1, label = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    glow(0, -72, 155, C.gold, .15 * openness); shadow(0, 25, 76, 15, .7);
    const g = ctx.createLinearGradient(-47, -156, 47, 0); g.addColorStop(0, '#fff0af'); g.addColorStop(.55, '#ffbd59'); g.addColorStop(1, '#ba7134');
    fillRound(-55, -162, 110, 174, 28, '#4c382d'); fillRound(-49, -156, 98, 164, 25, g);
    const inside = ctx.createLinearGradient(0, -143, 0, 10); inside.addColorStop(0, '#11283c'); inside.addColorStop(1, '#07121f'); fillRound(-39, -145, 78, 152, 19, inside);
    ctx.save(); ctx.globalAlpha = openness; orb(0, -90 + Math.sin(filmTime * 2) * 7, 11, 1, false); ctx.restore();
    line([[-43, -135], [-43, -18]], '#fff5c777', 2);
    if (label) text('下一条', 0, -185, 16, '#ffdd97');
    ctx.restore();
  }
  function snakeBelt(t: number, speed = 1) {
    const path = () => { ctx.beginPath(); ctx.moveTo(-80, 774); ctx.bezierCurveTo(115, 755, 325, 629, 259, 514); ctx.bezierCurveTo(188, 382, 382, 343, 610, 366); };
    path(); ctx.strokeStyle = '#020b16'; ctx.lineWidth = 132; ctx.stroke(); path(); ctx.strokeStyle = '#163646'; ctx.lineWidth = 112; ctx.stroke();
    path(); ctx.strokeStyle = '#66d6cc44'; ctx.lineWidth = 116; ctx.stroke(); path(); ctx.strokeStyle = '#122e3d'; ctx.lineWidth = 109; ctx.stroke();
    ctx.save(); path(); ctx.setLineDash([2, 21]); ctx.lineDashOffset = -t * 42 * speed; ctx.strokeStyle = '#83d9d143'; ctx.lineWidth = 104; ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = '#8cf5dd16'; ctx.lineWidth = 3; ctx.stroke();
  }

  function opening(t: number) {
    const dive = ease(t, 5.7, 7.2);
    ctx.save(); ctx.translate(268, 460); ctx.scale(1.1 + dive * .3, 1.1 + dive * .3); ctx.translate(-260, -460);
    room(t); cup(352, 583, .8);
    const reach = ease(t, 1.1, 2.3), slump = 1 - ease(t, 2.0, 3.1), late = ease(t, 3.6, 5.8);
    hero(183 + reach * 10, 613, 1.08, { seated: true, mood: late > .6 ? 'blank' : reach > .4 ? 'happy' : 'tired', reach: reach * .76, lean: .11 * slump - .05 * reach, squash: .11 * Math.exp(-t * 2) * Math.sin(t * 13), gaze: 1, blink: fract(t * .21) });
    phone(289, 552 - reach * 13, 54 + dive * 380, 104 + dive * 690, .55 + .45 * reach, -.09 * (1 - dive));
    if (t < 3.4) { ctx.save(); ctx.globalAlpha = 1 - ease(t, 2.6, 3.4); fillRound(62, 399, 90, 24, 7, '#173647'); text('十分钟', 107, 411, 14, '#bed4c7'); ctx.restore(); }
    if (t > 3.4 && t < 5.7) { const p = ease(t, 3.4, 5.7); for (let i = 0; i < 4; i++) { ctx.save(); ctx.globalAlpha = .3 * Math.sin(p * PI); line([[280, 500 - i * 16], [310, 480 - i * 16]], C.cyan, 2); ctx.restore(); } }
    ctx.restore();
    // One opening hook, carried by the phone's light; all subsequent scenes use visual action.
    const hookIn = back((t - .08) / .65), hookOut = 1 - ease(t, 3.8, 5.8);
    ctx.save(); ctx.globalAlpha = ease(t, .06, .5) * hookOut;
    const titleY = 191 + (1 - hookIn) * 25 - ease(t, 4.0, 5.8) * 42;
    glow(270, titleY + 18, 220, C.cyan, .10 * hookOut);
    text('刷了一晚上', 270, titleY, 33, '#e1f9ee');
    text('为什么还没休息够？', 270, titleY + 48, 30, '#ffdf99');
    ctx.restore();
  }
  function feedRooms(t: number) {
    const q = t - 7, kind = q < 3.7 ? 0 : q < 7 ? 1 : 2;
    const local = q < 3.7 ? q : q < 7 ? q - 3.7 : q - 7;
    tunnel(t, kind === 1 ? 1 : 0, 1.1);
    const drop = 1 - ease(t, 7, 8.2);
    ctx.save(); ctx.translate(Math.sin(q * .7) * 4, -drop * 75);
    // Contents are physical miniature events, never screens with text.
    attraction(kind, 279, 470 + Math.sin(local * 2) * 5, 1.68, local + (kind === 2 ? .1 : 0));
    const automaticSwipe = t > 13.6 && t < 17.3 ? fract((t - 13.6) * 1.3) : 0;
    hero(247, 694, 1.23, { mood: t > 13.6 && t < 17.3 ? 'blank' : kind === 0 ? 'happy' : kind === 1 ? 'angry' : 'wonder', gaze: .5, lean: Math.sin(q * 2.2) * .025, squash: Math.sin(q * 4) * .1, reach: automaticSwipe > 0 ? .24 + Math.sin(automaticSwipe * PI) * .43 : kind === 2 ? .45 : .05, walk: .16 * Math.sin(q) });
    if (automaticSwipe > 0) {
      ctx.save(); ctx.globalAlpha = Math.sin(automaticSwipe * PI) * .55;
      line([[339, 637], [343, 620 - automaticSwipe * 35]], C.cyan, 3);
      star(343, 620 - automaticSwipe * 35, 4, '#dcfff8'); ctx.restore();
    }
    orb(403 + Math.sin(t) * 12, 399, 7, .8); ctx.restore();
    // A passing rail, rather than a fade to black, motivates the content changes.
    const switchP = kind === 1 ? ease(t, 10.7, 11.2) : kind === 2 ? ease(t, 14, 14.5) : 1;
    if (switchP < 1) { const x = mix(-130, 700, switchP); ctx.save(); ctx.globalAlpha = Math.sin(switchP * PI) * .55; fillRound(x - 40, 100, 75, 710, 28, '#245c65'); line([[x - 8, 130], [x - 8, 770]], '#b6fff0', 3); ctx.restore(); }
  }
  function conveyor(t: number) {
    backdrop(t); glow(350, 320, 270, '#46b7c3', .13); snakeBelt(t, 1.2);
    const q = t - 18;
    // Moving attractions are depth-sorted by their vertical positions.
    const objects = Array.from({ length: 5 }, (_, i) => { const p = fract(i * .21 + q * .065); return { i, p, x: mix(490, -100, p), y: 350 + p * 430, s: .35 + p * .77 }; }).sort((a, b) => a.y - b.y);
    for (const o of objects) attraction(o.i % 5, o.x, o.y - 30, o.s, q + o.i * 2);
    const emotion = Math.floor(q / 2.8) % 5, moods: Mood[] = ['happy', 'angry', 'wonder', 'blank', 'happy'];
    hero(270 + Math.sin(q * .7) * 17, 663 + Math.sin(q * 3) * 2, 1.2, { mood: moods[emotion], gaze: Math.sin(q * 2.3), lean: Math.sin(q * 2.3) * .065, reach: Math.max(0, Math.sin(q * 1.7)) * .25, walk: q * 1.1 });
    // Clock faces physically stream past, so elapsed time is visible without a stat chart.
    for (let i = 0; i < 5; i++) { const p = fract(q * .12 + i * .23), yy = 190 + p * 600, xx = 433 + Math.sin(p * TAU + i) * 20; ctx.save(); ctx.globalAlpha = .16 + .65 * Math.sin(p * PI); ctx.translate(xx, yy); ctx.rotate(p * .6); const r = 15 + p * 14; ellipse(0, 0, r, r, '#163c4d'); ctx.strokeStyle = '#9ee7df88'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, TAU); ctx.stroke(); line([[0, -r * .65], [0, 0], [Math.sin(q * 3 + i) * r * .6, Math.cos(q * 3 + i) * r * .6]], '#b6f5e8', 2); ctx.restore(); }
    for (let i = 0; i < 3; i++) orb(390 + i * 30, 300 - i * 20 + Math.sin(t + i) * 5, 4, .55);
    dust(t);
  }
  function chase(t: number) {
    const q = t - 32; tunnel(t, 0, 1.6);
    ctx.save(); ctx.translate(Math.sin(q * .8) * 6, 0); ctx.rotate(Math.sin(q * .5) * .008);
    for (let i = 3; i >= 0; i--) { const p = i / 4, s = .45 + (1 - p) * .72; gate(343 + p * 71 + Math.sin(q * 1.2) * 9, 428 - p * 98 - Math.sin(q * .8) * 6, s, 1 - p * .15, i === 0); }
    const stride = q * 9; hero(192 + Math.sin(q * .7) * 14, 686, 1.3, { mood: q < 5 ? 'wonder' : 'blank', walk: stride, reach: .82 + Math.sin(stride) * .08, lean: .17, gaze: 1, squash: Math.sin(stride * 2) * .08 });
    const orbX = 331 + ease(q, 0, 2) * 34 + Math.sin(q * 1.2) * 10, orbY = 467 - Math.sin(q * .8) * 7;
    orb(orbX, orbY, 12); for (let i = 0; i < 7; i++) { const p = fract(q * .4 + i / 7); ctx.save(); ctx.globalAlpha = (1 - p) * .2; ellipse(orbX - p * 88, orbY + p * 36, 3 * (1 - p), 3 * (1 - p), C.cyan); ctx.restore(); }
    ctx.restore();
  }
  function ring(t: number) {
    const q = t - 43, pull = ease(q, 0, 2.2), brake = ease(q, 5.1, 7.8);
    backdrop(t); glow(270, 435, 285, '#438d9f', .14);
    const cx = 270, cy = 494, rx = mix(365, 199, pull), ry = mix(276, 135, pull);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.12); shadow(0, ry + 39, rx + 47, 32, .8);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.strokeStyle = '#061321'; ctx.lineWidth = 85; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.strokeStyle = '#21505d'; ctx.lineWidth = 71; ctx.stroke();
    ctx.save(); ctx.setLineDash([2, 18]); ctx.lineDashOffset = -(q * 32 - brake * 70); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.strokeStyle = '#8bd7cb66'; ctx.lineWidth = 64; ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, rx - 35, ry - 35, 0, 0, TAU); ctx.strokeStyle = '#7cdcd35c'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, rx + 35, ry + 35, 0, 0, TAU); ctx.strokeStyle = '#7cdcd35c'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 5; i++) { const a = -PI + i * TAU / 5 + Math.min(q, 5.3) * .11; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; if (i % 2) attraction(i % 5, x, y - 9, .37 + (y - 350) * .0006, t); else gate(x, y, .3 + (y - 350) * .0006, .65); }
    const a = mix(1.68, 1.9, ease(q, 0, 5.4)), hx = cx + Math.cos(a) * rx, hy = cy + Math.sin(a) * ry;
    hero(hx, hy + 23, mix(1.25, .86, pull), { mood: q > 5 ? 'blank' : 'wonder', walk: Math.min(q, 5.4) * 6, lean: .07 * (1 - brake), reach: .45 * (1 - brake), gaze: q > 5 ? -.5 : 1 });
    // Pulses leave the present activity as each new thing attracts the eye.
    for (let i = 0; i < 8; i++) { const p = fract(q * .34 + i / 8); const x = mix(hx + 15, 417, p), y = hy - 90 - Math.sin(p * PI) * 140 + Math.max(0, p - .55) * 180; ctx.save(); ctx.globalAlpha = (1 - p) * .55 * (1 - ease(q, 6, 8)); star(x, y, 3 + p * 3, i % 3 ? C.cyan : C.gold, p * 4); ctx.restore(); }
    // A small golden star drops when the character interrupts its chase.
    const drop = ease(q, 6.4, 8.1); if (q > 5.8) { star(hx + 49 - drop * 9, hy - 56 + drop * 89, 10 - drop * 3, C.gold, drop * 3); }
    dust(t, 0, .6);
  }
  function choice(t: number) {
    const q = t - 52, turn = ease(q, 2.5, 6.5), exit = ease(q, 10.7, 14);
    tunnel(t, 0, 1 - .84 * turn);
    // Timer is a tangible object, with a hand-operated knob and a chosen endpoint.
    const ty = 535;
    shadow(327, ty + 67, 96, 18, .7); glow(327, ty, 153, C.gold, .12 * turn);
    const metal = ctx.createLinearGradient(254, ty - 73, 400, ty + 73); metal.addColorStop(0, '#e3c78a'); metal.addColorStop(.5, '#8d7e5e'); metal.addColorStop(1, '#3d4d55'); ellipse(327, ty, 73, 73, metal); ellipse(327, ty, 64, 64, '#172c3b');
    for (let i = 0; i < 24; i++) { const a = i * TAU / 24 - PI / 2; const r = i % 3 ? 55 : 50; line([[327 + Math.cos(a) * r, ty + Math.sin(a) * r], [327 + Math.cos(a) * 59, ty + Math.sin(a) * 59]], '#b2ccc788', i % 3 ? 1 : 2); }
    ctx.save(); ctx.translate(327, ty); ctx.rotate(-1.7 + turn * 2.5); fillRound(-8, -44, 16, 62, 8, '#d4c595'); line([[-3, -32], [-3, 9]], '#fff2bf77', 2); ctx.restore();
    text(turn > .8 ? '现在停' : '十分钟', 327, ty - 95, 17, turn > .8 ? '#ffe1a0' : '#aecac6');
    const reach = Math.sin(clamp((q - 1.3) / 6.7) * PI) * .9;
    const push = Math.sin(clamp((q - 7.4) / 2.5) * PI);
    hero(224 - exit * 28, 649 + exit * 17, 1.22 - exit * .06, { mood: 'resolve', reach: Math.max(reach, push * .4), hand: [mix(mix(45, 84, reach), 84, push), mix(mix(-14, -72, reach), -38, push)], lean: -.018 * reach - exit * .02, gaze: q > 9.5 ? -.6 : 1, walk: exit * 8, blink: fract(t * .15) });
    if (q > 9.3 && q < 12.8) { const pulse = Math.sin(clamp((q - 9.3) / 3.5) * PI); ctx.save(); ctx.globalAlpha = pulse * .6; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(327, ty, 78 + i * 13 + Math.sin(q * 4) * 3, -.9, .7); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore(); }
    // The endpoint first draws itself, then catches the moving belt.
    const end = ease(q, 6, 8.1); ctx.save(); ctx.globalAlpha = end; const yy = 684 - end * 39;
    glow(269, yy, 210, C.gold, .08); line([[103, yy], [437, yy]], '#ffd990', 6); line([[103, yy - 4], [437, yy - 4]], '#fff4cf', 1.5);
    for (let i = 0; i < 12; i++) { const x = 112 + i * 27; fillRound(x, yy - 5, 11, 10, 2, i % 2 ? '#2c3440' : '#fff0c2'); } ctx.restore();
    // Phone visibly moves beyond immediate reach, not just disappears.
    const distant = ease(q, 8.3, 11.2); phone(mix(342, 458, distant), mix(589, 560, distant), mix(56, 40, distant), mix(112, 80, distant), 1 - distant * .5, -.12 + distant * .14);
    if (exit > 0) { ctx.save(); ctx.globalAlpha = exit; room(t, .35 + exit * .35); cup(352, 583, .8); hero(224 - exit * 28, 649 + exit * 17, 1.22 - exit * .06, { mood: 'resolve', gaze: 1, walk: exit * 8 }); phone(458, 560, 40, 80, .35); ctx.restore(); }
  }
  function recover(t: number) {
    const q = t - 66, approach = ease(q, 0, 3.1), drink = ease(q, 3.3, 4.2) * (1 - ease(q, 5, 5.9)), walk = ease(q, 6.5, 11.7);
    ctx.save(); ctx.translate(268, 460); ctx.scale(1.10 + drink * .022, 1.10 + drink * .022); ctx.translate(-260, -460);
    room(t, .7 + .3 * walk);
    const x = mix(mix(196, 279, approach), 367, walk), y = mix(666, 644, walk);
    if (drink < .02 && q < 3.8 || q > 5.9) cup(352, 583, .8);
    hero(x, y, 1.16, { mood: q < 3.3 ? 'resolve' : 'calm', cup: drink, reach: ease(q, 2.1, 3.1) * (1 - ease(q, 5.3, 6.4)) * .42, walk: q < 3.1 ? q * 5 : walk > 0 && walk < 1 ? q * 6 : 0, lean: walk > 0 && walk < 1 ? .04 : 0, gaze: q > 8 ? 1 : .4, blink: fract(t * .17), squash: Math.sin(t * 1.8) * .045 });
    phone(458, 560, 40, 80, .2); orb(459, 546, 2.8, .25 * (1 - walk));
    // Long diagonal shafts and warm particles make recovery a visible spatial change.
    glow(427, 330, 260, '#ffe1a0', .10 + walk * .14); dust(t, 1, .7); ctx.restore();
  }
  function ending(t: number) {
    const q = t - 79, close = ease(q, 1.0, 3.4), settle = ease(q, 3.7, 6), stretch = Math.sin(ease(q, 6, 9.1) * PI) * .85;
    ctx.save(); ctx.translate(268, 460); ctx.scale(1.10 + stretch * .018, 1.10 + stretch * .018); ctx.translate(-260, -460);
    room(t, 1); cup(352, 583, .8);
    // The invitation returns; the character chooses and physically closes it.
    const gx = 440, gy = 561;
    ctx.save(); ctx.globalAlpha = 1 - close; gate(gx, gy, .45 * (1 - close * .55), 1 - close, false); ctx.restore();
    phone(458 - close * 9, 561 + close * 17, 40 + close * 26, 80 * (1 - close * .66), .15 * (1 - close), -close * .04, close);
    const hx = mix(367, 320, settle), hy = mix(644, 664, settle);
    hero(hx, hy, 1.16, { mood: 'calm', gaze: q < 3 ? 1 : -.3, reach: Math.sin(clamp(q / 3.4) * PI) * .6, walk: settle > 0 && settle < 1 ? q * 5 : 0, stretch, lean: -.018 * Math.sin(q), squash: Math.sin(q * 1.7) * .045, blink: fract(t * .19) });
    glow(433, 310, 330, '#ffd188', .16 + settle * .08);
    // One last tiny cyan sparkle fades against the deliberate warm ending.
    if (q < 4) { const a = 1 - ease(q, 2, 4); orb(453 + Math.sin(q * 5) * 5, 521 - Math.sin(q * 2) * 7, 4, a * .55); }
    dust(t, 1, .65); ctx.restore();
  }

  const chapters: { start: number; end: number; draw: (t: number) => void }[] = [
    { start: 0, end: 7, draw: opening }, { start: 7, end: 18, draw: feedRooms },
    { start: 18, end: 32, draw: conveyor }, { start: 32, end: 43, draw: chase },
    { start: 43, end: 52, draw: ring }, { start: 52, end: 66, draw: choice },
    { start: 66, end: 79, draw: recover }, { start: 79, end: 90, draw: ending },
  ];
  function render(time: number) {
    filmTime = clamp(Number.isFinite(time) ? time : 0, 0, 90);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(canvas.width / 540, canvas.height / 960);
    const idx = Math.min(7, chapters.findIndex(c => filmTime < c.end) < 0 ? 7 : chapters.findIndex(c => filmTime < c.end));
    // Short motivated light blends retain continuity; the room/portal stays persistent.
    const prev = idx > 0 && filmTime < chapters[idx].start + .42 ? chapters[idx - 1] : null;
    if (prev) { prev.draw(chapters[idx].start - .001); ctx.save(); ctx.globalAlpha = ease(filmTime, chapters[idx].start, chapters[idx].start + .42); chapters[idx].draw(filmTime); ctx.restore(); }
    else chapters[idx].draw(filmTime);
    // Optical edge falloff, kept clear of subtitle placement.
    const vignette = ctx.createRadialGradient(270, 460, 170, 270, 480, 590); vignette.addColorStop(0, '#02071400'); vignette.addColorStop(.75, '#02071410'); vignette.addColorStop(1, '#020714b0'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 540, 960);
    const bottom = ctx.createLinearGradient(0, 793, 0, 960); bottom.addColorStop(0, '#050b1900'); bottom.addColorStop(.42, '#050b1999'); bottom.addColorStop(1, '#050b19ee'); ctx.fillStyle = bottom; ctx.fillRect(0, 793, 540, 167);
    if (subtitlesVisible) {
      const cue = captions.find(c => filmTime >= c.start && filmTime < c.end);
      if (cue) {
        const lines = cue.text.split('\n');
        ctx.font = '600 24px "Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
        const boxWidth = Math.min(478, Math.max(...lines.map(l => ctx.measureText(l).width)) + 32);
        const boxHeight = lines.length * 34 + 18;
        const boxTop = 828 - boxHeight / 2;
        fillRound(270 - boxWidth / 2, boxTop, boxWidth, boxHeight, 10, '#050c18d9');
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff6df'; ctx.shadowColor = '#000000'; ctx.shadowBlur = 3;
        lines.forEach((label, i) => ctx.fillText(label, 270, boxTop + 26 + i * 34));
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }
  render(0);
  return { canvas, render, setSubtitles(visible: boolean) { subtitlesVisible = visible; }, dispose() { canvas.width = 1; canvas.height = 1; } };
}
