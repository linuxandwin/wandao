# 参与贡献

感谢你愿意为万能导 Wandao 做贡献。

万能导的目标是减少用户手动复制、整理、迁移知识库文档的重复劳动。欢迎提交 Bug 修复、平台适配、导入导出效果优化、文档补充和界面体验改进。

## 贡献前请先了解

- 请只围绕用户有权限访问的内容做自动化整理，不要提交绕过登录、绕过权限、规避平台访问控制的实现。
- 请不要在 Issue、PR、截图或测试文件里提交 Cookie、账号密码、App Secret、Token 等敏感信息。
- 涉及平台导出或导入时，请尽量说明测试平台、入口类型、是否包含图片/附件/多层目录。
- 大功能建议先开 Issue 讨论，避免实现方向和项目定位偏离。

## 开源协议

万能导采用 AGPL-3.0-only 协议开源。提交 PR 即表示你同意将贡献内容按本项目协议授权。

如果贡献内容参考了第三方项目，请在 PR 中说明来源和许可证。不要直接复制许可证不兼容的代码、图片或文档；如果只是借鉴思路，也请尽量写清楚实现方式是自己完成的。

## 本地开发

```powershell
git clone https://github.com/tllovesxs/wandao.git
cd wandao
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
cd wandao_electron
npm install
npm start
```

macOS/Linux：

```bash
git clone https://github.com/tllovesxs/wandao.git
cd wandao
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cd wandao_electron
npm install
npm start
```

## 推荐检查

提交 PR 前建议至少运行：

```powershell
python -m py_compile wandao.py export_zsxq.py export_yuque.py export_feishu.py export_aliyun_thoughts.py export_yinxiang.py import_feishu.py import_yuque.py import_yinxiang.py
node --check wandao_electron\main.js
node --check wandao_electron\renderer\app.js
```

如果只改文档，可以说明没有运行代码检查。

## 打包发行版

发行版会内置 Python 运行时，打包命令会先自动准备对应平台运行时：

```powershell
cd wandao_electron
npm run build:win
```

macOS 需要在 macOS 本机或 GitHub Actions macOS runner 构建：

```bash
cd wandao_electron
npm run build:mac:x64
npm run build:mac:arm64
```

## PR 建议

一个 PR 尽量只解决一个问题，例如：

- 修复某个平台的图片导出
- 增加一个平台的目录读取
- 优化桌面端某个表单
- 补充一段使用教程
- 增加一个教程型 provider
- 增加一个文件型 provider 脚本

请在 PR 描述里写清楚：

- 改了什么
- 为什么要改
- 怎么测试
- 是否涉及用户凭证、登录态或平台权限

如果是新增平台 provider，请同时补充：

- `provider.json` 的平台名称、能力标签、状态和信任等级。
- `README.md` 的使用说明、限制、登录方式和常见失败原因。
- 至少一次真实导出或导入测试结果；如果暂时无法测试，请明确写出原因。
- 是否支持目录结构、图片、附件、断点续跑和失败重试。

## 代码风格

- Python 代码尽量保持标准库优先，避免为了小功能引入重量依赖。
- UI 改动要注意小窗口可滚动、按钮含义清楚、日志能帮助用户定位问题。
- 导出/导入逻辑要尽量保留目录结构、图片、附件和正文格式。
- 错误提示尽量说人话，告诉用户下一步该怎么做。

## 合规说明

万能导是本地自动化工具，用来帮助用户整理自己有权限访问的内容。请不要提交任何用于未授权访问、绕过权限控制、破解平台限制的代码或说明。

更多说明见 [docs/合规说明.md](docs/合规说明.md)。
