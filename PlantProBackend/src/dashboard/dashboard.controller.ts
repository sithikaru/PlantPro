import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ReportService } from './report.service';
import { DashboardFiltersDto, ReportGenerationDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly reportService: ReportService,
  ) {}

  @Get('summary')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS, UserRole.FIELD_STAFF)
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  async getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('plant-lots')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS, UserRole.FIELD_STAFF)
  @ApiOperation({ summary: 'Get plant lots analytics with filtering and pagination' })
  @ApiQuery({ name: 'zoneId', required: false, type: Number })
  @ApiQuery({ name: 'species', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'assignedToId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getPlantLotAnalytics(@Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getPlantLotAnalytics(filters);
  }

  @Get('zones')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS, UserRole.FIELD_STAFF)
  @ApiOperation({ summary: 'Get zone analytics' })
  @ApiResponse({ status: 200, description: 'Zone analytics retrieved successfully' })
  async getZoneAnalytics() {
    return this.dashboardService.getZoneAnalytics();
  }

  @Get('production-trends')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get production trends' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  async getProductionTrends(@Query('days') days?: number) {
    return this.dashboardService.getProductionTrends(days || 30);
  }

  @Get('health-trends')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get health trends' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  async getHealthTrends(@Query('days') days?: number) {
    return this.dashboardService.getHealthTrends(days || 30);
  }

  @Post('reports/generate')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate and download reports in various formats',
    description: 'Generate comprehensive plantation reports in PDF, Excel, CSV, or JSON format with filtering options'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Report generated and downloaded successfully',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
      'text/csv': {},
      'application/json': {},
      'text/html': {},
    }
  })
  async generateReport(
    @Body() reportDto: ReportGenerationDto,
    @Res() response: Response,
  ) {
    await this.reportService.generateReport(reportDto, response);
  }

  @Get('quick-stats')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS, UserRole.FIELD_STAFF)
  @ApiOperation({ summary: 'Get quick dashboard statistics for mobile/widget view' })
  async getQuickStats() {
    const summary = await this.dashboardService.getDashboardSummary();
    
    return {
      totalPlantLots: summary.totalPlantLots,
      readyForHarvest: summary.productionMetrics.readyForHarvest,
      averageHealthScore: summary.healthMetrics.averageHealthScore,
      recentIssues: summary.healthMetrics.recentIssues,
      activeFieldStaff: summary.userActivity.activeFieldStaff,
      systemHealth: summary.systemHealth.systemErrors,
    };
  }

  @Get('alerts')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get system alerts and notifications' })
  async getSystemAlerts() {
    const summary = await this.dashboardService.getDashboardSummary();
    
    const alerts: Array<{
      type: 'error' | 'warning' | 'info';
      title: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      timestamp: Date;
    }> = [];

    // Check for system issues
    if (summary.systemHealth.systemErrors > 5) {
      alerts.push({
        type: 'error',
        title: 'High AI Analysis Failure Rate',
        message: `${summary.systemHealth.systemErrors} failed analyses detected`,
        priority: 'high',
        timestamp: new Date(),
      });
    }

    if (summary.systemHealth.systemErrors > 5) {
      alerts.push({
        type: 'warning',
        title: 'System Errors Detected',
        message: `${summary.systemHealth.systemErrors} system errors logged`,
        priority: 'medium',
        timestamp: new Date(),
      });
    }

    // Check for production issues
    if (summary.productionMetrics.overdueLots > 0) {
      alerts.push({
        type: 'warning',
        title: 'Overdue Harvests',
        message: `${summary.productionMetrics.overdueLots} lots past expected harvest date`,
        priority: 'high',
        timestamp: new Date(),
      });
    }

    // Check for health issues
    if (summary.healthMetrics.diseaseDetectionRate > 0.2) {
      alerts.push({
        type: 'error',
        title: 'High Disease Detection Rate',
        message: `${(summary.healthMetrics.diseaseDetectionRate * 100).toFixed(1)}% disease detection rate`,
        priority: 'high',
        timestamp: new Date(),
      });
    }

    return {
      alerts,
      count: alerts.length,
      lastUpdated: new Date(),
    };
  }

  // Example API usage endpoints for demonstration
  @Get('examples/filtering')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ 
    summary: 'Example of advanced filtering capabilities',
    description: 'Demonstrates various filtering options available for plant lot analytics'
  })
  async getFilteringExamples() {
    return {
      examples: [
        {
          description: 'Get all tomato plants in zone 1',
          query: '/api/v1/dashboard/plant-lots?species=tomato&zoneId=1',
        },
        {
          description: 'Get plants planted in the last 30 days, sorted by health score',
          query: '/api/v1/dashboard/plant-lots?startDate=2024-01-01&sortBy=healthScore&sortOrder=DESC',
        },
        {
          description: 'Get paginated results with 20 items per page',
          query: '/api/v1/dashboard/plant-lots?page=1&limit=20',
        },
        {
          description: 'Filter by assigned field staff member',
          query: '/api/v1/dashboard/plant-lots?assignedToId=123',
        },
      ],
      reportExamples: [
        {
          description: 'Generate Excel report with health logs',
          request: {
            format: 'excel',
            title: 'Monthly Health Report',
            includeHealthLogs: true,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        },
        {
          description: 'Generate CSV report for specific zone',
          request: {
            format: 'csv',
            zoneId: 1,
            title: 'Zone 1 Production Report',
          },
        },
      ],
    };
  }
}
