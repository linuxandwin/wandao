import argparse
import tempfile
import unittest
from pathlib import Path

from wandao_checkpoint import WandaoCheckpoint, add_checkpoint_args, open_checkpoint_from_args


class WandaoCheckpointTests(unittest.TestCase):
    def test_checkpoint_records_task_item_cursor_and_resource(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "checkpoint.sqlite"
            checkpoint = WandaoCheckpoint.open(path, task_id="task-1", provider_id="zsxq-group", action="导出")
            try:
                checkpoint.start_task({"source": "https://wx.zsxq.com/group/1", "outputDir": tmp})
                checkpoint.save_cursor("group", {"end_time": "2026-07-09T10:00:00.000+0800", "page": 3})
                checkpoint.upsert_item("zsxq:topic:1", title="测试帖子", source_url="https://wx.zsxq.com/topic/1")
                checkpoint.start_item("zsxq:topic:1", "content")
                checkpoint.upsert_resource("zsxq:topic:1", "image:https://example.com/a.png", "image", "https://example.com/a.png")
                checkpoint.start_resource("image:https://example.com/a.png")
                checkpoint.complete_resource("image:https://example.com/a.png", local_path="assets/a.png")
                checkpoint.complete_item("zsxq:topic:1", local_path="01-测试帖子.md")
                checkpoint.complete_task({"exportedDocs": 1})

                self.assertEqual(checkpoint.load_cursor("group")["page"], 3)
                self.assertIn("zsxq:topic:1", checkpoint.completed_item_keys())
                stats = checkpoint.stats()
                self.assertEqual(stats["items"]["completed"], 1)
                self.assertEqual(stats["resources"]["completed"], 1)
            finally:
                checkpoint.close()

    def test_recover_interrupted_running_items(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "checkpoint.sqlite"
            checkpoint = WandaoCheckpoint.open(path, task_id="task-1", provider_id="zsxq-group", action="导出")
            checkpoint.start_task({})
            checkpoint.upsert_item("item-1", title="item")
            checkpoint.start_item("item-1", "content")
            checkpoint.close()

            reopened = WandaoCheckpoint.open(path, task_id="task-1", provider_id="zsxq-group", action="导出")
            try:
                self.assertEqual(reopened.item_status("item-1"), "pending")
                self.assertEqual(reopened.pending_items()[0]["item_key"], "item-1")
            finally:
                reopened.close()

    def test_source_scope_change_resets_old_items(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "checkpoint.sqlite"
            checkpoint = WandaoCheckpoint.open(path, task_id="default", provider_id="demo", action="export")
            try:
                checkpoint.start_task({"source": "book-a", "outputDir": tmp})
                checkpoint.upsert_item("item-a", title="A")
                checkpoint.complete_item("item-a", local_path="a.md")

                checkpoint.start_task({"source": "book-a", "outputDir": tmp})
                self.assertEqual(checkpoint.item_status("item-a"), "completed")

                checkpoint.start_task({"source": "book-b", "outputDir": tmp})
                self.assertEqual(checkpoint.item_status("item-a"), "")
                self.assertEqual(checkpoint.stats()["items"], {})
            finally:
                checkpoint.close()

    def test_open_checkpoint_from_args_can_reset_current_task(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "checkpoint.sqlite"
            checkpoint = WandaoCheckpoint.open(path, task_id="default", provider_id="demo", action="export")
            checkpoint.start_task({})
            checkpoint.upsert_item("item-1", title="item")
            checkpoint.close()

            args = argparse.Namespace(
                checkpoint_file=str(path),
                checkpoint_task_id="default",
                reset_checkpoint=True,
            )
            reopened = open_checkpoint_from_args(args, "demo", "export")
            try:
                self.assertIsNotNone(reopened)
                assert reopened is not None
                self.assertEqual(reopened.pending_items(), [])
                self.assertEqual(reopened.stats()["items"], {})
            finally:
                reopened.close()

    def test_add_checkpoint_args_uses_retry_failed_dest(self) -> None:
        parser = argparse.ArgumentParser()
        add_checkpoint_args(parser)

        args = parser.parse_args(["--checkpoint-file", "out/.wandao/checkpoint.sqlite", "--resume", "--retry-failed"])

        self.assertEqual(args.checkpoint_file, "out/.wandao/checkpoint.sqlite")
        self.assertTrue(args.resume)
        self.assertTrue(args.retry_failed)


if __name__ == "__main__":
    unittest.main()
