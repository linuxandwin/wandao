import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def read_text(rel_path: str) -> str:
    return (REPO_ROOT / rel_path).read_text(encoding="utf-8")


class ElectronHealthTests(unittest.TestCase):
    def test_browser_window_keeps_safe_renderer_defaults(self) -> None:
        main_js = read_text("wandao_electron/main.js")

        self.assertRegex(main_js, r"nodeIntegration\s*:\s*false")
        self.assertRegex(main_js, r"contextIsolation\s*:\s*true")
        self.assertRegex(main_js, r"preload\s*:\s*path\.join\(__dirname,\s*['\"]preload\.js['\"]\)")
        self.assertNotRegex(main_js, r"webSecurity\s*:\s*false")
        self.assertNotRegex(main_js, r"allowRunningInsecureContent\s*:\s*true")

    def test_preload_channels_are_handled_by_main_process(self) -> None:
        preload_js = read_text("wandao_electron/preload.js")
        main_js = read_text("wandao_electron/main.js")

        preload_channels = set(re.findall(r"ipcRenderer\.invoke\(['\"]([^'\"]+)['\"]", preload_js))
        main_channels = set(re.findall(r"ipcMain\.handle\(['\"]([^'\"]+)['\"]", main_js))

        self.assertTrue(preload_channels)
        self.assertFalse(preload_channels - main_channels)
        self.assertIn("run-python-command", preload_channels)
        self.assertIn("get-provider-manifests", preload_channels)

    def test_preload_does_not_expose_raw_ipc_or_node_modules(self) -> None:
        preload_js = read_text("wandao_electron/preload.js")
        exposed_object = preload_js.split("contextBridge.exposeInMainWorld", 1)[-1]

        self.assertIn("contextBridge.exposeInMainWorld('electronAPI'", preload_js)
        self.assertNotIn("ipcRenderer,", exposed_object)
        self.assertNotIn("require,", exposed_object)
        self.assertNotIn("process,", exposed_object)

    def test_remote_text_fetch_is_limited_to_project_docs(self) -> None:
        main_js = read_text("wandao_electron/main.js")

        self.assertIn("function isAllowedRemoteTextUrl", main_js)
        self.assertIn("parsed.protocol !== 'https:'", main_js)
        self.assertIn("raw.githubusercontent.com", main_js)
        self.assertIn("/tllovesxs/wandao/", main_js)
        self.assertIn("公告文档超过 1MB", main_js)

    def test_settings_have_schema_version_and_normalization(self) -> None:
        main_js = read_text("wandao_electron/main.js")

        self.assertIn("const SETTINGS_SCHEMA_VERSION = 1", main_js)
        self.assertIn("function normalizeAppSettings", main_js)
        self.assertIn("schemaVersion: settings.schemaVersion || SETTINGS_SCHEMA_VERSION", main_js)
        self.assertIn("next.schemaVersion = SETTINGS_SCHEMA_VERSION", main_js)

    def test_log_panel_uses_bounded_batch_rendering(self) -> None:
        app_js = read_text("wandao_electron/renderer/app.js")

        self.assertIn("const LOG_PANEL_RENDER_LIMIT = 400", app_js)
        self.assertIn("function visibleLogEntries", app_js)
        self.assertIn("document.createDocumentFragment()", app_js)
        self.assertIn("logContent.replaceChildren()", app_js)
        self.assertIn("trimRenderedLogEntries(logContent)", app_js)
        self.assertIn("为保持界面流畅", app_js)

    def test_settings_log_toggle_does_not_rerender_whole_settings_page(self) -> None:
        app_js = read_text("wandao_electron/renderer/app.js")

        marker = "querySelector('[data-settings-action=\"log-mode\"]')?.addEventListener"
        start = app_js.find(marker)
        self.assertGreater(start, -1)
        handler = app_js[start : start + 500]
        self.assertIn("toggleLogViewMode()", handler)
        self.assertIn("data-settings-log-mode-summary", app_js)
        self.assertNotIn("renderSettingsPage()", handler)

    def test_task_history_has_minimal_failure_diagnostics(self) -> None:
        app_js = read_text("wandao_electron/renderer/app.js")

        self.assertIn("function taskFailureDiagnostics", app_js)
        self.assertIn("data-history-action=\"copy-failures\"", app_js)
        self.assertIn("function copyTaskFailures", app_js)
        self.assertIn("button.dataset.historyAction === 'copy-failures'", app_js)
        self.assertIn("if (task.status === 'running') return false", app_js)
        self.assertIn("该平台暂未声明失败项重试能力", app_js)

    def test_scan_toc_passes_provider_id_to_python_process(self) -> None:
        app_js = read_text("wandao_electron/renderer/app.js")

        self.assertIn("runPythonCommand(config.script, args, {", app_js)
        self.assertIn("providerId: toolId", app_js)

    def test_group_toc_progress_is_labeled_as_topic_list_reading(self) -> None:
        structured_logs_js = read_text("wandao_electron/renderer/structured_logs.js")

        self.assertIn("stats.groupPage", structured_logs_js)
        self.assertIn("帖子列表读取：已读取", structured_logs_js)
        self.assertIn("帖子列表读取 ${current}/${total || '?'}", structured_logs_js)
        self.assertIn("已跳过视频帖", structured_logs_js)

    def test_zsxq_group_and_column_are_separate_providers(self) -> None:
        providers_js = read_text("wandao_electron/renderer/providers.js")
        index_html = read_text("wandao_electron/renderer/index.html")
        app_js = read_text("wandao_electron/renderer/app.js")

        self.assertIn("id: 'zsxq-group'", providers_js)
        self.assertIn("id: 'zsxq-column'", providers_js)
        self.assertIn("capabilities: { login: true, scanToc: false }", providers_js)
        self.assertIn("capabilities: { login: true, scanToc: true }", providers_js)
        self.assertIn('template id="template-zsxq-group"', index_html)
        self.assertIn('template id="template-zsxq-column"', index_html)
        self.assertIn('id="zsxq-group-download-files"', index_html)
        self.assertIn('id="zsxq-column-download-files"', index_html)
        self.assertIn("知识星球 Group 单次最多导出 500 条", app_js)
        self.assertIn("validateZsxqUrlForTool", app_js)
        self.assertIn("toolId === 'zsxq-column'", app_js)


if __name__ == "__main__":
    unittest.main()
