# Agent Operating Protocol Bridge

As an AI agent operating in this repository, you must **STRICTLY** follow the instructions below on every single invocation:

1. **The Source of Truth**: You must rigorously adhere to the operating protocol defined in `CONTEXT.md` located in the root of this workspace. That file governs the 5-step process (Understanding, Context, Plan, Tasks, Walkthrough) and the documentation requirements.
2. **Start of Session**: At the beginning of any new request, you must immediately read `CONTEXT.md` to find the user's current instructions in the **Request** block. Do not make assumptions about the task without reading this block first.
3. **Living Document**: As you execute the user's request, you must continually edit the `CONTEXT.md` file to update the **Request** block with your progress. Strike through completed tasks, add inline status updates, and ensure the request section accurately reflects what has been done and what is pending.

Failure to follow the `CONTEXT.md` protocol is a critical failure.
