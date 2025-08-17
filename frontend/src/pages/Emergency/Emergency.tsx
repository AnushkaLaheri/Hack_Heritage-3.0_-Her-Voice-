import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Warning,
  LocationOn,
  Phone,
  WhatsApp,
  Sms,
  LocalPolice,
  Security,
  Close,
  Send,
  MyLocation,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchNearbyHelp, sendEmergencyAlert } from '../../store/slices/emergencySlice';

const Emergency: React.FC = () => {
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  const dispatch = useDispatch<AppDispatch>();
  const { nearbyPlaces, loading } = useSelector((state: RootState) => state.emergency);

  useEffect(() => {
    dispatch(fetchNearbyHelp());
  }, [dispatch]);

  const handleEmergencyAlert = async () => {
    await dispatch(sendEmergencyAlert({ 
      message: alertMessage || 'EMERGENCY: I need immediate help!',
      location: 'Current location'
    }));
    setEmergencyDialogOpen(false);
    setAlertMessage('');
  };

  const emergencyContacts = [
    { name: 'Police', number: '100', icon: <LocalPolice />, color: '#1976d2' },
    { name: 'Women Helpline', number: '1091', icon: <Security />, color: '#e91e63' },
    { name: 'Domestic Violence Helpline', number: '181', icon: <Security />, color: '#f44336' },
    { name: 'Ambulance', number: '102', icon: <Warning />, color: '#4caf50' },
  ];

  const speedDialActions = [
    { icon: <Sms />, name: 'SMS Alert', action: () => setEmergencyDialogOpen(true) },
    { icon: <WhatsApp />, name: 'WhatsApp', action: () => window.open('https://wa.me/911234567890?text=EMERGENCY%20HELP%20NEEDED') },
    { icon: <Phone />, name: 'Call Police', action: () => window.open('tel:100') },
  ];

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'police':
        return <LocalPolice />;
      case 'safety_center':
        return <Security />;
      case 'safe_place':
        return <LocationOn />;
      default:
        return <LocationOn />;
    }
  };

  const getPlaceColor = (type: string) => {
    switch (type) {
      case 'police':
        return '#1976d2';
      case 'safety_center':
        return '#e91e63';
      case 'safe_place':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  return (
    <Box>
      {/* Emergency Alert Banner */}
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => setEmergencyDialogOpen(true)}>
            Send Alert
          </Button>
        }
      >
        <strong>EMERGENCY:</strong> If you're in immediate danger, use the emergency button or call 100 immediately.
      </Alert>

      <Grid container spacing={3}>
        {/* Emergency Contacts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, color: 'error.main' }} />
                Emergency Contacts
              </Typography>
              <List>
                {emergencyContacts.map((contact, index) => (
                  <ListItem key={index} button onClick={() => window.open(`tel:${contact.number}`)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: contact.color }}>
                        {contact.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={contact.number}
                    />
                                         <Button
                       variant="outlined"
                       size="small"
                     >
                       <Phone sx={{ mr: 1 }} />
                       Call
                     </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Nearby Help */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                Nearby Help
              </Typography>
              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading nearby help...
                </Typography>
              ) : (
                <List>
                  {nearbyPlaces.map((place, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPlaceColor(place.type) }}>
                          {getPlaceIcon(place.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={place.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {place.address}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={place.distance} 
                                size="small" 
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={place.type.replace('_', ' ')} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                                             <Button
                         variant="outlined"
                         size="small"
                         onClick={() => window.open(`tel:${place.phone}`)}
                       >
                         <Phone sx={{ mr: 1 }} />
                         Call
                       </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Tips */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Safety Tips
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      If you're in immediate danger:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="1. Call 100 immediately" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Try to get to a safe, public place" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Use the emergency alert button" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Contact trusted friends or family" />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      Prevention tips:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="• Share your location with trusted contacts" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Keep emergency numbers on speed dial" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Trust your instincts" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="• Stay aware of your surroundings" />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emergency Alert Dialog */}
      <Dialog open={emergencyDialogOpen} onClose={() => setEmergencyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1, color: 'error.main' }} />
            Send Emergency Alert
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will send an emergency alert to your emergency contacts and nearby authorities.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Emergency Message (Optional)"
            placeholder="Describe your emergency situation..."
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Your current location will be automatically included in the alert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>
            Cancel
          </Button>
                     <Button 
             variant="contained" 
             color="error" 
             onClick={handleEmergencyAlert}
           >
             <Send sx={{ mr: 1 }} />
             Send Emergency Alert
           </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Emergency Button */}
      <SpeedDial
        ariaLabel="Emergency actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
                 icon={<Warning />}
        FabProps={{ color: 'error' }}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default Emergency;
