import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
  TextField,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchClient, updateClient } from '../../redux/slices/clientSlice';
import type { ClientStatus } from '../../types';

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value ?? '—'}</Typography>
  </Box>
);

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { currentClient, loading } = useAppSelector((state) => state.clients);

  const [status, setStatus] = useState<ClientStatus>('active');
  const [revenue, setRevenue] = useState('');

  useEffect(() => {
    if (id) dispatch(fetchClient(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentClient) {
      setStatus(currentClient.status);
      setRevenue(String(currentClient.totalRevenue ?? 0));
    }
  }, [currentClient]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await dispatch(
        updateClient({ id, data: { status, totalRevenue: Number(revenue) || 0 } }),
      ).unwrap();
      enqueueSnackbar('Client updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to update client', {
        variant: 'error',
      });
    }
  };

  if (loading || !currentClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/clients')} sx={{ mb: 2 }}>
        Back to Clients
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {currentClient.companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentClient.clientNumber}
            </Typography>
          </Box>
          <Chip
            label={currentClient.status.replace('_', ' ')}
            color="primary"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Field label="Contact Person" value={currentClient.contactPerson} />
            <Field label="Email" value={currentClient.email} />
            <Field label="Phone" value={currentClient.phone} />
          </Box>
          <Box>
            <Field label="Industry" value={currentClient.industry} />
            <Field label="Active Contracts" value={currentClient.activeContracts} />
            <Field label="GST" value={currentClient.gst} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Manage
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setStatus(e.target.value as ClientStatus)
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
          </TextField>
          <TextField
            label="Total Revenue (₹)"
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClientDetail;
