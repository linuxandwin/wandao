# Provider 接入说明

从 1.2.0 开始，万能导支持两种 provider：

- **内置 provider**：仍然由 `wandao_electron/renderer/providers.js` 注册，适合官方长期维护的平台。
- **文件型 provider**：放在 `providers/<provider-id>/provider.json`，适合社区共创、教程型平台和实验平台。

详细规范见：

```text
docs/插件开发指南.md
```

## 为什么这样设计

平台越来越多后，不能要求所有贡献者都理解 Electron UI。新的文件型 provider 把平台接入拆成三层：

- `provider.json`：声明平台信息、表单字段、动作按钮和能力。
- `README.md`：展示平台教程、限制和人工操作步骤。
- `export.py` / `import.py`：可选，只有需要自动化时才提供。

这样有的平台可以写脚本自动导出，有的平台可以先提供教程，后续再升级成自动化。

## Provider 类型

```text
automation：自动化脚本型
guide：教程说明型
hybrid：混合型
```

示例：

```json
{
  "id": "notion",
  "name": "Notion",
  "type": "guide",
  "group": "guide",
  "guide": "README.md"
}
```

## 社区插件目录

```text
providers/
  _template/
  notion/
```

以下划线开头的目录不会自动加载，可以作为模板或草稿。

## UI 生成原则

社区 provider 默认不直接写前端代码，而是通过 `fields` 和 `actions` 声明 UI：

```json
{
  "fields": [
    {
      "name": "output",
      "label": "输出目录",
      "type": "directory",
      "arg": "--output",
      "required": true
    }
  ],
  "actions": [
    {
      "id": "export",
      "label": "开始导出",
      "script": "export.py"
    }
  ]
}
```

主程序会自动生成表单和按钮，并把用户输入转换为 Python 命令行参数。

## 复杂平台怎么共创

像飞书导入这种复杂功能，仍然可以共创，但建议分级：

- **普通 provider**：只靠 `provider.json` 生成表单和按钮，适合 URL、目录、API Key、简单下拉等场景。
- **高级 provider**：先用 `actions.updates` 读取空间/知识库/文件夹，再动态回填字段。
- **官方/复杂 provider**：如果需要多步骤授权、权限排障、动态目录树、图片修复、专属错误处理，可以先贡献 Python 核心脚本和 README，再由维护者接入专属模板。

也就是说，插件化不是要求所有平台都只能用一套简单 UI。简单平台不改前端即可共创；复杂平台可以逐步从教程型、脚本型升级为内置复杂 provider。

## 已支持的扩展点

- `trustLevel`：标记官方、社区、本地、实验 provider。
- `requirements`：声明 Python、系统和使用依赖。
- `toc`：声明通用目录树字段映射，支持读取目录后勾选。
- `actions.updates`：动作完成后把结果回填到输入框或下拉框。

## 内置平台何时继续用专属模板

如果平台交互非常复杂，例如飞书导入需要权限初始化、目标 Wiki 探测、图片修复等，可以继续保留专属 HTML 模板和专属 JS 逻辑。

新的文件型 provider 不是要消灭所有特殊 UI，而是让多数平台接入不用再改 Electron 代码。
