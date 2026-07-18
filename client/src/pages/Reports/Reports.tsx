import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useSnackbar } from 'notistack';
import api, { getApiErrorMessage } from '../../services/api';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, CHART_COLORS } from '../../constants';
import type { ReportsOverview, LeadStatus } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ data: ReportsOverview }>('/reports/overview');
        setData(res.data.data);
      } catch (error) {
        enqueueSnackbar(getApiErrorMessage(error, 'Failed to load reports'), { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [enqueueSnackbar]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Typography>No report data available.</Typography>;
  }

  const statusData = data.byStatus.map((s) => ({
    name: LEAD_STATUS_LABELS[s._id as LeadStatus] ?? s._id,
    status: s._id as LeadStatus,
    count: s.count,
  }));

  const sourceData = data.bySource.map((s) => ({
    name: String(s._id).replace('_', ' '),
    count: s.count,
  }));

  const monthlyData = data.monthly.map((m) => ({
    name: MONTHS[(m._id.month ?? 1) - 1] ?? String(m._id.month),
    leads: m.count,
    won: m.won,
  }));

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Reports & Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Performance insights across your pipeline
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Leads', value: data.summary.totalLeads },
          { label: 'Won', value: data.summary.wonLeads },
          { label: 'Lost', value: data.summary.lostLeads },
          { label: 'Conversion', value: `${data.summary.conversionRate}%` },
        ].map((card) => (
          <Paper key={card.label} sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {card.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Leads by Status
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={LEAD_STATUS_COLORS[entry.status] ?? '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Leads by Source
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {sourceData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Trend (last 6 months)
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={2} />
              <Line type="monotone" dataKey="won" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leaderboard
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>BDA</TableCell>
              <TableCell align="right">Total Leads</TableCell>
              <TableCell align="right">Won</TableCell>
              <TableCell align="right">Won Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No data yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.leaderboard.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.name ?? 'Unassigned'}</TableCell>
                  <TableCell align="right">{row.totalLeads}</TableCell>
                  <TableCell align="right">{row.wonLeads}</TableCell>
                  <TableCell align="right">₹{(row.wonValue / 100000).toFixed(1)}L</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Reports;
