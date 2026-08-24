import {
  DashboardSummary,
  Facility,
  InventoryItem,
  ForecastItem,
  RedistributionItem,
  SupplierItem,
  NotificationItem,
  ScenarioRequest,
  ScenarioResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  async getDashboardSummary(country = 'India', region = 'All'): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary?country=${country}&region=${region}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getFacilities(country = 'All', district = 'All', status = 'All'): Promise<Facility[]> {
    const res = await fetch(`${API_BASE}/facilities?country=${country}&district=${district}&status=${status}`);
    if (!res.ok) throw new Error('Failed to fetch facilities');
    return res.json();
  },

  async getInventory(params: {
    country?: string;
    district?: string;
    category?: string;
    risk_level?: string;
    search?: string;
  } = {}): Promise<InventoryItem[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/inventory?${query}`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async getForecasts(country = 'All', risk_level = 'All'): Promise<ForecastItem[]> {
    const res = await fetch(`${API_BASE}/forecasts?country=${country}&risk_level=${risk_level}`);
    if (!res.ok) throw new Error('Failed to fetch forecasts');
    return res.json();
  },

  async runForecastingPipeline() {
    const res = await fetch(`${API_BASE}/forecasts/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run forecasting pipeline');
    return res.json();
  },

  async getDemandTrend(facilityId = 'FAC-IN-101', medicineId = 'MED-ORS') {
    const res = await fetch(`${API_BASE}/forecasts/demand-trend?facility_id=${facilityId}&medicine_id=${medicineId}`);
    if (!res.ok) throw new Error('Failed to fetch demand trend');
    return res.json();
  },

  async getRedistributions(country = 'All'): Promise<RedistributionItem[]> {
    const res = await fetch(`${API_BASE}/redistribution/recommendations?country=${country}`);
    if (!res.ok) throw new Error('Failed to fetch redistributions');
    return res.json();
  },

  async approveRedistribution(id: string) {
    const res = await fetch(`${API_BASE}/redistribution/approve/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve redistribution');
    return res.json();
  },

  async getSuppliers(): Promise<SupplierItem[]> {
    const res = await fetch(`${API_BASE}/suppliers`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  async getProcurementGap(country = 'India') {
    const res = await fetch(`${API_BASE}/suppliers/procurement-gap?country=${country}`);
    if (!res.ok) throw new Error('Failed to fetch procurement gap');
    return res.json();
  },

  async generateProcurementSummary(country = 'India') {
    const res = await fetch(`${API_BASE}/suppliers/generate-summary?country=${country}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate procurement summary');
    return res.json();
  },

  async simulateScenario(req: ScenarioRequest): Promise<ScenarioResponse> {
    const res = await fetch(`${API_BASE}/scenario/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to simulate scenario');
    return res.json();
  },

  async askAICopilot(question: string, country = 'India') {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, country }),
    });
    if (!res.ok) throw new Error('Failed to ask AI Copilot');
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async loadEmergencyDemoScenario() {
    const res = await fetch(`${API_BASE}/demo/load-emergency-scenario`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load demo scenario');
    return res.json();
  },

  async updateFacilityBeds(facilityId: string, data: { occupied_beds: number; total_beds?: number }) {
    const res = await fetch(`${API_BASE}/facilities/${facilityId}/beds`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update facility beds');
    return res.json();
  },

  async updateFacilityStaff(facilityId: string, data: { doctors_available: number; nurses_available: number; support_available: number }) {
    const res = await fetch(`${API_BASE}/facilities/${facilityId}/staff`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update facility staff');
    return res.json();
  },

  async resetDemoDatabase() {
    const res = await fetch(`${API_BASE}/demo/reset-database`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo database');
    return res.json();
  }
};
