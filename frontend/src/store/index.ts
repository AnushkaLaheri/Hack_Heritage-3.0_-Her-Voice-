import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import chatbotReducer from './slices/chatbotSlice';
import emergencyReducer from './slices/emergencySlice';
import equalityReducer from './slices/equalitySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    chatbot: chatbotReducer,
    emergency: emergencyReducer,
    equality: equalityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
