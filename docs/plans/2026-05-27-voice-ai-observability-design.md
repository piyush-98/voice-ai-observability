# Design Doc: Voice AI Observability Copilot

## Goal
Build an Agent Observability Copilot that automates the "Monitor" and "Analyze" phases for HighLevel Voice AI agents using manual transcript ingestion and Gemini AI analysis.

## User Review Required
> [!IMPORTANT]
> The integration with GoHighLevel will be via **Custom Menu Link / IFRAME** for simplicity. Data ingestion is **Manual Upload**, avoiding complex webhook/OAuth setup for this assignment.

## Architecture
- **Backend**: Node.js + Express
- **Frontend**: Vue.js (Vite)
- **Database**: `db.json` (LowDB)
- **AI Service**: Gemini 1.5 Flash (via `@google/generative-ai`)

## Technical Details

### AI Logic
1. **Script Extraction**: Gemini analyzes the agent's system prompt to define 5 quantifiable KPIs.
2. **Transcript Scoring**: Each uploaded transcript is scored against these 5 KPIs.
3. **Use Actions**: Gemini identifies 2-3 specific "failure segments" in the transcript for human review.
4. **Recommendation Loop**: Based on historical failures, Gemini suggests prompt/script adjustments.

### UI/UX
- **Premium Dark Mode**: Professional, GHL-matching aesthetics.
- **Unified Dashboard**: Aggregate metrics (Avg Score, Failure Trends).
- **Call Detail View**: Transcript with AI-annotated "Use Actions" and segmented recommendations.

### Integration
- A standalone HTML file to embed the app as an IFRAME in GHL.

## Success Criteria
- [x] Manual upload functional
- [x] Gemini-based KPI derivation
- [x] Unified dashboard visualizing performance
- [x] Actionable prompt recommendations generated
