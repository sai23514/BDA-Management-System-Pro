import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../services/api';
import type { AppNotification } from '../../types';

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk<
  { notifications: AppNotification[]; unreadCount: number },
  void,
  { rejectValue: string }
>('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{
      data: { notifications: AppNotification[]; unreadCount: number };
    }>('/notifications');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch notifications'));
  }
});

export const markNotificationRead = createAsyncThunk<string, string, { rejectValue: string }>(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      return id;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update notification'));
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk<void, void, { rejectValue: string }>(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update notifications'));
    }
  },
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch notifications';
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
