import { useEffect, type ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TrendingUp, People, AttachMoney, CheckCircle } from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchLeadStats } from '../../redux/slices/leadSlice';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '../../constants';
import type { LeadStatus } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: alpha(color, 0.14),
            color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, loading } = useAppSelector((state) => state.leads);

  useEffect(() => {
    dispatch(fetchLeadStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalLeads = stats?.summary?.totalLeads ?? 0;
  const totalValue = stats?.summary?.totalValue ?? 0;
  const wonLeads = stats?.summary?.wonLeads ?? 0;
  const conversionRate = stats?.summary?.conversionRate ?? 0;

  const chartData = (stats?.stats ?? []).map((stat) => ({
    name: LEAD_STATUS_LABELS[stat._id as LeadStatus] ?? stat._id,
    status: stat._id as LeadStatus,
    count: stat.count,
    value: Number((stat.totalValue / 100000).toFixed(2)),
  }));

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here is what is happening with your leads today
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        <StatCard title="Total Leads" value={totalLeads} icon={<People />} color="#4f46e5" />
        <StatCard title="Won Deals" value={wonLeads} icon={<CheckCircle />} color="#16a34a" />
        <StatCard
          title="Total Value"
          value={`₹${(totalValue / 100000).toFixed(1)}L`}
          icon={<AttachMoney />}
          color="#f59e0b"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp />}
          color="#0ea5e9"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lead Status Distribution
          </Typography>
          {chartData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              No data yet.
            </Typography>
          ) : (
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={LEAD_STATUS_COLORS[entry.status] ?? '#8884d8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pipeline Value by Stage (₹ Lakh)
          </Typography>
          {chartData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              No data yet.
            </Typography>
          ) : (
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={LEAD_STATUS_COLORS[entry.status] ?? '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
