import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getProfile, updateSettings } from '../../store/slices/authSlice';
import { Box, Card, CardContent, FormControlLabel, Switch, Typography, TextField, Button, Snackbar } from '@mui/material';

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((s: RootState) => s.auth);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    if (!user) dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user?.preferences) {
      if (typeof user.preferences.notifications === 'boolean') setNotifications(user.preferences.notifications);
      if (user.preferences.theme === 'dark' || user.preferences.theme === 'light') setTheme(user.preferences.theme);
    }
  }, [user]);

  const handleSave = async () => {
    await dispatch(updateSettings({ notifications, theme, ...(newPassword ? { current_password: currentPassword, new_password: newPassword } : {}) }));
    setSnackOpen(true);
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Preferences</Typography>
          <FormControlLabel
            control={<Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />}
            label="Enable Notifications"
          />
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />}
              label={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'}`}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>Change Password</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth />
            <TextField label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth />
          </Box>

          <Button variant="contained" sx={{ mt: 3 }} disabled={loading} onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)} message="Settings saved" />
    </Box>
  );
};

export default Settings;
