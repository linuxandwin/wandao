# Wandao 1.0.5 Release Notes

## 新增

- 新增印象笔记导出：支持登录同步、读取笔记本目录、勾选笔记并导出为 Markdown。
- 印象笔记图片和附件会保存到本地资源目录，并在 Markdown 中使用相对链接引用。
- 印象笔记支持 ENEX 中间格式转换，已有 ENEX 文件也可以单独转换为 Markdown。

## 改进

- 修复印象笔记同一笔记本下存在同名笔记时前一篇被覆盖的问题。
- 桌面端新增“印象笔记导出”入口，并接入统一目录选择和进度条。
- 更新 README 截图为最新版界面。
- 源码运行说明改为推荐使用虚拟环境，避免依赖影响用户全局 Python。

## 发行包

- Windows：`.exe` 安装包和便携版。
- macOS：源码压缩包；真正的 macOS App 建议在 macOS 或 GitHub Actions macOS runner 上构建。

## 注意

- 桌面端当前仍需要本机安装 Python 3.10+。
- 印象笔记导出依赖 `evernote-backup==1.13.1`，源码运行可通过 `python -m pip install -r requirements.txt` 安装。
- 请只导出自己有权限访问的内容，并遵守目标平台服务条款。
