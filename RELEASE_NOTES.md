# Wandao 1.0.6 Release Notes

## 新增

- 新增语雀 Markdown 导入：支持把本地 Markdown 目录导入到语雀知识库。
- 语雀导入支持按本地文件夹创建语雀目录，并上传 Markdown 中引用的本地图片和附件。
- 桌面端新增“语雀导入”入口，支持登录保存凭证、生成导入计划、单篇测试和批量导入。

## 改进

- 语雀导出增强图片和附件下载能力，私有知识库资源会复用用户登录凭证下载。
- 语雀导出支持关闭附件下载，避免导出大文件时等待过久。
- 更新 README 和使用教程，补充语雀导入和附件导出的说明。

## 发行包

- Windows：`.exe` 安装包和便携版。
- macOS：源码压缩包；真正的 macOS App 建议在 macOS 或 GitHub Actions macOS runner 上构建。

## 注意

- 桌面端当前仍需要本机安装 Python 3.10+。
- 源码运行可通过 `python -m pip install -r requirements.txt` 安装 Python 依赖。
- 请只导出自己有权限访问的内容，并遵守目标平台服务条款。
