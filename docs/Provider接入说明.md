# Provider 接入说明

万能导支持两类平台接入方式：

- 内置 provider：由主程序维护专属 UI 和专属逻辑，适合飞书导入、语雀导入这类复杂长期功能。
- 文件型 provider：放在 `providers/<provider-id>/provider.json`，适合社区共创、教程型平台、实验平台和大多数标准导入导出流程。

详细开发规范见：

```text
docs/共创流程.md
docs/插件开发指南.md
```

## 目录约定

```text
providers/
  _template_standard/
  _template_custom/
  _demo_local_export/
  notion/
  your-provider/
```

以下划线开头的目录不会自动加载，用来放模板、示例和草稿。真正要展示给用户的平台目录不要以下划线开头。

## 文件型 provider 三件套

```text
providers/your-provider/
  provider.json
  README.md
  actions.py
```

- `provider.json`：声明平台信息、能力、字段、按钮、目录树协议和脚本入口。
- `README.md`：展示教程、限制、登录方式、权限要求和测试结果。
- `actions.py`：可选，执行读取目录、导出、导入、失败重试等动作。

如果平台只需要教程，可以只有 `provider.json` 和 `README.md`，并把 `type` 设置为 `guide`。

## 标准 UI 和复杂 UI

标准 UI provider 不需要改 Electron 主程序。贡献者只要声明 `fields` 和 `actions`，主程序会自动生成表单和按钮。

复杂平台可以先用 `providers/_template_custom/` 把流程拆成多个动作。当前文件型 provider 不直接注入任意 HTML；如果确实需要专属 UI，请在 PR 中说明 UI 需求，由维护者评估是否升级为内置 provider 或后续沙箱自定义 UI。

这个设计不是要求所有平台长得一样，而是让每个平台只声明自己支持的能力。飞书可以有权限检测和 Wiki 导入，OneNote 可以只有本地读取和 Markdown 导出，教程型平台也可以只展示文档。

## 已支持的扩展点

- `trustLevel`：标记官方、社区、本地、实验 provider。
- `status`：标记 experimental、beta、stable。
- `requirements`：声明 Python、系统和使用依赖。
- `capabilities`：声明导出、导入、教程、图片、附件、目录树、批量、重试等能力。
- `toc`：声明通用目录树字段映射，支持读取目录后勾选。
- `actions.updates`：动作完成后把结果回填到输入框或下拉框。

## 贡献建议

新增平台优先走文件型 provider：

1. 先搜索已有 Issue/PR，避免重复共创。
2. 没有重复时，使用“新平台共创/认领”Issue 模板提交需求或认领。
3. 平台本身有导出导入能力：先做教程型 provider。
4. 平台流程比较标准：用 `_template_standard`。
5. 平台流程很复杂：用 `_template_custom` 提交核心脚本和流程说明。
6. 标准 UI 不够：在 PR 中说明需要的专属 UI，不要直接把复杂逻辑散落到主程序里。

这样平台能力会集中在自己的目录中，后续维护、审查、回滚和共创都会更清楚。
