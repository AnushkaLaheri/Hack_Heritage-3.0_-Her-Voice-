import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getProfile, updateProfile } from '../../store/slices/authSlice';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Snackbar,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const roles = ['User', 'Volunteer', 'Mentor'];

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((s: RootState) => s.auth);

  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'User' | 'Volunteer' | 'Mentor'>('User');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    if (!user) dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setRole((user.role as any) || 'User');
      setLocation(user.location || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (user?.profile_image) {
      // Construct proper image URL
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Remove leading slash if present and construct full URL
      const imagePath = user.profile_image.startsWith('/') 
        ? user.profile_image.substring(1) 
        : user.profile_image;
      return `${baseUrl}/${imagePath}?t=${new Date().getTime()}`;
    }
    return undefined;
  }, [imageFile, user?.profile_image]);

  const handleSave = async () => {
    // Build FormData for image upload
    const form = new FormData();
    form.append('username', username);
    form.append('email', email);
    form.append('role', role);
    form.append('location', location);
    form.append('phone', phone);
    if (imageFile) form.append('profile_image', imageFile);

    const res = await dispatch(updateProfile(form));
    setSnackOpen(true);
    setEditMode(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>My Profile</Typography>
      <Card>
        <CardHeader
          avatar={<Avatar src={avatarSrc} sx={{ width: 64, height: 64 }} />}
          action={
            <IconButton onClick={() => setEditMode((v) => !v)}>
              <EditIcon />
            </IconButton>
          }
          title={user?.username}
          subheader={user?.email}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Username" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Role" fullWidth value={role} onChange={(e) => setRole(e.target.value as any)} disabled={!editMode}>
                {roles.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Location" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" component="label" disabled={!editMode}>
                Upload Profile Image
                <input hidden type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </Button>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          {editMode && (
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              Save Changes
            </Button>
          )}
        </CardActions>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Profile updated"
      />
    </Box>
  );
};

export default Profile;
