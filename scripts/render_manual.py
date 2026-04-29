"""Render USER_MANUAL.md into a brand-styled HTML wrapper.

After this runs, use:
    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
        --headless --disable-gpu --no-pdf-header-footer \\
        --print-to-pdf=USER_MANUAL.pdf file://$(pwd)/USER_MANUAL.html
    textutil -convert docx USER_MANUAL.html -output USER_MANUAL.docx
"""

from __future__ import annotations

import re
from pathlib import Path

import markdown


REPO_ROOT = Path(__file__).resolve().parent.parent
MD_PATH = REPO_ROOT / "USER_MANUAL.md"
HTML_PATH = REPO_ROOT / "USER_MANUAL.html"


CSS = """
@page { size: Letter; margin: 1in; }

:root {
  --brand-deep: #7c3aed;
  --brand-mid:  #a78bfa;
  --brand-cyan: #22d3ee;
  --ink:        #0f172a;
  --muted:      #475569;
  --rule:       #e2dafa;
  --soft-bg:    #f5f3ff;
}

html, body {
  margin: 0;
  padding: 0;
  color: var(--ink);
  font-family: "Calibri", "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
}

a { color: var(--brand-deep); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---- cover page ---- */
section.cover {
  min-height: 9.2in;
  page-break-after: always;
}
section.cover .cover-title {
  font-size: 30pt;
  font-weight: 700;
  color: var(--brand-deep);
  margin: 1in 0 0.18in 0;
}
section.cover .brand-bar {
  height: 6px;
  width: 240px;
  background: linear-gradient(135deg, var(--brand-mid), var(--brand-cyan));
  border-radius: 3px;
}
section.cover .cover-sub {
  margin-top: 14px;
  color: var(--muted);
  font-size: 13pt;
  font-style: italic;
}

/* ---- table of contents ---- */
section.toc-page { page-break-after: always; }
section.toc-page h2.toc-title {
  font-size: 22pt;
  color: var(--brand-deep);
  font-weight: 700;
  margin: 0 0 0.4em 0;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 6px;
}
section.toc-page ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
  font-style: italic;
}
section.toc-page > ul > li > a { font-style: normal; font-weight: 600; }
section.toc-page ul ul { padding-left: 0.5in; font-style: italic; font-weight: 400; }
section.toc-page ul ul ul { padding-left: 0.45in; }
section.toc-page li { margin: 0.18em 0; }
section.toc-page a { color: var(--ink); }
section.toc-page a:hover { color: var(--brand-deep); }

/* ---- body sections ---- */
section.body-content h2 {
  color: var(--brand-deep);
  font-size: 16pt;
  font-weight: 600;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 4px;
  margin: 1.4em 0 0.4em 0;
}
section.body-content h3 {
  color: var(--brand-deep);
  font-size: 13pt;
  font-weight: 600;
  margin: 1.1em 0 0.25em 0;
}
section.body-content h4 {
  color: var(--brand-mid);
  font-size: 11pt;
  font-weight: 600;
  text-decoration: underline;
  margin: 1em 0 0.25em 0;
}

/* ---- body text ---- */
section.body-content p { margin: 0.4em 0; }
section.body-content ul, section.body-content ol {
  margin: 0.3em 0 0.6em 0;
  padding-left: 1.4em;
}
section.body-content li { margin: 0.15em 0; }

/* ---- inline code, code blocks ---- */
section.body-content code {
  font-family: "Menlo", "Consolas", monospace;
  font-size: 10pt;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--soft-bg);
}
section.body-content pre {
  background: var(--soft-bg);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 9.5pt;
  line-height: 1.35;
  overflow-x: auto;
}
section.body-content pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* ---- tables ---- */
section.body-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.6em 0;
  font-size: 10.5pt;
}
section.body-content th, section.body-content td {
  border: 1px solid var(--rule);
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
}
section.body-content th { background: #f3eefe; color: var(--brand-deep); }

/* ---- blockquotes (used for figure callouts) ---- */
section.body-content blockquote {
  margin: 0.8em 0;
  padding: 0.4em 0.8em;
  border-left: 3px solid var(--brand-mid);
  background: var(--soft-bg);
  color: var(--ink);
}
section.body-content blockquote p { margin: 0.2em 0; }
section.body-content blockquote em {
  color: var(--muted);
  font-style: italic;
}

/* ---- images ---- */
section.body-content img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.6em auto;
  border: 1px solid var(--rule);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  page-break-inside: avoid;
}
"""


def split_sections(source: str) -> tuple[str, str, str]:
    """Return (title, toc_markdown, body_markdown)."""
    title_match = re.search(r"^# (.+)$", source, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else "User Manual"

    parts = re.split(r"^---\s*$", source, flags=re.MULTILINE)
    if len(parts) >= 3:
        toc_block = parts[1]
        body_block = "---".join(parts[2:])
    else:
        toc_block = ""
        body_block = source

    toc_match = re.search(r"^## Table of Contents\s*\n(.*)", toc_block, re.DOTALL | re.MULTILINE)
    toc_md = toc_match.group(1).strip() if toc_match else toc_block.strip()

    return title, toc_md, body_block.lstrip()


def render() -> None:
    source = MD_PATH.read_text(encoding="utf-8")
    title, toc_md, body_md = split_sections(source)

    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "attr_list", "sane_lists"],
        output_format="html5",
    )
    toc_html = md.convert(toc_md)
    md.reset()
    body_html = md.convert(body_md)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>

<section class="cover">
  <h1 class="cover-title">{title}</h1>
  <div class="brand-bar"></div>
  <p class="cover-sub">Plan meals and workouts like the pros.</p>
</section>

<section class="toc-page">
  <h2 class="toc-title">Table of Contents</h2>
  {toc_html}
</section>

<section class="body-content">
  {body_html}
</section>

</body>
</html>
"""
    HTML_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {HTML_PATH}")


if __name__ == "__main__":
    render()
