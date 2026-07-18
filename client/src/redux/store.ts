import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import leadReducer from './slices/leadSlice';
import clientReducer from './slices/clientSlice';
import notificationReducer from './slices/notificationSlice';
import chatReducer from './slices/chatSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadReducer,
    clients: clientReducer,
    notifications: notificationReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
