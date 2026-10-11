import type { Scene, SceneOptions } from "@frame/engine/types";
import { createLikeCounter, createLoadingCard, createSuccessChip } from "@materials/Lottie动效/code/widgets";

const INK = "#151719", PAPER = "#f5f2e8", LIME = "#caff45", RED = "#ff565c";
const F = '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const cl = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - cl(x), 3);

export async function createScene(options: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas"); canvas.width = options.width; canvas.height = options.height;
  const c = canvas.getContext("2d")!;
  const cardOptions = { width: 880, height: 308, quality: options.quality };
  const cards = await Promise.all([
    createLikeCounter(cardOptions, { label: "谢谢每一个喜欢", from: 1240, to: 1280, seconds: 2.1 }),
    createLoadingCard(cardOptions, { label: "美好即将发生", seconds: 3.5, rate: 1.4, theme: "ink" }),
    createSuccessChip(cardOptions, { label: "心动已收到", detail: "下一次创作，从这里开始", theme: "ink" }),
  ]);
  function txt(s: string, x: number, y: number, size: number, color = INK, weight = 800) {
    c.fillStyle = color; c.font = weight + " " + size + "px " + F; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText(s, x, y);
  }
  function line(x: number, y: number, x2: number, y2: number, color: string, w = 2) {
    c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.stroke();
  }
  function pill(s: string, x: number, y: number, width: number, color: string, fg: string) {
    c.fillStyle = color; c.beginPath(); c.roundRect(x,y,width,65,33); c.fill();
    c.font = "600 27px " + F; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = fg; c.fillText(s,x+width/2,y+33);
  }
  function enter(t: number, delay: number, action: () => void) {
    const p = ease((t-delay)/0.65); c.save(); c.globalAlpha = p; c.translate(0,(1-p)*75); action(); c.restore();
  }
  return {
    canvas,
    async render(t) {
      c.setTransform(options.width/1080,0,0,options.height/1920,0,0);
      c.globalAlpha=1;
      const phase = t < 5.65 ? 0 : t < 11.65 ? 1 : t < 16.15 ? 2 : 3;
      const start = [0,5.65,11.65,16.15][phase], local = t-start;
      const dark = phase === 1, bg = phase === 3 ? LIME : dark ? INK : PAPER, fg = dark ? PAPER : INK;
      c.fillStyle=bg; c.fillRect(0,0,1080,1920);
      // Quiet print-like field, fixed geometry; only its drift depends on time.
      c.fillStyle=dark?"#272924":phase===3?"#b9ea3b":"#e9e5d9";
      for(let y=270;y<1720;y+=54) for(let x=70;x<1050;x+=54) {
        c.beginPath(); c.arc(x,y,1.7,0,Math.PI*2); c.fill();
      }
      c.save(); c.strokeStyle=dark?"#30352b":phase===3?"#acd731":"#dfdbcf"; c.lineWidth=2;
      c.translate(540,1040); c.rotate(t*.035);
      for(const r of [355,445,565]){c.beginPath();c.ellipse(0,0,r,r*.62,Math.PI/5,0,Math.PI*2);c.stroke();}c.restore();

      // Persistent editorial frame.
      txt("FRAME",76,139,43,fg,900); txt("STUDIO",246,139,25,fg,500);
      txt("MOTION / 001",782,135,24,fg,500); line(76,182,1004,182,fg,2);
      const num=["01 / HELLO","02 / REACT","03 / MAKE","04 / AGAIN"][phase];
      txt(num,80,259,24,dark?"#caff45":"#6b6e60",500);
      // Progress strip leaves a clean safe area at the bottom.
      for(let i=0;i<4;i++){ c.fillStyle=dark?"#45483f":phase===3?"#a8cc35":"#dcd8cd";c.fillRect(80+i*236,1738,220,5);
        if(i<=phase){c.fillStyle=fg;c.fillRect(80+i*236,1738,220*(i<phase?1:cl(local/[5.65,6,4.5,4.85][phase])),5);}
      }
      txt("LOTTIE STICKER CLUB",80,1813,22,fg,600);
      txt("让每一帧，都有表情。",718,1813,23,fg,500);

      if(phase===0){
        enter(local,-.25,()=>txt("让灵感",80,444,140));
        enter(local,.1,()=>txt("动起来",80,616,166));
        enter(local,.45,()=>{pill("MAKE IT MOVE",84,676,307,INK,PAPER);txt("小小贴纸，大大心动。",424,721,30,INK,500);});
        c.save(); c.translate(520,1030);c.rotate(-.06); c.fillStyle=INK;c.beginPath();c.roundRect(-339,-204,704,498,42);c.fill();
        c.fillStyle="#fffdf4";c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.roundRect(-355,-222,704,498,42);c.fill();c.stroke();c.restore();
        enter(local,.75,()=>{txt("HEY, CREATOR.",140,1422,77,INK,900);txt("给你的视频，加一点好心情。",145,1492,38,INK,500);});
        enter(local,1.15,()=>{pill("弹一下",145,1550,188,LIME,INK);pill("笑一下",353,1550,188,RED,INK);pill("喜欢一下",561,1550,245,INK,PAPER);});
      } else if(phase===1){
        enter(local,0,()=>txt("喜欢，就",80,446,133,PAPER));
        enter(local,.14,()=>txt("点个赞。",80,608,151,PAPER));
        enter(local,.4,()=>{txt("把这一刻的心动留下。",86,707,36,"#d2d6c9",500);});
        c.save();c.translate(540,1016);c.rotate(-.06);
        c.strokeStyle="#4a5140";c.lineWidth=3;c.beginPath();c.roundRect(-332,-225,664,467,200);c.stroke();c.restore();
        enter(local,.65,()=>{pill("ONE TAP, GOOD VIBES",317,1275,446,LIME,INK);});
        await cards[0].render(Math.max(0,local-.5));
        enter(local,.55,()=>c.drawImage(cards[0].canvas,100,1390,880,308));
      } else if(phase===2){
        enter(local,0,()=>txt("好点子，",80,446,133));
        enter(local,.12,()=>txt("正在加载",80,608,141));
        enter(local,.35,()=>txt("让期待，也变得有趣。",86,707,36,INK,500));
        c.fillStyle="#fffdf4";c.beginPath();c.arc(540,1005,257,0,Math.PI*2);c.fill();
        enter(local,.65,()=>{pill("A LITTLE MOMENT OF JOY",248,1275,584,RED,INK);});
        await cards[1].render(Math.max(0,local-.2));
        enter(local,.55,()=>c.drawImage(cards[1].canvas,100,1390,880,308));
      } else {
        enter(local,0,()=>txt("心动已收到",80,446,133));
        enter(local,.15,()=>txt("下一条，见！",80,614,135));
        enter(local,.4,()=>txt("收藏灵感，然后大胆创作。",86,720,36,INK,500));
        c.fillStyle=PAPER;c.beginPath();c.arc(540,1018,254,0,Math.PI*2);c.fill();
        enter(local,.7,()=>{pill("KEEP MAKING",345,1290,390,INK,PAPER);});
        await cards[2].render(Math.max(0,local-.2));
        enter(local,.65,()=>c.drawImage(cards[2].canvas,100,1415,880,308));
      }
    },
    dispose(){cards.forEach(card=>card.dispose());canvas.width=canvas.height=1;},
  };
}
