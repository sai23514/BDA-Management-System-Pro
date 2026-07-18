import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Person,
  Brightness4,
  Brightness7,
  Search as SearchIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { useColorMode } from '../../context/ColorModeContext';
import NotificationsMenu from './NotificationsMenu';

const openCommandPalette = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
};

interface NavbarProps {
  onMenuClick: () => void;
  drawerWidth: number;
}

const Navbar = ({ onMenuClick, drawerWidth }: NavbarProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.auth);
  const chatUnread = useAppSelector((state) => state.chat.unreadTotal);
  const { mode, toggleColorMode } = useColorMode();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    await dispatch(logout());
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          BDA Module
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Search (Ctrl+K)">
            <IconButton color="inherit" onClick={openCommandPalette}>
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Messages">
            <IconButton color="inherit" onClick={() => navigate('/chat')}>
              <Badge badgeContent={chatUnread} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <NotificationsMenu />

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <IconButton onClick={handleProfileClick}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfile}>
            <Person sx={{ mr: 1 }} fontSize="small" />
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} fontSize="small" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
