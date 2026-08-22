import React from "react";
import { Bot, Sparkles } from "lucide-react";

const PROMPTS = [
  "How are my fields doing overall?",
  "Which field needs the most attention right now?",
  "What treatments should I prioritize this week?",
  "Are there any critical detections I should worry about?",
];

export default function WelcomeState({ onPrompt }) {
  return (
    <div className="flex flex-col" style={{ alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#2d8a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Bot style={{ width: 32, height: 32, color: '#fff' }} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8eaed', marginBottom: 8 }}>Ask me anything about your farm</h2>
      <p style={{ fontSize: 14, color: '#9aa3af', marginBottom: 24, maxWidth: 400, lineHeight: 1.5 }}>
        I can analyze your field data, explain detections, recommend treatments, and help you prioritize actions.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10, maxWidth: 500, width: '100%' }}>
        {PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="fs-card fs-card-hover"
            style={{ padding: 14, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Sparkles style={{ width: 14, height: 14, color: '#4ec285', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#e8eaed', fontWeight: 500 }}>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}