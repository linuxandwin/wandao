# Wandao 1.0.4 Release Notes

## 新增

- 恢复并统一四个导出器的“读取目录 + 勾选导出”能力。
- 增加全局进度条，导出、导入、读取目录时可感知任务进度。
- 飞书 Markdown 导入支持更清晰的首次配置流程。
- 桌面端增加中文顶部菜单，内置项目主页、使用教程、发行版、问题反馈和作者微信入口。

## 改进

- Chrome DevTools `/json/new` 兼容新版本 Chrome 的 `PUT` 调用方式，修复部分机器登录阶段 `HTTP 405`。
- 导出任务默认更频繁输出进度，界面进度条更新更及时。
- 清理旧的单功能 Electron 文档，统一为 Wandao 桌面端文档。
- 发布包不包含本地 Cookie、Chrome profile、测试导出内容和调试截图。

## 发行包

- Windows：`.exe` 安装包或便携包。
- macOS：`.zip` 压缩包。若在 Windows 本机准备发布，只能先提供源码压缩包；真正的 macOS App zip 需要在 macOS 或 GitHub Actions macOS runner 上构建。

## 注意

- 桌面端当前仍需要本机安装 Python 3.10+。
- 请只导出自己有权限访问的内容，并遵守目标平台服务条款。
