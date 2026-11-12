# Check the generated English site files.
# This does not train a model and does not start a web server.

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"
os.environ["OPENBLAS_NUM_THREADS"] = "4"
os.environ["NUMEXPR_NUM_THREADS"] = "4"
os.environ["CUDA_VISIBLE_DEVICES"] = ""

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DATA = DOCS / "data" / "site_data.json"
CJK = re.compile(r"[\u3400-\u9fff]")

REQUIRED_FILES = [
    DOCS / "index.html",
    DOCS / "project.html",
    DOCS / ".nojekyll",
    DOCS / "assets" / "site.css",
    DOCS / "assets" / "site.js",
    DATA,
]
EXPECTED_AP = {
    "logistic": "0.3838",
    "random_forest_classifier": "0.4058",
    "ridge": "0.1558",
    "query_ranking": "0.3473",
}
EXPECTED_DELTA = {
    ("0.10", "logistic"): "+0.0005",
    ("0.10", "random_forest_classifier"): "+0.0032",
    ("0.10", "ridge"): "+0.0077",
    ("0.10", "query_ranking"): "+0.0139",
    ("0.10", "random"): "−0.0019",
    ("0.20", "query_ranking"): "+0.0006",
}
EXPECTED_LABELS = {
    "logistic": "Logistic regression",
    "random_forest_classifier": "Random forest classifier",
    "ridge": "Ridge regression",
    "query_ranking": "Query ranking heuristic",
    "random": "Random selection",
}
FORBIDDEN = ["localhost", "127.0.0.1", "/home/", "file://", 'href="/', 'src="/']
PUBLIC_TEXT = [
    "Sun Chengyu",
    "https://github.com/chengyu-s",
    "Search filters the displayed rows only. The macro average is always calculated across all 28 queries for the current strategy and budget.",
    "Positive-class prevalence: 37/297",
    "Results could not be loaded. Please try again later.",
    "Resources will be added when available.",
    "Skip to main content",
    "SHARED_AXIS_MIN = -0.03",
    "SHARED_AXIS_MAX = 0.03",
]


def main() -> None:
    errors = []
    for path in REQUIRED_FILES:
        if not path.is_file():
            errors.append(f"missing file: {path.relative_to(ROOT)}")

    payload = json.loads(DATA.read_text(encoding="utf-8"))
    if len(payload["ranking"]) != 4:
        errors.append(f"ranking rows: {len(payload['ranking'])}, expected 4")
    if len(payload["budget"]) != 15:
        errors.append(f"budget rows: {len(payload['budget'])}, expected 15")
    if len(payload["per_query"]) != 336:
        errors.append(f"per-query rows: {len(payload['per_query'])}, expected 336")
    if payload.get("baseline_ndcg") != "0.28326150948068757":
        errors.append("baseline full precision changed")
    if payload.get("report_pdf") or payload.get("analysis_pack"):
        errors.append("report or analysis package is not empty")
    if payload.get("role") != "Primary analysis":
        errors.append("role label is not English")

    for item in payload["ranking"]:
        if item["ap_display"] != EXPECTED_AP[item["model"]]:
            errors.append(f"{item['model']} AP display is {item['ap_display']}")
        if item["label"] != EXPECTED_LABELS[item["model"]]:
            errors.append(f"{item['model']} label is {item['label']}")
    for item in payload["budget"]:
        key = (item["fraction"], item["method"])
        if key in EXPECTED_DELTA and item["delta_display"] != EXPECTED_DELTA[key]:
            errors.append(f"{key} delta display is {item['delta_display']}")
        if item["label"] != EXPECTED_LABELS[item["method"]]:
            errors.append(f"{key} label is {item['label']}")
        low = float(item["interval_low"])
        high = float(item["interval_high"])
        if low < -0.03 or high > 0.03:
            errors.append(f"{key} interval endpoint is outside -0.03 to +0.03")
        if CJK.search(item.get("interval_source", "")):
            errors.append(f"{key} interval source still contains Chinese")

    text_files = [path for path in DOCS.rglob("*") if path.is_file() and path.suffix != ""]
    combined_parts = []
    for path in text_files:
        text = path.read_text(encoding="utf-8")
        combined_parts.append(text)
        if CJK.search(text):
            errors.append(f"Chinese text remains in {path.relative_to(ROOT)}")
    combined = "\n".join(combined_parts)
    for phrase in FORBIDDEN:
        if phrase in combined:
            errors.append(f"disallowed path text: {phrase}")
    for phrase in PUBLIC_TEXT:
        if phrase not in combined:
            errors.append(f"missing required text: {phrase}")
    if 'lang="en"' not in (DOCS / "index.html").read_text(encoding="utf-8"):
        errors.append("homepage language is not English")
    if 'lang="en"' not in (DOCS / "project.html").read_text(encoding="utf-8"):
        errors.append("project page language is not English")
    project = (DOCS / "project.html").read_text(encoding="utf-8")
    if "downloads/" in project:
        errors.append("project page links a download before a file exists")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(1)
    print("File check passed: 4 ranking rows, 15 budget rows, 336 per-query rows.")
    print("This checks files only. Browser layout, the 1440 and 390 views, and the project subpath still need the README commands.")


if __name__ == "__main__":
    main()
