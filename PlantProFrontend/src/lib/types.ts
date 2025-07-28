// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'field_staff' | 'analytics';
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedPlantLotsCount?: number;
  healthLogsCount?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Plant lot types
export interface PlantSpecies {
  id: number;
  name: string;
  scientificName: string;
  description?: string;
  growthPeriodDays: number;
  harvestPeriodDays: number;
  expectedYieldPerPlant: number;
  yieldUnit: string;
}

export interface Zone {
  id: number;
  name: string;
  description?: string;
  areaHectares: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    boundaries?: Array<{ lat: number; lng: number }>;
  };
  isActive: boolean;
}

export interface PlantLot {
  id: number;
  lotNumber: string;
  qrCode: string;
  qrCodeImage?: string; // For storing the QR code image data URL
  plantCount: number;
  plantedDate: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  status: 'seedling' | 'growing' | 'mature' | 'harvesting' | 'harvested' | 'diseased' | 'dead';
  currentYield?: number;
  location?: {
    section: string;
    row: number;
    column: number;
  };
  notes?: string;
  speciesId: number;
  zoneId: number;
  assignedToId?: number;
  lastScannedAt?: string;
  lastScannedBy?: number;
  createdAt: string;
  updatedAt: string;
  species?: PlantSpecies;
  zone?: Zone;
  assignedTo?: User;
  healthLogs?: HealthLog[];
}

// Health Log types
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'diseased' | 'critical';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface HealthMetrics {
  plantHeight?: number;
  leafCount?: number;
  flowerCount?: number;
  fruitCount?: number;
  temperature?: number;
  humidity?: number;
  soilMoisture?: number;
}

export interface AIAnalysis {
  healthScore?: number;
  diseaseDetected?: boolean;
  diseaseType?: string;
  confidence?: number;
  recommendations?: string[];
  detectedIssues?: {
    type: string;
    severity: string;
    confidence: number;
    location?: { x: number; y: number; width: number; height: number };
  }[];
}

export interface HealthLog {
  id: number;
  healthStatus: HealthStatus;
  notes?: string;
  images?: string[];
  metrics?: HealthMetrics;
  analysisStatus: AnalysisStatus;
  aiAnalysis?: AIAnalysis;
  aiRawResponse?: string;
  latitude?: number;
  longitude?: number;
  recordedAt?: string;
  plantLotId: number;
  recordedById: number;
  createdAt: string;
  updatedAt: string;
  plantLot?: PlantLot;
  recordedBy?: User;
}

export interface CreateHealthLogData {
  healthStatus: HealthStatus;
  notes?: string;
  images?: string[];
  metrics?: HealthMetrics;
  latitude?: number;
  longitude?: number;
  recordedAt?: string;
  plantLotId: number;
}

export interface UpdateHealthLogData {
  healthStatus?: HealthStatus;
  notes?: string;
  images?: string[];
  metrics?: HealthMetrics;
  latitude?: number;
  longitude?: number;
  recordedAt?: string;
}

export interface CreatePlantLotData {
  speciesId: number;
  zoneId: number;
  plantCount: number;
  plantedDate: string;
  expectedHarvestDate?: string;
  assignedToId?: number;
  notes?: string;
  location?: {
    section: string;
    row: number;
    column: number;
  };
}

export interface UpdatePlantLotData {
  plantCount?: number;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  status?: string;
  currentYield?: number;
  assignedToId?: number;
  notes?: string;
  location?: {
    section: string;
    row: number;
    column: number;
  };
}

export interface QrScanUpdateData {
  qrCode: string;
  status?: string;
  currentYield?: number;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User management types
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'field_staff' | 'analytics';
  phoneNumber?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'manager' | 'field_staff' | 'analytics';
  phoneNumber?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  newPassword: string;
}

export interface UserStats {
  total: number;
  byRole: {
    manager: number;
    field_staff: number;
    analytics: number;
  };
  active: number;
  inactive: number;
}
