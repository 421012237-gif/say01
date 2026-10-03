# 本地工具用法

## 能力与环境
Node.js >=20.9，sharp 0.35.4。图像生成由宿主工具提供，脚本不调用 API、不联网。依赖缺失时先说明用途与安装影响，优先使用宿主已提供的依赖；确需安装可在 Skill 目录运行 npm install --omit=dev。不要安装到全局。安装的精确磁盘占用依系统而定，应实际检查，不预先编造。

优先使用当前宿主提供的运行时。Codex 桌面若有工作区依赖定位工具，可使用其返回的 Node 可执行文件及 NODE_PATH；其他宿主不要调用不存在的Codex工具。这些路径只用于当次运行，不写回 Skill 或客户模板。

先在实际执行器中运行 `node scripts/runtime-check.cjs`，它仅用内存中的合成图检查Node、sharp和GIF编码，无网络、无客户文件读写。退出码0表示当前导出运行时通过；2表示缺依赖、版本不符或编码失败；1表示参数／内部错误。检查通过不等于绘图、视觉检查、写文件和手机交付已通过。详见 [运行环境](runtime.md)。

## 初始化与设置
在 Skill 目录执行：
```sh
node scripts/sticker-kit.cjs init --project /path/to/customer-project
```
路径也可为 Windows 路径，含空格须按所用终端引用。初始化只接受空目录，不生成示例人物。

填写角色规范、准备原始帧并编辑 project.json。target 可为 personal 或 wechat_album。首版工具固定导出240×240、500KB以内的GIF；personal仅解除专辑数量、配套和官方核验记录要求，不改变导出规格。默认 personal 是为了不把未核验平台要求当成已通过。真正微信专辑交付前切为 wechat_album，核验官方规则并填写 platform.reviewed_on 和 source。

每款示例配置：
```json
{
  "id": "01",
  "meaning": "你好",
  "revision": "v1",
  "source": "source/01.png",
  "grid": [2, 2],
  "order": [1, 2, 3, 4],
  "delays_ms": [350, 200, 200, 350],
  "anchor": "head",
  "cleanup_min_pixels": 0,
  "allow_edge_touch": false,
  "visual_review": {"status": "pending", "gif_sha256": "", "notes": []}
}
```

- source 是透明序列图，grid 为“列数、行数”，按从左到右、从上到下编号。也可以用 frames: ["source/f1.png","source/f2.png",...] 代替 source/grid。
- order 使用 **从1开始** 的源帧编号，允许重复，但最终必须有真实不同画面。示例 [1,2,4,2] 会排除第3帧。
- delays_ms 长度与 order 一致，40～10000ms、10ms的整数倍。根据实际循环调整，不统一机械套速度。
- head 根据主体上部估算头部锚点，适合半身人像；canvas 保留各格原始位置。主动上下跳跃、点头或鞠躬不宜被 head 对齐抵消。头部俯仰而躯干应稳定时，优先检查 canvas 或以胸口／躯干为基准的手动 anchors，实际检查身体稳定及点头幅度后再选定。
- 可用 anchors: [[x,y],...] 指定每张源帧的锚点，长度等于原始帧数，坐标是该帧／格内像素。
- cleanup_min_pixels 默认0，不删除独立小图案；若确认小碎点是噪声，可设如60或80，然后检查星星、眼泪等是否被误删。
- allow_edge_touch 仅用于已确认的有意裁切；不能用它掩盖被格边切断的肩膀或头发。
- 路径限定项目内部，拒绝绝对路径和逃逸到外部的链接。新客户先复制其所需参考至自己的项目，不共用私人文件目录。

## 导出、检查与复核
```sh
node scripts/sticker-kit.cjs export --project /path/to/customer-project --id 01
node scripts/sticker-kit.cjs validate --project /path/to/customer-project
```

输出 renders/01/v1/ 下的逐帧PNG、sticker.gif、preview.png 和 render-report.json。已存在 revision 拒绝覆盖；返修修改为 v2 再导出。

检查报告验证240×240、<=500000字节、无限循环、透明、多帧有变化、至少5像素边缘余量。并不理解脸和首饰。看完原图、所有导出帧、真实循环以及深浅背景，才将 visual_review.status 写 passed，gif_sha256 填本次报告的 gif.sha256，并在 notes 写具体检查依据。validate 返回码2表示仍有阻塞项；导出及参数错误返回码1。

## 微信配套配置
先制作并缩放到正确尺寸，再放到项目source/，例如：
```json
{
  "cover": {
    "source": "source/cover.png",
    "visual_review": {"status": "pending", "file_sha256": "", "notes": []}
  },
  "icon": {
    "source": "source/icon.png",
    "visual_review": {"status": "pending", "file_sha256": "", "notes": []}
  },
  "banner": {
    "source": "source/banner.jpg",
    "visual_review": {"status": "pending", "file_sha256": "", "notes": []}
  }
}
```
放入 project.json 的 support。validate 会给每项摘要；图像检查后填写对应记录。脚本不会自动认定“无白描边”“有故事感”或“肖像已授权”。

## 打包
```sh
node scripts/sticker-kit.cjs package --project /path/to/customer-project
```
所有技术与视觉记录通过后，输出 delivery/v1/ 与 delivery/v1.zip；v1 来自 project.json 的 release，已存在则换新版本。
- stickers/：主GIF。
- static/：静态备份。
- assets/：微信三项配套（personal 可不提供）。
- meanings.csv、preview.html、overview.jpg、checks.json、使用说明.md。个人版说明直接指导微信添加；仅wechat_album另附上传说明.md。

ZIP由本地工具生成，无额外压缩软件依赖；HTML自带图片，可离线打开。打包不上传任何内容。它不是账号登录、版权核验或平台审核。

## 常见故障
缺少 sharp → 先找宿主依赖；否则按安装说明安装本目录依赖。
无 alpha／背景不透明 → 用绘图工具重新生成或编辑透明背景，不能把白底简单标成“透明”。
源帧碰边 → 修复分格和轮廓，或经复核后记录有意裁切。
视觉记录过期 → 查看新输出，再绑定新摘要；不批量复制旧记录。
动画只有单帧 → 检查源图是否真的有不同画面与帧序。
超过500KB → 减少冗余帧／调整动画设计或编码，再复核，不降低到已不能识别人脸却宣称通过。
导出头部跳动 → 检查锚点估算，使用手动锚点或 canvas，不要只拉长帧时长。

## 内置画风样片

新人物绘图前运行 `node scripts/resolve-style.cjs`。返回已核验摘要的包内绝对图片路径及各自角色；不依赖工作目录、客户另上传画风图或本机私有配置。缺图或摘要不符时退出码2，无成功输出。这个工具只准备参考，不调用绘图；Agent仍须打开图片、传给实际绘图工具并检查成品。
