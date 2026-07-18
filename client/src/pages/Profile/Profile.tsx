import { Box, Paper, Typography, Avatar, Chip } from '@mui/material';
import { useAppSelector } from '../../redux/hooks';

interface InfoProps {
  label: string;
  value?: string | number | null;
}

const Info = ({ label, value }: InfoProps) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" gutterBottom>
      {value ?? 'Not provided'}
    </Typography>
  </Box>
);

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Profile
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2.5rem' }}
          >
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </Avatar>
          <Box sx={{ ml: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={user.role?.replace('_', ' ').toUpperCase()}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Info label="Email" value={user.email} />
          <Info label="Phone" value={user.phone} />
          <Info label="Department" value={user.department ?? 'Not assigned'} />
          <Info label="Account Status" value={user.isActive ? 'Active' : 'Inactive'} />
        </Box>

        {user.targets && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Targets
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              <Info label="Monthly" value={`₹${user.targets.monthly?.toLocaleString() ?? 0}`} />
              <Info label="Quarterly" value={`₹${user.targets.quarterly?.toLocaleString() ?? 0}`} />
              <Info label="Yearly" value={`₹${user.targets.yearly?.toLocaleString() ?? 0}`} />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;
