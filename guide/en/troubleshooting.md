[← Back to Index](index.md) | [中文](../zh/troubleshooting.md)

# Troubleshooting

Common issues and how to fix them.

---

## Obsidian CLI not available

**Symptom:** /weave or other skills fail with "Obsidian CLI is not available."

**Fix:**
1. Make sure Obsidian is running
2. Make sure your vault is open in Obsidian
3. Enable CLI: **Settings** → **General** → **Advanced** → **Command-line interface**
4. Verify: run `obsidian --version` in your terminal

---

## byoao install says "OpenCode not installed"

**Symptom:** Install warns that OpenCode is not found.

**Fix:**
- Install OpenCode: `npm install -g opencode` or visit [opencode.ai](https://opencode.ai)
- If you just installed it, open a new terminal window (the PATH may not be updated)
- You can still use `byoao init` and `byoao status` without OpenCode — the AI skills just won't be available

---

## byoao init fails

**Common causes:**

- **Path permissions:** Make sure you have write access to the target directory
- **Path already exists as a file:** The vault path must be a directory, not a file
- **Obsidian not installed:** `byoao init` checks for Obsidian first. Install it from [obsidian.md](https://obsidian.md)

---

## /weave doesn't find my notes

**Possible reasons:**

- **Files are excluded:** /weave skips `.obsidian/`, `.git/`, `node_modules/`, templates, AGENT.md, and binary files
- **Custom exclusions:** Check if you have a `.byoaoignore` file with overly broad patterns
- **Wrong vault:** Make sure the correct vault is open in Obsidian
- **Non-markdown files:** /weave only processes `.md` files. PDFs, images, and other files are skipped (count reported at the end)

---

## Glossary terms not being linked

**Possible reasons:**

- **Case mismatch:** Glossary terms are matched with some flexibility, but very different casing may not match. Ensure the term in the Glossary matches how it appears in your notes.
- **Inside code blocks:** /weave doesn't create links inside code blocks or existing wikilinks
- **Already linked:** /weave is idempotent — if a term is already a `[[wikilink]]`, it won't be touched

---

## AGENT.md looks wrong or has missing sections

**Fix:**
- Run `byoao upgrade` to regenerate AGENT.md sections between markers
- Manual edits outside `<!-- byoao:...:start/end -->` markers are preserved
- Content between markers is auto-generated — don't edit it manually

---

## Plugin not loading in OpenCode

**Symptoms:** BYOAO tools don't appear in OpenCode sessions.

**Fix:**
1. Check that BYOAO is registered: look for `"byoao"` in `.opencode.json` (project-level) or `~/.config/opencode/opencode.json` (global)
2. Re-run `byoao install` to re-register
3. Restart OpenCode after installing

---

## Obsidian plugins not appearing

**Symptoms:** Agent Client or BRAT don't show up after `byoao init`.

**Fix:**
1. When opening the vault for the first time, click **"Trust author and enable plugins"**
2. Go to **Settings** → **Community plugins** and verify they are enabled
3. If Obsidian was running during `byoao init`, restart it or use **Cmd+P** → "Reload app without saving"

---

## Backups and undoing changes

/weave creates backups at `.byoao/backups/<timestamp>/` before modifying any file.

To restore a file:
```bash
cp .byoao/backups/2026-03-29T14-30/my-note.md ./my-note.md
```

To find the latest backup:
```bash
ls -la .byoao/backups/
```

---

## Still stuck?

- Check [GitHub Issues](https://github.com/JayJiangCT/BYOAO/issues) for known problems
- Open a new issue with: BYOAO version (`byoao --version`), Node version (`node --version`), OS, and steps to reproduce

---

**← Previous:** [CLI Reference](cli-reference.md)
