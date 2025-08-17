import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Support } from '@mui/icons-material';
import ChatbotDialog from '../../components/Chatbot/ChatbotDialog';

const Chatbot: React.FC = () => {
  return (
    <Box>
      <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
        <Support sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          AI Safety Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get 24/7 legal advice, safety information, and emergency guidance from our AI assistant.
        </Typography>
      </Paper>
      
      <ChatbotDialog open={true} onClose={() => {}} />
    </Box>
  );
};

export default Chatbot;
