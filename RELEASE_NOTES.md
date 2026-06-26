# Wandao 1.0.9 Release Notes

## 新增

- Windows 发行版内置 Python standalone 运行时，普通用户不需要额外安装 Python。
- macOS 构建流程支持内置 Python 运行时，可分别生成 Intel Mac 和 Apple Silicon Mac 压缩包。
- 新增运行时准备脚本 `wandao_electron/scripts/prepare_python_runtime.py`，打包前自动下载对应平台 Python 并安装依赖。

## 改进

- Electron 主进程会优先调用发行包里的 `python-runtime`，找不到时才回退到系统 Python，方便开发调试。
- GitHub Actions 桌面端构建拆分为 Windows x64、macOS Intel、macOS Apple Silicon 三个产物。
- 更新 README、桌面端说明和使用教程，明确普通用户下载发行版即可使用。

## 发行包

- Windows：`.exe` 安装包和便携版，内置 Python 和依赖。
- macOS：`.zip` 应用压缩包，建议通过 GitHub Actions 或 macOS 本机构建 Intel / Apple Silicon 版本。

## 注意

- 源码运行、参与开发或自行打包时仍需要本机 Python 3.10+ 与 Node.js。
- 发行版不保存账号密码、Cookie、App Secret、Token 等敏感信息到仓库。
- 请只处理自己有权限访问的内容，并遵守目标平台服务条款。
