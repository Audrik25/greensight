import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Plus } from "lucide-react";
import MessageBubble from "@/components/consultant/MessageBubble";
import ChatInput from "@/components/consultant/ChatInput";
import ConversationSidebar from "@/components/consultant/ConversationSidebar";
import WelcomeState from "@/components/consultant/WelcomeState";

const AGENT_NAME = "farm_consultant";

export default function FarmConsultant() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        if (cancelled) return;
        setConversations(convos);
        if (convos.length > 0) {
          setActiveConversationId(convos[0].id);
        } else {
          const convo = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "New Consultation" },
          });
          if (cancelled) return;
          setConversations([convo]);
          setActiveConversationId(convo.id);
        }
      } catch (e) {
        console.error("Failed to initialize conversations", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const unsubscribe = base44.agents.subscribeToConversation(activeConversationId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    const convo = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: "New Consultation" },
    });
    setConversations(prev => [convo, ...prev]);
    setActiveConversationId(convo.id);
  };

  const handleSend = async (text) => {
    if (!activeConversationId) return;
    let convo = conversations.find(c => c.id === activeConversationId);
    if (!convo) {
      convo = await base44.agents.getConversation(activeConversationId);
    }
    if (!convo) return;

    if (messages.length === 0) {
      const name = text.length > 40 ? text.slice(0, 40) + '...' : text;
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, metadata: { ...c.metadata, name } } : c));
    }

    await base44.agents.addMessage(convo, { role: "user", content: text });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="fs-spin" style={{ width: 32, height: 32, border: '3px solid #252a33', borderTopColor: '#3da970', borderRadius: '50%' }} />
      </div>
    );
  }

  const isThinking = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="flex flex-col md:flex-row" style={{ height: 'calc(100vh - 80px)', gap: 16, maxWidth: 1240, margin: '0 auto' }}>
      {/* Sidebar */}
      <div className="fs-card hidden md:block" style={{ width: 280, padding: 16, flexShrink: 0 }}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={handleNewConversation}
        />
      </div>

      {/* Chat area */}
      <div className="fs-card flex flex-col" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Header */}
        <div className="flex items-center" style={{ padding: '14px 20px', borderBottom: '1px solid #252a33', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2d8a5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>FieldSight Consultant</h2>
            <p style={{ fontSize: 12, color: '#6b7480', margin: 0 }}>AI precision farming advisor</p>
          </div>
          <button onClick={handleNewConversation} className="md:hidden fs-btn-ghost" style={{ padding: '8px 12px' }}>
            <Plus style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, minHeight: 0 }}>
          {messages.length === 0 ? (
            <WelcomeState onPrompt={handleSend} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isThinking && (
                <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2d8a5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot style={{ width: 18, height: 18, color: '#fff' }} />
                  </div>
                  <div className="fs-card flex items-center" style={{ padding: '12px 16px', gap: 5 }}>
                    <span className="fs-typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ec285', display: 'inline-block' }} />
                    <span className="fs-typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ec285', display: 'inline-block', animationDelay: '0.15s' }} />
                    <span className="fs-typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ec285', display: 'inline-block', animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isThinking} />
      </div>
    </div>
  );
}