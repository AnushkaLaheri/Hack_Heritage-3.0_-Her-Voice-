import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { resetPassword, clearError, clearSuccess } from '../../store/slices/authSlice';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Snackbar } from '@mui/material';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, successMessage } = useSelector((s: RootState) => s.auth);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) return;
    const res = await dispatch(resetPassword({ token, new_password: password }));
    setSnackOpen(true);
    // After success, redirect to login
    // You can inspect res.meta.requestStatus === 'fulfilled'
  };

  const handleSnackClose = () => {
    setSnackOpen(false);
    if (successMessage) {
      dispatch(clearSuccess());
      navigate('/login');
    }
    if (error) dispatch(clearError());
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Reset Password
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={confirm !== '' && confirm !== password}
            helperText={confirm !== '' && confirm !== password ? 'Passwords do not match' : ''}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            Set New Password
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Snackbar
        open={snackOpen && !!successMessage}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        message={successMessage}
      />
    </Container>
  );
};

export default ResetPassword;
