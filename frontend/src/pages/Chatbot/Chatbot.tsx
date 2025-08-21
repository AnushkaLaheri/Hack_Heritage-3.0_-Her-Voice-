import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, IconButton, List, ListItem, CircularProgress, Avatar 
} from '@mui/material';
import { Support, Send, SmartToy, Person } from '@mui/icons-material';
import api from "../../api/axios";

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  content: string;
  created_at: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ask', { question: text });
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: res.data.answer,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'bot',
        content: '⚠ Error: Could not reach server.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
        <Support sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>AI Safety Assistant</Typography>
        <Typography variant="body1" color="text.secondary">
          Ask about women schemes, policies, or just chat with AI.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, height: 400, overflowY: 'auto', mb: 2 }}>
        <List>
          {messages.map(msg => (
            <ListItem key={msg.id} sx={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper sx={{
                p: 1,
                maxWidth: '80%',
                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.200',
                color: 'text.primary',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
              }}>
                <Avatar sx={{ mr: 1, bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main', width: 32, height: 32 }}>
                  {msg.role === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Typography variant="body2">{msg.content}</Typography>
              </Paper>
            </ListItem>
          ))}
          {loading && (
            <ListItem>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">AI is typing...</Typography>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <IconButton color="primary" onClick={() => sendMessage(input)}>
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chatbot;