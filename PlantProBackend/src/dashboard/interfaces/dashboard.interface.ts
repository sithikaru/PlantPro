export interface DashboardSummary {
  totalPlantLots: number;
  totalActiveZones: number;
  totalUsers: number;
  totalSpecies: number;
  
  healthMetrics: {
    totalHealthLogs: number;
    averageHealthScore: number;
    diseaseDetectionRate: number;
    recentIssues: number;
  };

  productionMetrics: {
    totalYield: number;
    readyForHarvest: number;
    recentlyPlanted: number;
    overdueLots: number;
  };

  userActivity: {
    activeFieldStaff: number;
    recentScans: number;
    lastWeekActivity: number;
  };

  systemHealth: {
    aiAnalysisSuccess: number;
    pendingAnalysis: number;
    systemErrors: number;
  };
}

export interface PlantLotAnalytics {
  id: number;
  lotNumber: string;
  species: string;
  status: string;
  plantedDate: Date;
  expectedHarvestDate?: Date;
  currentYield: number;
  healthScore?: number;
  diseaseDetected: boolean;
  lastHealthCheck?: Date;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  zone?: {
    id: number;
    name: string;
  };
}

export interface ZoneAnalytics {
  zoneId: number;
  zoneName: string;
  totalLots: number;
  activeLots: number;
  totalYield: number;
  averageHealthScore: number;
  species: { name: string; count: number }[];
  recentActivity: number;
}

export interface ProductionTrends {
  daily: { date: string; planted: number; harvested: number; yield: number }[];
  weekly: { week: string; planted: number; harvested: number; yield: number }[];
  monthly: { month: string; planted: number; harvested: number; yield: number }[];
}

export interface HealthTrends {
  healthScoreTrend: { date: string; averageScore: number }[];
  diseaseIncidence: { date: string; count: number; rate: number }[];
  commonIssues: { issue: string; count: number; trend: string }[];
}
