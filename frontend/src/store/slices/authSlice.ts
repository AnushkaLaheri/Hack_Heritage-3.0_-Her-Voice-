import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Preferences {
  notifications?: boolean;
  theme?: 'light' | 'dark';
  [key: string]: any;
}

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  phone?: string;
  location?: string;
  profile_image?: string | null;
  preferences?: Preferences;
  emergency_contacts?: EmergencyContact[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  successMessage?: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
  successMessage: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data as { access_token: string; user: User };
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    aadhaar?: string;
    pan?: string;
    phone?: string;
    location?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data as { message: string };
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (otpData: { email: string; otp: string }) => {
    const response = await api.post('/api/auth/verify-otp', otpData);
    return response.data as { success: boolean; message: string };
  }
);

export const getProfile = createAsyncThunk('auth/getProfile', async (_, { getState }) => {
  const { auth } = getState() as { auth: AuthState };
  const response = await api.get('/api/user/profile', {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  return response.data as User;
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data as { message: string };
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { token: string; new_password: string }) => {
    const response = await api.post(`/api/auth/reset-password/${data.token}`, { new_password: data.new_password });
    return response.data as { message: string };
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload: FormData | { username?: string; email?: string; role?: string; location?: string; phone?: string; profile_image?: string }, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.user) throw new Error('Not authenticated');
    const userId = auth.user.id;
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;

    const response = await api.put(`/api/profile/${userId}`,
      payload as any,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          ...(isForm ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }),
        },
      }
    );
    
    // After successful update, fetch the latest profile data
    const profileResponse = await api.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    
    return profileResponse.data as User;
  }
);

export const updateSettings = createAsyncThunk(
  'auth/updateSettings',
  async (data: { notifications?: boolean; theme?: 'light' | 'dark'; current_password?: string; new_password?: string }, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    const response = await api.patch('/api/profile/settings', data, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    return response.data as { message: string; preferences?: Preferences };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.access_token);
        // Authorization header attachment is handled by interceptor via localStorage
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Login failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Registration failed';
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'OTP verification failed';
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load profile';
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to send reset link';
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reset password';
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = 'Profile updated successfully';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        if (state.user && action.payload.preferences) {
          state.user.preferences = action.payload.preferences;
        }
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { logout, clearError, clearSuccess } = authSlice.actions;
export default authSlice.reducer;
