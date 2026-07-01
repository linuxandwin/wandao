# Wandao 1.1.2 Release Notes

## 新增

- 新增 provider 平台配置结构：平台入口、脚本、默认目录、能力声明逐步从 UI 代码中抽离，后续新增平台更容易维护。
- 新增“任务历史”：导入导出任务会保存最近记录，可查看完成、失败、停止状态。
- 新增“继续/重试”任务：可按历史命令重新执行未完成任务，配合各平台增量能力补齐缺失内容。
- 新增单次任务报告：可复制某一次任务的统计、错误、失败项、返回数据和本任务详细日志。
- 新增日志视图切换：日志区右上角可在“用户日志”和“详细日志”之间切换。
- 新增“提交错误报告给开发者”：自动复制脱敏后的完整日志，便于反馈问题。

## 改进

- 普通用户日志更清晰：错误会按未登录、无权限、限流、页面结构变化、图片附件失败、API 权限不足、本地路径问题等分类提示。
- Python 原始输出、JSON、错误堆栈不再直接刷到用户日志，而是进入详细日志和错误报告。
- 桌面端左侧平台入口改为 provider 自动生成，减少平台越来越多后 UI 维护压力。
- 帮助菜单新增“新手模式 / 使用教程”，可直接打开项目使用文档。
- README 快速开始重新简化：普通用户优先下载发行版，源码启动命令更短。
- 新增 `npm run install:cn`：当 `npm install` 下载 Electron 卡住时，可使用国内镜像安装。
- 新增 `wandao_electron/.npmrc`，为源码开发提供 npm 国内镜像和重试参数。
- 新增 `docs/Provider接入说明.md`，说明后续平台 provider 接入方式。

## 当前限制

- “继续/重试”目前是按历史命令重新执行，依赖各平台已有增量逻辑跳过已完成内容。
- “只重试失败项”已在任务报告中保留失败项数据入口，但需要各平台脚本进一步统一返回可重试 ID 后才能精确执行。

## 验证

- 已执行 `node --check wandao_electron/main.js`。
- 已执行 `node --check wandao_electron/renderer/app.js`。
- 已执行 `node --check wandao_electron/renderer/providers.js`。
- 已执行 `node --check wandao_electron/scripts/npm_install_cn.js`。
- 已执行 `git diff --check`。
- 已确认 `wandao_electron/package.json`、`wandao_electron/package-lock.json`、`pyproject.toml` 版本号为 `1.1.2`。

## 下载

- Windows 安装版：下载 `Wandao Setup 1.1.2.exe`。
- Windows 免安装版：下载 `Wandao 1.1.2.exe`。
- macOS Apple Silicon：下载 `Wandao-1.1.2-arm64-mac.zip`，适合 M1 / M2 / M3 / M4 芯片 Mac。
- macOS Intel：本次不默认提供自动构建包，Intel 芯片 Mac 用户可以先使用源码方式运行，后续按需求补充。

## 注意

- 普通用户请优先下载发行版，发行版内置 Python 运行时，不需要额外安装 Python。
- 源码运行或参与开发时，仍需要自行安装 Python 3.10+ 和 Node.js。
- 如果源码运行时 `npm install` 长时间不动，可以在 `wandao_electron` 目录执行 `npm run install:cn`。
- 请只处理自己有权限访问的内容，并遵守目标平台服务条款和版权要求。
- 请勿在 Issue、PR、截图或日志里提交 Cookie、账号密码、App Secret、Token、API Key 等敏感信息。
