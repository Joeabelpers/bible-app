# Bible App — Project Context

> Drop this file into your Claude project so future chats have full context.

---

## What this app is

A daily Bible reading web app built in React, backed by Supabase. It follows the **Roberts Reading Plan** ("The Bible Companion" by Robert Roberts), which assigns three passages per day so users read the Old Testament once and the New Testament twice in a year. Users can highlight verses, leave private notes, post comments visible to their reading group, and switch between Bible translations.

**Live project path:** `/Users/joeabel/Desktop/bible-app`  
**Main component:** `src/DailyBibleApp.jsx`  
**Supabase project URL:** `https://mxlpyaebssriqdubjeiu.supabase.co`

---

## Database schema (Supabase)

| Table | Purpose |
|---|---|
| `bible_verses` | Stores all verse text. Columns: `id`, `book` (text), `chapter` (int), `verse` (int), `text` (text), `version` (text). Unique constraint on `(book, chapter, verse, version)`. |
| `comments` | User comments per day. Supports `visibility`: `'personal'` or `'group'`. Linked to `groups` and `auth.users`. |
| `annotations` | Highlights and underlines per verse, per user. Stores `start_offset`, `end_offset`, `colour`, `style`. |
| `verse_notes` | Private per-user notes on individual verses. One note per `verse_ref` per user. |
| `groups` | Reading groups with a unique `invite_code`. |
| `group_members` | Join table for users ↔ groups, with `role` and `status` (`pending`/`approved`). |

There is **no `reading_plan` table** — the schedule is hardcoded in the frontend as `READING_PLAN` in `DailyBibleApp.jsx`.

---

## Bible translations loaded

- **ESV** — loaded via `esv_verses_upload.json` → `load_versions.js`
- **NKJV** — loaded via `nkjv_verses_upload.json` → same loader
- **KJV** — the default/original version already in the DB

The loader script is at the project root: `load_versions.js`. It uses `upsert` with `ignoreDuplicates: true` in batches of 500.

---

## ESV data quality — history and fixes

The original ESV source JSON had **666 verses** where adjacent verse text was incorrectly merged. For example, verse 19's text would contain verse 20's text appended inline with an embedded reference tag like `Joh 12:20`.

A multi-pass Python fix script was developed to iteratively detect and split these merges:

- **Pattern detected:** embedded abbreviated book references mid-verse text (e.g. `Deu 18:16`, `Joh 12:20`)
- **Logic:** if the embedded ref points to the *next* verse (host+1, chapter rollover, or book rollover), split the text there
- **Passes required:** 2 (some verses had double-merges, e.g. Deuteronomy 18:14 contained both 15 and 16)
- **Final result:** `esv_verses_fixed.json` — **31,084 verses**, all correctly separated
- **20 remaining embedded-looking refs** are intentional ESV manuscript omissions (e.g. Matt 12:47, Matt 17:21, Mark 7:16, John 5:4) — the ESV intentionally skips these verse numbers and they are not errors

**To re-upload ESV after any future issue:**
```sql
-- Run in Supabase SQL editor first:
DELETE FROM bible_verses WHERE version = 'ESV';
```
```bash
# Then rename the fixed file and run the loader:
mv esv_verses_fixed.json esv_verses_upload.json
node load_versions.js
```

---

## Known bugs fixed

### 1. Song of Solomon not loading (fixed)

**Root cause:** `normaliseBookName()` used `replace(/\b\w/g, c => c.toUpperCase())` which capitalised every word, turning `"Song of Solomon"` into `"Song Of Solomon"`. The DB stores it as `"Song of Solomon"` so the Supabase query returned nothing.

**Fix applied** to `src/DailyBibleApp.jsx` (~line 1000):
- Added `"song of solomon"` and `"song of songs"` to `BOOK_ALIASES` (both map to `"Song of Solomon"`)
- Rewrote the capitalisation logic to preserve lowercase connectors (`"of"`, `"the"`, `"and"`) in non-leading positions

```js
const BOOK_ALIASES = {
  "1 chron.": "1 Chronicles", "2 chron.": "2 Chronicles",
  "rev": "Revelation", "psalm": "Psalms",
  "song of solomon": "Song of Solomon",
  "song of songs": "Song of Solomon",
};
function normaliseBookName(raw) {
  const lower = raw.trim().toLowerCase();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  const LOWER_WORDS = new Set(["of", "the", "and"]);
  return raw.trim().replace(/\b\w+/g, (word, offset) => {
    if (offset > 0 && LOWER_WORDS.has(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}
```

---

## Frontend architecture highlights

- **Reading plan:** Hardcoded JS object `READING_PLAN` keyed by `"month-day"` (e.g. `"5-4"`), each value an array of 3 passage strings.
- **Passage parsing:** `parsePassageRef(ref)` converts strings like `"Song of Solomon 1"` or `"Psalms 119:1-40"` into `{ book, chapters[] }` objects.
- **Verse fetching:** `fetchVerses(book, chapters, version)` queries Supabase with `.eq('book', book).eq('version', version).in('chapter', chapters)`. Results are cached in a module-level `verseCache` object.
- **Translations:** KJV, ESV, NKJV — toggled via `bibleVersion` state.
- **Annotations:** Stored in Supabase `annotations` table, rendered by `AnnotatedVerse` component using character offsets into verse text.
- **Comments:** Per-day, visibility `'personal'` or `'group'`. Group comments require approved `group_members` membership.
- **Auth:** Supabase Auth (email/password). Username stored in user metadata.

---

## Key file locations

| File | Purpose |
|---|---|
| `src/DailyBibleApp.jsx` | Entire frontend app (single file, ~2500 lines) |
| `load_versions.js` | Node script to batch-upload verse JSON to Supabase |
| `esv_verses_fixed.json` | Cleaned ESV verse data (31,084 verses) — use this for any re-uploads |
| `nkjv_verses_upload.json` | NKJV verse data |
| `Bible_Readings_Database.sql` | Schema reference (context only, not directly executable) |

---

## MCP / Claude filesystem access

Claude has MCP filesystem access to:
- `/Users/joeabel/Desktop/bible-app` ✅
- `/Users/joeabel/Desktop/hymn-app` ✅
- `/Users/joeabel/Downloads` ✅

Claude can read and edit files directly using `Filesystem:edit_file`. Joe prefers direct file edits over copy-paste code snippets.
