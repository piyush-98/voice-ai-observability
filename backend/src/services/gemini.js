import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const IS_MOCKED = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here";

const genAI = IS_MOCKED ? null : new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let resolvedModelName = null;
let modelInstance = null;

async function resolveBestModel() {
  if (IS_MOCKED) return null;
  
  const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash", "gemini-pro"];
  
  for (const modelName of candidateModels) {
    try {
      console.log(`[Gemini] Testing model availability: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 2 }
      });
      if (result && result.response) {
        console.log(`[Gemini] Successfully verified model: ${modelName}`);
        resolvedModelName = modelName;
        return model;
      }
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} is not available or quota exceeded:`, err.message || err);
    }
  }
  
  console.warn("[Gemini] All model verification checks failed. Falling back to gemini-2.5-flash.");
  resolvedModelName = "gemini-2.5-flash";
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

const getModelInstance = async () => {
    if (IS_MOCKED) return null;
    if (!modelInstance) modelInstance = await resolveBestModel();
    return modelInstance;
};

async function callWithRetry(prompt, maxRetries = 3) {
  let lastError = null;
  const modelsToTry = [
    resolvedModelName || "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash"
  ];
  
  for (const modelName of modelsToTry) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        console.log(`[Gemini] Sending content request to ${modelName} (Attempt ${retries + 1})...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        if (result && result.response) {
          const text = result.response.text();
          if (text) {
            resolvedModelName = modelName;
            return text;
          }
        }
      } catch (err) {
        lastError = err;
        const status = err.status || (err.message && err.message.includes("503") ? 503 : null);
        console.warn(`[Gemini] Call to ${modelName} failed (status ${status}):`, err.message || err);
        
        if (status === 404) {
          break;
        }
        
        retries++;
        if (retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000;
          console.log(`[Gemini] Retrying in ${delay}ms due to transient error...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
  }
  
  throw lastError || new Error("Failed to generate content after trying multiple models and retries");
}

function extractJSON(text) {
  const match = text.match(/[\{\[][\s\S]*[\}\]]/);
  if (!match) return text;
  return match[0];
}

/**
 * Extracts quantifiable KPIs from an agent's system script.
 */
export async function analyzeScript(script) {
  if (IS_MOCKED) {
    console.log("Using Mocked Gemini for Script Analysis");
    return [
      { id: "greeting", name: "Initial Greeting", description: "Did the agent greet correctly?" },
      { id: "needs_discovery", name: "Needs Discovery", description: "Did the agent ask about requirements?" },
      { id: "objection_handling", name: "Objection Handling", description: "Did the agent handle price objections?" },
      { id: "closing", name: "Call Closing", description: "Did the agent attempt to book a meeting?" },
      { id: "adherence", name: "Script Adherence", description: "General script following." }
    ];
  }
  const prompt = `
    Analyze the following System Script/Prompt for a Voice AI Agent.
    Define 5 measurable KPIs that can be evaluated as a Score (0-100) based on a call transcript.
    
    Return ONLY a raw JSON array of objects:
    [
      { "id": "greeting", "name": "Initial Greeting", "description": "Did the agent greet the user according to the script?" },
      ...
    ]
    
    Script:
    ${script}
  `;

  // Pre-initialize model instance on first request if not already done
  await getModelInstance();

  const rawText = await callWithRetry(prompt);
  console.log("--- RAW SCRIPT ANALYSIS TEXT FROM GEMINI ---");
  console.log(rawText);
  console.log("--------------------------------------------");
  
  const text = extractJSON(rawText).trim();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[Gemini] Failed to parse script analysis JSON. Raw text:", text);
    throw err;
  }
}

/**
 * Evaluates a call transcript against an agent's KPIs.
 */
export async function evaluateCall(transcript, kpis) {
  if (IS_MOCKED) {
    console.log("Using Mocked Gemini for Call Evaluation");
    return {
      overallScore: 85,
      kpiScores: kpis.map(k => ({
        id: k.id,
        score: Math.floor(Math.random() * 40) + 60,
        reason: `Agent performed well on ${k.name} with minor deviations.`
      })),
      useActions: [
        { snippet: "I'm not sure about the price...", issue: "Agent hesitated on pricing.", recommendation: "Clarify price tiers in the script." },
        { snippet: "Goodbye.", issue: "Abrupt ending.", recommendation: "Add a proper closing signature." }
      ],
      summary: "The agent followed the script generally well but had some hesitation on specific technical questions."
    };
  }
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

  // Pre-initialize model instance on first request if not already done
  await getModelInstance();

  const rawText = await callWithRetry(prompt);
  console.log("--- RAW CALL EVALUATION TEXT FROM GEMINI ---");
  console.log(rawText);
  console.log("--------------------------------------------");

  const text = extractJSON(rawText).trim();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[Gemini] Failed to parse call evaluation JSON. Raw text:", text);
    throw err;
  }
}
