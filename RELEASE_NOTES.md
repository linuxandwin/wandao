# Wandao 1.1.1 Release Notes

## 新增

- 新增 ima 知识库导出：支持读取 ima 知识库目录树，并按知识库、文件夹或文件勾选导出到本地。
- 新增 ima 知识库导入：支持将本地 Markdown、PDF、Word、PPT、Excel、图片、TXT、Xmind、音频等文件上传到 ima 知识库。
- 桌面端左侧“导出 / 导入”分组新增 ima 知识库入口。
- ima 导入新增目标文件夹选择：用户可以先读取目标知识库已有文件夹，再从下拉框选择上传位置。

## 改进

- 修复知识星球多层文章目录导出：`articles.zsxq.com` 目录文章会先保存当前页，再继续导出页面内的子文章链接，避免把目录文章误判为跳转页。
- 优化知识星球目录项导出：目录帖子内嵌文章时会直接下钻到真正文章页，减少中间壳文件对 URL 深度的消耗。
- 知识星球导出会从正文 Markdown 再补扫一次链接，降低页面转换过程中漏掉深层链接的概率。
- 飞书导出补充云文档和云空间文件夹入口支持，可导出普通云文档、云空间文件夹及其层级内容。
- 阿里云 Thoughts 导出保留多级子文档目录，并尽量把文档间引用改写为本地相对链接。
- ima 导入默认跳过 Markdown 正文引用到的本地图片和附件，避免配图被重复当成独立知识库文件上传。
- ima 导入支持扫描本地目录并统计待上传文件，单文件测试通过后再批量上传。
- README 重新整理为更简洁的项目首页结构，补充 Gitee 镜像入口，突出支持平台、快速开始、常用流程和合规说明。
- 版本号统一升级到 `1.1.1`，用于这次新增 ima 知识库导入导出能力，并包含知识星球多层目录和 macOS 打包修复。

## 当前限制

- ima OpenAPI 当前未提供明确的“创建知识库文件夹”接口，所以导入可以写入知识库根目录或已有文件夹，暂不能自动把本地多级目录完整重建到 ima。
- ima 笔记类内容导出受官方 API 返回内容影响，会尽量保存为 Markdown 文本；普通文件会尽量保存原文件。

## 验证

- 已执行 `python -m py_compile ima_knowledge.py wandao.py`。
- 已执行 `python -m py_compile export_zsxq.py export_feishu.py export_aliyun_thoughts.py`。
- 已执行 `node --check wandao_electron/main.js`。
- 已执行 `node --check wandao_electron/renderer/app.js`。
- 已实测知识星球链路：栏目文章 -> 目录文章 -> 目录内文章链接，目录页识别 139 个链接，导出 61 篇文章，按默认规则跳过 78 个视频主题，失败 0。
- 已执行敏感信息扫描，确认仓库文件中不包含本次测试用账号、密码、API Key。

## 下载

- Windows 安装版：下载 `Wandao Setup 1.1.1.exe`。
- Windows 免安装版：下载 `Wandao 1.1.1.exe`。
- macOS Apple Silicon：下载 `Wandao-1.1.1-arm64-mac.zip`，适合 M1 / M2 / M3 / M4 芯片 Mac。
- macOS Intel：本次不默认提供自动构建包，Intel 芯片 Mac 用户可以先使用源码方式运行，后续按需求补充。

## 注意

- 普通用户请优先下载发行版，发行版内置 Python 运行时，不需要额外安装 Python。
- 源码运行或参与开发时，仍需要自行安装 Python 3.10+ 和 Node.js。
- 请只处理自己有权限访问的内容，并遵守目标平台服务条款和版权要求。
- 请勿在 Issue、PR、截图或日志里提交 Cookie、账号密码、App Secret、Token、API Key 等敏感信息。
