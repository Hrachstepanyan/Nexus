---
name: create-endpoint
description: Create a new API endpoint following Nexus conventions
disable-model-invocation: true
---

Create a new API endpoint: $ARGUMENTS

Follow this workflow:

1. **Understand the requirements**
   - Parse the endpoint specification (method, path, request/response)
   - Identify which service needs the endpoint (Python FastAPI or TypeScript Express)

2. **Python FastAPI endpoint (if applicable)**
   - Add Pydantic models to `quivr-service/src/models/schemas.py`
   - Create/update route in `quivr-service/src/routes/`
   - Add business logic to appropriate service in `quivr-service/src/services/`
   - Follow RESTful conventions and return proper status codes

3. **TypeScript Express endpoint (if applicable)**
   - Add Zod schemas to `typescript-client/src/types/schemas.ts`
   - Create/update route in `typescript-client/src/routes/`
   - Update QuivrClient in `typescript-client/src/client/quivr-client.ts`
   - Use async/await and proper error handling

4. **Documentation**
   - Update `docs/api-reference.md` with the new endpoint
   - Add example usage to `docs/examples.md`
   - Update README.md if it's a major feature

5. **Verification**
   - Test the endpoint manually with curl or HTTP client
   - Verify request/response validation works
   - Check error cases (400, 404, 500)
   - Run linting: `npm run lint` (TS) or `npm run lint:python` (Python)

6. **Commit**
   - Use conventional commit format: `feat: add <endpoint-description>`
   - List changes in the commit body
