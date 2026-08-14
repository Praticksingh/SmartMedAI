# DevFusion 4.0 Phase 0 Architecture Baseline

## Scope
This document records the minimum architecture baseline required for the first execution phase only.
It intentionally does not define Phase 1+ business features.

## Objectives
- Build a clean frontend/backend separation.
- Standardize API conventions.
- Establish environment configuration and secure defaults.
- Document error handling and validation boundaries.
- Prepare the project for Prisma and PostgreSQL integration.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- Storage: Cloudinary
- Auth: JWT-based session handling with secure HTTP-only cookies
- Docs: Swagger/OpenAPI
- Deployment: Vercel + Render

## API conventions
- Base prefix: `/api/v1`
- Resource routes should use nouns and plural names where appropriate.
- Success responses should use standard JSON objects.
- Error responses must follow the envelope below:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": null
  }
}
```

## Validation boundary
- Validate all request payloads and params with Zod at the API boundary.
- Reject invalid body, query, and path values with a 400 status.
- Keep validation logic outside business logic when possible.

## Security baseline
- Use secure HTTP-only cookies for session tokens.
- Do not commit secrets.
- Use an allowlisted CORS origin strategy for `FRONTEND_URL` and `BACKEND_URL`.
- Add helmet middleware and request rate limiting at the server boundary.
- Use environment variable validation before booting the server.

## Deployment baseline
- Frontend deployed on Vercel.
- Backend deployed on Render.
- Production frontend must never point to localhost or local development APIs.

## Phase 0 deliverables
- Backend scaffold exists.
- Health endpoint responds successfully.
- Environment template is correct.
- API conventions and error envelope are documented.
- Security and validation baseline are defined.

## Out of scope for Phase 0
- Auth implementation beyond baseline contract.
- Queue implementation.
- EMR, lab, pharmacy, billing, telemedicine, AI workflows.
- Full database migration or production deployment.
