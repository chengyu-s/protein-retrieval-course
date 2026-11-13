# Setup, checks, and packaging

These steps maintain the site. They do not retrain models or change the published numbers. The short local preview in `README.md` uses port 8000. The checks below use port 8776. If either port is already taken, pick a free port and use that same port in the browser address.

GitHub Pages publishes the `docs` directory on the `main` branch:

- https://chengyu-s.github.io/protein-retrieval-course/
- https://chengyu-s.github.io/protein-retrieval-course/project.html

A later change appears on the site after it is pushed to `main`. Do not replace another personal website with this project.

## Local preview

From the repository root:

```bash
python3 -m http.server 8776 --directory docs
```

Visit:

- http://127.0.0.1:8776/index.html
- http://127.0.0.1:8776/project.html

Opening an HTML file directly will not load the results, because the page reads a JSON file. Stop the preview with Ctrl+C.

## Check the project-site path

GitHub Pages serves this site under `/protein-retrieval-course/`, not at the server root. From the repository root:

```bash
mkdir -p ../_pages_preview
ln -sfn "$PWD/docs" ../_pages_preview/protein-retrieval-course
cd ../_pages_preview
python3 -m http.server 8776
```

Then open:

http://127.0.0.1:8776/protein-retrieval-course/project.html

Confirm that the page, stylesheet, script, and `data/site_data.json` all load. A missing style, or the message “Results could not be loaded”, means a link is wrong. Stop the server with Ctrl+C. The preview directory is created beside the repository, not inside it.

## Check the files

From the repository root:

```bash
python3 tools/check_site.py
```

A passing message only means the files and numbers match. It does not measure phone layout.

## What to look at in the browser

Use a wide window, about 1440 pixels, and a narrow window, about 390 pixels.

- Home: name, three interests, one project card, and the GitHub link.
- Project: four study figures, three findings, the gain table, then the explorer.
- Budget buttons: 5%, 10%, and 20%. The default is 10%.
- Changing the strategy or budget changes the macro-average gain. Searching does not.
- Search `GO:0003723` and a GO ID that does not exist.
- Chart labels stay readable and are not cut off. The interval axis still runs from −0.03 to +0.03.
- Press Tab and confirm a visible focus outline.
- No report download appears while `docs/downloads/` is empty.

## Rebuild the data

Only needed if the separate course-analysis files change. From the repository root, with `course_analysis_v1` beside this repository:

```bash
python3 tools/export_site_data.py
```

The script stops without replacing the JSON if a displayed number does not match the checked values. It uses at most 4 CPU threads and no GPU.

## Package a zip

From the parent of the repository, replace `REPO_DIR` with the repository folder name:

```bash
zip -r protein-retrieval-course.zip REPO_DIR -x '*/__pycache__/*' '*/.ff*'
```

Do not put a local preview server or a browser profile in the zip.
