import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface CompanyRating {
  name: string;
  total_ratings: number;
  avg_safety: number;
  avg_pay_equality: number;
  avg_culture: number;
}

interface DashboardData {
  gender_pay_gap: {
    overall: number;
    by_sector: Record<string, number>;
  };
  leadership_diversity: {
    women_in_leadership: number;
    board_diversity: number;
  };
  harassment_reports: {
    total_reports: number;
    by_sector: Record<string, number>;
  };
}

interface EqualityState {
  companies: CompanyRating[];
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: EqualityState = {
  companies: [],
  dashboard: null,
  loading: false,
  error: null,
};

export const fetchCompanyRatings = createAsyncThunk('equality/fetchCompanies', async () => {
  const response = await api.get('/api/equality/companies');
  return response.data;
});

export const rateCompany = createAsyncThunk(
  'equality/rateCompany',
  async (ratingData: {
    company_name: string;
    safety_rating: number;
    pay_equality_rating: number;
    culture_rating: number;
    comment?: string;
    is_anonymous?: boolean;
  }) => {
    const response = await api.post('/api/equality/rate', ratingData);
    return response.data;
  }
);

export const fetchDashboard = createAsyncThunk('equality/fetchDashboard', async () => {
  const response = await api.get('/api/equality/dashboard');
  return response.data;
});

const equalitySlice = createSlice({
  name: 'equality',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Company Ratings
      .addCase(fetchCompanyRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload.companies;
      })
      .addCase(fetchCompanyRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch company ratings';
      })
      // Rate Company
      .addCase(rateCompany.fulfilled, (state) => {
        // Company rated successfully
      })
      .addCase(rateCompany.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to rate company';
      })
      // Fetch Dashboard
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      });
  },
});

export const { clearError } = equalitySlice.actions;
export default equalitySlice.reducer;
