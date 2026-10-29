import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "tiny-seed",
  title: "一颗种子的四季",
  subtitle: "把看不见的生长，变成看得见的故事。",
  description: "一颗种子在雨中扎根、向阳开花，蜜蜂短暂停留，绒球成熟后把新种子交还给风。镜头从土壤近景跟随到花朵，以三拍子室内乐讲述生命循环的艺术寓言。",
  renderer: "canvas",
  accent: "#ebce84",
  poster: "films/tiny-seed/poster.webp",
  posterTime: 26.8,
  tags: ["矢量形变","生长动画","因果叙事"],
  credits: ["矢量画面、花卉与角色动作：本项目原创","原创三拍子配乐：钢琴、竖琴、大提琴、弦乐、长笛与钢片琴；GeneralUser GS 乐器采样","Canvas 2D + GSAP（MorphSVG 叶片形变）；雨滴、根系、花瓣、蜜蜂与种子启程的连续近景"],
  timelines: ["main"],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
};
export default project;
