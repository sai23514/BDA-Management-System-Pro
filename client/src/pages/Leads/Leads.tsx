import { useEffect, useState, useMemo, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  Checkbox,
  Toolbar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility,
  Delete,
  Search as SearchIcon,
  FileDownload,
  FileUpload,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchLeads, createLead, deleteLead } from '../../redux/slices/leadSlice';
import api, { getApiErrorMessage } from '../../services/api';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_SOURCES,
  DATE_FORMAT,
} from '../../constants';
import type { LeadPriority, LeadSource, LeadStatus } from '../../types';

const BULK_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'nurturing',
];

interface LeadFormState {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: LeadSource;
  estimatedValue: string;
  priority: LeadPriority;
}

const emptyForm: LeadFormState = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  source: 'website',
  estimatedValue: '',
  priority: 'medium',
};

const Leads = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { leads, loading } = useAppSelector((state) => state.leads);

  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<LeadFormState>(emptyForm);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>('contacted');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.companyName, lead.contactPerson, lead.email, lead.leadNumber]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [leads, search]);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(emptyForm);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await dispatch(
        createLead({
          ...formData,
          estimatedValue: Number(formData.estimatedValue) || 0,
        }),
      ).unwrap();
      enqueueSnackbar('Lead created successfully', { variant: 'success' });
      handleCloseDialog();
      dispatch(fetchLeads());
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to create lead', {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
        enqueueSnackbar('Lead deleted successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(typeof error === 'string' ? error : 'Failed to delete lead', {
          variant: 'error',
        });
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === filteredLeads.length ? [] : filteredLeads.map((lead) => lead._id),
    );
  };

  const handleBulkStatus = async () => {
    try {
      await api.post('/leads/bulk', { action: 'status', ids: selected, status: bulkStatus });
      enqueueSnackbar(`${selected.length} lead(s) updated`, { variant: 'success' });
      setSelected([]);
      dispatch(fetchLeads());
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Bulk update failed'), { variant: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} lead(s)?`)) return;
    try {
      await api.post('/leads/bulk', { action: 'delete', ids: selected });
      enqueueSnackbar(`${selected.length} lead(s) deleted`, { variant: 'success' });
      setSelected([]);
      dispatch(fetchLeads());
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Bulk delete failed'), { variant: 'error' });
    }
  };

  const handleImport = async () => {
    const lines = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      enqueueSnackbar('Provide a header row plus at least one data row', { variant: 'warning' });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const leadsToImport = lines.slice(1).map((line) => {
      const cols = line.split(',');
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (cols[index] ?? '').trim();
      });
      return record;
    });

    setImporting(true);
    try {
      const res = await api.post<{ data: { count: number } }>('/leads/import', {
        leads: leadsToImport,
      });
      enqueueSnackbar(`${res.data.data.count} lead(s) imported`, { variant: 'success' });
      setImportOpen(false);
      setImportText('');
      dispatch(fetchLeads());
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Import failed'), { variant: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    if (filteredLeads.length === 0) {
      enqueueSnackbar('No leads to export', { variant: 'info' });
      return;
    }

    const headers = [
      'Lead Number',
      'Company',
      'Contact',
      'Email',
      'Phone',
      'Status',
      'Priority',
      'Estimated Value',
      'Created',
    ];

    const rows = filteredLeads.map((lead) => [
      lead.leadNumber,
      lead.companyName,
      lead.contactPerson,
      lead.email,
      lead.phone,
      lead.status,
      lead.priority,
      lead.estimatedValue,
      format(new Date(lead.createdAt), 'yyyy-MM-dd'),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Leads Management
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            Create Lead
          </Button>
        </Stack>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by company, contact, email or lead number..."
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

      {selected.length > 0 && (
        <Toolbar
          sx={{
            mb: 1,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ flex: '1 1 auto' }} variant="subtitle1">
            {selected.length} selected
          </Typography>
          <TextField
            select
            size="small"
            label="Set status"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
            sx={{ minWidth: 160 }}
          >
            {BULK_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" size="small" onClick={handleBulkStatus}>
            Apply
          </Button>
          <Button color="error" variant="outlined" size="small" onClick={handleBulkDelete}>
            Delete
          </Button>
        </Toolbar>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredLeads.length}
                  checked={filteredLeads.length > 0 && selected.length === filteredLeads.length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No leads found. Create your first lead!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead._id} hover selected={selected.includes(lead._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(lead._id)}
                      onChange={() => toggleSelect(lead._id)}
                    />
                  </TableCell>
                  <TableCell>{lead.companyName}</TableCell>
                  <TableCell>{lead.contactPerson}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={LEAD_STATUS_LABELS[lead.status]}
                      size="small"
                      sx={{ bgcolor: LEAD_STATUS_COLORS[lead.status], color: 'white' }}
                    />
                  </TableCell>
                  <TableCell>₹{lead.estimatedValue?.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(lead.createdAt), DATE_FORMAT)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/leads/${lead._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(lead._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Lead</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              fullWidth
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              select
              label="Source"
              name="source"
              value={formData.source}
              onChange={handleChange}
            >
              {LEAD_SOURCES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Estimated Value"
              name="estimatedValue"
              type="number"
              value={formData.estimatedValue}
              onChange={handleChange}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Leads from CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste CSV content below. The first row must be a header. Supported columns:
            companyName, contactPerson, email, phone, source, estimatedValue, priority.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={8}
            placeholder={
              'companyName,contactPerson,email,phone,source\nAcme Corp,Jane Doe,jane@acme.com,9990001111,website'
            }
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImport} disabled={importing}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leads;
