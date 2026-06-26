# Wandao 1.0.8 Release Notes

## 新增

- 新增“印象笔记 Markdown 导入”：支持把本地 Markdown 批量写入印象笔记。
- 支持将 Markdown 中的本地图片和普通附件作为印象笔记 Resource 上传。
- 支持按本地目录映射印象笔记笔记本组和笔记本。
- 命令行启动器新增 `yinxiang-import` provider。

## 改进

- 桌面端左侧“导入”分组新增“印象笔记 Markdown 导入”入口。
- 印象笔记导入提供“登录并同步凭证、扫描目录、单篇导入测试、批量导入”完整流程。
- 图片导入时会自动识别 PNG、GIF、JPEG 宽高，提高印象笔记客户端渲染稳定性。
- 更新 README、桌面端说明和使用教程。

## 发行包

- Windows：`.exe` 安装包和便携版。
- macOS：源码压缩包；真正的 macOS App 建议在 macOS 或 GitHub Actions macOS runner 上构建。

## 注意

- 桌面端当前仍需要本机安装 Python 3.10+。
- 使用印象笔记导入/导出前，请在本机 Python 环境安装 `evernote-backup==1.13.1`，源码用户可执行 `python -m pip install -r requirements.txt`。
- 请只处理自己有权限访问的内容，并遵守目标平台服务条款。
