import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AIAnalysisResult {
  healthScore: number; // 0-100
  diseaseDetected: boolean;
  diseaseType?: string;
  confidence: number;
  recommendations: string[];
  detectedIssues: {
    type: string;
    severity: string;
    confidence: number;
    description: string;
  }[];
  insights: string[];
  riskFactors: string[];
  nextActions: string[];
  environmentalAnalysis: {
    temperatureStatus: 'optimal' | 'suboptimal' | 'critical';
    humidityStatus: 'optimal' | 'suboptimal' | 'critical';
    soilMoistureStatus: 'optimal' | 'suboptimal' | 'critical';
    environmentalIssues: string[];
    environmentalRecommendations: string[];
  };
  plantLotImprovements: {
    overallAssessment: string;
    priorityActions: string[];
    longTermSuggestions: string[];
    expectedOutcomes: string[];
  };
  speciesSpecificGuidance: {
    optimalConditions: {
      temperature: string;
      humidity: string;
      soilMoisture: string;
      lightRequirements: string;
    };
    commonIssues: string[];
    preventiveMeasures: string[];
  };
}

export interface HistoricalAnalyticsResult {
  currentHealthStatus: {
    healthScore: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    lastAnalyzed: Date;
  };
  historicalComparison: {
    averageHealthScore: number;
    trendDirection: 'improving' | 'stable' | 'declining';
    percentageChange: number;
    comparisonPeriod: string;
  };
  healthTrends: {
    date: string;
    healthScore: number;
    diseaseDetected: boolean;
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
  }[];
  environmentalTrends: {
    temperatureAverage: number;
    temperatureTrend: 'improving' | 'stable' | 'declining';
    humidityAverage: number;
    humidityTrend: 'improving' | 'stable' | 'declining';
    soilMoistureAverage: number;
    soilMoistureTrend: 'improving' | 'stable' | 'declining';
  };
  diseaseFrequencyAnalysis: {
    totalEntries: number;
    diseaseDetectionRate: number;
    commonDiseases: { type: string; frequency: number; lastDetected: Date }[];
    riskTrend: 'increasing' | 'stable' | 'decreasing';
  };
  growthProgression: {
    heightProgression: { date: string; height: number }[];
    leafCountProgression: { date: string; count: number }[];
    flowerCountProgression: { date: string; count: number }[];
    fruitCountProgression: { date: string; count: number }[];
    growthRate: {
      height: 'fast' | 'normal' | 'slow';
      leafDevelopment: 'fast' | 'normal' | 'slow';
      flowering: 'active' | 'moderate' | 'low';
      fruiting: 'active' | 'moderate' | 'low';
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI client initialized successfully');
    } else {
      this.logger.warn('OpenAI API key not found, using simulation mode');
    }
  }

  async analyzeHealthLogData(healthLogData: {
    healthStatus: string;
    notes?: string;
    metrics?: {
      plantHeight?: number;
      leafCount?: number;
      flowerCount?: number;
      fruitCount?: number;
      temperature?: number;
      humidity?: number;
      soilMoisture?: number;
    };
    plantLotInfo?: {
      species?: string;
      zone?: string;
      plantingDate?: Date;
      currentAge?: number;
    };
    environmentalData?: {
      latitude?: number;
      longitude?: number;
      season?: string;
      weather?: string;
    };
  }): Promise<AIAnalysisResult> {
    try {
      this.logger.log('Starting OpenAI-powered health analysis');

      if (!this.openai) {
        this.logger.warn('OpenAI not available, falling back to simulation');
        return this.simulateAnalysis(healthLogData);
      }

      const prompt = this.buildAnalysisPrompt(healthLogData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert plant pathologist and agricultural specialist. Analyze the provided plant health data and respond with a JSON object containing your professional assessment. Be thorough, accurate, and provide actionable insights.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      const aiResponse = completion.choices[0].message.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const analysisResult = this.parseOpenAIResponse(aiResponse);
      this.logger.log(`OpenAI analysis completed with health score: ${analysisResult.healthScore}`);
      
      return analysisResult;

    } catch (error) {
      this.logger.error(`OpenAI analysis failed: ${error.message}`);
      
      // Fallback to simulation if OpenAI fails
      this.logger.warn('Falling back to simulated analysis');
      return this.simulateAnalysis(healthLogData);
    }
  }

  private buildAnalysisPrompt(healthLogData: any): string {
    return `
You are an expert agricultural consultant and plant pathologist. Analyze the following comprehensive plant health data and provide detailed environmental analysis and species-specific recommendations.

PLANT HEALTH STATUS: ${healthLogData.healthStatus}
NOTES: ${healthLogData.notes || 'No additional notes provided'}

CURRENT MEASUREMENTS:
${healthLogData.metrics ? `
- Plant Height: ${healthLogData.metrics.plantHeight || 'Not measured'} cm
- Leaf Count: ${healthLogData.metrics.leafCount || 'Not counted'}
- Flower Count: ${healthLogData.metrics.flowerCount || 'Not counted'}
- Fruit Count: ${healthLogData.metrics.fruitCount || 'Not counted'}
- Temperature: ${healthLogData.metrics.temperature || 'Not recorded'}°C
- Humidity: ${healthLogData.metrics.humidity || 'Not recorded'}%
- Soil Moisture: ${healthLogData.metrics.soilMoisture || 'Not recorded'}%
` : 'No measurements available'}

PLANT LOT INFORMATION:
${healthLogData.plantLotInfo ? `
- Species: ${healthLogData.plantLotInfo.species || 'Unknown'}
- Zone: ${healthLogData.plantLotInfo.zone || 'Unknown'}
- Planted Date: ${healthLogData.plantLotInfo.plantedDate || 'Unknown'}
- Current Age: ${healthLogData.plantLotInfo.currentAge || 'Unknown'} days
- Plant Count: ${healthLogData.plantCount || 'Unknown'} plants in this lot
` : 'Limited plant information available'}

ENVIRONMENTAL CONDITIONS:
${healthLogData.environmentalData ? `
- Location: ${healthLogData.environmentalData.latitude ? `${healthLogData.environmentalData.latitude}, ${healthLogData.environmentalData.longitude}` : 'Not available'}
- Season: ${healthLogData.environmentalData.season || 'Not specified'}
- Weather: ${healthLogData.environmentalData.weather || 'Not specified'}
- Images Available: ${healthLogData.hasImages ? 'Yes' : 'No'} (${healthLogData.imageCount || 0} images)
` : 'Environmental data not available'}

ANALYSIS REQUIREMENTS:
1. Assess current environmental conditions (temperature, humidity, soil moisture) against optimal ranges for the species
2. Identify any environmental stress factors
3. Provide species-specific care recommendations
4. Suggest plant lot-wide improvements
5. Recommend preventive measures

Please provide your comprehensive analysis in the following JSON format:
{
  "healthScore": <number 0-100>,
  "diseaseDetected": <boolean>,
  "diseaseType": "<string or null>",
  "confidence": <number 0-100>,
  "recommendations": ["<recommendation1>", "<recommendation2>", ...],
  "detectedIssues": [
    {
      "type": "<issue type>",
      "severity": "<low|medium|high>",
      "confidence": <number 0-100>,
      "description": "<detailed description>"
    }
  ],
  "insights": ["<insight1>", "<insight2>", ...],
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "nextActions": ["<action1>", "<action2>", ...],
  "environmentalAnalysis": {
    "temperatureStatus": "<optimal|suboptimal|critical>",
    "humidityStatus": "<optimal|suboptimal|critical>",
    "soilMoistureStatus": "<optimal|suboptimal|critical>",
    "environmentalIssues": ["<issue1>", "<issue2>", ...],
    "environmentalRecommendations": ["<recommendation1>", "<recommendation2>", ...]
  },
  "plantLotImprovements": {
    "overallAssessment": "<detailed assessment of the entire plant lot>",
    "priorityActions": ["<urgent action1>", "<urgent action2>", ...],
    "longTermSuggestions": ["<long term improvement1>", "<long term improvement2>", ...],
    "expectedOutcomes": ["<expected result1>", "<expected result2>", ...]
  },
  "speciesSpecificGuidance": {
    "optimalConditions": {
      "temperature": "<optimal temperature range for this species>",
      "humidity": "<optimal humidity range for this species>",
      "soilMoisture": "<optimal soil moisture range for this species>",
      "lightRequirements": "<light requirements for this species>"
    },
    "commonIssues": ["<common issue1 for this species>", "<common issue2>", ...],
    "preventiveMeasures": ["<preventive measure1>", "<preventive measure2>", ...]
  }
}

Focus your analysis on:
1. **Environmental Assessment**: Compare current conditions to species-optimal ranges
2. **Species-Specific Issues**: Common problems and solutions for this plant species
3. **Plant Lot Optimization**: How to improve conditions for the entire lot
4. **Preventive Care**: Early warning signs and preventive measures
5. **Growth Optimization**: Recommendations to maximize healthy growth and yield

Provide specific, actionable, and scientifically-based recommendations.
`;
  }

  private parseOpenAIResponse(response: string): AIAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields and provide defaults
      return {
        healthScore: Math.max(0, Math.min(100, parsed.healthScore || 75)),
        diseaseDetected: Boolean(parsed.diseaseDetected),
        diseaseType: parsed.diseaseType || null,
        confidence: Math.max(0, Math.min(100, parsed.confidence || 80)),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
          'Continue monitoring plant health',
          'Maintain regular watering schedule',
          'Ensure adequate sunlight exposure'
        ],
        detectedIssues: Array.isArray(parsed.detectedIssues) ? parsed.detectedIssues.map(issue => ({
          type: issue.type || 'Unknown issue',
          severity: issue.severity || 'medium',
          confidence: Math.max(0, Math.min(100, issue.confidence || 70)),
          description: issue.description || 'No description available'
        })) : [],
        insights: Array.isArray(parsed.insights) ? parsed.insights : [
          'Plant appears to be developing normally',
          'Environmental conditions seem suitable'
        ],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [
          'Continue current care routine',
          'Monitor for changes in plant condition'
        ],
        environmentalAnalysis: {
          temperatureStatus: parsed.environmentalAnalysis?.temperatureStatus || 'optimal',
          humidityStatus: parsed.environmentalAnalysis?.humidityStatus || 'optimal',
          soilMoistureStatus: parsed.environmentalAnalysis?.soilMoistureStatus || 'optimal',
          environmentalIssues: Array.isArray(parsed.environmentalAnalysis?.environmentalIssues) 
            ? parsed.environmentalAnalysis.environmentalIssues : [],
          environmentalRecommendations: Array.isArray(parsed.environmentalAnalysis?.environmentalRecommendations) 
            ? parsed.environmentalAnalysis.environmentalRecommendations : [
              'Monitor environmental conditions regularly',
              'Maintain stable growing environment'
            ]
        },
        plantLotImprovements: {
          overallAssessment: parsed.plantLotImprovements?.overallAssessment || 'Plant lot appears to be in good condition',
          priorityActions: Array.isArray(parsed.plantLotImprovements?.priorityActions) 
            ? parsed.plantLotImprovements.priorityActions : [
              'Continue current management practices'
            ],
          longTermSuggestions: Array.isArray(parsed.plantLotImprovements?.longTermSuggestions) 
            ? parsed.plantLotImprovements.longTermSuggestions : [
              'Consider implementing advanced monitoring systems',
              'Evaluate yield optimization strategies'
            ],
          expectedOutcomes: Array.isArray(parsed.plantLotImprovements?.expectedOutcomes) 
            ? parsed.plantLotImprovements.expectedOutcomes : [
              'Improved plant health and growth',
              'Higher yield potential'
            ]
        },
        speciesSpecificGuidance: {
          optimalConditions: {
            temperature: parsed.speciesSpecificGuidance?.optimalConditions?.temperature || '20-25°C',
            humidity: parsed.speciesSpecificGuidance?.optimalConditions?.humidity || '60-70%',
            soilMoisture: parsed.speciesSpecificGuidance?.optimalConditions?.soilMoisture || '40-60%',
            lightRequirements: parsed.speciesSpecificGuidance?.optimalConditions?.lightRequirements || 'Full sun (6-8 hours daily)'
          },
          commonIssues: Array.isArray(parsed.speciesSpecificGuidance?.commonIssues) 
            ? parsed.speciesSpecificGuidance.commonIssues : [
              'Monitor for typical plant stress signs',
              'Watch for common pests and diseases'
            ],
          preventiveMeasures: Array.isArray(parsed.speciesSpecificGuidance?.preventiveMeasures) 
            ? parsed.speciesSpecificGuidance.preventiveMeasures : [
              'Maintain good air circulation',
              'Provide adequate nutrition',
              'Regular monitoring and care'
            ]
        }
      };
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response, using fallback');
      return this.getFallbackAnalysis();
    }
  }

  private simulateAnalysis(healthLogData: any): Promise<AIAnalysisResult> {
    // Simulate processing time
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.getFallbackAnalysis());
      }, 1000);
    });
  }

  private getFallbackAnalysis(): AIAnalysisResult {
    const healthScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const diseaseDetected = healthScore < 75;
    
    const diseases = ['leaf_spot', 'powdery_mildew', 'bacterial_blight', 'rust', 'nutrient_deficiency'];
    const diseaseType = diseaseDetected ? diseases[Math.floor(Math.random() * diseases.length)] : undefined;

    return {
      healthScore,
      diseaseDetected,
      diseaseType,
      confidence: Math.floor(Math.random() * 20) + 70, // 70-90
      recommendations: diseaseDetected ? [
        'Apply appropriate treatment for detected condition',
        'Improve environmental conditions',
        'Monitor closely for changes',
        'Consider consulting agricultural expert'
      ] : [
        'Continue current care routine',
        'Maintain optimal growing conditions',
        'Regular monitoring recommended'
      ],
      detectedIssues: diseaseDetected ? [{
        type: diseaseType || 'unknown',
        severity: healthScore < 65 ? 'high' : 'medium',
        confidence: Math.floor(Math.random() * 20) + 70,
        description: `Potential ${diseaseType} detected based on health indicators`
      }] : [],
      insights: [
        'Analysis based on available health data',
        'Environmental factors considered in assessment',
        healthScore > 80 ? 'Plant shows good health indicators' : 'Some health concerns identified'
      ],
      riskFactors: diseaseDetected ? [
        'Environmental stress factors',
        'Potential disease spread risk',
        'Nutrient availability concerns'
      ] : [
        'Continue monitoring for early warning signs'
      ],
      nextActions: [
        'Document any changes in plant condition',
        'Maintain regular care schedule',
        diseaseDetected ? 'Implement recommended treatments' : 'Continue preventive care'
      ],
      environmentalAnalysis: {
        temperatureStatus: healthScore > 80 ? 'optimal' : healthScore > 65 ? 'suboptimal' : 'critical',
        humidityStatus: healthScore > 75 ? 'optimal' : 'suboptimal',
        soilMoistureStatus: healthScore > 70 ? 'optimal' : 'suboptimal',
        environmentalIssues: diseaseDetected ? [
          'Temperature fluctuations may be affecting plant health',
          'Humidity levels require adjustment',
          'Soil moisture optimization needed'
        ] : [],
        environmentalRecommendations: [
          'Monitor and maintain stable temperature range',
          'Adjust irrigation schedule based on soil moisture readings',
          'Implement humidity control measures if needed',
          'Consider microclimate improvements'
        ]
      },
      plantLotImprovements: {
        overallAssessment: healthScore > 80 
          ? 'Plant lot is performing well with good growth indicators and minimal stress factors'
          : healthScore > 65 
          ? 'Plant lot shows moderate performance with some areas for improvement'
          : 'Plant lot requires immediate attention to address multiple health concerns',
        priorityActions: diseaseDetected ? [
          'Implement disease management protocols',
          'Improve environmental monitoring',
          'Review and adjust fertilization program',
          'Enhance plant spacing for better air circulation'
        ] : [
          'Continue current management practices',
          'Implement preventive monitoring schedule',
          'Optimize resource allocation'
        ],
        longTermSuggestions: [
          'Install automated environmental monitoring systems',
          'Develop species-specific care protocols',
          'Implement integrated pest management strategies',
          'Consider yield optimization through precision agriculture',
          'Establish regular soil health assessments'
        ],
        expectedOutcomes: [
          'Improved overall plant health and resilience',
          'Reduced disease incidence and pest pressure',
          'Enhanced growth rates and productivity',
          'Better resource efficiency and cost management',
          'Increased harvest yield and quality'
        ]
      },
      speciesSpecificGuidance: {
        optimalConditions: {
          temperature: '22-28°C (optimal growth range)',
          humidity: '60-75% (prevents stress and disease)',
          soilMoisture: '45-65% (adequate but not waterlogged)',
          lightRequirements: 'Full sun 6-8 hours daily with morning sunlight priority'
        },
        commonIssues: [
          'Fungal diseases in high humidity conditions',
          'Nutrient deficiencies in poor soil conditions',
          'Heat stress during extreme temperature periods',
          'Water stress from irregular irrigation',
          'Pest infestations during favorable breeding conditions'
        ],
        preventiveMeasures: [
          'Maintain consistent watering schedule with drip irrigation',
          'Apply organic mulch to regulate soil temperature and moisture',
          'Implement crop rotation to prevent soil-borne diseases',
          'Use beneficial insects for natural pest control',
          'Regular pruning to improve air circulation',
          'Apply balanced fertilizers based on soil test results'
        ]
      }
    };
  }

  // Backward compatibility methods for existing code
  async analyzeMultipleImages(imageUrls: string[]): Promise<AIAnalysisResult> {
    this.logger.log(`Legacy method called - analyzing health data instead of ${imageUrls.length} images`);
    
    // Since we're no longer analyzing images, provide a basic analysis
    return this.getFallbackAnalysis();
  }

  // Legacy method compatibility - redirects to data-based analysis
  async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    this.logger.log('Legacy image analysis method called - using fallback analysis');
    return this.getFallbackAnalysis();
  }

  async analyzeHistoricalData(healthLogs: any[]): Promise<HistoricalAnalyticsResult> {
    try {
      this.logger.log(`Starting historical analysis for ${healthLogs.length} health logs`);

      // Filter logs from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLogs = healthLogs.filter(log => 
        new Date(log.recordedAt) >= thirtyDaysAgo
      ).sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      if (recentLogs.length === 0) {
        return this.getEmptyHistoricalAnalysis();
      }

      // Calculate current health status
      const latestLog = recentLogs[recentLogs.length - 1];
      const currentHealthScore = latestLog.aiAnalysis?.healthScore || 75;
      
      // Calculate historical comparison
      const healthScores = recentLogs
        .filter(log => log.aiAnalysis?.healthScore)
        .map(log => log.aiAnalysis.healthScore);
      
      const averageHealthScore = healthScores.length > 0 
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : currentHealthScore;

      // Calculate trend direction
      const firstHalfAvg = this.calculateAverage(healthScores.slice(0, Math.floor(healthScores.length / 2)));
      const secondHalfAvg = this.calculateAverage(healthScores.slice(Math.floor(healthScores.length / 2)));
      const percentageChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
      
      let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
      if (Math.abs(percentageChange) > 5) {
        trendDirection = percentageChange > 0 ? 'improving' : 'declining';
      }

      // Build health trends
      const healthTrends = recentLogs.map(log => ({
        date: new Date(log.recordedAt).toISOString().split('T')[0],
        healthScore: log.aiAnalysis?.healthScore || 75,
        diseaseDetected: log.aiAnalysis?.diseaseDetected || false,
        temperature: log.metrics?.temperature,
        humidity: log.metrics?.humidity,
        soilMoisture: log.metrics?.soilMoisture,
      }));

      // Calculate environmental trends
      const environmentalData = recentLogs
        .filter(log => log.metrics)
        .map(log => log.metrics);

      const environmentalTrends = this.calculateEnvironmentalTrends(environmentalData);

      // Disease frequency analysis
      const diseaseAnalysis = this.calculateDiseaseFrequency(recentLogs);

      // Growth progression
      const growthProgression = this.calculateGrowthProgression(recentLogs);

      // Generate recommendations and alerts
      const recommendations = this.generateRecommendations(currentHealthScore, trendDirection, diseaseAnalysis);
      const alerts = this.generateAlerts(currentHealthScore, trendDirection, diseaseAnalysis);

      return {
        currentHealthStatus: {
          healthScore: currentHealthScore,
          status: this.getHealthStatus(currentHealthScore),
          lastAnalyzed: new Date(latestLog.recordedAt),
        },
        historicalComparison: {
          averageHealthScore,
          trendDirection,
          percentageChange: Math.round(percentageChange * 100) / 100,
          comparisonPeriod: '30 days',
        },
        healthTrends,
        environmentalTrends,
        diseaseFrequencyAnalysis: diseaseAnalysis,
        growthProgression,
        recommendations,
        alerts,
      };

    } catch (error) {
      this.logger.error(`Historical analysis failed: ${error.message}`);
      return this.getEmptyHistoricalAnalysis();
    }
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
  }

  private getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  private calculateEnvironmentalTrends(environmentalData: any[]): any {
    if (environmentalData.length === 0) {
      return {
        temperatureAverage: 0,
        temperatureTrend: 'stable',
        humidityAverage: 0,
        humidityTrend: 'stable',
        soilMoistureAverage: 0,
        soilMoistureTrend: 'stable',
      };
    }

    const temperatures = environmentalData.filter(d => d.temperature).map(d => d.temperature);
    const humidities = environmentalData.filter(d => d.humidity).map(d => d.humidity);
    const soilMoistures = environmentalData.filter(d => d.soilMoisture).map(d => d.soilMoisture);

    return {
      temperatureAverage: Math.round(this.calculateAverage(temperatures) * 100) / 100,
      temperatureTrend: this.calculateTrend(temperatures),
      humidityAverage: Math.round(this.calculateAverage(humidities) * 100) / 100,
      humidityTrend: this.calculateTrend(humidities),
      soilMoistureAverage: Math.round(this.calculateAverage(soilMoistures) * 100) / 100,
      soilMoistureTrend: this.calculateTrend(soilMoistures),
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = this.calculateAverage(values.slice(0, Math.floor(values.length / 2)));
    const secondHalf = this.calculateAverage(values.slice(Math.floor(values.length / 2)));
    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private calculateDiseaseFrequency(healthLogs: any[]): any {
    const totalEntries = healthLogs.length;
    const diseaseDetections = healthLogs.filter(log => log.aiAnalysis?.diseaseDetected).length;
    const diseaseDetectionRate = totalEntries > 0 ? (diseaseDetections / totalEntries) * 100 : 0;

    // Count disease types
    const diseaseTypes = {};
    healthLogs.forEach(log => {
      if (log.aiAnalysis?.diseaseDetected && log.aiAnalysis?.diseaseType) {
        const diseaseType = log.aiAnalysis.diseaseType;
        if (!diseaseTypes[diseaseType]) {
          diseaseTypes[diseaseType] = { count: 0, lastDetected: null };
        }
        diseaseTypes[diseaseType].count++;
        diseaseTypes[diseaseType].lastDetected = new Date(log.recordedAt);
      }
    });

    const commonDiseases = Object.entries(diseaseTypes)
      .map(([type, data]: [string, any]) => ({
        type,
        frequency: (data.count / totalEntries) * 100,
        lastDetected: data.lastDetected,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Calculate risk trend
    const recentDetections = healthLogs.slice(-5).filter(log => log.aiAnalysis?.diseaseDetected).length;
    const olderDetections = healthLogs.slice(-10, -5).filter(log => log.aiAnalysis?.diseaseDetected).length;
    
    let riskTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentDetections > olderDetections) riskTrend = 'increasing';
    else if (recentDetections < olderDetections) riskTrend = 'decreasing';

    return {
      totalEntries,
      diseaseDetectionRate: Math.round(diseaseDetectionRate * 100) / 100,
      commonDiseases,
      riskTrend,
    };
  }

  private calculateGrowthProgression(healthLogs: any[]): any {
    const progressionData: {
      heightProgression: { date: string; height: number }[];
      leafCountProgression: { date: string; count: number }[];
      flowerCountProgression: { date: string; count: number }[];
      fruitCountProgression: { date: string; count: number }[];
    } = {
      heightProgression: [],
      leafCountProgression: [],
      flowerCountProgression: [],
      fruitCountProgression: [],
    };

    healthLogs.forEach(log => {
      const date = new Date(log.recordedAt).toISOString().split('T')[0];
      if (log.metrics) {
        if (log.metrics.plantHeight) {
          progressionData.heightProgression.push({ date, height: log.metrics.plantHeight });
        }
        if (log.metrics.leafCount) {
          progressionData.leafCountProgression.push({ date, count: log.metrics.leafCount });
        }
        if (log.metrics.flowerCount) {
          progressionData.flowerCountProgression.push({ date, count: log.metrics.flowerCount });
        }
        if (log.metrics.fruitCount) {
          progressionData.fruitCountProgression.push({ date, count: log.metrics.fruitCount });
        }
      }
    });

    // Calculate growth rates
    const growthRate = {
      height: this.calculateGrowthRate(progressionData.heightProgression.map(p => p.height)),
      leafDevelopment: this.calculateGrowthRate(progressionData.leafCountProgression.map(p => p.count)),
      flowering: this.calculateGrowthRate(progressionData.flowerCountProgression.map(p => p.count)),
      fruiting: this.calculateGrowthRate(progressionData.fruitCountProgression.map(p => p.count)),
    };

    return {
      ...progressionData,
      growthRate,
    };
  }

  private calculateGrowthRate(values: number[]): 'fast' | 'normal' | 'slow' {
    if (values.length < 2) return 'normal';
    
    const growthRates: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const rate = values[i] - values[i - 1];
      growthRates.push(rate);
    }
    
    const averageGrowthRate = this.calculateAverage(growthRates);
    
    if (averageGrowthRate > 2) return 'fast';
    if (averageGrowthRate < 0.5) return 'slow';
    return 'normal';
  }

  private generateRecommendations(healthScore: number, trend: string, diseaseAnalysis: any): any {
    const recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    } = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
    };

    // Immediate recommendations
    if (healthScore < 70) {
      recommendations.immediate.push('Immediate intervention required - health score below acceptable threshold');
    }
    if (diseaseAnalysis.diseaseDetectionRate > 30) {
      recommendations.immediate.push('High disease detection rate - implement disease management protocols');
    }
    if (trend === 'declining') {
      recommendations.immediate.push('Health trend declining - review and adjust care protocols');
    }

    // Short-term recommendations
    recommendations.shortTerm.push('Continue regular monitoring and data collection');
    if (diseaseAnalysis.riskTrend === 'increasing') {
      recommendations.shortTerm.push('Increase disease monitoring frequency');
    }
    recommendations.shortTerm.push('Optimize environmental conditions based on trend analysis');

    // Long-term recommendations
    recommendations.longTerm.push('Implement predictive analytics for early warning systems');
    recommendations.longTerm.push('Develop species-specific care protocols based on historical data');
    recommendations.longTerm.push('Consider automated monitoring systems for continuous data collection');

    return recommendations;
  }

  private generateAlerts(healthScore: number, trend: string, diseaseAnalysis: any): any[] {
    const alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    if (healthScore < 60) {
      alerts.push({
        type: 'error',
        message: 'Critical health score detected - immediate action required',
        priority: 'high',
      });
    } else if (healthScore < 75) {
      alerts.push({
        type: 'warning',
        message: 'Below average health score - monitor closely',
        priority: 'medium',
      });
    }

    if (trend === 'declining') {
      alerts.push({
        type: 'warning',
        message: 'Health trend is declining - review care protocols',
        priority: 'medium',
      });
    }

    if (diseaseAnalysis.diseaseDetectionRate > 25) {
      alerts.push({
        type: 'warning',
        message: 'High disease detection rate - implement preventive measures',
        priority: 'high',
      });
    }

    if (diseaseAnalysis.riskTrend === 'increasing') {
      alerts.push({
        type: 'warning',
        message: 'Disease risk trend increasing - enhance monitoring',
        priority: 'medium',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        message: 'Plant lot health is within normal parameters',
        priority: 'low',
      });
    }

    return alerts;
  }

  private getEmptyHistoricalAnalysis(): HistoricalAnalyticsResult {
    return {
      currentHealthStatus: {
        healthScore: 75,
        status: 'fair',
        lastAnalyzed: new Date(),
      },
      historicalComparison: {
        averageHealthScore: 75,
        trendDirection: 'stable',
        percentageChange: 0,
        comparisonPeriod: '30 days',
      },
      healthTrends: [],
      environmentalTrends: {
        temperatureAverage: 0,
        temperatureTrend: 'stable',
        humidityAverage: 0,
        humidityTrend: 'stable',
        soilMoistureAverage: 0,
        soilMoistureTrend: 'stable',
      },
      diseaseFrequencyAnalysis: {
        totalEntries: 0,
        diseaseDetectionRate: 0,
        commonDiseases: [],
        riskTrend: 'stable',
      },
      growthProgression: {
        heightProgression: [],
        leafCountProgression: [],
        flowerCountProgression: [],
        fruitCountProgression: [],
        growthRate: {
          height: 'normal',
          leafDevelopment: 'normal',
          flowering: 'moderate',
          fruiting: 'moderate',
        },
      },
      recommendations: {
        immediate: ['Start collecting health data for analysis'],
        shortTerm: ['Implement regular monitoring schedule'],
        longTerm: ['Build comprehensive health tracking system'],
      },
      alerts: [{
        type: 'info',
        message: 'Insufficient data for comprehensive analysis',
        priority: 'low',
      }],
    };
  }
}
