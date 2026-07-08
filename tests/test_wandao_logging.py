import unittest

from wandao_logging import mask_sensitive


class WandaoLoggingTests(unittest.TestCase):
    def test_masks_sensitive_url_query_values(self) -> None:
        text = "https://example.com/a.png?Signature=abc123&token=secret&safe=ok"

        masked = mask_sensitive(text)

        self.assertIn("Signature=***", masked)
        self.assertIn("token=***", masked)
        self.assertIn("safe=ok", masked)
        self.assertNotIn("abc123", masked)
        self.assertNotIn("secret", masked)

    def test_masks_nested_sensitive_fields(self) -> None:
        payload = {
            "message": "Authorization: Bearer abc.def token=hidden",
            "headers": {"Authorization": "Bearer abc.def", "cookie": "sid=123"},
            "items": [{"access_key": "key-123", "url": "https://a.test/?Signature=x"}],
        }

        masked = mask_sensitive(payload)

        self.assertEqual(masked["headers"]["Authorization"], "***")
        self.assertEqual(masked["headers"]["cookie"], "***")
        self.assertEqual(masked["items"][0]["access_key"], "***")
        self.assertIn("***", masked["message"])
        self.assertIn("token=***", masked["message"])
        self.assertIn("Signature=***", masked["items"][0]["url"])
        self.assertNotIn("abc.def", jsonish(masked))
        self.assertNotIn("hidden", jsonish(masked))


def jsonish(value) -> str:
    return repr(value)


if __name__ == "__main__":
    unittest.main()
