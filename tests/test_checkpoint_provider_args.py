import importlib
import json
import tempfile
import unittest
from pathlib import Path


class CheckpointProviderArgsTests(unittest.TestCase):
    def test_export_providers_accept_checkpoint_args(self) -> None:
        cases = [
            ("export_yuque", ["--book-url", "https://www.yuque.com/demo/book", "--output", "out"]),
            ("export_feishu", ["--wiki-url", "https://demo.feishu.cn/wiki/demo", "--output", "out"]),
            ("export_aliyun_thoughts", ["--workspace-url", "https://thoughts.aliyun.com/workspaces/demo/overview", "--output", "out"]),
            ("export_yinxiang", ["--output", "out"]),
            ("export_youdao", ["--output", "out"]),
            ("export_wiz", ["--output", "out"]),
            ("export_onenote", ["--output", "out"]),
            ("ima_knowledge", ["--knowledge-base-id", "kb-1", "--output", "out"]),
        ]

        for module_name, base_args in cases:
            with self.subTest(module=module_name):
                module = importlib.import_module(module_name)
                args = module.parse_args(
                    [
                        *base_args,
                        "--checkpoint-file",
                        "out/.wandao/checkpoint.sqlite",
                        "--checkpoint-task-id",
                        "task-1",
                        "--resume",
                        "--retry-failed",
                    ]
                )

                self.assertEqual(args.checkpoint_file, "out/.wandao/checkpoint.sqlite")
                self.assertEqual(args.checkpoint_task_id, "task-1")
                self.assertTrue(args.resume)
                self.assertTrue(args.retry_failed)

    def test_directory_export_providers_accept_doc_id_file(self) -> None:
        cases = [
            ("export_yuque", ["--book-url", "https://www.yuque.com/demo/book", "--output", "out"], "selected_doc_ids"),
            ("export_feishu", ["--wiki-url", "https://demo.feishu.cn/wiki/demo", "--output", "out"], "selected_doc_ids"),
            ("export_aliyun_thoughts", ["--workspace-url", "https://thoughts.aliyun.com/workspaces/demo/overview", "--output", "out"], "selected_doc_ids"),
            ("export_yinxiang", ["--output", "out"], "doc_id"),
            ("export_youdao", ["--output", "out"], "selected_doc_ids"),
            ("export_wiz", ["--output", "out"], "selected_doc_ids"),
            ("export_onenote", ["--output", "out"], "selected_doc_ids"),
            ("ima_knowledge", ["--knowledge-base-id", "kb-1", "--output", "out"], "doc_id"),
        ]

        with tempfile.TemporaryDirectory() as tmp:
            id_file = Path(tmp) / "ids.json"
            id_file.write_text(json.dumps({"docIds": ["doc-a", "doc-b"]}), encoding="utf-8")
            for module_name, base_args, attr in cases:
                with self.subTest(module=module_name):
                    module = importlib.import_module(module_name)
                    args = module.parse_args([*base_args, "--doc-id-file", str(id_file)])

                    self.assertEqual(getattr(args, attr)[-2:], ["doc-a", "doc-b"])


if __name__ == "__main__":
    unittest.main()
