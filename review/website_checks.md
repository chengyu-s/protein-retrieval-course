# Website checks for the English version

The site is published from the `main` branch, using the `docs` folder.

Checked after publishing: the homepage, project page, stylesheet, script, and `data/site_data.json` each returned HTTP 200 at `https://chengyu-s.github.io/protein-retrieval-course/`. The homepage contains the name Sun Chengyu and the GitHub link.

Not checked:

- No browser was opened, so there are no screenshots at 1440 or 390 pixels.
- Phone layout, chart labels, search, budget changes, and keyboard focus were not viewed.
- `python tools/check_site.py` was not run.
- The zip was not created.

Earlier Chinese versions had their own checks. Those results belong to those folders. They are not evidence that this English layout is correct.

Commands to run later are in `README.md`:

1. Preview `docs` on a local port.
2. Preview through `_pages_preview/protein-retrieval-course`.
3. Run `python tools/check_site.py`.
4. In a browser, check both page widths, all three budgets, strategy changes, search, chart labels, the shared interval axis, keyboard focus, and the absence of a download link.
5. Zip the folder only after removing Python cache files and any browser profile.
