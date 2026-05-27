import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

/**
 * Extracts quantifiable KPIs from an agent's system script.
 */
export async function analyzeScript(script) {
  const prompt = `
    You are an expert Voice AI Quality Auditor. 
    Analyze the following System Script/Prompt for a Voice AI Agent.
    Define 5 measurable KPIs that can be evaluated as a Score (0-100) based on a call transcript.
    
    Return a JSON array of objects:
    [
      { "id": "greeting", "name": "Initial Greeting", "description": "Did the agent greet the user according to the script?" },
      ...
    ]
    
    Script:
    ${script}
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

/**
 * Evaluates a call transcript against an agent's KPIs.
 */
export async function evaluateCall(transcript, kpis) {
  const prompt = `
    You are an expert Voice AI Quality Auditor.
    Evaluate the following call transcript against the provided KPIs.
    
    KPIs:
    ${JSON.stringify(kpis)}
    
    Transcript:
    ${transcript}
    
    Return a JSON object:
    {
      "overallScore": number,
      "kpiScores": [ { "id": string, "score": number, "reason": string } ],
      "useActions": [ { "snippet": string, "issue": string, "recommendation": string } ],
      "summary": string
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
