import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db/index.js';
import { analyzeScript } from './services/gemini.js';
import { evaluateCall } from './services/gemini.js';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Get Dashboard Data
app.get('/api/dashboard', async (req, res) => {
    const { agents, calls } = db.data;
    
    const totalCalls = calls.length;
    const avgScore = totalCalls > 0 
        ? Math.round(calls.reduce((acc, c) => acc + c.analysis.overallScore, 0) / totalCalls)
        : 0;
    
    // Most common failure (simplified)
    const failures = calls.flatMap(c => c.analysis.kpiScores.filter(k => k.score < 70).map(k => k.id));
    const topFailure = failures.length > 0 ? failures.sort((a,b) => failures.filter(v => v===a).length - failures.filter(v => v===b).length).reverse()[0] : 'None';

    res.json({
        stats: {
            totalCalls,
            avgScore,
            topFailure
        },
        recentCalls: calls.slice(-5).reverse(),
        agents: agents.map(a => ({ id: a.id, name: a.name }))
    });
});

// Create Agent
app.post('/api/agents', async (req, res) => {
    try {
        const { name, script } = req.body;
        const kpis = await analyzeScript(script);
        
        const newAgent = {
            id: randomUUID(),
            name,
            script,
            kpis,
            createdAt: new Date().toISOString()
        };
        
        db.data.agents.push(newAgent);
        await db.write();
        
        res.json(newAgent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});

// Upload Call
app.post('/api/calls/upload', async (req, res) => {
    try {
        const { agentId, transcript, callerName } = req.body;
        const agent = db.data.agents.find(a => a.id === agentId);
        
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        
        const analysis = await evaluateCall(transcript, agent.kpis);
        
        const newCall = {
            id: randomUUID(),
            agentId,
            agentName: agent.name,
            callerName,
            transcript,
            analysis,
            timestamp: new Date().toISOString()
        };
        
        db.data.calls.push(newCall);
        await db.write();
        
        res.json(newCall);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze call' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
