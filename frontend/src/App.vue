<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  Activity, 
  Phone, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Plus,
  ArrowLeft
} from 'lucide-vue-next'

const stats = ref({
  totalCalls: 0,
  avgScore: 0,
  topFailure: 'None'
})
const recentCalls = ref([])
const agents = ref([])
const currentView = ref('dashboard') // 'dashboard', 'create-agent', 'call-detail', 'upload'
const selectedCall = ref(null)
const isLoading = ref(true)

// Form data for upload
const uploadData = ref({
  agentId: '',
  callerName: '',
  transcript: ''
})

// Form data for agent creation
const newAgentData = ref({
  name: '',
  script: ''
})
const isCreatingAgent = ref(false)
const createdAgentResult = ref(null)

const fetchDashboard = async () => {
  isLoading.value = true
  try {
    const res = await axios.get('/api/dashboard')
    stats.value = res.data.stats
    recentCalls.value = res.data.recentCalls
    agents.value = res.data.agents
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleUpload = async () => {
  try {
    await axios.post('/api/calls/upload', uploadData.value)
    currentView.value = 'dashboard'
    fetchDashboard()
    // Reset form
    uploadData.value = { agentId: '', callerName: '', transcript: '' }
  } catch (err) {
    alert('Failed to upload')
  }
}

const handleCreateAgent = async () => {
  if (!newAgentData.value.name || !newAgentData.value.script) {
    alert('Please fill in all fields')
    return
  }
  isCreatingAgent.value = true
  try {
    const res = await axios.post('/api/agents', newAgentData.value)
    createdAgentResult.value = res.data
    // Refresh dashboard agents dropdown
    fetchDashboard()
    // Reset form
    newAgentData.value = { name: '', script: '' }
  } catch (err) {
    alert('Failed to create agent profile')
  } finally {
    isCreatingAgent.value = false
  }
}

const showCall = (call) => {
  selectedCall.value = call
  currentView.value = 'call-detail'
}

onMounted(fetchDashboard)
</script>

<template>
  <div class="sidebar glass-card">
    <div style="margin-bottom: 40px; display: flex; align-items: center; gap: 10px;">
      <Activity :size="32" color="#38bdf8" />
      <h2 style="margin: 0; font-size: 20px;">Observability</h2>
    </div>

    <nav style="display: flex; flex-direction: column; gap: 12px; flex: 1;">
      <a href="#" @click="currentView = 'dashboard'" :class="{ active: currentView === 'dashboard' }" class="nav-item">
        <TrendingUp :size="20" /> Dashboard
      </a>
      <a href="#" @click="currentView = 'create-agent'" :class="{ active: currentView === 'create-agent' }" class="nav-item">
        <Plus :size="20" /> Create Agent
      </a>
      <a href="#" @click="currentView = 'upload'" :class="{ active: currentView === 'upload' }" class="nav-item">
        <Phone :size="20" /> Upload Transcript
      </a>
    </nav>

    <div class="user-profile">
      <User :size="32" class="glass-card" style="padding: 4px;" />
      <div>
        <div style="font-weight: 600; font-size: 14px;">Demo User</div>
        <div style="font-size: 12px; color: var(--text-secondary);">GHL Sandbox</div>
      </div>
    </div>
  </div>

  <main class="main-content">
    <!-- DASHBOARD VIEW -->
    <div v-if="currentView === 'dashboard'">
      <h1>Performance Overview</h1>
      
      <div class="stats-grid">
        <div class="stat-card glass-card">
          <div class="stat-value">{{ stats.totalCalls }}</div>
          <div class="stat-label">Total Calls</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value" :style="{ color: stats.avgScore > 80 ? 'var(--success-color)' : 'var(--warning-color)' }">
            {{ stats.avgScore }}%
          </div>
          <div class="stat-label">Avg Adherence</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value" style="font-size: 20px; text-transform: capitalize;">{{ stats.topFailure }}</div>
          <div class="stat-label">Top Constraint</div>
        </div>
      </div>

      <div class="glass-card" style="padding: 24px;">
        <h3 style="display: flex; align-items: center; gap: 10px;">
          <Phone :size="20" /> Recent Call Logs
        </h3>
        <div v-if="recentCalls.length === 0" style="color: var(--text-secondary); text-align: center; padding: 40px;">
          No calls monitored yet.
        </div>
        <table v-else class="calls-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Agent</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="call in recentCalls" :key="call.id">
              <td>{{ call.callerName }}</td>
              <td>{{ call.agentName }}</td>
              <td>
                <span class="score-badge" :class="call.analysis.overallScore > 80 ? 'good' : 'bad'">
                  {{ call.analysis.overallScore }}
                </span>
              </td>
              <td>
                <CheckCircle v-if="call.analysis.overallScore > 75" :size="18" color="var(--success-color)" />
                <AlertTriangle v-else :size="18" color="var(--warning-color)" />
              </td>
              <td style="text-align: right;">
                <button @click="showCall(call)" class="btn-sm">Analyze</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE AGENT VIEW -->
    <div v-else-if="currentView === 'create-agent'">
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
        <button @click="currentView = 'dashboard'; createdAgentResult = null" class="btn-icon"><ArrowLeft :size="20" /></button>
        <h1 style="margin: 0;">Create Voice AI Agent</h1>
      </div>

      <div v-if="createdAgentResult" class="glass-card" style="padding: 32px; max-width: 700px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <CheckCircle :size="48" color="var(--success-color)" style="margin-bottom: 12px; margin-left: auto; margin-right: auto;" />
          <h2 style="margin: 0; color: var(--success-color);">Agent Profile Created!</h2>
          <p style="color: var(--text-secondary); margin-top: 8px;">AI has analyzed the instructions and generated KPIs successfully.</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 8px;">Agent Name</h3>
          <p style="font-size: 16px; margin: 0; font-weight: 600;">{{ createdAgentResult.name }}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 12px;">AI-Extracted KPI Scorecard</h3>
          <div v-for="kpi in createdAgentResult.kpis" :key="kpi.id" class="glass-card" style="padding: 14px; margin-bottom: 10px; border-left: 3px solid var(--accent-color);">
            <div style="font-weight: 600; font-size: 14px; color: var(--accent-color);">{{ kpi.name }}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ kpi.description }}</div>
          </div>
        </div>

        <button @click="currentView = 'dashboard'; createdAgentResult = null" class="btn-primary" style="width: 100%;">
          Back to Dashboard
        </button>
      </div>

      <div v-else class="glass-card" style="padding: 32px; max-width: 700px;">
        <div class="form-group">
          <label>Agent Name / Profile Title</label>
          <input v-model="newAgentData.name" type="text" placeholder="e.g. Real Estate Intake Closer" class="glass-input" />
        </div>
        <div class="form-group">
          <label>Agent Instruction Script / System Prompt</label>
          <textarea v-model="newAgentData.script" rows="8" placeholder="Paste the Voice AI prompt instructions here..." class="glass-input"></textarea>
        </div>
        <button @click="handleCreateAgent" class="btn-primary" style="width: 100%; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px;" :disabled="isCreatingAgent">
          <span v-if="isCreatingAgent">Extracting KPIs with AI...</span>
          <span v-else>Generate Agent Scorecard</span>
        </button>
      </div>
    </div>

    <!-- UPLOAD VIEW -->
    <div v-else-if="currentView === 'upload'">
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
        <button @click="currentView = 'dashboard'" class="btn-icon"><ArrowLeft :size="20" /></button>
        <h1 style="margin: 0;">Upload Ingestion</h1>
      </div>

      <div class="glass-card" style="padding: 32px; max-width: 700px;">
        <div class="form-group">
          <label>Select Agent Profile</label>
          <select v-model="uploadData.agentId" class="glass-input">
            <option disabled value="">Select an agent...</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Contact Name</label>
          <input v-model="uploadData.callerName" type="text" placeholder="e.g. John Smith" class="glass-input" />
        </div>
        <div class="form-group">
          <label>Transcript Snippet</label>
          <textarea v-model="uploadData.transcript" rows="10" placeholder="Paste the Voice AI transcript here..." class="glass-input"></textarea>
        </div>
        <button @click="handleUpload" class="btn-primary" style="width: 100%; margin-top: 20px;">
          Ingest & Analyze
        </button>
      </div>
    </div>

    <!-- CALL DETAIL VIEW -->
    <div v-else-if="currentView === 'call-detail'">
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
        <button @click="currentView = 'dashboard'" class="btn-icon"><ArrowLeft :size="20" /></button>
        <div>
          <h1 style="margin: 0;">Call Analysis: {{ selectedCall.callerName }}</h1>
          <div style="color: var(--text-secondary);">Agent: {{ selectedCall.agentName }} • {{ new Date(selectedCall.timestamp).toLocaleString() }}</div>
        </div>
      </div>

      <div class="analysis-grid">
        <div class="glass-card transcript-box">
          <h3>Transcript View</h3>
          <div class="transcript-content">
            <div v-for="(line, i) in selectedCall.transcript.split('\n')" :key="i" class="line">
              {{ line }}
            </div>
          </div>
        </div>

        <div class="insights-box">
          <div class="glass-card" style="padding: 24px; margin-bottom: 24px;">
            <h3>Success Criteria</h3>
            <div v-for="kpi in selectedCall.analysis.kpiScores" :key="kpi.id" class="kpi-row">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 500;">{{ kpi.id }}</span>
                <span>{{ kpi.score }}%</span>
              </div>
              <div class="progress-bg">
                <div class="progress-bar" :style="{ width: kpi.score + '%', backgroundColor: kpi.score > 70 ? 'var(--success-color)' : 'var(--danger-color)' }"></div>
              </div>
            </div>
          </div>

          <div class="glass-card" style="padding: 24px;">
            <h3>AI Recommendations</h3>
            <div v-for="(action, i) in selectedCall.analysis.useActions" :key="i" class="action-card">
              <div class="action-issue"><AlertTriangle :size="16" /> {{ action.issue }}</div>
              <div class="action-snippet">"{{ action.snippet }}"</div>
              <div class="action-rec"><strong>Fix:</strong> {{ action.recommendation }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.nav-item:hover, .nav-item.active {
  background: var(--card-bg);
  color: var(--accent-color);
}
.user-profile {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
.calls-table {
  width: 100%;
  border-collapse: collapse;
}
.calls-table th {
  text-align: left;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}
.calls-table td {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border-color);
}
.score-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.score-badge.good { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }
.score-badge.bad { background: rgba(239, 68, 68, 0.2); color: var(--danger-color); }
.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
  background: var(--border-color);
  color: var(--text-primary);
}
.btn-sm:hover { background: var(--accent-color); color: white; }
.btn-icon {
  background: var(--card-bg);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}
.glass-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 8px;
  color: white;
  font-family: inherit;
}
.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}
.transcript-content {
  background: rgba(0,0,0,0.2);
  padding: 20px;
  border-radius: 10px;
  font-family: monospace;
  height: 500px;
  overflow-y: auto;
}
.line {
  margin-bottom: 8px;
  padding: 4px;
}
.kpi-row {
  margin-bottom: 20px;
}
.progress-bg {
  background: rgba(255,255,255,0.05);
  height: 6px;
  border-radius: 3px;
}
.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease-out;
}
.action-card {
  background: rgba(245, 158, 11, 0.05);
  border-left: 3px solid var(--warning-color);
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 0 8px 8px 0;
}
.action-issue {
  color: var(--warning-color);
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.action-snippet {
  font-style: italic;
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}
.action-rec {
  font-size: 13px;
}
</style>
