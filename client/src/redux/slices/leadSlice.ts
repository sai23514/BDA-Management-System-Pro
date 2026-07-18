import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../services/api';
import type {
  Lead,
  LeadDetailResponse,
  LeadStats,
  LeadStatus,
  Pagination,
  PaginatedResponse,
} from '../../types';

export type LeadListParams = Record<string, string | number | undefined>;

interface LeadState {
  leads: Lead[];
  currentLead: LeadDetailResponse | null;
  stats: LeadStats | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: LeadState = {
  leads: [],
  currentLead: null,
  stats: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

export const fetchLeads = createAsyncThunk<
  PaginatedResponse<Lead>,
  LeadListParams | undefined,
  { rejectValue: string }
>('leads/fetchLeads', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get<PaginatedResponse<Lead>>('/leads', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch leads'));
  }
});

export const fetchLead = createAsyncThunk<LeadDetailResponse, string, { rejectValue: string }>(
  'leads/fetchLead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: LeadDetailResponse }>(`/leads/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch lead'));
    }
  },
);

export const createLead = createAsyncThunk<Lead, Record<string, unknown>, { rejectValue: string }>(
  'leads/createLead',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: { lead: Lead } }>('/leads', leadData);
      return response.data.data.lead;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create lead'));
    }
  },
);

export const updateLead = createAsyncThunk<
  Lead,
  { id: string; data: Record<string, unknown> },
  { rejectValue: string }
>('leads/updateLead', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put<{ data: { lead: Lead } }>(`/leads/${id}`, data);
    return response.data.data.lead;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to update lead'));
  }
});

export const deleteLead = createAsyncThunk<string, string, { rejectValue: string }>(
  'leads/deleteLead',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/leads/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete lead'));
    }
  },
);

export const updateLeadStatus = createAsyncThunk<
  Lead,
  { id: string; status: LeadStatus; notes?: string },
  { rejectValue: string }
>('leads/updateLeadStatus', async ({ id, status, notes }, { rejectWithValue }) => {
  try {
    const response = await api.patch<{ data: { lead: Lead } }>(`/leads/${id}/status`, {
      status,
      notes,
    });
    return response.data.data.lead;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to update status'));
  }
});

export const fetchLeadStats = createAsyncThunk<LeadStats, void, { rejectValue: string }>(
  'leads/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: LeadStats }>('/leads/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch stats'));
    }
  },
);

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentLead: (state) => {
      state.currentLead = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch leads';
      })
      .addCase(fetchLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLead.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLead = action.payload;
      })
      .addCase(fetchLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch lead';
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex((lead) => lead._id === action.payload._id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
        if (state.currentLead?.lead._id === action.payload._id) {
          state.currentLead.lead = { ...state.currentLead.lead, ...action.payload };
        }
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const index = state.leads.findIndex((lead) => lead._id === action.payload._id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((lead) => lead._id !== action.payload);
      })
      .addCase(fetchLeadStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentLead } = leadSlice.actions;
export default leadSlice.reducer;
