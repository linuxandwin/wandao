# Wandao Desktop

万能导的统一 Electron 桌面端。

## 功能

- 知识星球、语雀、飞书 Wiki、阿里云 Thoughts、印象笔记导出为 Markdown。
- 本地 Markdown 批量导入飞书 Wiki。
- 支持登录凭证保存、目录读取、勾选导出、增量导出、停止任务和全局进度条。
- 调用项目根目录下的 Python 脚本执行实际导出/导入逻辑。

## 开发运行

```bash
cd wandao_electron
npm install
npm start
```

如果启动时报 `electron` 不是可执行命令，通常是还没有执行 `npm install`。

## 打包

Windows：

```bash
npm run build:win
```

macOS：

```bash
npm run build:mac
```

在 Windows 本机更推荐只打 Windows 包；macOS 的 `.zip` 包建议在 macOS 或 GitHub Actions 的 `macos-latest` 环境构建。

## 运行依赖

桌面端打包后用户不需要安装 Node.js，但当前版本仍需要本机安装 Python 3.10+，因为导出/导入后端是 Python 脚本。

## 目录结构

```text
wandao_electron/
├── main.js
├── preload.js
├── package.json
├── assets/
└── renderer/
    ├── index.html
    ├── styles.css
    └── app.js
```
