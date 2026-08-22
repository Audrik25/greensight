import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const ANALYSIS_PROMPT = (crop) => `You are GreenSight, an advanced precision agriculture analysis system. Analyze the provided field image from a ${crop || 'crop'} field to assess grass/canopy health and detect any issues.

Assess these grass/canopy health indicators (0-100 each):
- color_health: how vibrant and healthy the crop/grass color appears (100 = ideal green, 0 = discolored/brown)
- density: how dense and full the canopy coverage appears (100 = full coverage, 0 = bare/sparse)
- growth: apparent growth vigor relative to expected stage (100 = vigorous, 0 = stunted)
- stress: visible stress level from disease/drought/nutrient issues (100 = severe stress, 0 = none)

Also detect any issues present. For each issue, provide:
1. type: exactly one of "disease", "weed", "soil_condition", "pest", "water_stress", "nutrient_deficiency"
2. label: specific name (e.g., "Early blight", "Pigweed growth")
3. confidence: 0-100
4. severity: exactly one of "low", "medium", "high", "critical"
5. affected_area: 0-100 (approximate percentage of field area affected)
6. zone: location description (e.g., "center", "scattered throughout")
7. description: 1-2 sentences
8. recommendation: specific, actionable recommendation. Treat ONLY the affected area, not the entire field.
9. priority: exactly one of "low", "medium", "high", "urgent"
10. action_type: exactly one of "targeted_treatment", "monitor", "irrigate", "fertilize", "apply_fungicide", "apply_herbicide", "apply_pesticide", "improve_drainage", "remove_plants"

Also provide:
- health_score: 0-100 (overall field health, 100 = perfectly healthy)
- health_status: exactly one of "EXCELLENT", "GOOD", "MODERATE", "POOR", "CRITICAL"
- summary: 1-2 sentence summary of the field's condition

If the field appears healthy with no visible issues, return an empty detections array and a health_score of 90-100.
Base your analysis on what you can actually observe in the image.`;

function scoreToStatus(score) {
  if (score >= 85) return 'healthy';
  if (score >= 70) return 'monitor';
  if (score >= 50) return 'action_needed';
  return 'critical';
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { field_id, field_name, crop, image_url, source } = body;

    if (!field_id || !image_url) {
      return Response.json({ error: 'field_id and image_url are required' }, { status: 400 });
    }

    // Run the AI analysis on the captured image
    let result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: ANALYSIS_PROMPT(crop),
      file_urls: [image_url],
      response_json_schema: {
        type: "object",
        properties: {
          health_score: { type: "number" },
          health_status: { type: "string" },
          summary: { type: "string" },
          color_health: { type: "number" },
          density: { type: "number" },
          growth: { type: "number" },
          stress: { type: "number" },
          detections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                label: { type: "string" },
                confidence: { type: "number" },
                severity: { type: "string" },
                affected_area: { type: "number" },
                zone: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                priority: { type: "string" },
                action_type: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch { /* ignore */ }
    }

    // Create the scan record with grass indicators
    const healthScore = result.health_score ?? (result.detections?.length === 0 ? 95 : 70);
    const scan = await base44.asServiceRole.entities.Scan.create({
      field_id,
      field_name: field_name || 'Field',
      crop: crop || 'Crop',
      crop_image: image_url,
      status: 'completed',
      source: source || 'raspberry_pi',
      health_score: healthScore,
      health_status: result.health_status || 'GOOD',
      summary: result.summary || 'Auto-analysis from camera capture.',
      color_health: result.color_health ?? null,
      density: result.density ?? null,
      growth: result.growth ?? null,
      stress: result.stress ?? null,
      capture_timestamp: new Date().toISOString(),
    });

    // Create detection records
    const detectionData = (result.detections || []).map(det => ({
      scan_id: scan.id,
      field_id,
      type: det.type || 'disease',
      label: det.label || 'Unknown issue',
      confidence: det.confidence ?? 75,
      severity: det.severity || 'medium',
      affected_area: det.affected_area ?? 10,
      zone: det.zone || 'scattered',
      description: det.description || '',
    }));

    let detectionRecords = [];
    if (detectionData.length > 0) {
      detectionRecords = await base44.asServiceRole.entities.Detection.bulkCreate(detectionData);
    }

    // Create recommendation records
    if (detectionRecords.length > 0) {
      const recData = detectionRecords.map((det, i) => ({
        detection_id: det.id,
        scan_id: scan.id,
        field_id,
        recommendation: result.detections[i].recommendation || 'Monitor the affected area and treat if conditions worsen.',
        priority: result.detections[i].priority || 'medium',
        action_type: result.detections[i].action_type || 'monitor',
      }));
      await base44.asServiceRole.entities.Recommendation.bulkCreate(recData);
    }

    // Update the field's health score and status
    await base44.asServiceRole.entities.Field.update(field_id, {
      health_score: healthScore,
      status: scoreToStatus(healthScore),
    });

    return Response.json({
      success: true,
      scan_id: scan.id,
      health_score: healthScore,
      detection_count: detectionRecords.length,
      indicators: {
        color_health: result.color_health,
        density: result.density,
        growth: result.growth,
        stress: result.stress,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}