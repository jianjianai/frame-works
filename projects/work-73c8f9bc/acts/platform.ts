// 第一幕的短视频 App 按时间轴换平台：main 是抖音样式；xhs（小红书版）不能出现抖音的字样和配色，
// 换成小红书的叫法（小红书号、笔记、获赞与收藏、评论和@）和品牌红；小红书的界面版式在 redbook.ts。
// 在 render 里调用（timeline() 不能在模块加载时读）。
import { timeline } from "@frame/engine/timeline";

export const xhs = () => timeline().id === "xhs";

/** the app's accent red (buttons, badges, the 「我」 tag, the 拉黑 action) */
export const accent = () => (xhs() ? "#ff2442" : "#fe2c55");
/** the accent as `r,g,b` for rgba() tints */
export const accentRgb = () => (xhs() ? "255,36,66" : "254,44,85");

/** the words that name the platform's features */
export const words = () =>
  xhs()
    ? {
        accountId: "小红书号：",
        works: "笔记",
        likes: "收藏",
        noWorks: "还没有笔记",
        noWorksHint: "TA 还没有发布过笔记",
        blockedHint: "对方无法再评论你的笔记",
        inbox: "评论和@",
        inboxSub: "收到的评论和@",
        postTag: "",
        commentHint: "说点什么…",
      }
    : {
        accountId: "抖音号：",
        works: "作品",
        likes: "喜欢",
        noWorks: "暂无作品",
        noWorksHint: "TA 还没有发布过作品",
        blockedHint: "对方无法再评论你的作品",
        inbox: "互动消息",
        inboxSub: "评论与回复",
        postTag: "我的日常",
        commentHint: "留下你的评论…",
      };

/** the profile's three numbers, left to right; the middle one is always 「1 关注」 (shot 4 frames and taps it there) */
export const profileStats = (): [string, string][] =>
  xhs()
    ? [["0", "粉丝"], ["1", "关注"], ["0", "获赞与收藏"]]
    : [["0", "获赞"], ["1", "关注"], ["0", "粉丝"]];
