import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { getMe } from './redux/slices/authSlice';
import { receiveMessage, fetchUnreadTotal } from './redux/slices/chatSlice';
import { connectSocket, disconnectSocket } from './services/socket';
import type { ChatMessage } from './types';
import { SOCKET_ENABLED } from './constants';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Leads from './pages/Leads/Leads';
import LeadDetail from './pages/Leads/LeadDetail';
import Pipeline from './pages/Pipeline/Pipeline';
import Profile from './pages/Profile/Profile';
import Clients from './pages/Clients/Clients';
import ClientDetail from './pages/Clients/ClientDetail';
import Tasks from './pages/Tasks/Tasks';
import Reports from './pages/Reports/Reports';
import Chat from './pages/Chat/Chat';

import PrivateRoute from './components/common/PrivateRoute';
import MainLayout from './components/layout/MainLayout';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getMe());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    dispatch(fetchUnreadTotal());

    // Socket.io is not available on Vercel serverless — chat still works via REST.
    if (!SOCKET_ENABLED) {
      return;
    }

    const socket = connectSocket(accessToken);
    const handleNewMessage = (payload: { conversationId: string; message: ChatMessage }) => {
      dispatch(receiveMessage(payload));
    };
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [dispatch, isAuthenticated, accessToken]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
