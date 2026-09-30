import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = { ...{
  "id": "work-0560feb5",
  "title": "超越对话｜从聊天机器人到 Agent",
  "subtitle": "语言，开始变成行动",
  "description": "原创科技知识短片。用连续三维动画解释规则、学习、注意力、后训练、推理与智能体闭环；以不同顶尖系统的公开能力示意收束。包含逐句实测中文旁白、可关闭字幕和原创五轨混音。参考资料及能力边界见 production/sources.md。",
  "renderer": "three",
  "engineProtocol": 1,
  "composition": {
    "width": 1920,
    "height": 1080
  },
  "duration": 216,
  "fps": 60,
  "audioTracks": [
    {
      "id": "narration",
      "name": "中文旁白",
      "kind": "file",
      "src": "films/work-0560feb5/audio/narration.mp3",
      "start": 0,
      "duration": 216,
      "gain": 0.9
    },
    {
      "id": "harmony",
      "name": "和声 · 主旋律",
      "kind": "file",
      "src": "films/work-0560feb5/audio/harmony.mp3",
      "start": 0,
      "duration": 216,
      "gain": 1
    },
    {
      "id": "pulse",
      "name": "琶音 · 低音",
      "kind": "file",
      "src": "films/work-0560feb5/audio/pulse.mp3",
      "start": 0,
      "duration": 216,
      "gain": 1
    },
    {
      "id": "drums",
      "name": "鼓组 · 节奏",
      "kind": "file",
      "src": "films/work-0560feb5/audio/drums.mp3",
      "start": 0,
      "duration": 216,
      "gain": 1
    },
    {
      "id": "fx",
      "name": "转场 · 交互音效",
      "kind": "file",
      "src": "films/work-0560feb5/audio/fx.mp3",
      "start": 0,
      "duration": 216,
      "gain": 1
    }
  ],
  "accent": "#65e5ed",
  "poster": "films/work-0560feb5/poster.svg",
  "posterTime": 5,
  "tags": [
    "知识科普",
    "AI",
    "Agent",
    "原创音乐",
    "3D",
    "中文旁白"
  ],
  "status": "film",
  "beats": [
    {
      "id": "opening",
      "at": 5,
      "title": "超越对话",
      "detail": "对话框向执行工具转化"
    },
    {
      "id": "rules",
      "at": 22,
      "title": "规则匹配",
      "detail": "关键词在分支轨道上匹配"
    },
    {
      "id": "dead-end",
      "at": 28,
      "title": "无法匹配",
      "detail": "规则的局限"
    },
    {
      "id": "network",
      "at": 43,
      "title": "从误差学习",
      "detail": "信号与误差反传"
    },
    {
      "id": "gradient",
      "at": 53,
      "title": "权重更新",
      "detail": "预测逼近目标"
    },
    {
      "id": "attention",
      "at": 72,
      "title": "上下文关联",
      "detail": "它与小猫的注意力示意"
    },
    {
      "id": "next-token",
      "at": 85,
      "title": "下一词元",
      "detail": "条件概率与采样示意"
    },
    {
      "id": "post-train",
      "at": 104,
      "title": "训练到有用",
      "detail": "预训练、示范和反馈"
    },
    {
      "id": "reasoning",
      "at": 124,
      "title": "推理与回退",
      "detail": "候选路径和回退"
    },
    {
      "id": "multimodal",
      "at": 135,
      "title": "多模态",
      "detail": "视觉声音语言汇聚"
    },
    {
      "id": "tools",
      "at": 151,
      "title": "工具执行",
      "detail": "读取、编辑与真实回执"
    },
    {
      "id": "failure",
      "at": 162,
      "title": "测试失败",
      "detail": "错误反馈至编辑器"
    },
    {
      "id": "passed",
      "at": 171,
      "title": "修复通过",
      "detail": "再运行与验证"
    },
    {
      "id": "software",
      "at": 182.5,
      "title": "编写软件",
      "detail": "能力示意"
    },
    {
      "id": "research",
      "at": 184.6,
      "title": "检索研究",
      "detail": "能力示意"
    },
    {
      "id": "data",
      "at": 186.7,
      "title": "数据分析",
      "detail": "能力示意"
    },
    {
      "id": "media",
      "at": 188.8,
      "title": "生成影像",
      "detail": "能力示意"
    },
    {
      "id": "audio",
      "at": 190.9,
      "title": "声音与音乐",
      "detail": "能力示意"
    },
    {
      "id": "math",
      "at": 193,
      "title": "数学探索",
      "detail": "能力示意"
    },
    {
      "id": "algorithms",
      "at": 195.1,
      "title": "优化算法",
      "detail": "能力示意"
    },
    {
      "id": "protein",
      "at": 197.2,
      "title": "生命结构",
      "detail": "能力示意"
    },
    {
      "id": "weather",
      "at": 199.3,
      "title": "天气预测",
      "detail": "能力示意"
    },
    {
      "id": "robot",
      "at": 201.4,
      "title": "机器人行动",
      "detail": "能力示意"
    },
    {
      "id": "ending",
      "at": 210,
      "title": "开始创造",
      "detail": "回到人类意图与行动"
    }
  ],
  "subtitles": [
    {
      "start": 1,
      "end": 3.839,
      "text": "以前，你给人工智能一句话，它回你一段话。"
    },
    {
      "start": 4.419,
      "end": 8.048,
      "text": "现在，你给它一个目标，它开始调用工具，检查结果。"
    },
    {
      "start": 8.628,
      "end": 10.102,
      "text": "语言，正在变成行动。"
    },
    {
      "start": 17,
      "end": 20.491,
      "text": "最早的一类聊天程序，靠关键词触发写好的回答。"
    },
    {
      "start": 21.071,
      "end": 24.579,
      "text": "命中规则，就沿着轨道走；换一种说法，就可能卡住。"
    },
    {
      "start": 25.159,
      "end": 28.216,
      "text": "于是，人们换了一个思路：不再把每条规则写死。"
    },
    {
      "start": 28.796,
      "end": 32.165,
      "text": "而是给机器大量例子，让它自己调整内部参数。"
    },
    {
      "start": 37,
      "end": 40.892,
      "text": "神经网络把输入变成数字，让信号穿过一层层连接。"
    },
    {
      "start": 41.472,
      "end": 44.617,
      "text": "先预测，再比较答案；误差沿网络反向传播。"
    },
    {
      "start": 45.197,
      "end": 49.358,
      "text": "每次更新，都微调连接的权重，让下一次预测更接近目标。"
    },
    {
      "start": 49.938,
      "end": 54.057,
      "text": "更多数据、更强算力和更好的方法，让网络学到复杂规律。"
    },
    {
      "start": 54.637,
      "end": 58.728,
      "text": "它不是把答案装进抽屉，而是在参数中形成可迁移的模式。"
    },
    {
      "start": 63,
      "end": 65.828,
      "text": "真正改变语言模型的一步，是注意力机制。"
    },
    {
      "start": 66.408,
      "end": 70.32,
      "text": "一句话被拆成词元，转换为向量，再计算彼此的关联。"
    },
    {
      "start": 70.9,
      "end": 74.909,
      "text": "小猫追着光点跑，它很兴奋。这个它，更应该关注小猫。"
    },
    {
      "start": 75.489,
      "end": 80.216,
      "text": "二零一七年的注意力架构，让这种关联计算更容易大规模并行训练。"
    },
    {
      "start": 80.796,
      "end": 84.621,
      "text": "生成时，模型根据已有上下文，预测下一个词元的概率。"
    },
    {
      "start": 85.201,
      "end": 89.576,
      "text": "选出一个，接回上下文，再预测下一个，语言就这样逐步展开。"
    },
    {
      "start": 93,
      "end": 95.019,
      "text": "但会续写，不等于会帮助人。"
    },
    {
      "start": 95.599,
      "end": 100.225,
      "text": "预训练从大量文本和代码中学习规律；指令微调，示范怎样回答。"
    },
    {
      "start": 100.805,
      "end": 104.381,
      "text": "人类偏好和可验证反馈，再推动模型变得更有用。"
    },
    {
      "start": 104.961,
      "end": 109.698,
      "text": "进步不是只把模型做大，还来自数据质量、训练方法和系统工程。"
    },
    {
      "start": 110.278,
      "end": 114.587,
      "text": "这些过程改变参数，不代表你每问一句，它就现场重新训练。"
    },
    {
      "start": 117,
      "end": 119.26,
      "text": "接着，模型不再总是立刻给出答案。"
    },
    {
      "start": 119.84,
      "end": 124.972,
      "text": "通过专门训练和更多推理计算，它可以分解问题，尝试路线，再检查。"
    },
    {
      "start": 125.552,
      "end": 128.774,
      "text": "失败的路径被放弃，有证据的路径继续向前。"
    },
    {
      "start": 129.354,
      "end": 132.955,
      "text": "图像、声音与文字，也被编码成可以共同处理的表示。"
    },
    {
      "start": 133.535,
      "end": 136.546,
      "text": "它能看图、听声音、理解更复杂的上下文。"
    },
    {
      "start": 137.126,
      "end": 140.86,
      "text": "但说得流畅，仍然不等于正确，检查结果至关重要。"
    },
    {
      "start": 143,
      "end": 146.705,
      "text": "智能体，往前又走了一步：把模型接入能够行动的环境。"
    },
    {
      "start": 147.285,
      "end": 149.473,
      "text": "比如，你让它把一个想法做成网站。"
    },
    {
      "start": 150.053,
      "end": 153.926,
      "text": "它先拆解目标，读取资料，然后调用工具，编辑文件。"
    },
    {
      "start": 154.506,
      "end": 159.195,
      "text": "工具返回真实结果，模型据此决定下一步，而不是假装已经完成。"
    },
    {
      "start": 159.775,
      "end": 162.362,
      "text": "测试失败了？读错误，改代码，再运行。"
    },
    {
      "start": 162.942,
      "end": 167.83,
      "text": "观察、计划、执行、验证，这个循环，让一次回答变成持续推进的任务。"
    },
    {
      "start": 168.41,
      "end": 173.326,
      "text": "记忆和检索保留必要信息；权限、预算和停止条件，限制行动范围。"
    },
    {
      "start": 173.906,
      "end": 176.647,
      "text": "能自主推进，不等于可以绕过人的授权。"
    },
    {
      "start": 181,
      "end": 183.982,
      "text": "现在，看看不同顶尖系统已经展示的能力。"
    },
    {
      "start": 184.562,
      "end": 186.769,
      "text": "编写软件，检索研究，分析数据。"
    },
    {
      "start": 187.349,
      "end": 189.458,
      "text": "生成图像、视频、声音和音乐。"
    },
    {
      "start": 190.038,
      "end": 192.307,
      "text": "辅助数学探索，设计更好的算法。"
    },
    {
      "start": 192.887,
      "end": 195.279,
      "text": "预测蛋白质结构，推演全球天气。"
    },
    {
      "start": 195.859,
      "end": 198.669,
      "text": "看懂环境，控制机器人，操作数字工具。"
    },
    {
      "start": 199.249,
      "end": 202.542,
      "text": "这些能力来自不同系统，并非一款模型无所不能。"
    },
    {
      "start": 207.35,
      "end": 209.637,
      "text": "从接住一句话，到推进一个目标。"
    },
    {
      "start": 210.217,
      "end": 212.368,
      "text": "下一次，你准备让它，创造什么？"
    }
  ],
  "credits": [
    "导演脚本、三维动画、音乐与声音设计：本作品原创",
    "旁白：Kokoro 中文 zm_yunyang（Apache-2.0），逐句实测对齐",
    "图形为机制及能力示意，不是模型内部实拍或产品录屏",
    "资料核实日期：2026-10-01；完整来源：production/sources.md",
    "不同系统能力与条件不同，不表示单一模型无所不能"
  ]
}, load: () => import('./scene') };
export default project;
