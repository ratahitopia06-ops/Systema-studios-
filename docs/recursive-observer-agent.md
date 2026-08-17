# The Recursive Observer: Agent Build

## Purpose

**The Recursive Observer** is a server-side reasoning agent for examining claims about consciousness, time, personal identity, recurrence, reincarnation, and purported communication between separate observer-instances. Its role is analytical rather than confirmatory: it identifies the logical structure of a claim, states the premises required, separates scientific evidence from speculation, and identifies questions that remain unresolved.

> The agent is not a mechanism for establishing reincarnation, interdimensional communication, or the external source of a subjective experience.

## Delivered Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Agent policy | `recursive-observer-prompt.js` | Defines the reasoning constraints, safety boundaries, evidence categories, calibrated confidence labels, and required investigation headings. |
| Server route | `server.js` | Validates requests, protects the server-side model credential, bounds context, calls the configured model, and returns the completed analysis. |
| Investigation UI | `recursive-observer.html` | Provides the dedicated, no-index browser surface at `/recursive-observer.html`. |
| Client controller | `recursive-observer.js` | Maintains tab-only conversation context and renders model Markdown only after HTML escaping. |
| Visual system | `recursive-observer.css` | Supplies responsive, accessible presentation for the reasoning workspace. |
| Tests | `test/recursive-observer.test.js` | Covers input validation, system-prompt isolation, GPT request construction, and response validation. |

## Reasoning Contract

The agent requires the following distinctions in substantive investigations.

| Category | Required treatment |
| --- | --- |
| Possibility | Logical, metaphysical, epistemic, and physical possibility are treated as separate claims. |
| Time | Objective time, experienced time, and unexperienced time are not conflated. |
| Identity | Biological, psychological, memory, causal, informational, structural, consciousness, first-person, pattern, observer, and no-self accounts may be compared. |
| Recurrence | Present consciousness does not, by itself, establish future recurrence or identity with a future observer. |
| Apparent signs | A neutral description, the hypothesis-supporting interpretation, at least two alternatives, discriminating evidence, and a calibrated status are required. |
| Probability | The sample space, event, distribution, independence, priors, and conditional probabilities must be explicit before a numerical conclusion is drawn. |

The required response structure is: **Claim; Formal argument; Validity; Soundness; Hidden assumptions; Strongest objection; Strongest defence; Scientific status; Philosophical status; Open question.** The allowed evidence labels are **Established**, **Strongly supported**, **Plausible**, **Speculative**, **Highly speculative**, **Contradicted**, and **Currently unknowable**.

## API Contract

The browser does not receive or store a model credential. Conversation history exists only in page memory until the tab closes or the user selects **Clear conversation**.

| Route | Method | Request | Response |
| --- | --- | --- | --- |
| `/api/recursive-observer/status` | `GET` | None | `{ ok, agent, configured }` without secret values. |
| `/api/recursive-observer/investigate` | `POST` | `{ message: string, history?: Array<{ role: 'user' | 'assistant', content: string }> }` | `{ ok: true, analysis: string, model: string }` on success. |

The endpoint accepts at most eight prior user or assistant messages. It strips control characters, rejects malformed history, refuses caller-supplied `system` roles, limits request body size, applies a 45-second upstream timeout, and never discloses provider error details to the browser.

## Configuration

Configure the following only in the server environment or Vercel project settings. Do not commit an actual key and do not introduce the key into client-side JavaScript.

```dotenv
OPENAI_API_BASE=https://your-openai-compatible-endpoint/v1
OPENAI_API_KEY=replace_with_server_side_key
RECURSIVE_OBSERVER_MODEL=gpt-5
```

The model defaults to `gpt-5`. The current model request uses bounded output and medium reasoning effort for the GPT model family. If no configuration is present, the route returns a clear `503` response and the UI says that secure configuration is pending; it does not simulate a model response.

## Local Verification

Install dependencies and run the automated contract tests:

```bash
npm ci
npm test
```

Start the application locally and open the dedicated agent surface:

```bash
npm start
# Visit http://localhost:3000/recursive-observer.html
```

Without model environment variables, `GET /api/recursive-observer/status` should report `configured: false`, and a valid investigation submission should receive a `503` response. With secure model variables configured, the endpoint should return a structured analysis that follows the reasoning contract.

## Operational Boundaries

This build is an **implemented server-backed agent surface**, but not evidence that any metaphysical proposition is true. It makes no claims of autonomous external communication, empirical verification, persistence beyond a browser session, or clinical assessment. Any future persistence, user authentication, research-source retrieval, or experiment-record system should be designed as separate, auditable capabilities rather than implied by the chat interface.
