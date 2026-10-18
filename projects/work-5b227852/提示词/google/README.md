# 《引力》全片出图提示词（Google 图像模型）

用户用 Google 的图像模型（Gemini / AI Studio）出图，出好的图交给 AI 做进片子。这里是全片需要的全部提示词，按批次排好。

| 文件 | 内容 | 出好以后 AI 怎么用 |
|---|---|---|
| `README.md`（本文） | 用法、通用风格、出图顺序、风格关键帧 K1–K3、通用检查 | 定画风 |
| `1-角色.md` | 全员身高对比、每个人的转面图、拆件图、表情表 | 拆件图拆成部件挂到骨架上；转面和表情对着画 |
| `2-动作.md` | 按剧情排的动作序列（每张一串关键姿势）、手部特写 | 照着摆骨架的关键帧 |
| `3-场景.md` | 每一幕的背景（不带人），竖版 9:16 | 直接当背景层用（可以分层做视差） |
| `4-道具特写特效.md` | 道具表、直接用的特写插画、白光和化灰的参考 | 道具挂在手上；特写直接进片 |

## 怎么用

1. **每条都上传参考图。** Google 的模型能看图，上传设定图比文字描述更能保证同一个人。每条提示词前面写了要传哪几张，例如「图 1：秤砣设定图」。
   - 秤砣现在的设定：`public/ref/秤砣-拆件图.png`（全套服装的三视图和拆件，带围巾）。
   - 别的角色：第一张转面图出好、确认以后，之后所有带这个人的图都把它传上去。
   - 场景：K1 定下来以后，所有场景都把 K1 传上去当画风参考。
2. **一个人物在同一个对话里出**，模型记得前面的图，脸和衣服更稳。换下一个人物开新对话。
3. **画幅**：AI Studio 里直接选比例；Gemini App 里在提示词开头写「竖版 9:16」或「横版 3:2」。场景、关键帧、特写用竖版 9:16；设定图、动作序列用横版 3:2。
4. **提示词里的［风格·角色］［风格·场景］［秤砣］这类方括号**，换成下面或 `1-角色.md` 里对应的那一段（中文提示词换中文段，英文换英文段）。英文提示词一般更听话，两种都可以试。
5. **不满意就在同一个对话里接着改**：「同一张图，只把……改成……，其他不变」。
6. **砖上的字、价签上的字都不要让模型写**：中文字它常写错，砖一律画空白，字由 AI 在片子里加。
7. **交图**：传到作品里（`public/uploads/` 就行），告诉 AI 是哪一条（例如「K1」「角色 小石头 转面」「动作 A02」）。挑不出来时多给几张，AI 帮你挑。

## 通用风格

**［风格·角色］**

中文：二维日系动画角色设定，干净的深灰色细描边，大色块平涂，只有一层很淡的阴影（光从左上来），没有渐变、纹理和厚涂，纯白背景，没有地面影子，没有文字和水印。Q 版但不夸张的比例：大人约 5.5 头身，少女约 5 头身，七岁孩子约 3.5 头身；大而圆的眼睛、小点鼻子、淡粉腮红。

English: 2D anime character design, clean thin dark-gray outlines, flat cel colors with only one very light shadow tone (light from the upper left), no gradients, textures or painterly rendering, pure white background, no ground shadow, no text, no watermark. Slightly chibi but not exaggerated proportions: adults about 5.5 heads tall, the teenage girl about 5 heads, seven-year-old children about 3.5 heads; big round eyes, tiny dot nose, light pink blush.

**［风格·场景］**

中文：柔和的二维扁平插画背景，和角色同一套画风：干净的深灰色细描边，大色块平涂，柔和的光，不压抑（不用灰黑、不加重暗角）。世界观：这座城里的人一绝望就会飘起来；头顶三百米是一整片发光的「白」（天光），从地上看是白的，离近了是五颜六色的强光，下沿有柔和的光束和一道彩虹边；粉白色的灰像温柔的雪一样一直在落，地上薄薄积着一层。房子是粉、杏、薄荷、雾蓝、奶油色的，木门、条纹遮阳棚，窗里亮着暖黄的灯，窗外装着防飘的铁栏；街道上空横着一层层接人的网，大多破了洞、挂着灰；门口常摆着一双双彩色的空鞋。画面里不要有人，不要有文字。

English: Soft 2D flat illustration background in the same style as the characters: clean thin dark-gray outlines, flat color shapes, gentle light, never gloomy (no gray-black palette, no heavy vignette). World: in this city people float up when they despair; 300 meters overhead the whole sky is a glowing light called "the White" — white from below, a radiant multicolored light up close, with soft light rays and a rainbow fringe along its lower edge; pinkish-white ash falls constantly like gentle snow and lies thinly on the ground. Houses are pink, apricot, mint, misty blue and cream, with wooden doors, striped awnings, warm yellow lit windows and iron anti-float bars outside the windows; layers of catch-nets hang across the streets overhead, most of them torn and draped with ash; pairs of colorful empty shoes sit by many doors. No people in the image, no text.

**颜色**：白天的天是粉橙到淡紫的渐变；夜是靛蓝，不是黑，「白」在夜里是清冷的月白色；回忆是暖色、褪色的老照片。暖光 = 被人放在心上（别人送的砖发暖光、亮着的窗、握在一起的手）。拴脚的绳子都是红绳。每个人物有自己的标志色，人链里一眼认得出来（见 `1-角色.md`）。

## 出图顺序

1. **第一批：定画风。** K1–K3 三张风格关键帧，加上 `1-角色.md` 的 R1（秤砣补上围巾的设定图）。这四张给 AI 看过、定下来，再往下出。
2. **第二批：角色。** `1-角色.md` 全部：全员身高对比、每人的转面图、要动的人物的拆件图、主角的表情表。
3. **第三批：场景。** `3-场景.md`。
4. **第四批：动作。** `2-动作.md`。
5. **第五批：道具、特写、特效。** `4-道具特写特效.md`。

## 风格关键帧（第一批，竖版 9:16）

上传：图 1 秤砣设定图（`public/ref/秤砣-拆件图.png`）。

### K1　白天的街：她把飘起来的人拽下来（0:06）

中文：竖版 9:16 的动画关键帧，和图 1 同一个角色、同一套画风。一条粉、杏、薄荷色房子夹着的石板街，头顶横着破了洞、挂着灰的网，最上方是发光的「白」；粉白色的灰像雪一样落着。画面中下方：图 1 的女孩（秤砣）刚从空中落地，一双大铁靴砸进石板，裂纹和一圈灰向四周炸开，她单手还攥着一个穿灰蓝西装、蓝领带的男人的脚踝——男人被拽下来，膝盖磕在地上，脚踝上拖着一截割断的红绳，一个棕色公文包掉在旁边。街边几个撑着彩色雨伞的路人低着头走过，没有人抬头。镜头略微仰拍，构图干净，人物占画面下半部分。［风格·场景］

English: Vertical 9:16 animation key frame, same character and art style as image 1. A stone-paved street between pink, apricot and mint houses, torn ash-draped catch-nets overhead and the glowing White at the very top; pinkish-white ash falls like snow. In the lower middle: the girl from image 1 (Chengtuo) has just landed from the air — her huge iron boots slam into the paving stones, cracks and a ring of ash burst outward — and one of her hands still grips the ankle of a man in a gray-blue suit and blue tie; he has been yanked down onto his knees, a cut red rope trailing from his ankle, a brown briefcase fallen beside him. A few passersby with colorful umbrellas walk past with their heads down; nobody looks up. Slight low angle, clean composition, figures in the lower half. [scene style]

### K2　夜里的网（0:42）

中文：竖版 9:16 的动画关键帧。靛蓝色的夜（不是黑），头顶是月白色发光的「白」。全城的人睡着觉飘在楼顶和白之间，每个人脚踝上拴着一根红绳连到下面的窗口和楼顶，几百根红绳交错成一张盖住整座城的网；人都闭着眼，头发和衣角朝上飘，像沉在水里。正中是全城最高的一栋细高楼，楼顶几乎碰到白。远处楼群的窗里亮着暖黄的灯。安静、美、让人窒息。［风格·场景］（这一张里要画人：把「画面里不要有人」去掉）

English: Vertical 9:16 animation key frame. An indigo night (not black), the White overhead glowing a cool moonlight white. The whole city's people float asleep between the rooftops and the White, each with a red rope tied to the ankle leading down to a window or rooftop; hundreds of red ropes crisscross into a web covering the whole city; everyone's eyes are closed, hair and clothes drifting upward as if underwater. In the center stands the city's tallest, slender tower, its top almost touching the White. Warm yellow windows glow in the distant buildings. Quiet, beautiful, suffocating. [scene style] (people are wanted in this one: drop "no people")

### K3　人链（2:06）

中文：竖版 9:16 的动画关键帧，和图 1 同一个角色。从街面到天上的一条竖直的人链：每个人用双手抓住上面那个人的脚踝，一个接一个，穿过破了洞的网，擦过一扇扇亮起来的窗，一直连到画面顶端发光的「白」的边上；链上的人都光着脚，胸前用红绳挂着一小块砖，砖发着暖光，连成一串暖光。最顶上一个穿大橘色外套的小男孩伸手抓住图 1 女孩光着的脚踝，她在白的边上低头看着他，头发边缘发亮。街上铺满了脱下来的彩色鞋子。壮阔、温暖。［风格·场景］（这一张里要画人）

English: Vertical 9:16 animation key frame, same character as image 1. A vertical human chain from the street to the sky: each person grips the ankle of the person above with both hands, one after another, passing through torn catch-nets and past windows lighting up, reaching all the way to the edge of the glowing White at the top; everyone in the chain is barefoot, with a small brick hanging on a red string at the chest, each brick glowing warmly so they form a string of warm lights. At the very top a little boy in an oversized orange coat reaches up and grips the bare ankle of the girl from image 1; she looks down at him at the edge of the White, the edges of her hair glowing. The street below is covered with the colorful shoes everyone took off. Epic and warm. [scene style] (people are wanted in this one)

## 通用检查（每张都看）

- 画风和 K1 一致：细描边、平涂、一层淡阴影，没有厚涂、渐变和写实光影。
- 人物和传上去的设定图是同一个人：脸、发型、衣服、配色、靴子都对。秤砣的袖标在她自己的左臂，围巾垂下的一头在画面右边（她的左边）。
- 白底的图真的是纯白，没有地面阴影、没有灰底。
- 没有文字、水印、签名（砖、价签留白）。
- 设定图、动作序列：全身完整入画，几个姿势一样大、站在同一条地平线上，互相不重叠。
- 场景：不带人（关键帧除外），竖版，颜色不压抑。
