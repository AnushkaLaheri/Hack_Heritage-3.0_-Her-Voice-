import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Warning, LocationOn, Phone } from '@mui/icons-material';
import { RootState } from '../../store';
import { startSOS, stopSOS, updateSOSLocation, getActiveSOSStatus } from '../../api/emergencyApi';

interface SOSButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({ 
  variant = 'contained', 
  size = 'large',
  fullWidth = false 
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [sosActive, setSosActive] = useState(false);
  const [sosId, setSosId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'getting' | 'success' | 'error' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [contactsNotified, setContactsNotified] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  // Check for active SOS on component mount
  useEffect(() => {
    if (user) {
      checkActiveSOSStatus();
    }
  }, [user]);

  const checkActiveSOSStatus = async () => {
    if (!user) return;
    
    try {
      const status = await getActiveSOSStatus(user.id);
      if (status.active) {
        setSosActive(true);
        setSosId(status.sos_id);
        startLocationTracking();
      }
    } catch (error) {
      console.error('Error checking SOS status:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const handleSOSStart = async () => {
    if (!user) return;

    setLoading(true);
    setLocationStatus('getting');
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationStatus('success');

      // Start SOS with location
      const response = await startSOS(user.id, location.lat, location.lng);
      
      setSosId(response.sos_id);
      setSosActive(true);
      setContactsNotified(response.contacts_notified || 0);
      setTotalContacts(response.total_contacts || 0);
      
      // Start location tracking
      startLocationTracking();
      
      setDialogOpen(true);
    } catch (error) {
      console.error('SOS start error:', error);
      setLocationStatus('error');
      
      // Try to start SOS without location as fallback
      try {
        const response = await startSOS(user.id);
        setSosId(response.sos_id);
        setSosActive(true);
        setContactsNotified(response.contacts_notified || 0);
        setTotalContacts(response.total_contacts || 0);
        setDialogOpen(true);
      } catch (fallbackError) {
        console.error('SOS fallback error:', fallbackError);
        alert('Failed to start SOS. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSOSStop = async () => {
    if (!sosId) return;

    setLoading(true);
    try {
      await stopSOS(sosId);
      setSosActive(false);
      setSosId(null);
      stopLocationTracking();
      setDialogOpen(false);
      setLocationStatus(null);
      setCurrentLocation(null);
      setContactsNotified(0);
      setTotalContacts(0);
    } catch (error) {
      console.error('SOS stop error:', error);
      alert('Failed to stop SOS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (!sosId) return;

    locationInterval.current = setInterval(async () => {
      try {
        const location = await getCurrentLocation();
        await updateSOSLocation(sosId, location.lat, location.lng);
        setCurrentLocation(location);
      } catch (error) {
        console.error('Location update error:', error);
      }
    }, 30000); // Update every 30 seconds
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'getting':
        return 'Getting your location...';
      case 'success':
        return 'Location obtained successfully';
      case 'error':
        return 'Could not get location, but SOS is still active';
      default:
        return '';
    }
  };

  return (
    <>
      <Button
        variant={variant}
        color={sosActive ? 'secondary' : 'error'}
        size={size}
        fullWidth={fullWidth}
        onClick={sosActive ? handleSOSStop : handleSOSStart}
        disabled={loading || !user}
        startIcon={loading ? <CircularProgress size={20} /> : <Warning />}
        sx={{
          fontSize: size === 'large' ? '1.2rem' : undefined,
          fontWeight: 'bold',
          ...(sosActive && {
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
              },
            },
          }),
        }}
      >
        {loading ? 'Processing...' : sosActive ? 'STOP SOS' : 'SOS ALERT'}
      </Button>

      {/* SOS Status Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <Warning sx={{ mr: 1 }} />
            SOS Alert Active
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>SOS Alert has been sent!</strong>
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Emergency Contacts Notified:</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip 
                icon={<Phone />} 
                label={`${contactsNotified} of ${totalContacts} contacts notified`}
                color={contactsNotified > 0 ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
            {contactsNotified === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                No emergency contacts found. Please add emergency contacts in your profile.
              </Alert>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Location Status:</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn color={locationStatus === 'success' ? 'success' : 'disabled'} />
              <Typography variant="body2" color="text.secondary">
                {getLocationStatusText()}
              </Typography>
            </Box>
            {currentLocation && (
              <Typography variant="caption" color="text.secondary">
                Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
              </Typography>
            )}
          </Box>

          <Alert severity="info">
            Your location is being tracked and updated every 30 seconds. 
            Emergency services and your contacts have been notified.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Keep Running in Background
          </Button>
          <Button 
            onClick={handleSOSStop} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Stop SOS
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SOSButton;