# Wandao 1.2.0 Release Notes

本次版本是一次架构升级，重点是让万能导更适合开源共创：新增文件型 provider 插件机制，支持教程型平台、混合型平台和社区自动化脚本。

## 新增

- 新增 `providers/` 插件目录。
- 新增文件型 provider manifest：`provider.json`。
- 新增教程型 provider：平台可以只提供 `README.md`，不必写脚本。
- 新增混合型 provider：同一个平台可以同时展示教程和自动化动作。
- 新增通用目录树协议：社区 provider 可返回标准 `nodes`，由 UI 自动渲染勾选树。
- 新增动态动作回填：动作结果可自动更新输入框或下拉框。
- 新增 provider 依赖声明：可展示 Python、系统和使用依赖。
- 新增 provider 信任等级：官方、社区、本地、实验等来源会在界面展示。
- 新增平台中心入口，平台能力按卡片集中展示。
- 新增 Notion 迁移指南示例 provider。
- 新增社区插件模板：`providers/_template/`。
- 新增插件开发文档：`docs/插件开发指南.md`。
- 应用头部新增万能导 Logo 展示，品牌识别更清晰。

## 架构改进

- Electron 主进程支持自动发现 `providers/*/provider.json`。
- 打包后会把 `providers/` 一起放入应用资源。
- 渲染进程支持从 manifest 自动生成表单字段和动作按钮。
- provider 字段支持 `text`、`password`、`number`、`textarea`、`directory`、`file`、`checkbox`、`select`、`notice`。
- provider 动作支持 `kind: "scan"`，用于读取目录并自动填充目录选择器。
- provider 动作支持 `updates`，用于把脚本返回值写回表单。
- 社区插件脚本使用 `provider:<id>:<script>` 形式执行，并限制脚本只能位于自己的 provider 目录内。
- 保留现有内置 provider 和专属复杂 UI，避免影响已有平台。

## 文档

- 重写 `docs/Provider接入说明.md`，说明内置 provider 与文件型 provider 的关系。
- README 新增插件开发入口。
- README 新增平台中心和插件开发入口说明。
- README 和使用教程补充 OneNote 导出、为知笔记导出说明。
- 贡献指南补充 AGPL 协议说明和 provider PR 规则。

## 协议

- 项目开源协议调整为 AGPL-3.0-only。
- Python 项目元数据、Electron 项目元数据和 LICENSE 文件已同步更新。

## 版本

- 桌面端版本升级到 `1.2.0`。
- Python 项目版本升级到 `1.2.0`。

## 注意

- 社区 provider 的 Python 脚本会在用户本机执行，请只安装可信来源的插件。
- 教程型 provider 不执行脚本，只展示 Markdown 操作说明。
- 复杂平台仍可继续使用内置专属模板，不强制所有平台使用统一表单。
