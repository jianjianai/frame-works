# 内容依据与边界

资料核实：2026-10-01。此片为原创机制与能力示意动画，不是模型内部实拍，也不冒充产品录屏。片中概率数值仅用于解释，不是实测模型输出。能力蒙太奇代表不同系统的公开能力，不是单一模型排名，不承诺任意任务都能成功。

## 机制

- Transformer / Attention Is All You Need，Google Research，2017。注意力计算序列内部关联，利于并行训练；自回归生成仍逐步产生词元。https://research.google/pubs/attention-is-all-you-need/
- Aligning language models to follow instructions，OpenAI，2022。监督示范和人类偏好反馈改变模型行为；流畅或有用并不意味着不会出错。https://openai.com/index/instruction-following/
- Learning to reason with LLMs，OpenAI。训练和推理计算支持分解、尝试、检查；动画不宣称读取隐藏思维或具备人类意识。https://openai.com/index/learning-to-reason-with-llms/
- Building effective agents，Anthropic。模型、工具、记忆、环境反馈、停止条件组成任务循环；区别预设工作流与动态决策。https://www.anthropic.com/engineering/building-effective-agents

## 结尾能力

- 软件编写与执行测试：Codex。https://openai.com/index/introducing-codex/
- 检索研究、汇总来源、数据和代码分析：Deep research。https://openai.com/index/introducing-deep-research/
- 影像生成：Veo 系列。https://deepmind.google/models/veo/
- 音乐生成：Lyria 系列。https://deepmind.google/models/lyria/
- 数学探索和算法改进：AlphaEvolve。强调自动评估和验证，不声称解出所有开放问题。https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/
- 蛋白质结构预测：AlphaFold。不是自动完成药物研发或临床验证。https://deepmind.google/science/alphafold/
- 全球天气预测：WeatherNext。预测存在不确定性，不是绝对准确的未来记录。https://deepmind.google/science/weathernext/
- 机器人感知与控制：Gemini Robotics。特定实验和系统条件下的能力，不代表任何机器人都能完成所有现实任务。https://deepmind.google/models/gemini-robotics/

## 创作素材

三维结构、动效、转场、音乐和音效均为本作品程序化原创，不包含第三方影片片段或商业音乐采样。中文旁白使用平台内置 Kokoro / zm_yunyang，模型许可 Apache-2.0，参考 https://huggingface.co/hexgrad/Kokoro-82M 。逐句缓存、实测时长与字幕在 production/voice、production/narration-timing.json 和 public/captions.srt。音乐可由 production/build-score.mjs 确定性重建。
