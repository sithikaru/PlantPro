import { Injectable, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ReportGenerationDto, ReportFormat } from './dto/dashboard.dto';
import * as Excel from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private dashboardService: DashboardService) {}

  async generateReport(
    reportDto: ReportGenerationDto,
    response: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Generating ${reportDto.format} report with filters: ${JSON.stringify(reportDto)}`);

      switch (reportDto.format) {
        case ReportFormat.EXCEL:
          await this.generateExcelReport(reportDto, response);
          break;
        case ReportFormat.CSV:
          await this.generateCSVReport(reportDto, response);
          break;
        case ReportFormat.JSON:
          await this.generateJSONReport(reportDto, response);
          break;
        case ReportFormat.PDF:
          await this.generatePDFReport(reportDto, response);
          break;
        default:
          throw new Error(`Unsupported report format: ${reportDto.format}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }
  }

  private async generateExcelReport(
    reportDto: ReportGenerationDto,
    response: Response,
  ): Promise<void> {
    const workbook = new Excel.Workbook();

    // Get data
    const [
      summary,
      plantLotsData,
      zoneAnalytics,
      productionTrends,
      healthTrends,
    ] = await Promise.all([
      this.dashboardService.getDashboardSummary(),
      this.dashboardService.getPlantLotAnalytics(reportDto),
      this.dashboardService.getZoneAnalytics(),
      this.dashboardService.getProductionTrends(30),
      this.dashboardService.getHealthTrends(30),
    ]);

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Total Plant Lots', value: summary.totalPlantLots },
      { metric: 'Total Active Zones', value: summary.totalActiveZones },
      { metric: 'Total Users', value: summary.totalUsers },
      { metric: 'Total Species', value: summary.totalSpecies },
      { metric: 'Average Health Score', value: summary.healthMetrics.averageHealthScore },
      { metric: 'Disease Detection Rate', value: `${(summary.healthMetrics.diseaseDetectionRate * 100).toFixed(2)}%` },
      { metric: 'Total Yield', value: summary.productionMetrics.totalYield },
      { metric: 'Ready for Harvest', value: summary.productionMetrics.readyForHarvest },
      { metric: 'Recently Planted', value: summary.productionMetrics.recentlyPlanted },
      { metric: 'Active Field Staff', value: summary.userActivity.activeFieldStaff },
    ]);

    // Plant Lots Sheet
    const plantLotsSheet = workbook.addWorksheet('Plant Lots');
    plantLotsSheet.columns = [
      { header: 'Lot Number', key: 'lotNumber', width: 15 },
      { header: 'Species', key: 'species', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Planted Date', key: 'plantedDate', width: 15 },
      { header: 'Expected Harvest', key: 'expectedHarvestDate', width: 18 },
      { header: 'Current Yield', key: 'currentYield', width: 15 },
      { header: 'Health Score', key: 'healthScore', width: 15 },
      { header: 'Disease Detected', key: 'diseaseDetected', width: 18 },
      { header: 'Zone', key: 'zone', width: 20 },
      { header: 'Assigned To', key: 'assignedTo', width: 25 },
    ];

    plantLotsSheet.addRows(
      plantLotsData.data.map(lot => ({
        lotNumber: lot.lotNumber,
        species: lot.species,
        status: lot.status,
        plantedDate: lot.plantedDate?.toISOString().split('T')[0],
        expectedHarvestDate: lot.expectedHarvestDate?.toISOString().split('T')[0] || 'N/A',
        currentYield: lot.currentYield || 0,
        healthScore: lot.healthScore || 'N/A',
        diseaseDetected: lot.diseaseDetected ? 'Yes' : 'No',
        zone: lot.zone?.name || 'N/A',
        assignedTo: lot.assignedTo ? `${lot.assignedTo.firstName} ${lot.assignedTo.lastName}` : 'Unassigned',
      }))
    );

    // Zone Analytics Sheet
    const zoneSheet = workbook.addWorksheet('Zone Analytics');
    zoneSheet.columns = [
      { header: 'Zone Name', key: 'zoneName', width: 20 },
      { header: 'Total Lots', key: 'totalLots', width: 15 },
      { header: 'Active Lots', key: 'activeLots', width: 15 },
      { header: 'Total Yield', key: 'totalYield', width: 15 },
      { header: 'Avg Health Score', key: 'averageHealthScore', width: 18 },
      { header: 'Recent Activity', key: 'recentActivity', width: 18 },
    ];

    zoneSheet.addRows(
      zoneAnalytics.map(zone => ({
        zoneName: zone.zoneName,
        totalLots: zone.totalLots,
        activeLots: zone.activeLots,
        totalYield: zone.totalYield,
        averageHealthScore: zone.averageHealthScore,
        recentActivity: zone.recentActivity,
      }))
    );

    // Health Trends Sheet if requested
    if (reportDto.includeHealthLogs && healthTrends.healthScoreTrend.length > 0) {
      const healthSheet = workbook.addWorksheet('Health Trends');
      healthSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Average Health Score', key: 'averageScore', width: 20 },
      ];

      healthSheet.addRows(healthTrends.healthScoreTrend);
    }

    // Production Trends Sheet if requested
    if (reportDto.includeAnalytics && productionTrends.daily.length > 0) {
      const productionSheet = workbook.addWorksheet('Production Trends');
      productionSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Planted', key: 'planted', width: 15 },
        { header: 'Harvested', key: 'harvested', width: 15 },
        { header: 'Yield', key: 'yield', width: 15 },
      ];

      productionSheet.addRows(productionTrends.daily);
    }

    // Style the headers
    workbook.worksheets.forEach(worksheet => {
      worksheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
      });
    });

    // Set response headers
    const fileName = `plantation-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write to response
    await workbook.xlsx.write(response);
    response.end();
  }

  private async generateCSVReport(
    reportDto: ReportGenerationDto,
    response: Response,
  ): Promise<void> {
    const plantLotsData = await this.dashboardService.getPlantLotAnalytics(reportDto);

    const csvHeaders = [
      'Lot Number',
      'Species',
      'Status',
      'Planted Date',
      'Expected Harvest',
      'Current Yield',
      'Health Score',
      'Disease Detected',
      'Zone',
      'Assigned To',
    ];

    const csvRows = plantLotsData.data.map(lot => [
      lot.lotNumber,
      lot.species,
      lot.status,
      lot.plantedDate?.toISOString().split('T')[0] || '',
      lot.expectedHarvestDate?.toISOString().split('T')[0] || '',
      lot.currentYield || 0,
      lot.healthScore || '',
      lot.diseaseDetected ? 'Yes' : 'No',
      lot.zone?.name || '',
      lot.assignedTo ? `${lot.assignedTo.firstName} ${lot.assignedTo.lastName}` : '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const fileName = `plantation-report-${new Date().toISOString().split('T')[0]}.csv`;
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(csvContent);
  }

  private async generateJSONReport(
    reportDto: ReportGenerationDto,
    response: Response,
  ): Promise<void> {
    const [
      summary,
      plantLotsData,
      zoneAnalytics,
    ] = await Promise.all([
      this.dashboardService.getDashboardSummary(),
      this.dashboardService.getPlantLotAnalytics(reportDto),
      this.dashboardService.getZoneAnalytics(),
    ]);

    const reportData = {
      metadata: {
        title: reportDto.title || 'Plantation Report',
        generatedAt: new Date().toISOString(),
        filters: reportDto,
      },
      summary,
      plantLots: plantLotsData,
      zoneAnalytics,
    };

    // Include additional data if requested
    if (reportDto.includeHealthLogs) {
      reportData['healthTrends'] = await this.dashboardService.getHealthTrends(30);
    }

    if (reportDto.includeAnalytics) {
      reportData['productionTrends'] = await this.dashboardService.getProductionTrends(30);
    }

    const fileName = `plantation-report-${new Date().toISOString().split('T')[0]}.json`;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.json(reportData);
  }

  private async generatePDFReport(
    reportDto: ReportGenerationDto,
    response: Response,
  ): Promise<void> {
    // For now, generate a simple HTML-based PDF report
    // In a production environment, you would use a proper PDF library
    const [summary, plantLotsData] = await Promise.all([
      this.dashboardService.getDashboardSummary(),
      this.dashboardService.getPlantLotAnalytics(reportDto),
    ]);

    const htmlContent = this.generateHTMLReport(summary, plantLotsData.data, reportDto.title);

    // Set response headers for PDF
    const fileName = `plantation-report-${new Date().toISOString().split('T')[0]}.html`;
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(htmlContent);
  }

  private generateHTMLReport(summary: any, plantLots: any[], title?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title || 'Plantation Report'}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2 { color: #2c5530; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .summary-card h3 { margin-top: 0; color: #2c5530; }
        </style>
    </head>
    <body>
        <h1>${title || 'Plantation Management Report'}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Plant Lots</h3>
                <p>Total: ${summary.totalPlantLots}</p>
                <p>Ready for Harvest: ${summary.productionMetrics.readyForHarvest}</p>
                <p>Recently Planted: ${summary.productionMetrics.recentlyPlanted}</p>
            </div>
            <div class="summary-card">
                <h3>Health Metrics</h3>
                <p>Avg Health Score: ${summary.healthMetrics.averageHealthScore}</p>
                <p>Disease Detection: ${(summary.healthMetrics.diseaseDetectionRate * 100).toFixed(1)}%</p>
                <p>Recent Issues: ${summary.healthMetrics.recentIssues}</p>
            </div>
            <div class="summary-card">
                <h3>Production</h3>
                <p>Total Yield: ${summary.productionMetrics.totalYield}</p>
                <p>Active Zones: ${summary.totalActiveZones}</p>
                <p>Species Count: ${summary.totalSpecies}</p>
            </div>
            <div class="summary-card">
                <h3>Team Activity</h3>
                <p>Active Staff: ${summary.userActivity.activeFieldStaff}</p>
                <p>Recent Scans: ${summary.userActivity.recentScans}</p>
                <p>Week Activity: ${summary.userActivity.lastWeekActivity}</p>
            </div>
        </div>

        <h2>Plant Lots Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Lot Number</th>
                    <th>Species</th>
                    <th>Status</th>
                    <th>Planted Date</th>
                    <th>Expected Harvest</th>
                    <th>Current Yield</th>
                    <th>Health Score</th>
                    <th>Zone</th>
                    <th>Assigned To</th>
                </tr>
            </thead>
            <tbody>
                ${plantLots.map(lot => `
                    <tr>
                        <td>${lot.lotNumber}</td>
                        <td>${lot.species}</td>
                        <td>${lot.status}</td>
                        <td>${lot.plantedDate?.toISOString().split('T')[0] || 'N/A'}</td>
                        <td>${lot.expectedHarvestDate?.toISOString().split('T')[0] || 'N/A'}</td>
                        <td>${lot.currentYield || 0}</td>
                        <td>${lot.healthScore || 'N/A'}</td>
                        <td>${lot.zone?.name || 'N/A'}</td>
                        <td>${lot.assignedTo ? `${lot.assignedTo.firstName} ${lot.assignedTo.lastName}` : 'Unassigned'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>`;
  }
}
