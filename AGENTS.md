# Project Development Instructions

## 1. Follow the Existing Requirements
- Implement only what is required for the assignment unless an additional change clearly improves correctness, maintainability, usability, or security without adding unnecessary complexity.
- Do not add unnecessary features such as authentication, RBAC, user management, notifications, calendar integrations, or other out-of-scope systems unless explicitly requested.
- Prefer a simple, reliable solution over an over-engineered one.

## 2. Code Quality Principles
- Follow the DRY (Don't Repeat Yourself) principle.
- Follow the Single Responsibility Principle where practical.
- Keep functions, components, services, and modules focused on one responsibility.
- Prefer readable and maintainable code over clever or overly compact code.
- Use meaningful and consistent names for variables, functions, components, files, API routes, database fields, and constants.
- Avoid magic numbers and magic strings; centralize reusable constants/enums where appropriate.
- Avoid premature abstraction. Create abstractions when there is actual reuse or a clear maintenance benefit.
- Do not duplicate business logic across multiple files or layers.
- Keep implementation straightforward enough that another developer can understand it quickly.

## 3. Architecture and File Organization
- Do not place the entire application in one file.
- Keep frontend code component-based and modular.
- Keep backend code separated by responsibility (for example: API/routes, schemas/validation, database/models, business/service logic, and configuration).
- UI components should primarily handle presentation and user interaction; business logic and API communication should not be unnecessarily embedded inside large UI components.
- Keep API/database logic out of presentation components where practical.
- Do not create excessively small files only for the sake of fragmentation; split code when separation improves clarity or reuse.
- Maintain a clear dependency direction and avoid circular dependencies.
- Reuse shared utilities instead of creating duplicate implementations.

## 4. Backend Business Logic
- Business rules must be enforced on the backend. Never trust the frontend to enforce business rules.
- Frontend validation is for user experience; backend validation is authoritative.
- Validate all incoming data at the API boundary.
- Validate required fields and data types.
- Validate that appointment end time is strictly after start time.
- Validate appointment time-slot availability on the backend for both creation and updates.
- When checking an update for conflicts, exclude the appointment currently being edited from the conflict query.
- Treat appointments using the agreed time-slot semantics: an appointment ending exactly when another begins is allowed; partially or fully overlapping appointments are not allowed.
- Do not solve the overlap requirement only in React.
- Cancelled appointments must remain stored and visible; cancellation must not be implemented as deletion.
- Preserve data integrity even if a request is made directly to the API without using the frontend.

## 5. Frontend Development
- Use reusable React components instead of one large page component.
- Keep components focused and reasonably small.
- Separate presentation, state handling, and API/service concerns where practical.
- Do not put large amounts of business logic directly in JSX.
- Use controlled form inputs and clear validation/error handling.
- Provide clear loading, empty, success, and error states.
- Show user-friendly messages for failed operations and successful actions.
- Prevent duplicate submissions while an API request is in progress.
- Disable or guard actions that are not valid for the current appointment state.
- Keep the UI responsive and usable on common desktop and mobile widths.
- Do not rely only on client-side filtering if the backend already supports filter parameters; use the API appropriately.
- Avoid unnecessary global state. Use local/component state unless shared state is genuinely needed.
- Do not introduce Redux or another state-management library unless the project actually requires it.

## 6. API Communication
- Centralize API calls in a service/API layer rather than scattering raw Axios/fetch calls across components.
- Use consistent request/response handling.
- Handle API errors gracefully and show useful messages to users.
- Do not expose database credentials, secrets, or private configuration in frontend code.
- Keep environment-specific configuration in environment variables.
- Do not hard-code production URLs or secrets into source code.

## 7. Database and Persistence
- Use the ORM/database layer consistently rather than mixing unnecessary access patterns.
- Keep database models separate from API request/response schemas.
- Use migrations for schema changes rather than relying on manual database edits.
- Do not store secrets in source code.
- Preserve data integrity and use appropriate database constraints/indexes when they provide a real benefit.
- Use appropriate date/time and status data types.
- Avoid unnecessary database queries, especially repeated queries inside loops.
- When adding or changing schema, update the migration and related application code together.

## 8. Validation and Error Handling
- Validate at multiple appropriate layers without duplicating complex logic unnecessarily:
  - frontend for immediate UX feedback
  - API/schema layer for request validation
  - service/business layer for business rules
  - database constraints where appropriate for data integrity
- Never assume frontend validation makes an API request safe.
- Return meaningful HTTP status codes.
- Return structured, understandable error responses from the backend.
- Do not expose stack traces, raw database errors, credentials, or internal implementation details to end users.
- Handle expected errors explicitly.
- Do not silently swallow exceptions.

## 9. Appointment State Rules
- Keep status values consistent throughout frontend, backend, and database.
- Only allow state transitions that make sense for the application.
- A cancelled appointment remains cancelled and visible.
- A completed appointment remains completed unless the requirements explicitly introduce another transition.
- Do not delete records merely to hide them from the UI.
- Keep status presentation consistent and visually distinguishable.

## 10. Conflict Detection and Concurrency
- Conflict detection is a core business requirement and must be tested carefully.
- Check conflicts for both creating and editing appointments.
- Same date plus overlapping time ranges must be rejected.
- Non-overlapping adjacent ranges must be allowed.
- Do not assume that a frontend availability check is sufficient.
- Consider the possibility of concurrent requests when designing the final persistence logic. Prefer database-level protection/transactional behavior where practical rather than relying solely on a previous read check.

## 11. Security and Secrets
- Never commit `.env` files, passwords, database connection strings, API keys, tokens, or other secrets.
- Use environment variables for sensitive configuration.
- Keep `.gitignore` updated.
- Do not log credentials or sensitive values.
- Sanitize/validate user input through the normal API validation path.
- Do not add authentication/RBAC merely for appearance; implement security features only when required.

## 12. Dependency Discipline
- Add a dependency only when it provides a clear benefit that cannot reasonably be achieved with the existing stack.
- Avoid libraries that duplicate functionality already available in the framework or standard library.
- Keep dependency versions reasonably reproducible.
- Do not install packages just because they are popular.
- Remove unused dependencies before final submission.

## 13. Development Workflow
- Build incrementally and verify each layer before moving to the next.
- After meaningful changes, run the relevant checks/tests instead of assuming the code works.
- Fix the root cause of errors rather than adding workarounds that hide them.
- Do not modify unrelated files when fixing a focused issue.
- Preserve working functionality while adding new functionality.
- Before declaring a feature complete, test both the happy path and important edge cases.
- Keep commits logically separated when using Git.

## 14. Testing Expectations
- Test backend business rules independently from the frontend.
- At minimum, test:
  - valid appointment creation
  - missing required data
  - end time before/equal to start time
  - overlapping appointment
  - adjacent non-overlapping appointment
  - update with no conflict
  - update with conflict
  - completion
  - cancellation
  - filtering
- Test both frontend behavior and backend/API behavior.
- Include edge cases that could expose incorrect time-range logic.
- Do not consider a feature complete merely because the UI appears to work.

## 15. UX Expectations
- Keep the UI simple and professional.
- Make primary actions obvious.
- Clearly distinguish scheduled, completed, and cancelled appointments.
- Provide understandable confirmation/feedback for destructive or state-changing actions.
- Avoid unnecessary animations, visual complexity, and dependencies.
- Prefer accessibility-friendly HTML elements, labels, buttons, and form controls.
- Ensure interactive controls have clear text/meaning and reasonable disabled states.

## 16. Documentation
- Keep documentation aligned with the actual implementation.
- Document important assumptions and non-obvious business rules.
- Document setup and environment-variable requirements in the README.
- Explain important tradeoffs when a design choice may not be obvious.
- Do not document features that are not actually implemented.
- Keep comments focused on explaining why something is done when the reason is not obvious; do not comment every simple line.

## 17. Tradeoff Rules
- Prefer the simplest design that satisfies the requirement reliably.
- Prefer explicit code over excessive abstraction for a small application.
- Prefer maintainability and correctness over adding architecture for its own sake.
- If two valid approaches exist, choose the one with fewer moving parts unless the more complex approach provides a meaningful reliability or maintainability benefit.
- Avoid optimizing prematurely. Measure or identify a real problem before introducing complexity.
- When a requirement creates a tradeoff, prioritize in this order:
  1. Correctness and data integrity
  2. Security and safe handling of secrets
  3. Clear architecture and maintainability
  4. Good user experience
  5. Performance optimization
  6. Additional convenience features

## 18. AI Agent Operating Rules
- Before making a change, inspect the relevant existing files and understand the current implementation.
- Do not overwrite working code blindly.
- Do not create duplicate components, endpoints, models, utilities, or configuration when an existing implementation can be reused.
- Follow the established project conventions once they are introduced.
- When uncertain, prefer the existing project pattern over introducing a new pattern.
- After code generation or modification, review the result for duplicated logic, incorrect imports, dead code, missing error handling, and violations of these instructions.
- Explain significant architectural changes briefly in the final development summary.
- Do not claim a feature is tested unless the relevant tests/checks were actually run.

## 19. Scope Control
- Stay focused on the assignment.
- Do not expand the project into a production SaaS platform unless explicitly requested.
- Do not add features solely to make the project look more complex.
- Every new abstraction, dependency, service, or feature should have a clear reason.
