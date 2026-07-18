import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../services/api';
import type { ChatConversation, ChatMessage, ChatUser } from '../../types';

interface ChatState {
  conversations: ChatConversation[];
  contacts: ChatUser[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  unreadTotal: number;
  loadingConversations: boolean;
  loadingMessages: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  contacts: [],
  activeConversationId: null,
  messages: [],
  unreadTotal: 0,
  loadingConversations: false,
  loadingMessages: false,
  error: null,
};

export const fetchConversations = createAsyncThunk<
  ChatConversation[],
  void,
  { rejectValue: string }
>('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<{ data: { conversations: ChatConversation[] } }>(
      '/chat/conversations',
    );
    return res.data.data.conversations;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to load conversations'));
  }
});

export const fetchContacts = createAsyncThunk<ChatUser[], void, { rejectValue: string }>(
  'chat/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: { contacts: ChatUser[] } }>('/chat/contacts');
      return res.data.data.contacts;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load contacts'));
    }
  },
);

export const fetchUnreadTotal = createAsyncThunk<number, void, { rejectValue: string }>(
  'chat/fetchUnreadTotal',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: { unreadTotal: number } }>('/chat/unread');
      return res.data.data.unreadTotal;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load unread count'));
    }
  },
);

export const openConversation = createAsyncThunk<
  ChatConversation,
  string,
  { rejectValue: string }
>('chat/openConversation', async (userId, { rejectWithValue }) => {
  try {
    const res = await api.post<{ data: { conversation: ChatConversation } }>(
      '/chat/conversations',
      { userId },
    );
    return res.data.data.conversation;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to open conversation'));
  }
});

export const fetchMessages = createAsyncThunk<ChatMessage[], string, { rejectValue: string }>(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: { messages: ChatMessage[] } }>(
        `/chat/conversations/${conversationId}/messages`,
      );
      return res.data.data.messages;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load messages'));
    }
  },
);

export const sendMessage = createAsyncThunk<
  { conversationId: string; message: ChatMessage },
  { conversationId: string; body: string },
  { rejectValue: string }
>('chat/sendMessage', async ({ conversationId, body }, { rejectWithValue }) => {
  try {
    const res = await api.post<{ data: { message: ChatMessage } }>(
      `/chat/conversations/${conversationId}/messages`,
      { body },
    );
    return { conversationId, message: res.data.data.message };
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to send message'));
  }
});

const bumpToTop = (
  conversations: ChatConversation[],
  conversationId: string,
  message: ChatMessage,
  incrementUnread: boolean,
): ChatConversation[] => {
  const convo = conversations.find((c) => c._id === conversationId);
  if (!convo) return conversations;
  convo.lastMessage = message.body;
  convo.lastMessageAt = message.createdAt;
  if (incrementUnread) convo.unreadCount += 1;
  return [convo, ...conversations.filter((c) => c._id !== conversationId)];
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      if (action.payload) {
        const convo = state.conversations.find((c) => c._id === action.payload);
        if (convo && convo.unreadCount > 0) {
          state.unreadTotal = Math.max(0, state.unreadTotal - convo.unreadCount);
          convo.unreadCount = 0;
        }
      }
    },
    receiveMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: ChatMessage }>,
    ) => {
      const { conversationId, message } = action.payload;
      const isActive = state.activeConversationId === conversationId;

      if (isActive) {
        if (!state.messages.some((m) => m._id === message._id)) {
          state.messages.push(message);
        }
      }

      const exists = state.conversations.some((c) => c._id === conversationId);
      if (exists) {
        state.conversations = bumpToTop(state.conversations, conversationId, message, !isActive);
      }
      if (!isActive) {
        state.unreadTotal += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload ?? 'Failed to load conversations';
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
      })
      .addCase(fetchUnreadTotal.fulfilled, (state, action) => {
        state.unreadTotal = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingMessages = false;
      })
      .addCase(openConversation.fulfilled, (state, action) => {
        const exists = state.conversations.some((c) => c._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (state.activeConversationId === conversationId) {
          if (!state.messages.some((m) => m._id === message._id)) {
            state.messages.push(message);
          }
        }
        if (state.conversations.some((c) => c._id === conversationId)) {
          state.conversations = bumpToTop(state.conversations, conversationId, message, false);
        }
      });
  },
});

export const { setActiveConversation, receiveMessage } = chatSlice.actions;
export default chatSlice.reducer;
