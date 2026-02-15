import axios from 'axios';
import type { Provider, ValidationReport, AgentLog, DashboardStats } from '../types';

const API_BASE_URL = `http://${window.location.hostname}:8001/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

export const fetchProviders = async (): Promise<Provider[]> => {
    const response = await api.get('/providers');
    return response.data;
};

export const fetchLogs = async (): Promise<AgentLog[]> => {
    const response = await api.get('/logs');
    return response.data;
};

export const fetchValidationReport = async (providerId: number): Promise<ValidationReport> => {
    // Legacy or specific provider lookup
    const response = await api.get(`/validations/${providerId}`);
    return response.data;
};

export const fetchValidationById = async (validationId: number): Promise<ValidationReport> => {
    const response = await api.get(`/validation/${validationId}`);
    return response.data;
};

export const fetchDiscrepancies = async (validationId: number): Promise<any[]> => {
    const response = await api.get(`/validation/${validationId}/discrepancies`);
    return response.data;
};

export const fetchAgentLogsByValidation = async (validationId: number): Promise<AgentLog[]> => {
    const response = await api.get(`/agent-logs/${validationId}`);
    return response.data;
};

export const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/validate', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const clearLogs = async (): Promise<void> => {
    await api.delete('/logs');
};

export const deleteProvider = async (providerId: number): Promise<void> => {
    await api.delete(`/providers/${providerId}`);
};

export const clearRegistry = async (): Promise<void> => {
    await api.delete('/providers');
};

export const fetchConfig = async (): Promise<any> => {
    const response = await api.get('/config');
    return response.data;
};

export const updateConfig = async (config: any): Promise<any> => {
    const response = await api.put('/config', config);
    return response.data;
};

export const fetchSystemStatus = async () => {
    const response = await api.get('/system/status');
    return response.data;
};

export const updateSecrets = async (secrets: { gemini_api_key: string; database_url: string }) => {
    const response = await api.post('/system/secrets', secrets);
    return response.data;
};

// Validation Job Progress
export const fetchActiveJob = async () => {
    const response = await api.get('/jobs/active');
    return response.data;
};

export const cancelJob = async (jobId: number) => {
    const response = await api.post(`/jobs/${jobId}/cancel`);
    return response.data;
};
