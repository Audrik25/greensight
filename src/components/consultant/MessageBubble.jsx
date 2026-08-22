import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import ToolCallDisplay from "./ToolCallDisplay";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className="flex" style={{ gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2d8a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {message.content && (
          isUser ? (
            <div style={{ background: '#16261c', border: '1px solid #353b45', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#e8eaed', lineHeight: 1.5 }}>
              {message.content}
            </div>
          ) : (
            <div className="fs-card fs-markdown" style={{ padding: '14px 16px' }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )
        )}
        {message.tool_calls?.map((tc, i) => (
          <ToolCallDisplay key={i} toolCall={tc} />
        ))}
      </div>
      {isUser && (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User style={{ width: 18, height: 18, color: '#9aa3af' }} />
        </div>
      )}
    </div>
  );
}