Here’s a complete `plantProPrompts.prompt.md` built for GitHub Copilot **agent mode** (inside VS Code or Visual Studio) using the **Claude 4 Sonnet** model. It defines a suite of step‑by‑step prompts to guide Copilot through full system development—from setup to deployment—with best practices and clean modularity. It reflects GitHub prompt file format and agent mode conventions: ([Microsoft Learn][1])

---

```md
---
mode: 'agent'
model: 'Claude‑4‑Sonnet'
tools: ['codebase', 'githubRepo', 'terminal']
description: |
  Step‑by‑step agent prompts to build complete Zijja Plantation Management system:
  NestJS + MySQL backend, Next.js + Tailwind frontend, CI/CD, testing, deployment.
---

# 🚀 plantPro Full‑Stack Development Prompts

## 1. 🧱 Initialize project structure

Your goal is to scaffold the monorepo workspace with backend and frontend directories.

**Prompt**:
```

Create a Next.js frontend scaffold using app router and TailwindCSS.
Then scaffold a NestJS backend using TypeORM or Prisma with MySQL support.
Include directories: /frontend, /backend, with clear README and GitHub repo structure.

```

---

## 2. 📦 Define database schema

```

Based on our plantation spec file (#file\:Zijja‑spec.pdf or summary), design a normalized MySQL schema:
tables for users, roles, plant\_species, zones, plant\_lots, health\_logs, reports.
Provide SQL or TypeORM/Prisma schema file. Then create entity files in NestJS.

```

---

## 3. 🔐 Implement authentication + RBAC

```

Generate NestJS auth module with JWT and roles: Manager, FieldStaff, Analytics.
Include guard logic in controllers; seed initial user accounts with role permission.
Ensure correct guards and decorators.

```

---

## 4. 🌱 Plant lot CRUD + QR integration

```

Design PlantLots module: controllers, service, entity.
Implement auto‑generated unique IDs and QR code generation endpoint.
Write a QR‑scan endpoint that updates plant growth data.
Include example HTTP requests and responses.

```

---

## 5. 📸 Field updates and image upload + AI analysis

```

Add an endpoint to accept photo uploads and health metrics from field staff.
Integrate with external AI service (e.g. Google Vision or Roboflow) to analyze plant health.
Return structured response. Include controllers, DTOs, and service logic.

```

---

## 6. 📊 Dashboard + reporting API

```

Build endpoints to query plant lots by zone/species/filter, produce summary stats,
and generate PDF/Excel reports.
Include example usage and pagination.

```

---

## 7. 🧪 Test suite generation

```

Create Jest tests for backend modules: auth, plant lot, health analysis.
Mock dependencies and verify endpoints and service logic.
Also write basic front end tests for Next.js pages/components using React Testing Library.

```

---

## 8. 📦 Frontend UI pages & flow

```

In frontend, scaffold pages:
‑ Login + dashboard (charts via Recharts or Chart.js)
‑ Plant lot listing, detail, and QR scan page
‑ Form for health updates (photo, input)
Include components styled with Tailwind and ShadCN.

```

---

## 9. 🚀 CI/CD setup & deployment

```

Create GitHub Actions workflow to:
‑ Run tests,
‑ Build Docker images for backend & frontend,
‑ Push to container registry,
‑ Deploy automatically to chosen cloud (e.g., AWS, GCP, DigitalOcean).
Include rollback control, secrets handling, and environment setup.

```

---

## 10. 🧠 AI model prediction and override logic

```

Add code to predict harvest readiness based on historical data (ML or rules).
Allow manager override via backend API and UI.
Document logic and edge‑case behavior.

```

---

## 11. 🧾 PR review & code quality guidelines

```

Create a prompt to review sample feature branch code.
Check for naming conventions, error handling, modular structure, security issues.
Provide review feedback and propose improvements.

```

---

## ✅ Usage Guidance & Best Habits

- Provide clear high‑level goal, then specific requirements—avoid ambiguity. :contentReference[oaicite:2]{index=2}  
- Break tasks into small, independent prompts. :contentReference[oaicite:3]{index=3}  
- Include examples or sample input/output for clarity. Use tests as examples. :contentReference[oaicite:4]{index=4}  
- Monitor agent steps: review diffs and confirm each change before merging. :contentReference[oaicite:5]{index=5}  
- Use repository-level custom instructions (`.github/copilot-instructions.md`) to enforce coding standards and stack preferences. :contentReference[oaicite:6]{index=6}

---

## 🔄 Workflow Summary

1. Scaffold structure and dependencies  
2. Model DB schema and entities  
3. Auth and RBAC  
4. Core CRUD + QR pipeline  
5. Field uploads + AI analysis  
6. Dashboard + reporting logic  
7. Writing tests  
8. Building frontend workflows  
9. CI/CD and deployment  
10. Add AI predictions with override  
11. PR review and refactors  
12. Repeat for each missing feature
