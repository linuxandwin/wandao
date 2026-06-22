---
name: run-wandao
description: Use this skill when the user wants AI to directly run Wandao from a Codex Skill, launch the Wandao GUI, export an authorized knowledge base, infer the provider from a URL, or recommend export parameters before running. The skill must call its bundled launch_wandao.py script instead of only explaining manual commands.
---

# Run Wandao

This skill directly calls the bundled launcher script:

```bash
python <this-skill-dir>/scripts/launch_wandao.py
```

The launcher script then locates or downloads the Wandao repository and calls `wandao.py`.

## Required Behavior

When the user invokes `$run-wandao`, do not stop at explanation. Run the launcher script unless the user only asks for documentation.

Use the absolute path of this skill directory when running the script. If the skill is installed at `~/.codex/skills/run-wandao`, run:

```bash
python ~/.codex/skills/run-wandao/scripts/launch_wandao.py
```

If the current working directory is the Wandao repository, this also works:

```bash
python skills/run-wandao/scripts/launch_wandao.py
```

## Normal Flow

1. Check that the user is exporting content they are allowed to access.
2. If the user gave a URL, run a dry run first so the user can see the detected provider and recommended parameters:

   ```bash
   python <this-skill-dir>/scripts/launch_wandao.py --url "<url>" --dry-run
   ```

3. If the user wants a GUI, run:

   ```bash
   python <this-skill-dir>/scripts/launch_wandao.py --url "<url>"
   ```

4. If the user wants the AI to run the export directly, run:

   ```bash
   python <this-skill-dir>/scripts/launch_wandao.py --url "<url>" --export
   ```

5. If no URL is available, open the unified GUI:

   ```bash
   python <this-skill-dir>/scripts/launch_wandao.py
   ```

## Provider Detection

The launcher can infer providers from URL hosts:

- `zsxq.com` -> `zsxq`
- `yuque.com` -> `yuque`
- `feishu.cn/wiki` -> `feishu`
- `thoughts.aliyun.com/workspaces` -> `aliyun-thoughts`

If the user says "Alibaba Cloud Yunxiao" or "Alibaba Cloud DevOps", inspect the actual URL first. Use `aliyun-thoughts` only for `thoughts.aliyun.com/workspaces/...` URLs. Generic `devops.aliyun.com` pages are not supported by the current exporter.

If a URL is ambiguous, ask the user for the provider or pass `--provider`.

## Recommended Parameters

For `zsxq` project or column URLs:

- Default depth: `--max-depth 2`
- Folder threshold: `--folder-link-threshold 9`
- Skip video-only pages unless requested: `--skip-video-topics`
- Safer request pace: `--request-delay 1.5 --request-jitter 0.6`
- If nested links were missed in an earlier run, add `--update-existing`

For `yuque`, `feishu`, and `aliyun-thoughts` URLs:

- Use incremental export by default
- Normal request pace: `--request-delay 0.8 --request-jitter 0.4`
- Add `--update-existing` only when refreshing existing local docs

For single article URLs:

- Use low depth unless the article is clearly an index page
- Skip video-only pages when the user wants text documents

## Plain-Language Explanations

Use these short explanations when the user is unsure:

- URL depth: how many layers of internal links should be opened.
- Request delay: how long the tool waits between document/page requests.
- Incremental export: only add missing documents by default.
- Update existing: refresh documents that already exist locally.
- Skip video pages: avoid creating empty Markdown for video-only pages.

The tool stores cookies only, not account passwords. If login is needed, tell the user to complete login in the opened browser and then save credentials in the GUI.
