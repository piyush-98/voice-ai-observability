import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Default data
const defaultData = { agents: [], calls: [] };

// Initialize LowDB
const adapter = new JSONFile('/home/fa064050/Desktop/voice-ai-observability/backend/db.json');
const db = new Low(adapter, defaultData);

await db.read();
db.data ||= defaultData;
await db.write();

export default db;
