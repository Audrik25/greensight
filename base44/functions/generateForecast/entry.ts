import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fieldId = body.field_id || null;

    // Gather fields (single field or all)
    let fields;
    if (fieldId) {
      const f = await base44.entities.Field.get(fieldId);
      fields = [f];
    } else {
      fields = await base44.entities.Field.list("-updated_date", 100);
    }
    if (!fields || fields.length === 0) {
      return Response.json({ error: 'No fields found' }, { status: 400 });
    }

    // Gather per-field data: scan history, environmental data, detections
    const fieldData = [];
    for (const field of fields) {
      const scans = await base44.entities.Scan.filter({ field_id: field.id }, "-capture_timestamp", 20);
      const envRecords = await base44.entities.EnvironmentalData.filter({ field_id: field.id }, "-updated_date", 5);
      const detections = await base44.entities.Detection.filter({ field_id: field.id });
      fieldData.push({
        field,
        scans,
        latestEnv: envRecords[0] || null,
        envHistory: envRecords,
        detections
      });
    }

    // Build context for AI
    const today = new Date().toISOString().split('T')[0];
    const context = fieldData.map(fd => {
      const f = fd.field;
      const scanHistory = fd.scans.map(s =>
        `  - ${s.capture_timestamp || s.created_date || 'unknown'}: health ${s.health_score ?? 'N/A'}/100, status ${s.health_status || 'N/A'}, ${s.summary || ''}`
      ).join('\n');
      const env = fd.latestEnv
        ? `Temp: ${fd.latestEnv.temperature ?? 'N/A'}°C, Humidity: ${fd.latestEnv.humidity ?? 'N/A'}%, Precip: ${fd.latestEnv.precipitation ?? 'N/A'}mm, Rain prob: ${fd.latestEnv.rain_probability_percent ?? 'N/A'}%, Wind: ${fd.latestEnv.wind_speed ?? 'N/A'}km/h, Soil moist (0-1cm): ${fd.latestEnv.soil_moisture_0_to_1cm ?? 'N/A'}, Soil temp: ${fd.latestEnv.soil_temperature_0cm_c ?? 'N/A'}°C, Leaf wetness prob: ${fd.latestEnv.leaf_wetness_probability_percent ?? 'N/A'}%, Cloud cover: ${fd.latestEnv.cloud_cover_percent ?? 'N/A'}%`
        : 'No environmental data';
      const activeDetections = fd.detections.map(d => `${d.label} [${d.type}, ${d.severity}]`).join(', ') || 'None';

      return `FIELD: ${f.name} (crop: ${f.crop || 'N/A'}, size: ${f.size} ${f.size_unit || 'acres'}, growth stage: ${f.growth_stage || 'N/A'})
Current health: ${f.health_score ?? 'N/A'}/100, status: ${f.status}
Scan history (most recent first):
${scanHistory || '  No scans yet'}
Current environmental: ${env}
Active detections: ${activeDetections}`;
    }).join('\n\n');

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are GreenSight's forecasting engine. Analyze the farm data below and generate a 14-day forecast predicting what the farmer is likely to encounter next. The goal is early warning — "What am I likely to encounter next?"

FARM DATA:
${context}

Today is ${today}. Generate a comprehensive forecast. Return a JSON object with this EXACT structure:

{
  "summary": "2-3 sentence AI-generated summary of the overall forecast and what to watch for",
  "overall_predicted_health": number (0-100, predicted average farm health over next 7 days),
  "overall_confidence": "High" | "Medium" | "Low",
  "trend": "improving" | "stable" | "slight_decline" | "declining",
  "daily_forecasts": [14 entries, one per day starting tomorrow, each with:
    {
      "day": 1-14,
      "date": "YYYY-MM-DD",
      "health_score": number 0-100,
      "soil_moisture": number 0-100 (percent),
      "disease_risk": number 0-100,
      "weed_risk": number 0-100,
      "pest_risk": number 0-100,
      "crop_stress": number 0-100
    }
  ],
  "risks": [
    {
      "field": "field name",
      "type": one of "low_moisture", "disease", "weeds", "pests", "heat_stress", "excess_moisture", "declining_health",
      "timeframe": "e.g. 'Days 3-7' or 'Within 2 weeks'",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": "High" | "Medium" | "Low",
      "probability": number 0-100,
      "description": "1-2 sentence explanation of why this risk is predicted"
    }
  ],
  "historical_patterns": [
    "insight comparing current conditions to past patterns from scan history"
  ],
  "weather_impact": "2-3 sentence analysis of how current and likely weather will affect the fields",
  "recommended_actions": [
    {
      "action": "specific action to take",
      "field": "field name",
      "priority": "low" | "medium" | "high" | "urgent",
      "reason": "why this action is recommended based on the forecast",
      "timing": "when to do it"
    }
  ]
}

RULES:
- Base predictions on the actual data provided — field names, health scores, scan history, environmental conditions, and active detections.
- Use scan history to identify trends (improving, stable, declining) and project them forward.
- Factor environmental conditions into risk predictions: high humidity + leaf wetness → higher disease risk; low precipitation → lower soil moisture → low_moisture risk; high temperature → heat_stress; heavy precipitation → excess_moisture.
- Confidence "High" only when there is strong historical data and clear patterns. Use "Medium" or "Low" when data is limited.
- Never present predictions as guaranteed — they are forecasts.
- Generate exactly 14 daily_forecasts entries.
- Identify at least 2-5 risks across the farm.
- Provide 3-6 recommended actions.
- Reference actual field names throughout.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          overall_predicted_health: { type: "number" },
          overall_confidence: { type: "string" },
          trend: { type: "string" },
          daily_forecasts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                date: { type: "string" },
                health_score: { type: "number" },
                soil_moisture: { type: "number" },
                disease_risk: { type: "number" },
                weed_risk: { type: "number" },
                pest_risk: { type: "number" },
                crop_stress: { type: "number" }
              }
            }
          },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                type: { type: "string" },
                timeframe: { type: "string" },
                severity: { type: "string" },
                confidence: { type: "string" },
                probability: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          historical_patterns: {
            type: "array",
            items: { type: "string" }
          },
          weather_impact: { type: "string" },
          recommended_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                field: { type: "string" },
                priority: { type: "string" },
                reason: { type: "string" },
                timing: { type: "string" }
              }
            }
          }
        }
      }
    });

    let forecast = aiResult;
    if (typeof forecast === 'string') {
      try { forecast = JSON.parse(forecast); } catch { /* ignore */ }
    }

    return Response.json({
      success: true,
      forecast,
      fieldCount: fields.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}