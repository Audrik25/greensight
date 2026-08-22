import React from "react";
import { Plus, MessageSquare } from "lucide-react";

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <button onClick={onNew} className="fs-btn-primary" style={{ marginBottom: 12, width: '100%', justifyContent: 'center' }}>
        <Plus style={{ width: 16, height: 16 }} />
        New Consultation
      </button>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {conversations.length === 0 ? (
          <p style={{ fontSize: 12, color: '#6b7480', textAlign: 'center', padding: 20 }}>No conversations yet</p>
        ) : (
          conversations.map(convo => {
            const isActive = convo.id === activeId;
            const name = convo.metadata?.name || 'New Consultation';
            return (
              <button
                key={convo.id}
                onClick={() => onSelect(convo.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 10, border: '1px solid', borderColor: isActive ? '#3da970' : 'transparent',
                  background: isActive ? '#16261c' : 'transparent', cursor: 'pointer',
                  textAlign: 'left', width: '100%', transition: 'all 0.15s ease',
                }}
              >
                <MessageSquare style={{ width: 14, height: 14, color: isActive ? '#3da970' : '#6b7480', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? '#2d8a5a' : '#9aa3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}