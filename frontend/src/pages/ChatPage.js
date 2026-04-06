import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatHistory } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { PaperPlaneTilt, Robot } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const { data } = await getChatHistory();
      setMessages(data.history || []);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message immediately
    const userMsg = {
      role: 'user',
      message: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await sendChatMessage(userMessage);
      const assistantMsg = {
        role: 'assistant',
        message: data.message,
        created_at: data.timestamp
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Failed to send message');
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)]" data-testid="chat-page">
      <div className="mb-6">
        <h1 className="text-4xl font-heading font-light mb-2">
          AI Loan Assistant
        </h1>
        <p className="text-muted-foreground">
          Your personal banking advisor powered by AI
        </p>
      </div>

      <Card className="h-full flex flex-col" data-testid="chat-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
              alt="AI Assistant"
              className="w-8 h-8"
            />
            Virtual Loan Officer
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Robot className="w-16 h-16 mx-auto mb-4 text-primary" weight="duotone" />
                <p className="text-lg font-medium mb-2">Welcome, {user?.name}!</p>
                <p>I'm your AI loan officer. Ask me anything about loans, eligibility, EMI calculations, or apply for a new loan.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`chat-message-${idx}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground border border-border'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
                        alt="AI"
                        className="w-5 h-5"
                      />
                      <span className="text-xs font-medium uppercase tracking-wider">AI Officer</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSend} className="flex gap-2" data-testid="chat-input-form">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                data-testid="chat-input"
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={loading || !input.trim()}
                data-testid="chat-send-button"
              >
                <PaperPlaneTilt weight="fill" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Ask about loan eligibility, EMI calculations, or negotiate your loan terms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;