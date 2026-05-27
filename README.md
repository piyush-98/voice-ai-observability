# Voice AI Observability Copilot

Objective: An Agent Observability Copilot that automates the "Monitor" and "Analyze" phases for HighLevel Voice AI agents.

## 🚀 Quick Start (Team of One Delivery)

### Prerequisites
- Node.js (v18+)
- Gemini API Key (Optional, mocks used by default)

### 1. Setup Backend
```bash
cd backend
npm install
# Add your GEMINI_API_KEY to .env for real AI analysis
npm start
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Open in Browser
- **Dashboard**: `http://localhost:5173`
- **GHL Integration Mock**: Open `ghl_integration.html` in your browser.

---

## 🛠 Architecture

- **Backend**: Node.js/Express. Handles transcript evaluation and aggregate statistics.
- **AI Engine**: Gemini 1.5 Flash. Used in two stages:
    1. **Script Analyzer**: Extracts KPIs from the agent's system prompt.
    2. **Call Evaluator**: Scores transcripts and identifies "Use Actions" (human intervention snippets).
- **Frontend**: Vue 3 with a "Premium" Dark Mode design. Uses Glassmorphism and Lucide icons for a high-end feel.
- **Database**: LowDB (JSON on disk). Lightweight and portable for sandbox reviews.

## 📈 Functional Coverage
- [x] **Monitor**: Manual transcript ingestion and score derivation.
- [x] **Analyze**: Unified dashboard visualizing performance issues and top constraints.
- [x] **Loop Close**: AI-generated recommendations for script adjustments based on failures.
- [x] **Integration**: Embeddable IFRAME wrapper for HighLevel Custom Menu Links.

## 🛡 "Team of One" Ownership Notes
As a Team of One, I prioritized:
- **Scalable Code**: Used a service-based architecture for Gemini to allow easy swapping of models.
- **Product Thinking**: Designed the "Failure Radar" to help managers immediately see where their agents are struggling.
- **DX (Developer Experience)**: Included a Mock mode for reviewers who may not want to setup API keys.