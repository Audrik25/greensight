import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex" style={{ gap: 10, alignItems: 'flex-end', padding: '16px 20px', background: '#161a21', borderTop: '1px solid #252a33', borderRadius: '0 0 14px 14px', flexShrink: 0 }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your fields, detections, treatments..."
        rows={1}
        style={{
          flex: 1, resize: 'none', border: '1px solid #252a33', borderRadius: 10,
          padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#e8eaed',
          outline: 'none', background: '#1c2129', lineHeight: 1.5, maxHeight: 120,
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          width: 42, height: 42, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: text.trim() && !disabled ? '#2d8a5a' : '#353b45',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s ease',
        }}
      >
        <Send style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}