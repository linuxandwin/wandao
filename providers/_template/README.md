# 示例平台 Provider

这个目录是给社区开发者复制的模板，不会被万能导自动加载。

## 文件结构

```text
providers/demo-provider/
  provider.json
  README.md
  export.py
```

## provider.json 负责什么

- 描述平台名称、类型、状态和能力。
- 声明 UI 需要展示哪些字段。
- 声明用户点击按钮后要执行哪个脚本。
- 声明 README.md 教程内容。

## 脚本输出约定

脚本运行中可以输出普通文本作为日志；任务完成时最后输出一段 JSON：

```json
{
  "provider": "demo-provider",
  "mode": "export",
  "totalDocs": 1,
  "exportedDocs": 1,
  "failureCount": 0,
  "failures": []
}
```

## 安全提醒

社区 provider 的 Python 脚本会在用户本机执行。提交 PR 时请保持代码清晰、依赖尽量少，并在 README 中说明需要的权限和限制。
