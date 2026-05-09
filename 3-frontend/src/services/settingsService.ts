import { SettingsData, RawChildProfile, ChildProfile } from '../types/settings';

// ✅ التعديل: القراءة من .env لضمان العمل من الموبايل وفي الجامعة
const API_BASE = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const settingsService = {
  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return res.json();
  },

  async updateSettings(data: Partial<SettingsData>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PATCH', 
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async getChildren(): Promise<ChildProfile[]> {
    const res = await fetch(`${API_BASE}/children`, { headers: getHeaders() });
    const data: RawChildProfile[] = await res.json();
    return data.map(child => ({
      ...child,
      id: child.id || child._id || "unknown"
    })) as ChildProfile[];
  },

  async addChild(name: string, grade: string, email?: string, password?: string) {
    const res = await fetch(`${API_BASE}/children`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        name, 
        grade,
        email,    
        password  
      })
    });
    return res.json();
  },

  async deleteChild(id: string) {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  },

  async resetAccount() {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  }
};