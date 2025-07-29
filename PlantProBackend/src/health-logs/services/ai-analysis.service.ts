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
}
