import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  created_at: string;
}

interface ChatbotState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatbotState = {
  messages: [],
  loading: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chatbot/sendMessage',
  async (message: string) => {
    const response = await api.post('/api/chatbot/query', { message });
    return response.data;
  }
);

export const fetchChatHistory = createAsyncThunk('chatbot/fetchHistory', async () => {
  const response = await api.get('/api/chatbot/history');
  return response.data;
});

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new message to the list
        state.messages.push({
          id: Date.now(),
          message: action.meta.arg,
          response: action.payload.response,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to send message';
      })
      // Fetch History
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.messages = action.payload.messages;
      });
  },
});

export const { clearError, clearMessages } = chatbotSlice.actions;
export default chatbotSlice.reducer;
