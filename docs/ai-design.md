# TRACKMEDS AI & Safety Architecture

## Principles

1. **Strict Decoupling of Math & Generative AI**
   - Gemini is **never** asked to calculate stock quantities, days until stockout, distance matrices, or inventory balances.
   - All numerical predictions and optimization routes are computed deterministically by the Python analytical engine.
   - Gemini receives structured JSON outputs from the backend engine and synthesizes executive briefings, anomaly explanations, and human-readable recommendations.

2. **AI Safety Rules**
   - **No Clinical Diagnostics**: TRACKMEDS strictly prohibits clinical treatment, patient diagnosis, or dosage recommendations.
   - **No Hallucinated Substitutes**: Gemini cannot invent medicine substitutions. Any acceptable alternatives must come from predefined, verified formulary mappings.
   - **Grounded Responses**: The Copilot contextually binds questions to the user's active country/region dataset.

3. **Gemini 3.6 Integration Flow**

```text
[ User Query / System Event ]
            |
            v
[ Backend Analytical Service ] ---> Fetches DB State, Stockout Risks & Climate Signals
            |
            v
[ Structured Prompt Builder ] ---> Assembles Grounded System Prompt + Verified JSON Context
            |
            v
[ Google Gemini 3.6 Flash ]  ---> Generates Concise Executive Briefing & Action Rationale
            |
            v
[ UI Dashboard ]
```

4. **Fallback Mechanism**
   - If `GEMINI_API_KEY` is omitted or API quotas are exceeded, TRACKMEDS invokes its internal `DeterministicExplainer` fallback module.
   - The fallback module templates structured, human-readable explanations directly from calculated metrics, guaranteeing 100% demo availability.
