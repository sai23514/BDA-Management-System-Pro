import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '../../services/api';
import type { SearchResults } from '../../types';

const EMPTY: SearchResults = { leads: [], clients: [] };

const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data: SearchResults }>('/search', { params: { q: query } });
        setResults(res.data.data);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const hasResults = results.leads.length > 0 || results.clients.length > 0;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { position: 'absolute', top: 72 } } }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search leads and clients..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={18} /> : <Search />}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {query.trim().length >= 2 && !hasResults && !loading && (
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No results for &quot;{query}&quot;
          </Typography>
        </Box>
      )}

      {hasResults && (
        <List dense sx={{ pb: 1 }}>
          {results.leads.length > 0 && <ListSubheader>Leads</ListSubheader>}
          {results.leads.map((lead) => (
            <ListItemButton key={lead._id} onClick={() => go(`/leads/${lead._id}`)}>
              <ListItemText primary={lead.companyName} secondary={lead.contactPerson} />
              <Chip label={lead.leadNumber} size="small" />
            </ListItemButton>
          ))}

          {results.clients.length > 0 && <ListSubheader>Clients</ListSubheader>}
          {results.clients.map((client) => (
            <ListItemButton key={client._id} onClick={() => go(`/clients/${client._id}`)}>
              <ListItemText primary={client.companyName} secondary={client.contactPerson} />
              <Chip label={client.clientNumber} size="small" />
            </ListItemButton>
          ))}
        </List>
      )}
    </Dialog>
  );
};

export default CommandPalette;
