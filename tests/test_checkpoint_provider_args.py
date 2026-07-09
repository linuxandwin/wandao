import importlib
import unittest


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


if __name__ == "__main__":
    unittest.main()
