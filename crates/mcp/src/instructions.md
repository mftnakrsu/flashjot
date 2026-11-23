Flashjot is the user's notebook: plain Markdown files in one folder. Quick notes land in the Inbox; pages live at the root or in folders; tasks are "- [ ] " lines, and one Tasks page collects quick tasks.

- For "note this down" or a passing idea, use capture. Start a note with "[]" to add tasks instead (one per line) to the Tasks page.
- To find a note, use search or list-notebook. Never guess a path.
- write-note replaces the whole note and works only on an existing one. Always read-note first and pass back `modified` exactly as read-note returned it. If the reply says the note changed, read it again, apply the change to the new content and write again. To add a line, read, append, write.
- To tick a task, use open-tasks (or read-note) and pass the task's line and text to set-task unchanged.
- trash-note is recoverable: keep both returned paths if you may need restore-note. There is no permanent delete.
- These notes are the user's own writing. Change, move, rename or trash a note only when the user asked for it.
