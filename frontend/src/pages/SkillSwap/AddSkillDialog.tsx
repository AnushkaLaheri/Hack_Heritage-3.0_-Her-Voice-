import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Box,
  Typography,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  School,
  MenuBook,
  Search,
  Add
} from '@mui/icons-material';
import { skillSwapApi, SkillCategory, Skill } from '../../api/skillSwapApi';

interface AddSkillDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddSkillDialog: React.FC<AddSkillDialogProps> = ({ open, onClose }) => {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [skillType, setSkillType] = useState<'teach' | 'learn'>('teach');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillSearch, setSkillSearch] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [preferredMethod, setPreferredMethod] = useState('');

  useEffect(() => {
    if (open) {
      loadCategories();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCategory || skillSearch) {
      searchSkills();
    }
  }, [selectedCategory, skillSearch]);

  const loadCategories = async () => {
    try {
      const data = await skillSwapApi.getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const searchSkills = async () => {
    try {
      setSearchLoading(true);
      const data = await skillSwapApi.searchSkills(
        skillSearch, 
        selectedCategory ? Number(selectedCategory) : undefined
      );
      setSkills(data.skills);
    } catch (err) {
      console.error('Failed to search skills:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const resetForm = () => {
    setSkillType('teach');
    setSelectedCategory('');
    setSelectedSkill(null);
    setSkillSearch('');
    setProficiencyLevel('');
    setDescription('');
    setAvailability('');
    setPreferredMethod('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedSkill) {
      setError('Please select a skill');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await skillSwapApi.addUserSkill({
        skill_id: selectedSkill.id,
        skill_type: skillType,
        proficiency_level: proficiencyLevel || undefined,
        description: description || undefined,
        availability: availability || undefined,
        preferred_method: preferredMethod || undefined
      });

      onClose();
      // You might want to trigger a refresh of the parent component here
      window.location.reload(); // Simple refresh for now
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedSkill && skillType;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add color="primary" />
          Add New Skill
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share what you can teach or add what you want to learn
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Skill Type Selection */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                What would you like to do?
              </FormLabel>
              <RadioGroup
                row
                value={skillType}
                onChange={(e) => setSkillType(e.target.value as 'teach' | 'learn')}
              >
                <FormControlLabel 
                  value="teach" 
                  control={<Radio />} 
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <MenuBook color="secondary" />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">Teach a Skill</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Share your expertise with others
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ 
                    border: 1, 
                    borderColor: skillType === 'teach' ? 'secondary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    mr: 2,
                    bgcolor: skillType === 'teach' ? 'secondary.50' : 'transparent'
                  }}
                />
                <FormControlLabel 
                  value="learn" 
                  control={<Radio />} 
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <School color="primary" />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">Learn a Skill</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Find teachers for skills you want to learn
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ 
                    border: 1, 
                    borderColor: skillType === 'learn' ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: skillType === 'learn' ? 'primary.50' : 'transparent'
                  }}
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Category Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value as number | "")}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{category.icon}</span>
                      <Box>
                        <Typography variant="body1">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.skills_count} skills
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Skill Search/Selection */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={skills}
              getOptionLabel={(option) => option.name}
              value={selectedSkill}
              onChange={(_, newValue) => setSelectedSkill(newValue)}
              inputValue={skillSearch}
              onInputChange={(_, newInputValue) => setSkillSearch(newInputValue)}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search & Select Skill"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.category} • {option.description}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText={
                skillSearch ? "No skills found. Try a different search term." : "Start typing to search skills..."
              }
            />
          </Grid>

          {/* Proficiency Level (for teaching) */}
          {skillType === 'teach' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Your Proficiency Level</InputLabel>
                <Select
                  value={proficiencyLevel}
                  label="Your Proficiency Level"
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                >
                  <MenuItem value="beginner">
                    <Box>
                      <Typography variant="body1">Beginner</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Basic understanding, can teach fundamentals
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="intermediate">
                    <Box>
                      <Typography variant="body1">Intermediate</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Good understanding, can teach practical applications
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="advanced">
                    <Box>
                      <Typography variant="body1">Advanced</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deep knowledge, can teach complex concepts
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="expert">
                    <Box>
                      <Typography variant="body1">Expert</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Professional level, can teach advanced techniques
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Preferred Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Preferred Method</InputLabel>
              <Select
                value={preferredMethod}
                label="Preferred Method"
                onChange={(e) => setPreferredMethod(e.target.value)}
              >
                <MenuItem value="online">Online (Video calls, chat)</MenuItem>
                <MenuItem value="offline">Offline (In-person meetings)</MenuItem>
                <MenuItem value="both">Both (Flexible)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Availability */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="e.g., Weekends, Evenings after 6 PM, Flexible"
              helperText="When are you available for teaching/learning sessions?"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={skillType === 'teach' ? "Teaching Description" : "Learning Goals"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                skillType === 'teach' 
                  ? "Describe your teaching approach, what you can cover, any prerequisites..."
                  : "Describe what you want to learn, your current level, specific goals..."
              }
              helperText={
                skillType === 'teach'
                  ? "Help learners understand what they can expect from your teaching"
                  : "Help teachers understand your learning needs and goals"
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : (skillType === 'teach' ? <MenuBook /> : <School />)}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Adding...' : `Add ${skillType === 'teach' ? 'Teaching' : 'Learning'} Skill`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSkillDialog;