// 成片的舞台：一个 WebGL 渲染器 + 后期（辉光、调色、暗角、颗粒、拖影、白闪）+ 城、天、落灰、光，
// 最后画到一张 2D 画布上，再在上面写字（世界设定、「十二年前」这些）。每一段（前奏、主歌一……）是一个 scene 图层，
// 只加载这一段要用的人物；图层的 offset 等于 start，所以 render(t) 收到的就是全片时间。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { assetUrl, type Scene, type SceneOptions } from "@frame/engine/types";
import { disposeObject } from "@frame/engine/three-assets";
import { setOutlineResolution } from "../rig3d/vrm";
import { generateCity, buildingsMesh, type Building } from "../world/city";
import { createSky } from "../world/sky";
import { createAsh } from "../world/ash";
import { DAY, type Mood } from "../world/palette";

const GRADE_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const GRADE_FS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uRes;
  uniform float uSat, uBright, uVig, uFlash, uGrain, uTime, uTintK;
  uniform vec3 uTint, uVigColor, uFlashColor;
  uniform vec2 uBlur;          // 拖影：方向和长度（像素）
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec4 c = texture2D(tDiffuse, uv);
    float bl = length(uBlur);
    if (bl > 0.5) {
      vec4 acc = vec4(0.0);
      for (int i = -8; i <= 8; i++) acc += texture2D(tDiffuse, uv + uBlur * (float(i) / 16.0) / uRes);
      c = acc / 17.0;
    }
    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    c.rgb = mix(vec3(l), c.rgb, uSat) * uBright;
    c.rgb = mix(c.rgb, c.rgb * uTint, uTintK);
    vec2 d = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float v = smoothstep(0.32, 0.92, length(d) * 1.35);
    c.rgb = mix(c.rgb, c.rgb * uVigColor, uVig * v);
    c.rgb = mix(c.rgb, uFlashColor, uFlash);
    float g = fract(sin(dot(floor(uv * uRes) + floor(uTime * 24.0) * 17.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    c.rgb += g * uGrain;
    gl_FragColor = c;
  }
`;

export interface Grade {
  sat: number;
  bright: number;
  vig: number;
  vigColor: string;
  tint: string;
  tintK: number;
  flash: number;
  flashColor: string;
  grain: number;
  blur: [number, number];
  bloom: number;
}
export const GRADE0: Grade = { sat: 1, bright: 1, vig: 0.22, vigColor: "#8a6f9e", tint: "#ffffff", tintK: 0, flash: 0, flashColor: "#ffffff", grain: 0.035, blur: [0, 0], bloom: 0.55 };

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(35, 9 / 16, 0.1, 9000);
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  readonly gradePass: ShaderPass;
  readonly hemi: THREE.HemisphereLight;
  readonly sun: THREE.DirectionalLight;
  readonly fog: THREE.FogExp2;
  sky!: ReturnType<typeof createSky>;
  city!: ReturnType<typeof buildingsMesh>;
  ash: ReturnType<typeof createAsh>[] = [];
  /** 竖屏 1080 宽时为 1：画面像素的比例（描边、灰的大小、字号都乘它） */
  readonly S: number;
  readonly aspect: number;
  mood: Mood = DAY;
  constructor(readonly width: number, readonly height: number, readonly quality: SceneOptions["quality"]) {
    this.S = Math.min(width, height) / 1080;
    this.aspect = width / height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }));
    r.setPixelRatio(1);
    r.setSize(width, height);
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.fog = new THREE.FogExp2(new THREE.Color(DAY.haze), DAY.fog);
    this.scene.fog = this.fog;
    this.hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemi);
    this.sun = new THREE.DirectionalLight(DAY.sun, DAY.sunI);
    this.sun.position.set(-0.35, 1, 0.45);
    this.scene.add(this.hemi, this.sun);
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.5, 0.985);
    this.composer.addPass(this.bloom);
    this.gradePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uRes: { value: new THREE.Vector2(width, height) },
        uSat: { value: 1 },
        uBright: { value: 1 },
        uVig: { value: 0.22 },
        uVigColor: { value: new THREE.Color(GRADE0.vigColor) },
        uTint: { value: new THREE.Color(1, 1, 1) },
        uTintK: { value: 0 },
        uFlash: { value: 0 },
        uFlashColor: { value: new THREE.Color(1, 1, 1) },
        uGrain: { value: 0.035 },
        uTime: { value: 0 },
        uBlur: { value: new THREE.Vector2() },
      },
      vertexShader: GRADE_VS,
      fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.gradePass);
    this.composer.addPass(new OutputPass());
  }

  /** 城、天、落灰（每段都要）；keep 决定哪些楼留下（给手工搭的街景让位） */
  buildWorld(mood: Mood = DAY, keep?: (b: Building) => boolean) {
    this.sky = createSky(mood);
    this.scene.add(this.sky.group);
    this.city = buildingsMesh(generateCity(7, keep), mood);
    this.scene.add(this.city.group);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshToonMaterial({ color: "#c7bccf" }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);
    const lite = this.quality === "draft";
    this.ash = [createAsh(lite ? 500 : 1400, [36, 36, 36], 70, 3), createAsh(lite ? 600 : 1800, [240, 240, 240], 160, 9)];
    for (const a of this.ash) this.scene.add(a.points);
    this.setMood(mood);
  }

  setMood(m: Mood) {
    this.mood = m;
    this.fog.color.set(m.haze);
    this.fog.density = m.fog;
    this.hemi.color.set(m.hemiSky);
    this.hemi.groundColor.set(m.hemiGround);
    this.hemi.intensity = m.hemi;
    this.sun.color.set(m.sun);
    this.sun.intensity = m.sunI;
    this.sky?.setMood(m);
    this.city?.setMood(m);
    for (const a of this.ash) {
      a.uniforms.uColor.value.set(m.ash);
      a.uniforms.uFogColor.value.set(m.haze);
    }
  }

  /** 画一帧：t 全片时间；grade 调色；overlay 在 2D 画布上写字 */
  draw(t: number, grade: Partial<Grade> = {}, overlay?: (ctx: CanvasRenderingContext2D, S: number) => void, skyFlash = 0) {
    const g = { ...GRADE0, ...grade };
    this.sky?.update(this.camera, skyFlash);
    for (const a of this.ash) a.update(t, this.camera, this.S);
    setOutlineResolution(this.scene, this.width, this.height);
    const u = this.gradePass.uniforms;
    u.uSat.value = g.sat;
    u.uBright.value = g.bright;
    u.uVig.value = g.vig;
    u.uVigColor.value.set(g.vigColor);
    u.uTint.value.set(g.tint);
    u.uTintK.value = g.tintK;
    u.uFlash.value = g.flash;
    u.uFlashColor.value.set(g.flashColor);
    u.uGrain.value = this.quality === "draft" ? 0 : g.grain;
    u.uTime.value = t;
    u.uBlur.value.set(g.blur[0] * this.S, -g.blur[1] * this.S);
    this.bloom.strength = g.bloom;
    this.composer.render(0);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.renderer.domElement, 0, 0);
    if (overlay) overlay(this.ctx, this.S);
  }

  dispose() {
    disposeObject(this.scene);
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.width = this.canvas.height = 1;
  }
}

// ---------------------------------------------------------------- 字

let fontReady: Promise<void> | null = null;
/** 片子里的字（白字 + 深紫描边，浅色背景上也看得清） */
export function loadFilmFont() {
  if (!fontReady)
    fontReady = (async () => {
      try {
        const f = new FontFace("FilmSerif", `url(${assetUrl("films/work-dca00795/fonts/serif.woff2")})`);
        document.fonts.add(await f.load());
      } catch {
        /* 用系统字体 */
      }
    })();
  return fontReady;
}

export function filmText(ctx: CanvasRenderingContext2D, S: number, lines: string[], x: number, y: number, opts: { size?: number; alpha?: number; lineGap?: number; align?: CanvasTextAlign } = {}) {
  const size = (opts.size ?? 52) * S;
  const a = opts.alpha ?? 1;
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `600 ${size}px FilmSerif, "Noto Serif CJK SC", "Noto Serif SC", serif`;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  lines.forEach((line, i) => {
    const yy = y * S + i * size * (opts.lineGap ?? 1.35);
    ctx.strokeStyle = "rgba(62, 38, 84, 0.85)";
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(line, x * S, yy);
    ctx.fillStyle = "#fffaf3";
    ctx.fillText(line, x * S, yy);
  });
  ctx.restore();
}

/**
 * 一段片子 = 一个 scene 图层：建好舞台，build 返回这一段的 render(t)（t 是全片时间）。
 */
export function sectionScene(options: SceneOptions, build: (stage: Stage) => Promise<(t: number) => void>): Promise<Scene> {
  return (async () => {
    const stage = new Stage(options.width, options.height, options.quality);
    await loadFilmFont();
    const render = await build(stage);
    return {
      canvas: stage.canvas,
      render(t: number) {
        render(t);
      },
      dispose() {
        stage.dispose();
      },
    };
  })();
}
