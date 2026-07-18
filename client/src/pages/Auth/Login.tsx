import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { login, clearError } from '../../redux/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
      dispatch(clearError());
    }
  }, [error, enqueueSnackbar, dispatch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
      return;
    }

    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      enqueueSnackbar('Login successful!', { variant: 'success' });
      navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              BDA Module
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Please login to your account
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Demo: <strong>admin@bda.com</strong> / <strong>admin123</strong>
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Do not have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Register here
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            © {new Date().getFullYear()} BDA Module. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
