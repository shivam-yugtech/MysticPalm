# Agents (from ECC)

Project-scoped subagents in `.claude/agents/`. Call them by bare name, e.g. `Agent(subagent_type: "code-reviewer", ...)`.

| Agent | Use when |
|---|---|
| planner | Expert planning specialist for complex features and refactoring. |
| code-reviewer | Expert code review specialist. |
| typescript-reviewer | Expert TypeScript/JavaScript code reviewer specializing in type safety, async correctness, Node/web security, and idiomatic patterns. |
| react-reviewer | Expert React/JSX code reviewer specializing in hook correctness, render performance, server/client component boundaries, accessibility, and React-specific security. |
| security-reviewer | Security vulnerability detection and remediation specialist. |
| tdd-guide | Test-Driven Development specialist enforcing write-tests-first methodology. |
| build-error-resolver | Build and TypeScript error resolution specialist. |
| silent-failure-hunter | Review code for silent failures, swallowed errors, bad fallbacks, and missing error propagation. |

Proactive use: plan complex features with **planner**, review fresh code with **code-reviewer**, and run **security-reviewer** before committing anything that touches API keys, user input or uploads.
