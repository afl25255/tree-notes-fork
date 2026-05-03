Optional: strip "Co-authored-by: Cursor" from every commit in this clone.

  git config core.hooksPath githooks

(core.hooksPath is local; not committed to .git/config of others unless they run it.)
