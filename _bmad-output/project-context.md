---
project_name: 'exe-prj'
user_name: 'there'
date: '2026-05-23'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 16
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Backend:** Node.js, Express (`^5.2.1`)
- **Frontend:** (To be determined - currently empty)
- **Dev Tools:** nodemon (`^3.1.14`)

## Critical Implementation Rules

### Language-Specific Rules

- Use `async/await` syntax exclusively; avoid raw Promises (`.then()` / `.catch()`) where possible.
-Use global error , success handling , put in `core` directory in  `backend` folder
- Use modern ES6+ features (destructuring, template literals, arrow functions).
- Ensure strict null and undefined checks.

### Framework-Specific Rules

- **Express.js:** Abstract business logic out of route handlers into separate service modules.
- **Express.js:** Centralize error handling in a single error middleware rather than handling responses locally in every route.
- **Frontend:** (To be determined once stack is chosen).

### Testing Rules

- Write unit tests for all business logic (services/utilities) before submitting code.
- Place tests adjacent to the file they are testing (e.g., `user.service.test.js` next to `user.service.js`).
- Ensure mock usage is localized and clear to avoid leaking state between tests.

### Code Quality & Style Rules

- Use `camelCase` for variables and function names, `PascalCase` for classes.
- Use `kebab-case` for file names and directories.
- Always add JSDoc comments for complex functions and classes explaining parameters and return types.

### Development Workflow Rules

- Ensure `package.json` scripts are used for consistent build, dev, and test commands.
- Never commit `node_modules` or `.env` files (ensure they are in `.gitignore`).

### Critical Don't-Miss Rules

- **Anti-Pattern:** Do not use `console.log` for error reporting; use a dedicated logging mechanism (or centralized error handler).
- **Security:** Do not expose sensitive environment variables (e.g., database credentials, API keys) to the client or log them in plaintext.
- **Edge Case:** Always handle scenarios where request bodies or query parameters are empty or malformed.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-23
