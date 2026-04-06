import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatHistory } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { PaperPlaneTilt } from '@phosphor-icons/react';
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
    <div className="max-w-5xl mx-auto" data-testid="chat-page">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          AI Loan Assistant
        </h1>
        <p className="text-muted-foreground text-lg">
          Your personal banking advisor powered by AI
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)' }} data-testid="chat-card">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
                    alt="AI Assistant"
                    className="w-12 h-12"
                  />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">Welcome, {user?.name}!</p>
                <p className="text-muted-foreground">I'm your AI loan officer. Ask me anything about loans, eligibility, EMI calculations, or apply for a new loan.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`chat-message-${idx}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-muted border border-border'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <img 
                        src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
                        alt="AI"
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Officer</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.message}</p>
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-100' : 'text-muted-foreground'}`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-muted/30">
          <form onSubmit={handleSend} className="flex gap-2" data-testid="chat-input-form">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              data-testid="chat-input"
              className="flex-1 h-12 bg-background"
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              data-testid="chat-send-button"
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 h-12 rounded-xl"
            >
              <PaperPlaneTilt weight="fill" className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Ask about loan eligibility, EMI calculations, or negotiate your loan terms
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
