# Beyond Academics WordPress integration package

This package adds a long-form digital handbook and searchable competition directory as an isolated plugin. The live 10xTechClub WordPress installation was not available in this workspace, so nothing has been installed or published on the live site.

## Included files

- `beyond-academics-directory/beyond-academics-directory.php` — markdown parser, server-rendered handbook, master directory, and page creation hook.
- `beyond-academics-directory/assets/css/beyond-academics-directory.css` — wrapper-scoped styling and responsive layouts.
- `beyond-academics-directory/assets/js/beyond-academics-directory.js` — master-directory filters, compact mobile contents panel, category-to-directory filtering, and anchor scrolling.
- `beyond-academics-directory/data/README.txt` — source manuscript placement notes.
- `index.html` and `handbook.js` — standalone browser preview using the generated competition JSON.

## WordPress integration

1. Copy the `beyond-academics-directory` folder into `wp-content/plugins/` on the live site.
2. Place `Beyond Academics - Blog Version.md` in `wp-content/plugins/beyond-academics-directory/data/` or `wp-content/uploads/beyond-academics/`.
3. Activate **Beyond Academics Competition Handbook** in WordPress Admin → Plugins.
4. Visit `/beyond-academics/`. The plugin creates this page on activation if the slug is available. Alternatively, place `[beyond_academics_directory]` on a page.

The page uses the active theme's normal header and footer. CSS and JavaScript are scoped to `.beyond-academics-directory`; the plugin does not alter the theme, homepage, or global SEO metadata.

## Directory and data notes

- The contents panel links to the introduction, four-stage journey, master directory, all source categories, parent-fit guidance, preparation guidance, closing section, and student letter.
- The master directory contains 164 unique competition names and consolidates 8 cross-category repeats from the 172 source category placements.
- Category sections retain their handbook introductions and entry counts. Their “View these competitions” links set the master directory's domain filter; competition rows are not repeated in 11 extra tables.
- Cross-listed “Best For” guidance is labeled by the handbook section it came from.
- Filters use source-provided name, domain, grades/age, level, participation format, difficulty, and “Best For” information. National/international scope filters are derived from the source's level labels.
- The available manuscript does not provide a competition calendar, FAQs, cost or time-commitment data, or appendices. The page does not invent those sections or values.
- The student letter at the end is new editorial content written for this digital version; the available manuscript ends without a student letter.
- Official links are taken from the manuscript and should be checked for current availability and registration details before publication.

## Proposed URL

`/beyond-academics/`, subject to availability on the live site.

## Verification

The local preview was checked in a browser: 172 source category placements, 164 unique master records, all directory anchors resolving, search, category filters, empty state, and reset behavior working. The WordPress source and asset files have editor diagnostics checked, but the live theme integration and PHP runtime rendering still need verification on the actual site. No deployment has been performed.
