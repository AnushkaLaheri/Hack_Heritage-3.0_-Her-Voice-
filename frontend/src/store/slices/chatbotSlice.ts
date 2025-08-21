import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

export interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  content: string;
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

export const sendMessage = createAsyncThunk<{ answer: string }, string>(
  'chatbot/sendMessage',
  async (question: string) => {
    const response = await api.post('/ask', { question });
    return response.data;
  }
);

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    clearMessages: (state) => { state.messages = []; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const now = Date.now();
        // user message
        state.messages.push({
          id: now,
          role: 'user',
          content: action.meta.arg,
          created_at: new Date().toISOString(),
        });
        // bot reply
        state.messages.push({
          id: now + 1,
          role: 'bot',
          content: action.payload.answer,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to send message';
      });
  },
});

export const { clearMessages, clearError } = chatbotSlice.actions;
export default chatbotSlice.reducer;