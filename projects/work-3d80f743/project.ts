import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-3d80f743",
  title: "[第2版]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "《引力》：这里的人一绝望就会飘起来，飘进天上的白光就烧成灰。全城都说扫天的秤砣是最沉的人，她把飘走的人一个个拽回地面，每晚却在石子上写「秤砣，明天见」塞进自己的靴子——没人知道她飘得最高。剧情稿见 故事.md（世界观、人物、整首歌的剧情表），分镜和画面待做。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 152,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"他从秤上飘起来","detail":"首帧：称重被盖「轻」，周磊离开秤盘；4.0 秒「咚」，秤砣抓住他的脚踝"},{"at":8,"title":"明天见","detail":"她在石子上写「明天见」，他的手一坠；「城里人都说，她是最沉的人」"},{"at":15.9,"title":"锁在顶层的千斤","detail":"抢灰锭、脚踝上的挂锁、看不见灯；灰锭掉下天井"},{"at":27.78,"title":"天井追逐","detail":"螺旋楼梯往上追，扑出去抓住千斤，在空中多停了半拍"},{"at":31.92,"title":"第一块不是锁上去的重量","detail":"给千斤写石子；夜里她给自己写「秤砣，明天见」，拴上脚绳"},{"at":39.99,"title":"反转：她飘得最高","detail":"睡着后飘到绳子尽头，离白一米"},{"at":43.92,"title":"没拽回来的妈妈","detail":"她的靴跟离地；小石头的妈妈掰开儿子的手，升进白；她捡起小刀"},{"at":53.94,"title":"十二年前","detail":"妈妈在半空脱下铁靴套在她脚上，松开手"},{"at":61.65,"title":"小刀与敲门声","detail":"刀抵着脚绳；小石头爬了九十九层来敲门，两根绳系在一起"},{"at":71.97,"title":"他知道了她的秘密","detail":"她从天花板下爬下来；电车上拽回阿满，自己也离了地；千斤开始给邻居吊石子"},{"at":83.79,"title":"等等我","detail":"小石头追她摔倒，她回头伸手"},{"at":87.93,"title":"灯下写字","detail":"教小石头写「明天见」，送他那支笔；他写「妈妈，明天见」；她的靴子塞满了"},{"at":95.49,"title":"小石头抬头","detail":"他把石子举向白，白里有妈妈；她抓住他，两个人一起升"},{"at":101.91,"title":"把靴子穿给他","detail":"她脱下铁靴套在他脚上；「秤砣，明天见」滚出来；她赤脚升天"},{"at":112,"title":"静","detail":"全城没有她的脚步声；白里的妈妈朝她张开手"},{"at":113.88,"title":"活下去：第一脚","detail":"小石头穿着她的靴子跺地，老钟推开窗抬头"},{"at":117.9,"title":"全城脱鞋","detail":"周磊第一个飘起来，一个抓一个，街上铺满鞋"},{"at":121.89,"title":"人链","detail":"阿满、千斤、称重员……原来每个人都是轻的"},{"at":125.82,"title":"他抓住了她的脚踝","detail":"和第一个镜头上下颠倒；白里的妈妈放下了手"},{"at":129.87,"title":"沉下来","detail":"她第一次握住别人的手，整条人链沉回人间"},{"at":136,"title":"这一次有人回来了","detail":"十二年前的镜头；光脚落地"},{"at":139,"title":"背面的字","detail":"小石头在石子背面写「秤砣，明天见」，她的手一坠"},{"at":148,"title":"光脚的一声","detail":"「咚」，和铁靴一样响；片名《引力》"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  experiences: ["情绪运镜","剧情音乐短片"],
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
};
export default project;
