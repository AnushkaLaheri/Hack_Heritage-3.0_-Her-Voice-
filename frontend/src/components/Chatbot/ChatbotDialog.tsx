import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close,
  Send,
  SmartToy,
  Person,
  Support,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { sendMessage, fetchChatHistory } from '../../store/slices/chatbotSlice';

interface ChatbotDialogProps {
  open: boolean;
  onClose: () => void;
}

const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onClose }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading } = useSelector((state: RootState) => state.chatbot);

  useEffect(() => {
    if (open) {
      dispatch(fetchChatHistory());
    }
  }, [open, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      await dispatch(sendMessage(message.trim()));
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'What are my legal rights at work?',
    'How to report harassment?',
    'Government schemes for women',
    'Emergency contacts',
    'Self-defense tips',
  ];

  const handleQuickQuestion = (question: string) => {
    dispatch(sendMessage(question));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center' }}>
        <Support sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          AI Safety Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          • 24/7 Available
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Welcome to your AI Safety Assistant!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  I'm here to help you with legal advice, safety information, and emergency guidance.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Quick Questions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {quickQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      onClick={() => handleQuickQuestion(question)}
                      variant="outlined"
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <List>
                {messages.map((msg, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      flexDirection: 'column',
                      alignItems: msg.message ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        maxWidth: '70%',
                        flexDirection: msg.message ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: msg.message ? 'primary.main' : 'secondary.main',
                          mr: msg.message ? 0 : 1,
                          ml: msg.message ? 1 : 0,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {msg.message ? <Person /> : <SmartToy />}
                      </Avatar>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: msg.message ? 'primary.main' : 'grey.100',
                          color: msg.message ? 'white' : 'text.primary',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">
                          {msg.message || msg.response}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            opacity: 0.7,
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  </ListItem>
                ))}
                {loading && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 1, width: 32, height: 32 }}>
                        <SmartToy />
                      </Avatar>
                      <CircularProgress size={20} />
                    </Box>
                  </ListItem>
                )}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ask me anything about women's rights, safety, or legal advice..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                sx={{ borderRadius: 3, minWidth: 60 }}
              >
                <Send />
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotDialog;
