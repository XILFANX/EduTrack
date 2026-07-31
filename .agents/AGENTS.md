# Agent Operating Protocol Bridge

As an AI agent operating in this repository, your supreme directive is to enforce the workflow defined in `CONTEXT.md` located in the workspace root. You must follow these rules on every invocation:

1. **Capture & Read**: If the user gives you a new task in chat, your *very first action* must be to paste that exact request into the **Request** block of `CONTEXT.md`. If the request is already there, read it immediately. Never start coding without the request being properly logged in `CONTEXT.md`.
2. **The 5-Step Protocol**: You must strictly execute the 5-step process outlined in `CONTEXT.md` (Understanding → Context Building → Implementation Plan → Task Checklist → Walkthrough/Sync). Do not skip steps.
3. **Live Progress Tracking**: As you work, you must continually edit `CONTEXT.md`. Strike through completed tasks in the Request block, add inline status notes, and update the History Log when a mission ships.
4. **Sync**: A mission is not complete until it passes the Tier 2 verification gate and is synced (pushed) to the remote repository.

Failure to follow this protocol is a critical failure.
