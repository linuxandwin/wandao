# Wandao 1.1.3 Release Notes

## 修复

- 修复知识星球导出时，部分文章代码块前会混入网页工具栏文字的问题。
- 典型表现为代码块前出现类似 `textjavascripttypescript...yaml Copy` 的异常文本。
- 导出器现在会在浏览器解析阶段跳过代码块工具栏，并在写入 Markdown 前再次清洗残留工具栏行。

## 改进

- 知识星球代码块提取更稳定，优先读取真实 `code` 或 `textarea` 内容，减少页面 UI 文本混入正文。
- 保留原有多层链接导出、评论区导出、图片本地化和增量导出逻辑。

## 验证

- 已执行 `python -m py_compile export_zsxq.py`。
- 已用反馈样例验证：代码块前的工具栏乱码会被删除，代码内容正常保留。
- 已执行 `git diff --check`。
- 已确认 `wandao_electron/package.json`、`wandao_electron/package-lock.json`、`pyproject.toml` 版本号为 `1.1.3`。

## 下载

- Windows 安装版：下载 `Wandao Setup 1.1.3.exe`。
- Windows 免安装版：下载 `Wandao 1.1.3.exe`。
- macOS Apple Silicon：下载 `Wandao-1.1.3-arm64-mac.zip`，适合 M1 / M2 / M3 / M4 芯片 Mac。
- macOS Intel：本次不默认提供自动构建包，Intel 芯片 Mac 用户可以先使用源码方式运行。

## 注意

- 普通用户请优先下载发行版，发行版内置 Python 运行时，不需要额外安装 Python。
- 源码运行可以直接使用项目根目录的 `start-wandao.cmd` 或 `start-wandao.sh`。
- 请只处理自己有权限访问的内容，并遵守目标平台服务条款和版权要求。
- 请勿在 Issue、PR、截图或日志里提交 Cookie、账号密码、App Secret、Token、API Key 等敏感信息。
