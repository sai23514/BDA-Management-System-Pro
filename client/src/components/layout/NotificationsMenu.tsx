import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../redux/slices/notificationSlice';

const POLL_INTERVAL_MS = 60_000;

const NotificationsMenu = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, unreadCount } = useAppSelector((state) => state.notifications);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);

  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleItemClick = (id: string, link?: string) => {
    dispatch(markNotificationRead(id));
    handleClose();
    if (link) navigate(link);
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460 } } }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => dispatch(markAllNotificationsRead())}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {items.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {items.map((n) => (
              <ListItemButton
                key={n._id}
                onClick={() => handleItemClick(n._id, n.link)}
                sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}
              >
                <ListItemText
                  primary={n.title}
                  secondary={
                    <>
                      {n.message}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                  slotProps={{ primary: { fontWeight: n.read ? 400 : 600 } }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;
