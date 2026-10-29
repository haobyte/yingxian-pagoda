# 应县木塔 · 完整三维交互原版

计划地址（当前已撤下）：https://haobyte.github.io/yingxian-pagoda/

当前仅整理发布分支，尚未提交、推送或上线。

本分支发布包含 **26 尊真实 GLB 资产**的完整版，保留原项目的塔体、屋面、斗拱、场地、材质、阴影、镜头和交互。不是使用造像图卡的小红书轻量版。

支持自由旋转、九层拆解、核心柱网、剖切逐层看佛、万佛出塔、三塔对比、倾斜时间轴、中英文切换，以及独立造像对照册。对照册包含26尊GLB及AI现貌、推测复原的分列展示；“真实照片”一栏因来源待核实，公开版暂缺。

## 开发与部署

需要 Node.js 22+。运行 `npm ci`、`npm run build`、`npm run check`。

`npm run preview` 打开本地预览。`npm test` 检查完整版主场景和所有模型；`npm run test:atlas` 单独检查对照页的26个模型，适合云端软件渲染环境。测试前运行 `npx playwright install chromium`；本机也可以用 `CHROME_PATH` 指定Chrome。`BASE_URL` 可指定线上测试地址。

GitHub Actions仅从main构建和发布dist。模型本体与原项目正式运行资源逐字节一致；`data/model-integrity.json` 固定26个模型摘要，检查同时拒绝图卡轻量版内容。相对资源路径使主页和对照页兼容Pages项目子目录。

`codex/opensource` 是独立公开分支，不包含原开发仓库的提交历史、旅行录像、原始生成实验或本机配置。旧的小红书误发版本已撤下，当前树完整替换为原版。后续只选择性同步需要公开的文件，不合并原master，不使用push --all/--mirror。

## 资源与边界

- `src/`：原版运行代码；部署适配仅增加资源前缀处理。
- `static/models/statues/`：26个正式GLB及来源记录，约93MB。
- `static/ref/`、`static/plaques/`：原版使用的照片与匾额。
- `static/comparison/`：对照册指定素材；不公开整个实验目录。
- `data/comparison.json`、`docs/asset-provenance.json`：来源映射、原文件摘要。来源JSON中本机绝对路径已移除，图像与模型不重新生成。

AI生成模型不等于实物测绘，遮挡细节、缺失部件与部分造像身份仍有不确定性；推测复原不能当作已经证实的历史原貌。原始参考照片、AI图和三维模型保持分列标识。

Three.js 和 Vite 均为 MIT 许可。页面首次加载会下载约93MB模型，实际速度与设备性能取决于访问环境。

## 许可

- 代码：[MIT](LICENSE)。
- 自有素材（26 个 GLB、AI 参考图、作者自拍照片）：[CC BY-NC 4.0](LICENSE-ASSETS.md)，需署名，禁止商用。模型和参考图由 AI 生成，详见该文件的 AI 生成声明。
- 第三方素材不受上述许可约束，需按各自来源条款使用：一层释迦牟尼佛正面照为 CC BY-SA 4.0（Patrick20242023，Wikimedia Commons）；陈明达《应县木塔》图版、展板和测绘图转摄照片、对照册中来源未登记的26张造像照片，因授权未核实，已从公开版移除。
