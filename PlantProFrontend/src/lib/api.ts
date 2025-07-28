import { apiClient } from './api-client';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User,
  PlantLot,
  CreatePlantLotData,
  UpdatePlantLotData,
  QrScanUpdateData,
  PaginatedResponse,
  PlantSpecies,
  Zone
} from './types';

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    apiClient.post('/auth/login', credentials),

  register: (data: RegisterData): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data),

  getProfile: (): Promise<User> =>
    apiClient.get('/auth/profile'),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout'),
};

// Plant Lots API
export const plantLotsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    zoneId?: number;
    speciesId?: number;
    status?: string;
    assignedToId?: number;
  }): Promise<PaginatedResponse<PlantLot>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get(`/plant-lots?${searchParams.toString()}`);
  },

  getById: (id: number): Promise<PlantLot> =>
    apiClient.get(`/plant-lots/${id}`),

  getByQrCode: (qrCode: string): Promise<PlantLot> =>
    apiClient.get(`/plant-lots/qr/${qrCode}`),

  create: (data: CreatePlantLotData): Promise<PlantLot> =>
    apiClient.post('/plant-lots', data),

  update: (id: number, data: UpdatePlantLotData): Promise<PlantLot> =>
    apiClient.patch(`/plant-lots/${id}`, data),

  updateByQrScan: (data: QrScanUpdateData): Promise<PlantLot> =>
    apiClient.post('/plant-lots/qr-scan', data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/plant-lots/${id}`),

  getQrCode: (id: number): Promise<{ id: number; qrCode: string; type: string }> =>
    apiClient.get(`/plant-lots/${id}/qr-code`),
};

// Plant Species API
export const plantSpeciesApi = {
  getAll: (): Promise<PlantSpecies[]> =>
    apiClient.get('/plant-species'),
};

// Zones API
export const zonesApi = {
  getAll: (): Promise<Zone[]> =>
    apiClient.get('/zones'),
};

// Users API
export const usersApi = {
  getFieldStaff: (): Promise<User[]> =>
    apiClient.get('/users/field-staff'),
  
  getAll: (): Promise<User[]> =>
    apiClient.get('/users'),
};
