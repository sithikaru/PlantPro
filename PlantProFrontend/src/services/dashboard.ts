import { apiClient } from '../lib/api-client';

export interface DashboardSummary {
  totalPlantLots: number;
  totalUsers: number;
  totalActiveZones: number;
  totalHealthLogs: number;
  recentHealthLogs: number;
  readyForHarvest: number;
  recentlyPlanted: number;
  healthTrends: {
    totalHealthy: number;
    totalSickOrPest: number;
    avgHealthScore: number;
    recentHealthScore: number;
  };
  productionTrends: {
    avgGrowthRate: number;
    avgYield: number;
    totalHarvested: number;
    totalReplanted: number;
  };
  userStats: {
    totalManagers: number;
    totalFieldStaff: number;
    totalAnalytics: number;
    activeUsers: number;
  };
  alerts: {
    overdueHealthChecks: number;
    lowHealthPlants: number;
    harvestReady: number;
    pestReports: number;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export const dashboardApi = {
  getDashboardSummary: (): Promise<DashboardSummary> =>
    apiClient.get('/dashboard/summary'),
};
