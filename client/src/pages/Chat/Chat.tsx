import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Button,
} from '@mui/material';
import { Send, Add } from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchConversations,
  fetchContacts,
  fetchMessages,
  openConversation,
  sendMessage,
  setActiveConversation,
} from '../../redux/slices/chatSlice';
import type { ChatConversation, ChatUser } from '../../types';

const fullName = (user?: ChatUser | null): string =>
  user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.email ?? 'User') : 'User';

const initials = (user?: ChatUser | null): string => {
  if (!user) return '?';
  const f = user.firstName?.[0] ?? '';
  const l = user.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || (user.email?.[0]?.toUpperCase() ?? '?');
};

const Chat = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { conversations, contacts, activeConversationId, messages, loadingMessages } =
    useAppSelector((state) => state.chat);
  const myId = useAppSelector((state) => state.auth.user?._id);

  const [text, setText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const handleSelect = (conversation: ChatConversation) => {
    dispatch(setActiveConversation(conversation._id));
    dispatch(fetchMessages(conversation._id));
  };

  const handleStartChat = async (userId: string) => {
    setAnchorEl(null);
    try {
      const conversation = await dispatch(openConversation(userId)).unwrap();
      dispatch(setActiveConversation(conversation._id));
      dispatch(fetchMessages(conversation._id));
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to open chat', {
        variant: 'error',
      });
    }
  };

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !activeConversationId) return;
    setText('');
    try {
      await dispatch(sendMessage({ conversationId: activeConversationId, body })).unwrap();
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to send', { variant: 'error' });
      setText(body);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Chat directly with your teammates
      </Typography>

      <Paper sx={{ display: 'flex', height: 'calc(100vh - 220px)', minHeight: 420, overflow: 'hidden' }}>
        {/* Conversation list */}
        <Box
          sx={{
            width: { xs: '100%', sm: 320 },
            display: { xs: activeConversationId ? 'none' : 'flex', sm: 'flex' },
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Conversations
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
            >
              New
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              {contacts.length === 0 ? (
                <MenuItem disabled>No teammates found</MenuItem>
              ) : (
                contacts.map((contact) => (
                  <MenuItem key={contact._id} onClick={() => handleStartChat(contact._id)}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>
                        {initials(contact)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={fullName(contact)} secondary={contact.role} />
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
          <Divider />
          <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No conversations yet. Start one with “New”.
                </Typography>
              </Box>
            ) : (
              conversations.map((conversation) => (
                <ListItemButton
                  key={conversation._id}
                  selected={conversation._id === activeConversationId}
                  onClick={() => handleSelect(conversation)}
                >
                  <ListItemAvatar>
                    <Badge color="error" badgeContent={conversation.unreadCount} overlap="circular">
                      <Avatar>{initials(conversation.otherUser)}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={fullName(conversation.otherUser)}
                    secondary={conversation.lastMessage ?? 'No messages yet'}
                    slotProps={{
                      secondary: { noWrap: true },
                      primary: { fontWeight: conversation.unreadCount > 0 ? 700 : 500 },
                    }}
                  />
                  {conversation.lastMessageAt && (
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                    </Typography>
                  )}
                </ListItemButton>
              ))
            )}
          </List>
        </Box>

        {/* Thread */}
        <Box
          sx={{
            flexGrow: 1,
            display: { xs: activeConversationId ? 'flex' : 'none', sm: 'flex' },
            flexDirection: 'column',
          }}
        >
          {!activeConversation ? (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar>{initials(activeConversation.otherUser)}</Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {fullName(activeConversation.otherUser)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeConversation.otherUser?.role}
                  </Typography>
                </Box>
              </Box>
              <Divider />

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
                {loadingMessages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  messages.map((message) => {
                    const senderId =
                      typeof message.sender === 'string' ? message.sender : message.sender._id;
                    const mine = senderId === myId;
                    return (
                      <Box
                        key={message._id}
                        sx={{
                          display: 'flex',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '72%',
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: mine ? 'primary.main' : 'background.paper',
                            color: mine ? 'primary.contrastText' : 'text.primary',
                            border: mine ? 'none' : '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.body}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', opacity: 0.7, mt: 0.5, textAlign: 'right' }}
                          >
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message… (Enter to send)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  multiline
                  maxRows={4}
                />
                <IconButton color="primary" onClick={handleSend} disabled={!text.trim()}>
                  <Send />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat;
