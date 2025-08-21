import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Inbox,
  Send,
  Check,
  Close,
  Schedule,
  Person,
  Message,
  Notifications,
  Star
} from '@mui/icons-material';
import { skillSwapApi, SkillMatch } from '../../api/skillSwapApi';

const SkillRequests: React.FC = () => {
  const [receivedRequests, setReceivedRequests] = useState<SkillMatch[]>([]);
  const [sentRequests, setSentRequests] = useState<SkillMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [responseDialog, setResponseDialog] = useState<{
    open: boolean;
    match: SkillMatch | null;
    action: 'accept' | 'reject' | null;
  }>({
    open: false,
    match: null,
    action: null
  });
  const [responseMessage, setResponseMessage] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [receivedData, sentData] = await Promise.all([
        skillSwapApi.getMatchRequests('received'),
        skillSwapApi.getMatchRequests('sent')
      ]);
      
      setReceivedRequests(receivedData.matches);
      setSentRequests(sentData.matches);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!responseDialog.match || !responseDialog.action) return;

    try {
      setResponseLoading(true);
      await skillSwapApi.respondToMatch(responseDialog.match.id, {
        action: responseDialog.action,
        message: responseMessage
      });

      setReceivedRequests(prev =>
  prev.map(req =>
    req.id === responseDialog.match!.id
      ? { 
          ...req, 
          status: responseDialog.action === "accept" ? "accepted" : "rejected", 
          teacher_response: responseMessage 
        }
      : req
  )
);


      setResponseDialog({ open: false, match: null, action: null });
      setResponseMessage('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to respond to request');
    } finally {
      setResponseLoading(false);
    }
  };

  const openResponseDialog = (match: SkillMatch, action: 'accept' | 'reject') => {
    setResponseDialog({ open: true, match, action });
    setResponseMessage(
      action === 'accept' 
        ? `Hi ${match.learner.username}! I'd be happy to help you learn ${match.skill.name}. Let's discuss the details!`
        : `Hi ${match.learner.username}, thank you for your interest in learning ${match.skill.name}. Unfortunately, I'm not available to teach this right now.`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'accepted': return <Check />;
      case 'rejected': return <Close />;
      default: return <Schedule />;
    }
  };

  const RequestCard: React.FC<{ 
    match: SkillMatch; 
    type: 'received' | 'sent';
  }> = ({ match, type }) => (
    <Card sx={{ 
      mb: 2,
      border: match.status === 'pending' ? '2px solid' : '1px solid',
      borderColor: match.status === 'pending' ? 'warning.main' : 'divider',
      '&:hover': { 
        boxShadow: 4,
        transform: 'translateY(-1px)',
        transition: 'all 0.2s ease-in-out'
      }
    }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* User Info */}
          <Grid item xs={12} sm={8}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar 
                src={type === 'received' ? match.learner.profile_image : match.teacher.profile_image}
                sx={{ width: 48, height: 48, mr: 2 }}
              >
                {(type === 'received' ? match.learner.username : match.teacher.username)[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {type === 'received' ? match.learner.username : match.teacher.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {type === 'received' ? 'wants to learn' : 'teaching'} • {match.skill.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {match.skill.category}
                </Typography>
              </Box>
            </Box>

            {/* Message */}
            <Box mb={2}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {type === 'received' ? 'Their message:' : 'Your message:'}
              </Typography>
              <Typography variant="body2" sx={{ 
                bgcolor: 'grey.50', 
                p: 2, 
                borderRadius: 1,
                fontStyle: 'italic'
              }}>
                "{match.message}"
              </Typography>
            </Box>

            {/* Teacher Response (if any) */}
            {match.teacher_response && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {type === 'received' ? 'Your response:' : 'Their response:'}
                </Typography>
                <Typography variant="body2" sx={{ 
                  bgcolor: match.status === 'accepted' ? 'success.50' : 'error.50', 
                  p: 2, 
                  borderRadius: 1,
                  fontStyle: 'italic'
                }}>
                  "{match.teacher_response}"
                </Typography>
              </Box>
            )}

            {/* Dates */}
            <Box display="flex" gap={2}>
              <Typography variant="caption" color="text.secondary">
                Requested: {new Date(match.created_at).toLocaleDateString()}
              </Typography>
              {match.updated_at !== match.created_at && (
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(match.updated_at).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Status & Actions */}
          <Grid item xs={12} sm={4}>
            <Box display="flex" flexDirection="column" alignItems="flex-end" height="100%">
              {/* Status */}
              <Chip
                icon={getStatusIcon(match.status)}
                label={match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                color={getStatusColor(match.status) as any}
                variant={match.status === 'pending' ? 'filled' : 'outlined'}
                sx={{ mb: 2 }}
              />

              {/* Actions for received pending requests */}
              {type === 'received' && match.status === 'pending' && (
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<Check />}
                    onClick={() => openResponseDialog(match, 'accept')}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Close />}
                    onClick={() => openResponseDialog(match, 'reject')}
                  >
                    Decline
                  </Button>
                </Box>
              )}

              {/* Contact button for accepted requests */}
              {match.status === 'accepted' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Message />}
                  sx={{ mt: 1 }}
                >
                  Contact
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const pendingReceivedCount = receivedRequests.filter(r => r.status === 'pending').length;
  const pendingSentCount = sentRequests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Skill Requests
        </Typography>
        {(pendingReceivedCount > 0 || pendingSentCount > 0) && (
          <Alert severity="info" sx={{ ml: 2 }}>
            You have {pendingReceivedCount + pendingSentCount} pending request(s)
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={
              <Badge badgeContent={pendingReceivedCount} color="error">
                <Inbox />
              </Badge>
            } 
            label={`Received (${receivedRequests.length})`}
            sx={{ minHeight: 60 }}
          />
          <Tab 
            icon={
              <Badge badgeContent={pendingSentCount} color="warning">
                <Send />
              </Badge>
            } 
            label={`Sent (${sentRequests.length})`}
            sx={{ minHeight: 60 }}
          />
        </Tabs>
      </Box>

      {/* Received Requests Tab */}
      {tabValue === 0 && (
        <Box>
          {receivedRequests.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Inbox sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Teaching Requests Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When people want to learn from you, their requests will appear here.
              </Typography>
            </Card>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Teaching Requests:</strong> People who want to learn from you. 
                  Respond to help them start their learning journey!
                </Typography>
              </Alert>
              {receivedRequests.map((match) => (
                <RequestCard key={match.id} match={match} type="received" />
              ))}
            </>
          )}
        </Box>
      )}

      {/* Sent Requests Tab */}
      {tabValue === 1 && (
        <Box>
          {sentRequests.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Send sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Learning Requests Sent
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse skills and send requests to teachers you'd like to learn from.
              </Typography>
            </Card>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Learning Requests:</strong> Your requests to learn from others. 
                  Track the status and wait for responses!
                </Typography>
              </Alert>
              {sentRequests.map((match) => (
                <RequestCard key={match.id} match={match} type="sent" />
              ))}
            </>
          )}
        </Box>
      )}

      {/* Response Dialog */}
      <Dialog
        open={responseDialog.open}
        onClose={() => setResponseDialog({ open: false, match: null, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {responseDialog.action === 'accept' ? 'Accept' : 'Decline'} Learning Request
        </DialogTitle>
        <DialogContent>
          {responseDialog.match && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  src={responseDialog.match.learner.profile_image}
                  sx={{ width: 40, height: 40, mr: 2 }}
                >
                  {responseDialog.match.learner.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {responseDialog.match.learner.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    wants to learn {responseDialog.match.skill.name}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Their message:
              </Typography>
              <Typography variant="body2" sx={{ 
                bgcolor: 'grey.50', 
                p: 2, 
                borderRadius: 1,
                mb: 2,
                fontStyle: 'italic'
              }}>
                "{responseDialog.match.message}"
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your response"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  responseDialog.action === 'accept'
                    ? "Let them know you're excited to teach and discuss next steps..."
                    : "Politely explain why you can't teach this skill right now..."
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog({ open: false, match: null, action: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleResponse}
            variant="contained"
            color={responseDialog.action === 'accept' ? 'success' : 'error'}
            disabled={responseLoading || !responseMessage.trim()}
            startIcon={
              responseLoading ? <CircularProgress size={20} /> : 
              responseDialog.action === 'accept' ? <Check /> : <Close />
            }
          >
            {responseDialog.action === 'accept' ? 'Accept Request' : 'Decline Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SkillRequests;