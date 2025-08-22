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
import DeleteIcon from '@mui/icons-material/Delete';

const roles = ['User', 'Volunteer', 'Mentor'];

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
}

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

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState<{name:string, phone:string, relationship:string}>({name:'', phone:'', relationship:''});

  useEffect(() => {
    if (!user) dispatch(getProfile());
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setRole((user.role as any) || 'User');
      setLocation(user.location || '');
      setPhone(user.phone || '');
      // Fetch emergency contacts
      fetch(`http://127.0.0.1:5000/api/emergency/contacts/${user.id}`)
        .then(res => res.json())
        .then(data => setContacts(data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (user?.profile_image) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const imagePath = user.profile_image.startsWith('/') ? user.profile_image.substring(1) : user.profile_image;
      return `${baseUrl}/${imagePath}?t=${new Date().getTime()}`;
    }
    return undefined;
  }, [imageFile, user?.profile_image]);

  const handleSave = async () => {
    const form = new FormData();
    form.append('username', username);
    form.append('email', email);
    form.append('role', role);
    form.append('location', location);
    form.append('phone', phone);
    if (imageFile) form.append('profile_image', imageFile);

    await dispatch(updateProfile(form));
    setSnackOpen(true);
    setEditMode(false);
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !user?.id) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/emergency/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...newContact }),
      });
      const data = await res.json();
      if (data.success) {
        setContacts(prev => [...prev, data.contact]);
        setNewContact({name:'', phone:'', relationship:''});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateContact = async (id: number, updated: Partial<EmergencyContact>) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/emergency/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setContacts(prev => prev.map(c => c.id === id ? {...c, ...updated} : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/emergency/contacts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
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
          title={user?.username || ''}
          subheader={user?.email || ''}
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
                {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
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
            <Button variant="contained" onClick={handleSave} disabled={loading}>Save Changes</Button>
          )}
        </CardActions>
      </Card>

      {/* Emergency Contacts Section */}
      <Card sx={{ mt: 4 }}>
        <CardHeader title="Emergency Contacts" />
        <CardContent>
          <Grid container spacing={2}>
            {contacts.map(c => (
              <Grid item xs={12} sm={6} key={c.id}>
                <Box sx={{border:'1px solid #ccc', p:2, borderRadius:2}}>
                  {editMode ? (
                    <>
                      <TextField 
                        label="Name" 
                        fullWidth 
                        value={c.name} 
                        onChange={(e)=>handleUpdateContact(c.id, {name:e.target.value})}
                        sx={{mb:1}}
                      />
                      <TextField 
                        label="Phone" 
                        fullWidth 
                        value={c.phone} 
                        onChange={(e)=>handleUpdateContact(c.id, {phone:e.target.value})}
                        sx={{mb:1}}
                      />
                      <TextField 
                        label="Relationship" 
                        fullWidth 
                        value={c.relationship || ''} 
                        onChange={(e)=>handleUpdateContact(c.id, {relationship:e.target.value})}
                        sx={{mb:1}}
                      />
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />} 
                        onClick={()=>handleDeleteContact(c.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography><strong>{c.name}</strong> ({c.relationship || 'N/A'})</Typography>
                      <Typography>{c.phone}</Typography>
                    </>
                  )}
                </Box>
              </Grid>
            ))}

            {editMode && (
              <Grid item xs={12} sm={6}>
                <Box sx={{border:'1px dashed #aaa', p:2, borderRadius:2}}>
                  <TextField label="Name" fullWidth value={newContact.name} onChange={(e)=>setNewContact({...newContact,name:e.target.value})} sx={{mb:1}} />
                  <TextField label="Phone" fullWidth value={newContact.phone} onChange={(e)=>setNewContact({...newContact,phone:e.target.value})} sx={{mb:1}} />
                  <TextField label="Relationship" fullWidth value={newContact.relationship} onChange={(e)=>setNewContact({...newContact,relationship:e.target.value})} sx={{mb:1}} />
                  <Button variant="contained" fullWidth onClick={handleAddContact}>Add Contact</Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
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
