import argparse
import json


def print_result(data):
    print(json.dumps(data, ensure_ascii=False, indent=2))


def login(args):
    print("TODO: open browser, complete login, then save reusable credentials safely.")
    print_result(
        {
            "provider": "your-custom-provider",
            "mode": "login",
            "success": False,
            "message": "请在 actions.py 中实现真实登录逻辑。",
            "workspaceUrl": args.workspace_url,
        }
    )


def scan_toc(args):
    print("TODO: fetch remote spaces, folders or documents from the target platform.")
    print_result(
        {
            "provider": "your-custom-provider",
            "readOnly": True,
            "totalDocs": 0,
            "folderCount": 0,
            "nodes": [],
            "workspaceUrl": args.workspace_url,
        }
    )


def export(args):
    print("TODO: export selected documents and preserve Markdown, images and attachments.")
    print_result(
        {
            "provider": "your-custom-provider",
            "mode": "export",
            "totalDocs": len(args.doc_id or []),
            "exportedDocs": 0,
            "failureCount": 0,
            "failures": [],
            "output": args.output,
            "workspaceUrl": args.workspace_url,
        }
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace-url", required=True)
    parser.add_argument("--output", default="")
    parser.add_argument("--login", action="store_true")
    parser.add_argument("--scan-toc", action="store_true")
    parser.add_argument("--export", action="store_true")
    parser.add_argument("--doc-id", action="append")
    args = parser.parse_args()

    if args.login:
        login(args)
    elif args.scan_toc:
        scan_toc(args)
    elif args.export:
        export(args)
    else:
        raise SystemExit("Please pass --login, --scan-toc or --export")


if __name__ == "__main__":
    main()
