# Engineering and AI Agent Rules

This document defines the engineering guidelines, boundaries, and AI agent behaviors for the Manufacturing Digital Operations System.

## 1. Source of Truth
- `PRD.md` is the primary product source of truth.
- Supporting documents must not silently contradict `PRD.md`.

## 2. Document Hierarchy
- `PRD.md` → product requirements
- `docs/business-process.md` → business workflows
- `docs/use-cases.md` → use cases
- `docs/erd.md` → data model
- `docs/architecture.md` → technical architecture
- `DESIGN.md` → UI/UX rules
- `AGENTS.md` → engineering/agent behavior rules

## 3. Panasonic Boundary
- This is an independent portfolio project.
- Never invent, imply, or claim knowledge of Panasonic proprietary systems, architecture, workflows, APIs, databases, or internal processes.
- Panasonic is only the motivation/context for exploring manufacturing enterprise software.

## 4. Scope Control
- Do not add features merely because they are technically interesting.
- Every feature must trace back to the PRD or an explicitly approved scope change.
- Prefer completing the MVP end-to-end over expanding the feature list.
- Do not introduce microservices or unnecessary infrastructure.

## 5. Engineering Principles
- Prefer the simplest solution that satisfies the requirement.
- Reuse existing code before creating abstractions.
- Do not add dependencies when native/platform functionality is sufficient.
- Do not over-engineer.
- Keep business logic out of UI components where practical.
- Validate input at API boundaries.
- Preserve security, accessibility, error handling, and data integrity.
- Do not remove important safeguards merely to reduce code.

## 6. Traceability
- Important features must be traceable: requirement → use case → implementation → test.
- Update relevant documentation when implementation changes documented behavior.

## 7. AI Coding Behavior
- Inspect existing code before editing.
- Read only the documentation relevant to the current task.
- For non-trivial changes, create an implementation plan before coding.
- Do not modify unrelated files.
- Do not fabricate data, metrics, integrations, or completed functionality.
- Do not mark work complete without verification.

## 8. Testing
- Add or update tests for important business behavior.
- Test validation, authorization, success, and failure paths where applicable.
- Run relevant tests after implementation.

## 9. Definition of Done
- Requirement implemented correctly.
- Business workflow preserved.
- Authorization and validation handled.
- Relevant tests pass.
- UI states handled where applicable.
- Documentation updated when necessary.
