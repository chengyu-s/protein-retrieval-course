# 从已完成的课程复算结果导出网页用的小数据。
# 不训练模型，不读取服务器绝对路径，不改原始结果。

from __future__ import annotations

import csv
import json
import os
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"
os.environ["OPENBLAS_NUM_THREADS"] = "4"
os.environ["NUMEXPR_NUM_THREADS"] = "4"
os.environ["CUDA_VISIBLE_DEVICES"] = ""

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "course_analysis_v1"
OUT = ROOT / "docs" / "data" / "site_data.json"

PUBLIC_MODELS = ("logistic", "random_forest_classifier", "ridge", "query_ranking")
BUDGET_METHODS = PUBLIC_MODELS + ("random",)
LABELS = {
    "logistic": "Logistic regression",
    "random_forest_classifier": "Random forest classifier",
    "ridge": "Ridge regression",
    "query_ranking": "Query ranking heuristic",
    "random": "Random selection",
    "no_upgrade": "No replacement",
}
BUDGET_LABEL = {"0.05": "5%", "0.10": "10%", "0.20": "20%"}

# 这些是页面文案中的显示值，只用于核对，不是数据来源。
EXPECTED_AP = {
    "logistic": "0.3838",
    "random_forest_classifier": "0.4058",
    "ridge": "0.1558",
    "query_ranking": "0.3473",
}
EXPECTED_DELTA = {
    ("0.05", "logistic"): "+0.0024",
    ("0.05", "random_forest_classifier"): "+0.0085",
    ("0.05", "ridge"): "+0.0024",
    ("0.05", "query_ranking"): "+0.0065",
    ("0.05", "random"): "−0.0016",
    ("0.10", "logistic"): "+0.0005",
    ("0.10", "random_forest_classifier"): "+0.0032",
    ("0.10", "ridge"): "+0.0077",
    ("0.10", "query_ranking"): "+0.0139",
    ("0.10", "random"): "−0.0019",
    ("0.20", "logistic"): "+0.0019",
    ("0.20", "random_forest_classifier"): "+0.0038",
    ("0.20", "ridge"): "+0.0075",
    ("0.20", "query_ranking"): "+0.0006",
    ("0.20", "random"): "−0.0046",
}
EXPECTED_INTERVAL = {
    ("0.10", "logistic"): ("−0.0139", "+0.0141"),
    ("0.10", "random_forest_classifier"): ("−0.0078", "+0.0147"),
    ("0.10", "ridge"): ("+0.0006", "+0.0160"),
    ("0.10", "query_ranking"): ("+0.0026", "+0.0254"),
    ("0.10", "random"): ("−0.0142", "+0.0071"),
}
EXPECTED_K = {"0.05": "15", "0.10": "30", "0.20": "59"}


def read_tsv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def display_plain(text: str) -> str:
    number = Decimal(text).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return format(number, "f")


def display_signed(text: str) -> str:
    number = Decimal(text).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    if number > 0:
        return "+" + format(number, "f")
    if number < 0:
        return "−" + format(abs(number), "f")
    return "0.0000"


def interval_kind(source: str) -> str:
    if "随机子集" in source or "random subset" in source.lower():
        return "random_subset"
    if "查询重抽样" in source or "query resampl" in source.lower():
        return "query_resample"
    return "defined_zero"


def english_interval_source(source: str) -> str:
    # The result table is Chinese. The public JSON uses English descriptions.
    if interval_kind(source) == "random_subset":
        return "Percentile range across 100 random subsets; not a query-resampling interval"
    if interval_kind(source) == "query_resample":
        return "1,000 query resamples with the selected proteins fixed; models are not retrained"
    return source


def main() -> None:
    needed = [
        SOURCE / "results" / "w010" / "ranking_metrics.tsv",
        SOURCE / "results" / "w010" / "budget_gains.tsv",
        SOURCE / "results" / "w010" / "per_query_delta.tsv",
        SOURCE / "data" / "queries.tsv",
    ]
    missing = [path.name for path in needed if not path.is_file()]
    if missing:
        raise SystemExit("缺少课程复算结果：" + "、".join(missing) + "。请先完成 course_analysis_v1。")
    ranking_rows = read_tsv(needed[0])
    budget_rows = read_tsv(needed[1])
    query_rows = read_tsv(needed[2])
    queries = read_tsv(needed[3])
    names = {row["go_id"]: row["name"] for row in queries}
    if len(names) != 28:
        raise SystemExit(f"查询数是 {len(names)}，文案要求 28。")

    ranking = []
    for row in ranking_rows:
        if row["model"] not in PUBLIC_MODELS:
            continue
        ranking.append(
            {
                "model": row["model"],
                "label": LABELS[row["model"]],
                "ap": row["AP"],
                "ap_display": display_plain(row["AP"]),
            }
        )
    found_models = [item["model"] for item in ranking]
    if found_models != list(PUBLIC_MODELS):
        raise SystemExit(f"排序指标模型不符合文案：{found_models}")

    budget = []
    baseline = ""
    for row in budget_rows:
        fraction = f"{Decimal(row['fraction']):.2f}"
        if row["method"] == "no_upgrade" and fraction == "0.10":
            baseline = row["ndcg"]
        if row["method"] not in BUDGET_METHODS:
            continue
        if fraction not in BUDGET_LABEL:
            continue
        budget.append(
            {
                "fraction": fraction,
                "fraction_label": BUDGET_LABEL[fraction],
                "method": row["method"],
                "label": LABELS[row["method"]],
                "nominal_k": row["nominal_k"],
                "actual_k": row["actual_k"],
                "ndcg": row["ndcg"],
                "delta_ndcg": row["delta_ndcg"],
                "delta_display": display_signed(row["delta_ndcg"]),
                "interval_low": row["interval_low"],
                "interval_high": row["interval_high"],
                "interval_low_display": display_signed(row["interval_low"]) if row["interval_low"] else "",
                "interval_high_display": display_signed(row["interval_high"]) if row["interval_high"] else "",
                "interval_kind": interval_kind(row["interval_source"]),
                "interval_source": english_interval_source(row["interval_source"]),
            }
        )
    if baseline != "0.28326150948068757":
        raise SystemExit(f"基线与文案不一致：{baseline}")

    per_query = []
    for row in query_rows:
        if row["method"] not in PUBLIC_MODELS:
            continue
        fraction = f"{Decimal(row['fraction']):.2f}"
        if fraction not in BUDGET_LABEL:
            continue
        go_id = row["go_id"]
        if go_id not in names:
            raise SystemExit(f"查询 {go_id} 不在 queries.tsv 中。")
        per_query.append(
            {
                "fraction": fraction,
                "fraction_label": BUDGET_LABEL[fraction],
                "method": row["method"],
                "label": LABELS[row["method"]],
                "go_id": go_id,
                "name": names[go_id],
                "ndcg": row["ndcg"],
                "baseline_ndcg": row["baseline_ndcg"],
                "delta_ndcg": row["delta_ndcg"],
                "ndcg_display": display_plain(row["ndcg"]),
                "baseline_display": display_plain(row["baseline_ndcg"]),
                "delta_display": display_signed(row["delta_ndcg"]),
            }
        )

    mismatches = []
    for item in ranking:
        if item["ap_display"] != EXPECTED_AP[item["model"]]:
            mismatches.append(f"AP {item['model']} 显示为 {item['ap_display']}，文案为 {EXPECTED_AP[item['model']]}")
    for item in budget:
        key = (item["fraction"], item["method"])
        if item["delta_display"] != EXPECTED_DELTA[key]:
            mismatches.append(f"增量 {key} 显示为 {item['delta_display']}，文案为 {EXPECTED_DELTA[key]}")
        if item["actual_k"] != EXPECTED_K[item["fraction"]]:
            mismatches.append(f"条数 {key} 为 {item['actual_k']}，文案为 {EXPECTED_K[item['fraction']]}")
        if key in EXPECTED_INTERVAL:
            low, high = EXPECTED_INTERVAL[key]
            if item["interval_low_display"] != low or item["interval_high_display"] != high:
                mismatches.append(
                    f"区间 {key} 为 {item['interval_low_display']} 至 {item['interval_high_display']}，文案为 {low} 至 {high}"
                )
    if mismatches:
        print("\n".join(mismatches), file=sys.stderr)
        raise SystemExit("导出值与页面文案不一致，已停止，未覆盖网页数据。")

    payload = {
        "weight": "0.10",
        "role": "Primary analysis",
        "source_label": "Course recomputation",
        "baseline_ndcg": baseline,
        "random_reference": "37/297",
        "report_pdf": None,
        "analysis_pack": None,
        "ranking": ranking,
        "budget": budget,
        "per_query": per_query,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(OUT)
    print(f"已写入 {OUT.relative_to(ROOT)}")
    print(f"排序模型 {len(ranking)} 个，预算行 {len(budget)} 行，逐查询 {len(per_query)} 行。")
    print("显示值与页面文案一致。PDF 与公开分析包均未附上。")


if __name__ == "__main__":
    main()
