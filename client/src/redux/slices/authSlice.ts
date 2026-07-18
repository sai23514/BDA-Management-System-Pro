import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../services/api';
import type { AuthPayload, LoginCredentials, RegisterData, User } from '../../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk<AuthPayload, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: AuthPayload }>('/auth/login', credentials);
      const payload = response.data.data;
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
      return payload;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
    }
  },
);

export const register = createAsyncThunk<AuthPayload, RegisterData, { rejectValue: string }>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: AuthPayload }>('/auth/register', userData);
      const payload = response.data.data;
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
      return payload;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed'));
    }
  },
);

export const logout = createAsyncThunk<null, void>('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  return null;
});

export const getMe = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: { user: User } }>('/auth/me');
      const { user } = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch user'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
