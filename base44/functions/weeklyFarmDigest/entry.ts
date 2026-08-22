import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Determine recipients:
    // - Manual run by a signed-in user → email just that user.
    // - Scheduled background run (no user session) → email every registered user.
    let recipients = [];
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (e) {
      // No user session — scheduled run.
    }

    if (currentUser && currentUser.email) {
      recipients = [currentUser];
    } else {
      const allUsers = await base44.asServiceRole.entities.User.list();
      recipients = (allUsers || []).filter(u => u.email);
    }

    if (recipients.length === 0) {
      return Response.json({ error: 'No registered users to send the digest to.' }, { status: 400 });
    }

    // ── Gather farm data (service role reads all fields) ──
    const fields = await base44.asServiceRole.entities.Field.list("-updated_date", 100);
    if (fields.length === 0) {
      return Response.json({ error: 'No fields found.' }, { status: 400 });
    }

    const fieldData = [];
    for (const field of fields) {
      const scans = await base44.asServiceRole.entities.Scan.filter({ field_id: field.id }, "-capture_timestamp", 1);
      const latestScan = scans[0] || null;

      let detections = [];
      if (latestScan) {
        detections = await base44.asServiceRole.entities.Detection.filter({ scan_id: latestScan.id });
      }

      const envRecords = await base44.asServiceRole.entities.EnvironmentalData.filter({ field_id: field.id }, "-updated_date", 1);
      const latestEnv = envRecords[0] || null;

      const recommendations = await base44.asServiceRole.entities.Recommendation.filter({ field_id: field.id });

      fieldData.push({ field, latestScan, detections, latestEnv, recommendations });
    }

    // ── Build a data summary for the AI ──
    const dataSummary = fieldData.map(fd => {
      const f = fd.field;
      const s = fd.latestScan;
      return `FIELD: ${f.name}
  Crop: ${f.crop || 'N/A'}
  Health Score: ${f.health_score ?? 'N/A'} / 100
  Status: ${f.status || 'N/A'}
  Size: ${f.size ?? 'N/A'} ${f.size_unit || 'acres'}
  Growth Stage: ${f.growth_stage || 'N/A'}
  Latest Scan: ${s ? `health ${s.health_score ?? 'N/A'}/100, status ${s.health_status || 'N/A'}, summary: ${s.summary || 'N/A'}` : 'No scans yet'}
  Active Detections: ${fd.detections.length > 0 ? fd.detections.map(d => `${d.label} [${d.type}, ${d.severity}, ${d.confidence ?? 0}% confidence, ${d.affected_area ?? 0}% area]`).join('; ') : 'None'}
  Environmental: ${fd.latestEnv ? `${fd.latestEnv.temperature ?? 'N/A'}°C, ${fd.latestEnv.humidity ?? 'N/A'}% humidity, ${fd.latestEnv.precipitation ?? 'N/A'}mm precip, conditions: ${fd.latestEnv.conditions || 'N/A'}` : 'No data'}
  Open Recommendations: ${fd.recommendations.length > 0 ? fd.recommendations.map(r => `${r.recommendation} [priority: ${r.priority}]`).join('; ') : 'None'}`;
    }).join('\n\n');

    // ── AI generates the digest ──
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are GreenSight, generating a Weekly Farm Health Digest email for a farmer. Based on the data below, write a clear, actionable weekly digest.

FARM DATA:
${dataSummary}

Write the digest with exactly these four sections. Use ALL CAPS for each section header on its own line, followed by the content:

OVERALL FARM HEALTH SUMMARY
One short paragraph summarizing the farm's overall condition this week.

KEY CHANGES & HIGHLIGHTS
A bullet list (use "- " prefix) of the most important findings from the latest scans — new issues, fields that need attention, notable environmental conditions.

RISKS & ISSUES NEEDING ATTENTION
A bullet list (use "- " prefix) of the most urgent risks, ordered by severity. Reference the specific field name and detection label for each.

RECOMMENDED ACTIONS THIS WEEK
A numbered list ("1. ", "2. ", etc.) of concrete actions to take this week, each with the field name and exactly what to do.

Be specific — reference actual field names, health scores, and detection labels from the data. Keep it practical and concise. Use plain text only, no markdown symbols except the bullet/number prefixes specified above.`,
      response_json_schema: {
        type: "object",
        properties: {
          digest: { type: "string" }
        }
      }
    });

    let digestText = aiResult.digest || (typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult));

    // ── Build HTML email ──
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const safeDigest = digestText.replace(/</g, '&lt;');

    const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0e1116; color: #e8eaed; padding: 32px; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 28px; border-bottom: 1px solid #252a33; padding-bottom: 20px;">
    <h1 style="color: #4ec285; font-size: 22px; margin: 0 0 6px;">🌾 GreenSight</h1>
    <p style="color: #9aa3af; font-size: 13px; margin: 0;">Weekly Farm Health Digest — ${dateStr}</p>
  </div>
  <div style="background: #161a21; border: 1px solid #252a33; border-radius: 12px; padding: 24px; white-space: pre-wrap; font-size: 14px; line-height: 1.65; color: #e8eaed;">${safeDigest}</div>
  <p style="color: #6b7480; font-size: 11px; text-align: center; margin-top: 24px;">You received this digest because you're registered for GreenSight. Log in to your dashboard for full details.</p>
</div>`;

    const subject = `🌾 FieldSight Weekly Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // ── Send to each recipient ──
    const sendResults = [];
    for (const user of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body: htmlBody
        });
        sendResults.push({ email: user.email, status: 'sent' });
      } catch (e) {
        sendResults.push({ email: user.email, status: 'failed', error: e.message });
      }
    }

    return Response.json({
      success: true,
      recipients: sendResults,
      fieldCount: fields.length,
      digestPreview: digestText.slice(0, 200)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}