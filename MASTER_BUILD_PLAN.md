# Pillar & Keystone: Master Build Plan
**Strategic Objective:** To transform the existing Systema Studios MVP into the Pillar & Keystone Revenue Architecture Operating System through progressive architectural evolution and AI workforce integration.

## Phase 1: Identity Migration and Foundation
The primary objective of this phase is to establish the new Pillar & Keystone identity and eliminate all remnants of legacy branding. This ensures that the platform is commercially aligned with the new strategic direction before deeper technical transformations begin.

| Task | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **Brand Migration** | Replace all "Systema Studios" and "Systema" strings in UI, logs, and metadata. | Zero legacy strings in public-facing interfaces. |
| **Metadata Update** | Revise `package.json`, `vercel.json`, and SEO tags to reflect the new identity. | Correct project naming in deployment and search contexts. |
| **Log Refactoring** | Update server-side console outputs and internal application naming. | Coherent internal branding for engineering teams. |

## Phase 2: Architectural Modernization
In this phase, the system will be migrated to the preferred production stack (Next.js and TypeScript). This transition is critical for supporting the modularity and type safety required for the AI workforce.

> **Architecture Principle:** Understanding before automation. The transition to Next.js will focus on preserving existing functionality while creating a scalable foundation for future agents.

### Key Implementation Steps
1.  **Project Initialization:** Scaffold a new Next.js environment with TypeScript, Tailwind CSS, and a structured directory for AI agents.
2.  **Component Migration:** Transform static HTML files into reusable React components, eliminating code duplication in headers, logos, and footers.
3.  **API Refactoring:** Migrate the custom `server.js` logic into Next.js API routes, improving maintainability and security.

## Phase 3: The Observer Agent Deployment
The "Observer" is the first foundational agent of the Pillar & Keystone workforce. Its purpose is to perceive and structure business reality without premature interpretation or prescription.

| Role | Responsibility | Core Tools |
| :--- | :--- | :--- |
| **Observer** | Data collection, entity identification, and constraint mapping. | Built-in LLM, structured data parsers. |

The implementation will focus on the **Fact vs. Inference** distinction, ensuring that every observation retains its evidence source. This agent will provide the structured input necessary for all subsequent intelligence roles.

## Phase 4: Shadow Audit Workflow and Persistence
The Shadow Audit is the core commercial product of Pillar & Keystone. This phase involves building the persistence layer and user interface necessary to manage end-to-end audits for clients.

A relational database will be introduced to replace the current JSONL file-based storage. This will support complex data relationships, including client profiles, audit findings, evidence logs, and recommendation histories. The CEO Command Dashboard will be expanded to provide deep visibility into the progress and outcomes of these audits.

## Phase 5: Workforce Expansion and Integration
The final phase involves the deployment of additional specialist agents, including the **Interpreter** and **Architect**. These roles will form a connected intelligence loop, moving from observation to system design.

The system will eventually integrate with external operational tools such as Odoo ERP and n8n automation. This creates a complete feedback loop where the AI workforce not only architects solutions but also monitors their operational effectiveness and learns from the results.
