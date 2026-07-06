import argparse
import json
import re
import shutil
from pathlib import Path
from urllib.parse import unquote, urlparse


MARKDOWN_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
HTML_SRC_RE = re.compile(r"""<(?:img|source|video|audio)\b[^>]*\bsrc=["']([^"']+)["']""", re.IGNORECASE)


def is_url(value):
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https", "data", "mailto", "tel"}


def is_inside(root, candidate):
    root = root.resolve()
    candidate = candidate.resolve()
    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False


def clean_resource_ref(value):
    value = value.strip().strip("<>")
    if not value or value.startswith("#") or is_url(value):
        return ""
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return ""
    return unquote(parsed.path)


def iter_markdown_files(source_dir):
    for path in sorted(source_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in {".md", ".markdown"}:
            yield path


def posix_rel(path, root):
    return path.relative_to(root).as_posix()


def folder_node_id(rel_path):
    return f"folder:{rel_path}"


def doc_node_id(rel_path):
    return f"doc:{rel_path}"


def build_nodes(source_dir):
    nodes = []
    seen_folders = set()
    for md_file in iter_markdown_files(source_dir):
        rel = posix_rel(md_file, source_dir)
        parent_id = ""
        if md_file.parent != source_dir:
            current = Path()
            for part in Path(posix_rel(md_file.parent, source_dir)).parts:
                current = current / part
                folder_rel = current.as_posix()
                node_id = folder_node_id(folder_rel)
                if node_id not in seen_folders:
                    parent = "" if current.parent == Path(".") else folder_node_id(current.parent.as_posix())
                    nodes.append(
                        {
                            "nodeId": node_id,
                            "exportId": "",
                            "title": part,
                            "parentNodeId": parent,
                            "selectable": False,
                        }
                    )
                    seen_folders.add(node_id)
                parent_id = node_id
        nodes.append(
            {
                "nodeId": doc_node_id(rel),
                "exportId": rel,
                "title": md_file.stem,
                "parentNodeId": parent_id,
                "selectable": True,
            }
        )
    return nodes


def referenced_resources(markdown_text):
    refs = []
    for match in MARKDOWN_LINK_RE.finditer(markdown_text):
        ref = clean_resource_ref(match.group(1))
        if ref:
            refs.append(ref)
    for match in HTML_SRC_RE.finditer(markdown_text):
        ref = clean_resource_ref(match.group(1))
        if ref:
            refs.append(ref)
    return refs


def copy_resource(ref, source_doc, target_doc, source_root, output_root):
    source_path = (source_doc.parent / ref).resolve()
    if not is_inside(source_root, source_path) or not source_path.exists() or not source_path.is_file():
        return False, ref
    target_path = (target_doc.parent / ref).resolve()
    if not is_inside(output_root, target_path):
        return False, ref
    target_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, target_path)
    return True, ref


def scan(args):
    source_dir = Path(args.source_dir).expanduser().resolve()
    if not source_dir.exists():
        raise SystemExit(f"源目录不存在：{source_dir}")
    nodes = build_nodes(source_dir)
    print(
        json.dumps(
            {
                "provider": "demo-local-export",
                "readOnly": True,
                "totalDocs": sum(1 for node in nodes if node.get("selectable")),
                "folderCount": sum(1 for node in nodes if not node.get("selectable")),
                "nodes": nodes,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def export(args):
    source_dir = Path(args.source_dir).expanduser().resolve()
    output_dir = Path(args.output).expanduser().resolve()
    if not source_dir.exists():
        raise SystemExit(f"源目录不存在：{source_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)

    selected = set(args.doc_id or [])
    all_docs = list(iter_markdown_files(source_dir))
    docs = [path for path in all_docs if not selected or posix_rel(path, source_dir) in selected]
    exported = 0
    skipped = 0
    resource_copied = 0
    resource_missing = []
    failures = []

    for index, md_file in enumerate(docs, 1):
        rel = posix_rel(md_file, source_dir)
        target = output_dir / rel
        try:
            if args.incremental and target.exists():
                skipped += 1
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                text = md_file.read_text(encoding="utf-8", errors="replace")
                target.write_text(text, encoding="utf-8")
                exported += 1
                if args.copy_resources:
                    for ref in referenced_resources(text):
                        copied, missing_ref = copy_resource(ref, md_file, target, source_dir, output_dir)
                        if copied:
                            resource_copied += 1
                        else:
                            resource_missing.append({"docId": rel, "resource": missing_ref})
        except Exception as exc:
            failures.append({"docId": rel, "error": str(exc)})
        print(
            f"progress {index}/{len(docs)} exported={exported} skipped={skipped} "
            f"resources={resource_copied} failures={len(failures)}",
            flush=True,
        )

    print(
        json.dumps(
            {
                "provider": "demo-local-export",
                "mode": "export",
                "totalDocs": len(docs),
                "exportedDocs": exported,
                "skippedDocs": skipped,
                "resourceCopies": resource_copied,
                "missingResourceCount": len(resource_missing),
                "missingResources": resource_missing[:100],
                "failureCount": len(failures),
                "failures": failures,
                "output": str(output_dir),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--output", default="")
    parser.add_argument("--scan-toc", action="store_true")
    parser.add_argument("--export", action="store_true")
    parser.add_argument("--doc-id", action="append")
    parser.add_argument("--copy-resources", action="store_true")
    parser.add_argument("--incremental", action="store_true")
    args = parser.parse_args()

    if args.scan_toc:
        scan(args)
    elif args.export:
        if not args.output:
            raise SystemExit("--output is required for export")
        export(args)
    else:
        raise SystemExit("Please pass --scan-toc or --export")


if __name__ == "__main__":
    main()
