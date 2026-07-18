import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Search as SearchIcon,
  Business,
  CheckCircle,
  AttachMoney,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchClients, deleteClient, fetchClientStats } from '../../redux/slices/clientSlice';
import type { ClientStatus } from '../../types';

const statusColor: Record<ClientStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  on_hold: 'warning',
};

const Clients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { clients, stats, loading } = useAppSelector((state) => state.clients);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchClientStats());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      [c.companyName, c.contactPerson, c.email, c.clientNumber]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(term)),
    );
  }, [clients, search]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this client?')) {
      try {
        await dispatch(deleteClient(id)).unwrap();
        enqueueSnackbar('Client deleted', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(typeof error === 'string' ? error : 'Failed to delete client', {
          variant: 'error',
        });
      }
    }
  };

  if (loading && clients.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Clients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customers converted from won opportunities
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Business color="primary" fontSize="large" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Clients
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats?.totalClients ?? 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle color="success" fontSize="large" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats?.activeClients ?? 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AttachMoney sx={{ color: 'warning.main' }} fontSize="large" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ₹{((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <TextField
        fullWidth
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 480 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client #</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No clients yet. Convert a won lead from its detail page.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>{client.clientNumber}</TableCell>
                  <TableCell>{client.companyName}</TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>₹{client.totalRevenue?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={client.status.replace('_', ' ')}
                      size="small"
                      color={statusColor[client.status]}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/clients/${client._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(client._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Clients;
