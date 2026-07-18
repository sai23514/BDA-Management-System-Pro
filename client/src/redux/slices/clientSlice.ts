import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../services/api';
import type {
  Client,
  ClientStatsSummary,
  Pagination,
  PaginatedResponse,
} from '../../types';

export type ClientListParams = Record<string, string | number | undefined>;

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  stats: ClientStatsSummary | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: ClientState = {
  clients: [],
  currentClient: null,
  stats: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
};

export const fetchClients = createAsyncThunk<
  PaginatedResponse<Client>,
  ClientListParams | undefined,
  { rejectValue: string }
>('clients/fetchClients', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch clients'));
  }
});

export const fetchClient = createAsyncThunk<Client, string, { rejectValue: string }>(
  'clients/fetchClient',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: { client: Client } }>(`/clients/${id}`);
      return response.data.data.client;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch client'));
    }
  },
);

export const convertLeadToClient = createAsyncThunk<Client, string, { rejectValue: string }>(
  'clients/convert',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: { client: Client } }>(`/clients/convert/${leadId}`);
      return response.data.data.client;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to convert lead'));
    }
  },
);

export const updateClient = createAsyncThunk<
  Client,
  { id: string; data: Record<string, unknown> },
  { rejectValue: string }
>('clients/updateClient', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put<{ data: { client: Client } }>(`/clients/${id}`, data);
    return response.data.data.client;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to update client'));
  }
});

export const deleteClient = createAsyncThunk<string, string, { rejectValue: string }>(
  'clients/deleteClient',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete client'));
    }
  },
);

export const fetchClientStats = createAsyncThunk<
  ClientStatsSummary,
  void,
  { rejectValue: string }
>('clients/stats', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ data: { summary: ClientStatsSummary } }>('/clients/stats');
    return response.data.data.summary;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch client stats'));
  }
});

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch clients';
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.currentClient = action.payload;
      })
      .addCase(convertLeadToClient.fulfilled, (state, action) => {
        state.clients.unshift(action.payload);
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.clients[index] = action.payload;
        if (state.currentClient?._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter((c) => c._id !== action.payload);
      })
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentClient } = clientSlice.actions;
export default clientSlice.reducer;
