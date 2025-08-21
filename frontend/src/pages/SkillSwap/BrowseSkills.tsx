import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  LocationOn,
  Schedule,
  Computer,
  Person,
  Send,
  Star,
  FilterList
} from '@mui/icons-material';
import { skillSwapApi, SkillCategory, SkillTeacher, BrowseFilters } from '../../api/skillSwapApi';

const BrowseSkills: React.FC = () => {
  const [skills, setSkills] = useState<SkillTeacher[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrowseFilters>({
    page: 1,
    per_page: 12
  });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState<SkillTeacher | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load skills when filters change
  useEffect(() => {
    loadSkills();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await skillSwapApi.getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadSkills = async () => {
    try {
      setLoading(true);
      const data = await skillSwapApi.browseSkills(filters);
      setSkills(data.skills);
      setTotalPages(data.pages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof BrowseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when other filters change
    }));
  };

  const handleRequestSkill = (skill: SkillTeacher) => {
    setSelectedSkill(skill);
    setRequestMessage(`Hi ${skill.teacher.username}! I'm interested in learning ${skill.skill.name}. Could you help me get started?`);
    setRequestDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedSkill) return;

    try {
      setRequestLoading(true);
      await skillSwapApi.requestMatch({
        teacher_id: selectedSkill.teacher.id,
        skill_id: selectedSkill.skill.id,
        message: requestMessage
      });
      
      setRequestDialogOpen(false);
      setRequestMessage('');
      setSelectedSkill(null);
      
      // Show success message (you might want to use a snackbar here)
      alert('Learning request sent successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'online': return <Computer fontSize="small" />;
      case 'offline': return <Person fontSize="small" />;
      default: return <Computer fontSize="small" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'online': return 'primary';
      case 'offline': return 'secondary';
      case 'both': return 'success';
      default: return 'default';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'error';
      case 'advanced': return 'warning';
      case 'intermediate': return 'info';
      case 'beginner': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Skills"
              variant="outlined"
              size="small"
              value={filters.skill_name || ''}
              onChange={(e) => handleFilterChange('skill_name', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category_id || ''}
                label="Category"
                onChange={(e) => handleFilterChange('category_id', e.target.value || undefined)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Location"
              variant="outlined"
              size="small"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Method</InputLabel>
              <Select
                value={filters.method || ''}
                label="Method"
                onChange={(e) => handleFilterChange('method', e.target.value || undefined)}
              >
                <MenuItem value="">All Methods</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : skills.length === 0 ? (
        <Alert severity="info">No skills found matching your criteria. Try adjusting your filters.</Alert>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Found {skills.length} skills available to learn
          </Typography>
          
          <Grid container spacing={3}>
            {skills.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': { 
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Teacher Info */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        src={skill.teacher.profile_image} 
                        sx={{ width: 48, height: 48, mr: 2 }}
                      >
                        {skill.teacher.username[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {skill.teacher.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" />
                          {skill.teacher.location || 'Location not specified'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Skill Info */}
                    <Typography variant="h6" gutterBottom color="primary">
                      {skill.skill.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {skill.skill.category}
                    </Typography>
                    
                    {skill.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {skill.description}
                      </Typography>
                    )}

                    {/* Tags */}
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      <Chip 
                        size="small" 
                        label={skill.proficiency_level}
                        color={getProficiencyColor(skill.proficiency_level) as any}
                        variant="outlined"
                      />
                      <Chip 
                        size="small" 
                        icon={getMethodIcon(skill.preferred_method)}
                        label={skill.preferred_method}
                        color={getMethodColor(skill.preferred_method) as any}
                        variant="outlined"
                      />
                    </Box>

                    {skill.availability && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                        <Schedule fontSize="small" />
                        {skill.availability}
                      </Typography>
                    )}
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => handleRequestSkill(skill)}
                      sx={{ borderRadius: 2 }}
                    >
                      Request to Learn
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={filters.page || 1}
                onChange={(_, page) => handleFilterChange('page', page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Request Dialog */}
      <Dialog 
        open={requestDialogOpen} 
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Request to Learn: {selectedSkill?.skill.name}
        </DialogTitle>
        <DialogContent>
          {selectedSkill && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  src={selectedSkill.teacher.profile_image} 
                  sx={{ width: 40, height: 40, mr: 2 }}
                >
                  {selectedSkill.teacher.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {selectedSkill.teacher.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSkill.proficiency_level} level • {selectedSkill.preferred_method}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like to learn this skill..."
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={submitRequest}
            variant="contained"
            disabled={requestLoading || !requestMessage.trim()}
            startIcon={requestLoading ? <CircularProgress size={20} /> : <Send />}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrowseSkills;