import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ViewKanban as PipelineIcon,
  AccountCircle as ProfileIcon,
  Business as ClientsIcon,
  TaskAlt as TasksIcon,
  Assessment as ReportsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

interface MenuItemDef {
  text: string;
  icon: ReactNode;
  path: string;
}

const menuItems: MenuItemDef[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Leads', icon: <PeopleIcon />, path: '/leads' },
  { text: 'Pipeline', icon: <PipelineIcon />, path: '/pipeline' },
  { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
  { text: 'Tasks', icon: <TasksIcon />, path: '/tasks' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Messages', icon: <ChatIcon />, path: '/chat' },
  { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
];

const Sidebar = ({ drawerWidth, mobileOpen, onDrawerToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#fff',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          BDA System
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) onDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: '#fff' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: selected ? '#fff' : 'text.secondary', minWidth: 40 }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
