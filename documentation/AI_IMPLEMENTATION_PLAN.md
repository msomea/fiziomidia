# FizioMidia Multi-Agent AI System — Implementation Plan (Archive)

> Source document: `documentation/AI_GUIDELINE`
> Ethics framework: `documentation/World Physiotherapy_Taipei_principles_for_the_responsible_use_of_AI_in_physiotherapy_0.pdf` (World Physiotherapy, v1 Nov 2026) — governs agent development; **not** part of the knowledge pool
> Status: PLANNING — not yet implemented
> Budget constraint: **$0/month** — free tiers and existing infrastructure only
> Rule: Any task marked **[USER ACTION]** must be performed by the project owner. The AI assistant will NOT register accounts, create API keys, or accept terms of service on the owner's behalf. It will only prepare code/config that consumes credentials the owner supplies.

---

## 1. Cost Ledger — $0/month Guarantee

| Component | Service | Tier | Monthly Cost |
|---|---|---|---|
| LLM provider | Google Gemini API (AI Studio) | Free tier — `gemini-2.5-flash` / `gemini-2.0-flash` (~1,500 req/day) | $0 |
| Email notifications | Resend (already integrated) | Free tier — 100 emails/day, 3,000/month | $0 |
| Scheduling | `node-cron` (already in `backend/package.json`) | Self-hosted in existing process | $0 |
| Database | MongoDB Atlas (existing `MONGO_URI`) | Existing cluster | $0 |
| Cache / rate limiting | Redis (existing `REDIS_*` config) | Existing instance | $0 |
| Knowledge base storage | MongoDB collections + existing Cloudflare R2 | Existing | $0 |
| WhatsApp alerts (optional, Phase 3+) | WhatsApp Business Cloud API | Free tier for user-initiated/service conversations only | $0* |
| Hosting | Existing backend server | No new infra | $0 |

\* WhatsApp free tier only covers service conversations; template/marketing messages may incur Meta fees. **Default decision: use email only for admin approval.** WhatsApp is deferred and optional.

**Quota safety:** All AI calls go through a central `usageTracker` that enforces daily caps below the Gemini free-tier limit. When the cap is hit, agents degrade gracefully (skip generation, log, notify admin) rather than erroring or incurring cost.

---

## 2. USER ACTION REQUIRED — Owner Checklist

These items CANNOT be done by the AI assistant. Complete them before the dependent phase starts.

### UA-1. Gemini API Key (blocks Phase 1)
- [ ] Go to https://aistudio.google.com/ and sign in with a Google account
- [ ] Click **Get API key** → **Create API key** (a Google Cloud project is auto-created)
- [ ] Copy the key and add to `backend/.env` as `GEMINI_API_KEY=...`
- [ ] Do NOT commit the key; it stays server-side only
- [ ] Optional but recommended: in Google AI Studio, note the free-tier rate limits for the chosen model

### UA-2. Confirm admin notification email (blocks Phase 3)
- [ ] Confirm which email address receives forum-content approval requests and daily admin reports (likely the existing admin account email)
- [ ] Verify Resend domain `mail.fiziomidia.org` is already verified (it is, since `sendEmailService` is in production use)

### UA-3. Knowledge base reviewers & curation (blocks Phase 1 production use)
Per `FizioMidia_Physiotherapy_Knowledge_Source_Register.md` §13/§15:
- [ ] Appoint a **clinical editor / physiotherapy reviewer** (checks clinical accuracy + local applicability)
- [ ] Appoint a **Kiswahili language reviewer** (checks translation quality — no unreviewed machine translation)
- [ ] Act as or appoint **knowledge curator** to find documents, record metadata, verify licences
- [ ] Work through the §11 curation tracker (12 initial docs) and §5 acquisition plan (~38 docs target)
- [ ] Verify WHO licence terms per document — CC BY-NC-SA 3.0 IGO is **non-commercial**; FizioMidia has sponsored products, so commercial-use compatibility must be confirmed before adaptation
- [ ] Provide source materials for ingestion once documents reach `approved` status

### UA-4. Optional — WhatsApp Business (only if desired later)
- [ ] Register at https://developers.facebook.com/ → create Meta app → add WhatsApp product
- [ ] Complete business verification if template messages are ever needed
- [ ] Provide `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` — **deferred; not required for $0 plan**

### UA-5. Optional — Gemini billing alert (recommended, still $0)
- [ ] In Google Cloud Console, set a budget alert at $0.01 on the auto-created project so any accidental paid usage is caught immediately

---

## 3. Architecture (from AI_GUIDELINE, confirmed against codebase)

```
backend/src/
├── ai/
│   ├── core/
│   │   ├── aiProvider.js          # Gemini client wrapper (fetch-based, no SDK needed)
│   │   ├── agentManager.js        # routes tasks to the correct agent
│   │   ├── promptManager.js       # loads/versioned prompts per agent
│   │   └── usageTracker.js        # daily token/request caps → stays under free tier
│   ├── agents/
│   │   ├── physiotherapyAgent.js
│   │   ├── forumContentAgent.js
│   │   └── virtualAdminAgent.js
│   ├── knowledge/
│   │   ├── retrieveKnowledge.js   # retrieval over approved AIKnowledgeDocuments only
│   │   ├── ingestKnowledge.js     # PDF/text extraction → chunking → $text-indexed chunks
│   │   └── safetyRules.js         # emergency-symptom classifier + forbidden-topic rules
│   ├── jobs/
│   │   ├── forumScheduler.js      # node-cron, per-subcategory schedules
│   │   └── adminMonitoring.js     # daily report job
│   └── services/
│       ├── approvalService.js     # pending_review → approve/edit/reject/regenerate
│       ├── notificationService.js # wraps existing sendEmailService
│       └── auditService.js        # writes AIActivityLog entries
├── models/
│   ├── AIConversation.js
│   ├── AIMessage.js
│   ├── AIGeneratedContent.js
│   ├── AIActivityLog.js
│   ├── AIConfiguration.js
│   └── AIKnowledgeDocument.js    # schema per Source Register §6 — see below
├── controllers/aiController.js
└── routes/aiRoutes.js
```

**Design decisions locked in:**
- No agent-to-agent calls. Central `agentManager` dispatches; agents never touch MongoDB directly for monitoring — conventional queries feed the Virtual Admin, the LLM only interprets.
- All AI traffic is backend-only (`/api/ai/*`). No keys or prompts in React.
- Forum agent **never publishes directly** — always `pending_review` → email → human approve → existing forum controller publishes.
- Virtual Admin starts **read-only**; mutating actions require explicit human approval.

---

## 4. Phase Plan

### Phase 0 — Foundation (prerequisite: UA-1)

| # | Task | Files | Owner |
|---|---|---|---|
| 0.1 | Add `GEMINI_API_KEY` to env validation (optional var, not required — app must boot without it) | `backend/src/config/env.js` | AI |
| 0.2 | Create `ai/core/aiProvider.js` — Gemini REST call (`generateContent`), timeout, retry-once, error normalization | new | AI |
| 0.3 | Create `ai/core/usageTracker.js` — Redis counters `ai:usage:{YYYY-MM-DD}:{agent}`, daily caps in `AIConfiguration` | new | AI |
| 0.4 | Create `ai/core/promptManager.js` + `ai/core/agentManager.js` | new | AI |
| 0.5 | Create 6 Mongoose models listed above | `backend/src/models/` | AI |
| 0.6 | Create `aiRoutes.js` + `aiController.js` skeleton (`POST /api/ai/chat` stub returning 501) | new | AI |
| 0.7 | Mount routes in `app.js`, add `limiters.ai` (stricter rate limit) in `rateLimiter.js` | edit | AI |
| 0.8 | Admin config endpoints: get/update `AIConfiguration` (enable flags, schedules, caps) | `aiController.js` | AI |

**Exit criteria:** `POST /api/ai/chat` reaches Gemini and returns a response; usage counter increments; disabling AI via config returns a clean error.

### Phase 1 — Physiotherapy Assistant (prerequisite: Phase 0, UA-3 for production)

| # | Task | Notes |
|---|---|---|
| 1.1 | `safetyRules.js` — emergency keyword/regex classifier (stroke signs, chest pain, severe trauma) runs BEFORE main model; hard-coded escalation message in EN + SW |
| 1.2 | `retrieveKnowledge.js` — MongoDB `$text` keyword search over approved chunks (decision: no vector search on M0). Filter `status: "approved"` AND `approvedForAI: true`, boost by `specialty`/`conditionTags` match. Fallback to model's general knowledge with disclaimer |
| 1.3 | `physiotherapyAgent.js` — bilingual (EN/SW) system prompt enforcing: no diagnosis, no prescriptions, no individualized exercise plans, "not a substitute for professional assessment" disclaimer |
| 1.4 | Chat endpoints: `POST /api/ai/chat` (guest + auth), history via `AIConversation`/`AIMessage`, per-user rate limit |
| 1.5 | Feedback endpoint (`POST /api/ai/feedback`) + admin view of flagged conversations |
| 1.6 | Privacy: strip/minimize PII before sending to Gemini; log only metadata in `AIActivityLog` |

**Exit criteria:** Bilingual Q&A works; emergency query triggers escalation path; unverified knowledge docs are never retrieved.

### Phase 2 — Forum Content Agent (prerequisite: Phase 0; UA-2)

| # | Task | Notes |
|---|---|---|
| 2.1 | `forumScheduler.js` — node-cron jobs reading per-subcategory schedules from `AIConfiguration`; register in `app.js` alongside existing cron jobs |
| 2.2 | Pipeline: fetch `ForumSub` list → fetch recent `Post`s per sub → dedupe check → generate topic+body via Gemini → safety/quality self-check → save `AIGeneratedContent` as `pending_review` |
| 2.3 | `approvalService.js` — generate signed review token, email admin via existing `sendEmailService` with approve/edit/reject/regenerate links |
| 2.4 | Admin endpoints: `GET /api/ai/content/pending`, `POST /api/ai/content/:id/approve|reject|regenerate` (admin-only middleware) |
| 2.5 | On approve → call existing forum post creation logic (reuse controller/service, don't duplicate) → set status `published` + store publication ID |
| 2.6 | Audit: every agent action and admin decision → `AIActivityLog` |

**Exit criteria:** Scheduled run produces a pending draft + admin email; approval publishes a real forum post; rejection regenerates on request.

### Phase 3 — Virtual Administrator (prerequisite: Phase 0)

| # | Task | Notes |
|---|---|---|
| 3.1 | `adminMonitoring.js` — daily cron aggregating via **plain MongoDB queries**: new users, pending `PTRequest`s, new clinics, forum posts/reports, appointments, expiring promotions, API error counts |
| 3.2 | Feed aggregates to `virtualAdminAgent.js` → LLM writes plain-language summary + flagged anomalies → email admin via `sendEmailService` |
| 3.3 | Admin dashboard endpoints: `GET /api/ai/admin/daily-report`, `GET /api/ai/admin/activity` (read-only) |
| 3.4 | Suspicious-activity flags stored in `AIActivityLog` with `requiresHumanReview: true` — agent NEVER mutates users/appointments/financial records |

**Exit criteria:** Morning report email arrives; all numbers traceable to DB queries, not LLM guesses.

### Phase 4 — Optimization (ongoing)

- Provider fallback config (structure ready; second provider only added if free quota becomes insufficient — would require new UA item)
- Token-usage dashboards from `usageTracker` data
- Prompt/version evaluation, knowledge-base expansion
- Reassess paid tiers ONLY if free quotas prove insufficient — requires explicit owner approval (would break $0 constraint)

---

## 5. Knowledge Library Schema & Retrieval

Governed by `documentation/FizioMidia_Physiotherapy_Knowledge_Source_Register.md`. The `AIKnowledgeDocument` model MUST implement the §6 metadata record:

- `documentId` (e.g. `FM-KB-MS-0001`), `title`, `specialty`, `conditionTags[]`, `language` (`en`/`sw`), `documentType`, `targetAudience[]`
- `source: { organization, documentTitle, url, publicationDate, edition, accessedAt, licence }`
- `evidenceType` (guideline / systematic-review / patient-guide / research / original)
- `clinicalReviewer`, `reviewedAt`, `nextReviewAt`
- `status` enum: `discovered`, `pending_licence_review`, `pending_clinical_review`, `pending_language_review`, `approved`, `restricted`, `rejected`, `superseded`, `under_review`
- `approvedForAI` (boolean) and `approvedForPublicDisplay` (boolean) — **separate approvals**
- Chunk-level subdocuments/embed refs for retrieval

**Retrieval rule (hard):** only chunks whose parent doc has `status: "approved"` AND `approvedForAI: true` may be passed to Gemini. Unreviewed material never grounds an answer.

### ✅ Retrieval decision — keyword search (confirmed 2026-11-27)

Atlas cluster is **free/shared tier (M0)** — Vector Search is unavailable, and upgrading would break the $0/month constraint. Decision:

- Retrieval uses **MongoDB `$text` index + keyword scoring** over approved knowledge chunks — $0, no external services.
- `ingestKnowledge.js` handles PDF/text extraction → chunking → store chunks with `text` index fields. **No embeddings** — `gemini-embedding-001` not used.
- Retrieval quality is keyword-based; mitigate with good `conditionTags`/`specialty` metadata filtering before text search.
- If Atlas is ever upgraded to M10+, vector search can be added later without schema changes (chunks already store `content` + metadata).

## 6. Non-Negotiable Safeguards (carried from AI_GUIDELINE)

1. **Patient privacy** — no identifiable patient data sent to Gemini; minimization + retention policy documented before Phase 1 production.
2. **Medical accuracy** — only docs with `status: "approved"` + `approvedForAI: true` are retrieved; AI output never represented as clinical advice.
3. **Security** — `GEMINI_API_KEY` server-side only; admin endpoints behind existing admin auth; signed, expiring review tokens for approval links.
4. **Human authority** — agents are read-only by default; every mutating action requires admin approval; no direct DB write access for agents.
5. **Cost guard** — `usageTracker` hard-caps daily calls below free-tier limits; config flag `AI_ENABLED=false` killswitch.

---
6A. Governing Ethics Framework — World Physiotherapy "Taipei Principles"

`documentation/World Physiotherapy_Taipei_principles_for_the_responsible_use_of_AI_in_physiotherapy_0.pdf` (v1, Nov 2026) is the **governing ethics reference for all agent development**. It is a policy/guideline document — it informs *how* we build and operate the agents, and is **never ingested into the knowledge base** (not patient-facing content; `documentType: policy`, `approvedForPublicDisplay: false` if ever catalogued).

The 8 principles and how each binds our implementation:

| Principle | Binding requirement for FizioMidia agents |
|---|---|
| **Purpose & Benefit** | Every agent must have a documented need vs. non-AI alternatives; benefits must justify cost/burden/risk. |
| **Human-Centredness & Connection** | AI supplements, never replaces, therapist–patient relationship. Chat must offer a path to human care (escalation → contact a physiotherapist). |
| **Equity & Accessibility** | EN + SW support is mandatory; consider low-literacy users; no feature gated behind payment/digital barriers. |
| **Transparency & Informed Choice** | Users must know they are talking to AI; disclaimers visible in UI; users can question or decline AI use. |
| **Evidence & Evaluation** | Risk-proportional evidence: only curated, approved knowledge sources; higher-risk outputs (clinical-sounding) require stronger sourcing or human review. |
| **Professional Capability** | Agents must not erode clinical judgement; outputs are educational, never diagnostic; clinicians retain override authority. |
| **Human Accountability & Shared Responsibility** | Humans remain accountable for AI-informed decisions; `AIActivityLog` + `requiresHumanReview` + admin approval gates are the accountability trail; escalation/stop processes must exist. |
| **Governance & Lifecycle** | Ongoing governance: doc status workflow, licence tracking, `nextReviewAt`, PII stripping, `approvedForAI` gating, kill switch. |

**Known gaps tracked against these principles** (address in Phase 4 or earlier if touched):
- Chat UI lacks an explicit "you are talking to an AI" disclosure banner and a visible human-handoff CTA when `escalated: true`.
- No accessibility audit (screen readers, low-literacy UX) performed.

---

## 
## 7. Gemini API — Verified Facts (tested 2026-11-27)

- `GEMINI_API_KEY` is set in `backend/.env` and **works** (HTTP 200 on `generateContent`).
- `gemini-2.5-flash` and `gemini-2.5-flash-lite` return **404 for new users** — do not use.
- Verified working text models: `gemini-flash-latest`, `gemini-3.5-flash`.

### Free-tier rate limits (RPM / TPM / RPD — requests per minute / tokens per minute / requests per day)

| Model | RPM | TPM | RPD | Notes |
|---|---|---|---|---|
| Gemini 3.8 Flash | 5 | 250K | 20 | newest flash |
| Gemini 3.6 Flash | 5 | 250K | 20 | |
| Gemini 3 Flash | 5 | 250K | 20 | |
| Gemini 2.5 Flash | 5 | 250K | 20 | listed but 404 for new keys |
| Gemini 3.5 Flash Lite | 15 | 250K | **500** | highest text RPD — best for chat volume |
| Gemini 3.1 Flash Lite | 15 | 250K | **500** | same as above |
| Gemini 2.5 Flash Lite | 10 | 250K | 20 | 404 for new keys |
| Gemma 4 26B / 31B | 30 | 16K | 14.4K | huge RPD but tiny TPM — poor for long prompts |
| Gemini Embedding 1 / 2 | 100 | 30K | 1K | for knowledge-base embeddings |
| Gemini 3.8 Live / Live Extended Thinking | ∞ | 65K | ∞ | live API only |
| Gemini 3.5 Transcribe Live / 3.5 Live Translate | ∞ | 20K | ∞ | live API only |
| Gemini 2.5 Flash Native Audio Dialog | ∞ | 1M | ∞ | live audio only |
| Gemini 3.8 Flash TTS / Lite TTS / 3.1 Flash TTS / 2.5 Flash TTS | 3 | 10K | 10 | text-to-speech |
| Gemini 3.5 Transcribe | 3 | 10K | 25 | |
| Gemini Robotics ER 2 Preview | 5 | 250K | 20 | |
| Antigravity (agents) | 60 | 100K | 100 | agent platform |
| Lyria Realtime | 15 | — | 1.5K | music |
| Gemini Decision 1 | 200 | 50K | 10K | decisions API |
| Deep Research / Pro Preview, Genie 4, Gemini 4.*, Omni, Nano Banana, Lyria 3, Computer Use, Gemini 2 Flash*, 2.5 Pro*, 3.1 Pro | 0 | 0 | 0 | **not available on free tier** |

### Model assignment — one model per agent

Each agent gets its own dedicated model, configured in `AIConfiguration` (per-agent `model` field) so they can be changed without code deploys:

| Agent | Model | Free-tier limit | Rationale |
|---|---|---|---|
| Physiotherapy Assistant (chat) | `gemini-3.5-flash-lite` | 15 RPM / 250K TPM / **500 RPD** | Highest text RPD — only tier that supports member chat volume at $0. Fallback: `gemini-3.1-flash-lite` (same limits) |
| Forum Content Agent | `gemini-3.5-flash` | 5 RPM / 250K TPM / 20 RPD | Quality matters more than volume; 1–5 posts/day fits easily. Fallback: `gemini-flash-latest` |
| Virtual Administrator | `gemini-3.5-flash-lite` | 15 RPM / 250K TPM / 500 RPD | Summarization task, 1 call/day — lite is sufficient and cheap on quota |
| ~~Knowledge base embeddings~~ | — | — | **Not used** — Atlas M0 has no Vector Search; keyword `$text` retrieval instead (§5) |

- `usageTracker` caps are keyed by **agent + model** (`ai:usage:{date}:{agent}`), since each agent has independent quotas.
- Safety classifier (emergency detection) runs as a lightweight pre-check — either regex rules in `safetyRules.js` (no API call, $0) or a flash-lite call only when rules are ambiguous.
- If a chat agent ever needs higher quality for complex questions, it can escalate to `gemini-3.5-flash` — but that shares the 20 RPD pool, so escalation must be rate-limited in `usageTracker`.

## 8. Document Archive Metadata

- **Created:** 2026-11-26
- **Source:** `documentation/AI_GUIDELINE` + `documentation/FizioMidia_Physiotherapy_Knowledge_Source_Register.md`
- **Implementation status:** Phase 0 + Phase 1 COMPLETE (2026-11-27, branch `feature/ai-agents`) — safety classifier, $text knowledge retrieval, PII stripping, ingest pipeline all verified live. Next: Phase 2 Forum Content Agent (scheduler, approval emails, publish-on-approve)
- **Budget:** $0/month confirmed
- **Next action:** Begin Phase 0 — AI foundation (`aiProvider.js`, `usageTracker.js`, models, routes)
