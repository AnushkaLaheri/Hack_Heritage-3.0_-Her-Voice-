import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { forgotPassword, clearError, clearSuccess } from '../../store/slices/authSlice';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Snackbar } from '@mui/material';

const ForgotPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, successMessage } = useSelector((s: RootState) => s.auth);
  const [email, setEmail] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(forgotPassword(email));
    setSnackOpen(true);
  };

  const handleSnackClose = () => {
    setSnackOpen(false);
    if (error) dispatch(clearError());
    if (successMessage) dispatch(clearSuccess());
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your registered email address to receive a password reset link.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            Send Reset Link
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Snackbar
        open={snackOpen && !!successMessage}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        message={successMessage}
      />
    </Container>
  );
};

export default ForgotPassword;
