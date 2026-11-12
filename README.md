# Protein function retrieval course site

English course site for Sun Chengyu. It is prepared for a GitHub Pages project site.

Planned repository: `protein-retrieval-course`  
Planned Pages source: the `docs` directory on the `main` branch  
Planned addresses, not yet published:

- https://chengyu-s.github.io/protein-retrieval-course/
- https://chengyu-s.github.io/protein-retrieval-course/project.html

These addresses are not live. This folder has not been uploaded.

## What is included

- `docs/` is the website. Pages, styles, scripts, and data use relative links so they also work under `/protein-retrieval-course/`.
- `docs/data/site_data.json` keeps the original full-precision numbers. Only the public labels are in English.
- `tools/export_site_data.py` can rebuild that JSON from the existing course analysis. It does not retrain anything.
- `tools/check_site.py` checks file counts, displayed numbers, English text, and relative links. It does not open a browser.
- `review/website_checks.md` records that the browser checks in this round were not run.
- `docs/downloads/` is empty. The page does not invent a report link.

## Preview on this computer

Open a terminal in `docs`, then run:

```bash
python -m http.server 8776
```

Visit:

- http://127.0.0.1:8776/index.html
- http://127.0.0.1:8776/project.html

Opening the HTML file directly will not load the results, because the page reads a JSON file. If the message says the address is already in use, change `8776` to another port and use that port in the address.

Stop the preview with Ctrl+C.

## Check the project-site path

GitHub Pages will place this site under `/protein-retrieval-course/`, not at the server root. From the folder that contains `course_website_v4_en`, run:

```bash
mkdir -p _pages_preview
ln -sfn ../course_website_v4_en/docs _pages_preview/protein-retrieval-course
cd _pages_preview
python -m http.server 8776
```

Then open:

http://127.0.0.1:8776/protein-retrieval-course/project.html

Confirm that the page, stylesheet, script, and `data/site_data.json` all load. A missing style or a “could not be loaded” message means a link is wrong.

## Check the files

From `course_website_v4_en`:

```bash
python tools/check_site.py
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

Only needed if the course analysis files change. From `course_website_v4_en`, with `course_analysis_v1` beside this folder:

```bash
python tools/export_site_data.py
```

The script stops without replacing the JSON if a displayed number does not match the checked values. It uses at most 4 CPU threads and no GPU.

## Package a zip

From the folder that contains `course_website_v4_en`:

```bash
zip -r course_website_v4_en.zip course_website_v4_en -x '*/__pycache__/*' '*/.ff*'
```

Do not put a local preview server or a browser profile in the zip.

## Publishing later

When you choose to publish, create the repository `protein-retrieval-course`, put this site on `main`, and set GitHub Pages to the `docs` folder. Do not change another personal website to do that. The planned addresses above should be checked in a browser after publishing; they are not evidence that the site is already online.
