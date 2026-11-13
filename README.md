# Protein Function Retrieval with Selective Structure Replacement

**When does additional structural information improve protein retrieval, and can we predict which proteins will benefit?**

This project studies text-to-protein function retrieval using sequence, structural, and functional-text representations. It compares strategies for selecting a limited number of proteins whose structural scores are replaced, and evaluates both prediction quality and the resulting retrieval gain.

**[Explore the interactive project](https://chengyu-s.github.io/protein-retrieval-course/project.html)** · **[Sun Chengyu's homepage](https://chengyu-s.github.io/protein-retrieval-course/)**

## Study overview

| Component | Description |
| --- | --- |
| Data | 2,000 proteins and 28 GO molecular-function queries derived from CAFA5 |
| Split | 1,400 training, 300 validation, and 300 test proteins, separated by sequence-homology cluster |
| Eligible test proteins | 297 with available AlphaFold DB structures |
| Representations | ProTrek embeddings of sequence, 3Di structural tokens, and function text |
| Replacement | ProstT5-generated 3Di scores replaced with scores from AlphaFold DB-derived 3Di |
| Predictors | Logistic regression, random forest classifier, and ridge regression using 40 pre-replacement features |
| Comparisons | Query ranking heuristic and random selection |
| Evaluation | Average precision for positive-gain ranking; change in macro nDCG@10 after selection and reranking |

The primary analysis uses a sequence fusion weight of **0.10**, selected on validation data. Replacement budgets correspond to **15, 30, or 59 proteins** (5%, 10%, or 20% of the 297 eligible test proteins).

## Main results

Only **37 of 297** eligible test proteins produced a positive macro nDCG@10 change when replaced individually; 227 had zero net gain and 33 had negative gain.

At the **10% budget**, selecting 30 proteins yielded:

| Selection strategy | Positive-gain ranking AP | Change in macro nDCG@10 |
| --- | ---: | ---: |
| Logistic regression | 0.3838 | +0.0005 |
| Random forest classifier | **0.4058** | +0.0032 |
| Ridge regression | 0.1558 | +0.0077 |
| Query ranking heuristic | 0.3473 | **+0.0139** |
| Random selection | — | −0.0019 |

The no-replacement baseline is **0.2833** macro nDCG@10. Values are rounded test-set point estimates; random selection reports the mean over 100 subsets. The interactive project provides intervals and query-level results for the four non-random strategies.

The random forest ranked beneficial replacements most effectively by AP, while the query ranking heuristic achieved the largest retrieval gain at this budget. For that heuristic, increasing the budget from 10% to 20% reduced the gain from +0.0139 to +0.0006. Identifying positive individual gains and maximizing the outcome after multiple replacements therefore require separate evaluation.

## Explore the results

The [project page](https://chengyu-s.github.io/protein-retrieval-course/project.html) includes:

- Comparisons of positive-gain ranking and retrieval gain.
- Budget selection with intervals on a shared scale.
- A searchable browser of the 28 function queries.
- Methods, metric definitions, and evaluation limitations.

Changing the selection strategy or budget updates the reported outcome. Searching filters the displayed queries while keeping the macro average over all 28 queries.

## Interpretation and limitations

- Replacement is an operation, not a guarantee of improved structural quality or retrieval.
- Budgets count proteins; this experiment does not measure structure-prediction time or GPU savings.
- Queries were selected partly using test-set positive counts. Results describe this selected query set, and the course analysis reuses the existing test split rather than providing a new independent validation.
- Missing GO annotations do not establish biological negatives. Query-specific known positives and old-training overlaps are excluded from scoring.
- Intervals for models and the heuristic resample queries with selected proteins fixed. Random-selection intervals summarize different subsets. Neither measures variability across repeated training.
- Zero macro gain is an aggregate result and does not prove that every query ranking remained unchanged.

## Repository contents

| Path | Contents |
| --- | --- |
| `docs/index.html` | Personal homepage |
| `docs/project.html` | Interactive project presentation |
| `docs/assets/` | Local styles and JavaScript |
| `docs/data/site_data.json` | Exported full-precision results with English labels |
| `tools/` | Data-export and consistency-check scripts |
| `review/` | Verification notes |
| `SETUP.md` | Deployment, file checks, and packaging |

This repository contains the website and exported results. The upstream embedding and model-training pipeline is not included. Rebuilding the JSON with the exporter requires the separate course-analysis files; browsing the published results does not.

## Local preview

From the repository root, run:

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000/` or `http://localhost:8000/project.html`. These two local addresses work only while the server is running. Opening the HTML directly as a file will not reliably load the JSON data.

Deployment, consistency checks, and packaging instructions are in [SETUP.md](SETUP.md).

## Data and methods references

- [CAFA5 evaluation data](https://doi.org/10.5281/zenodo.22381862)
- [ProTrek](https://doi.org/10.1038/s41587-025-02836-0)
- [ProstT5](https://doi.org/10.1093/nargab/lqae150)
- [Foldseek](https://doi.org/10.1038/s41587-023-01773-0)
- [AlphaFold](https://doi.org/10.1038/s41586-021-03819-2)

## Author

**[Sun Chengyu](https://github.com/chengyu-s)**  
Medical Bioinformatics · School of Basic Medical Sciences, Peking University

Prepared as a course data-analysis project.
