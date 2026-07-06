import unittest

from export_aliyun_thoughts import slate_value_to_markdown


def text_node(text: str) -> dict:
    return {"object": "text", "leaves": [{"text": text}]}


def code_line(text: str) -> dict:
    return {"object": "block", "type": "code-line", "nodes": [text_node(text)]}


class AliyunThoughtsMarkdownTests(unittest.TestCase):
    def test_code_block_preserves_slate_line_boundaries(self) -> None:
        value = {
            "document": {
                "nodes": [
                    {
                        "object": "block",
                        "type": "code-block",
                        "data": {"language": "java"},
                        "nodes": [
                            code_line("public class Demo {"),
                            code_line("    return;"),
                            code_line("}"),
                        ],
                    }
                ]
            }
        }

        markdown = slate_value_to_markdown(value, "demo")["markdown"]

        self.assertIn("```java\npublic class Demo {\n    return;\n}\n```", markdown)
        self.assertNotIn("public class Demo {    return;}", markdown)

    def test_code_block_preserves_blank_lines_inside_fence(self) -> None:
        value = {
            "document": {
                "nodes": [
                    {
                        "object": "block",
                        "type": "code-block",
                        "data": {"language": "text"},
                        "nodes": [
                            code_line("第一行"),
                            code_line(""),
                            code_line("第三行"),
                        ],
                    }
                ]
            }
        }

        markdown = slate_value_to_markdown(value, "demo")["markdown"]

        self.assertIn("```text\n第一行\n\n第三行\n```", markdown)


if __name__ == "__main__":
    unittest.main()
