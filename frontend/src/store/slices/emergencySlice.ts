import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
  phone: string;
  address: string;
}

interface EmergencyState {
  nearbyPlaces: NearbyPlace[];
  loading: boolean;
  error: string | null;
}

const initialState: EmergencyState = {
  nearbyPlaces: [],
  loading: false,
  error: null,
};

export const fetchNearbyHelp = createAsyncThunk('emergency/fetchNearby', async () => {
  const response = await axios.get('/api/emergency/nearby');
  return response.data;
});

export const sendEmergencyAlert = createAsyncThunk(
  'emergency/sendAlert',
  async (alertData: { message?: string; location?: string }) => {
    const response = await axios.post('/api/emergency/alert', alertData);
    return response.data;
  }
);

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Nearby Help
      .addCase(fetchNearbyHelp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyHelp.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyPlaces = action.payload.nearby_places;
      })
      .addCase(fetchNearbyHelp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch nearby help';
      })
      // Send Emergency Alert
      .addCase(sendEmergencyAlert.fulfilled, (state) => {
        // Alert sent successfully
      })
      .addCase(sendEmergencyAlert.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send emergency alert';
      });
  },
});

export const { clearError } = emergencySlice.actions;
export default emergencySlice.reducer;
