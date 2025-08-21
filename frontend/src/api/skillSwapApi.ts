import api from './axios';

// Types
export interface SkillCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  skills_count: number;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  category_id: number;
}

export interface UserSkill {
  id: number;
  skill: {
    id: number;
    name: string;
    category: string;
  };
  skill_type: 'teach' | 'learn';
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  availability: string;
  preferred_method: 'online' | 'offline' | 'both';
  created_at: string;
  updated_at: string;
}

export interface SkillTeacher {
  id: number;
  skill: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
  teacher: {
    id: number;
    username: string;
    location: string;
    profile_image: string;
  };
  proficiency_level: string;
  description: string;
  availability: string;
  preferred_method: string;
  created_at: string;
}

export interface SkillMatch {
  id: number;
  skill: {
    id: number;
    name: string;
    category: string;
  };
  teacher: {
    id: number;
    username: string;
    profile_image: string;
  };
  learner: {
    id: number;
    username: string;
    profile_image: string;
  };
  message: string;
  teacher_response: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: number;
  badge_type: string;
  badge_name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface SkillStats {
  teaching_skills: number;
  learning_skills: number;
  teaching_requests_received: number;
  learning_requests_sent: number;
  active_teaching_matches: number;
  active_learning_matches: number;
  average_rating: number;
  total_ratings: number;
  badges_earned: number;
}

export interface BrowseFilters {
  category_id?: number;
  skill_name?: string;
  location?: string;
  method?: 'online' | 'offline' | 'both';
  page?: number;
  per_page?: number;
}

// API Functions
export const skillSwapApi = {
  // Get all skill categories
  getCategories: async (): Promise<{ categories: SkillCategory[] }> => {
    const response = await api.get('/api/skills/categories');
    return response.data;
  },

  // Search skills
  searchSkills: async (query: string, categoryId?: number): Promise<{ skills: Skill[] }> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (categoryId) params.append('category_id', categoryId.toString());
    
    const response = await api.get(`/api/skills/search?${params}`);
    return response.data;
  },

  // Add or update user skill
  addUserSkill: async (skillData: {
    skill_id: number;
    skill_type: 'teach' | 'learn';
    proficiency_level?: string;
    description?: string;
    availability?: string;
    preferred_method?: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/api/skills/user-skills', skillData);
    return response.data;
  },

  // Get user's skills
  getUserSkills: async (type?: 'teach' | 'learn'): Promise<{ skills: UserSkill[] }> => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/api/skills/user-skills${params}`);
    return response.data;
  },

  // Browse available skills
  browseSkills: async (filters: BrowseFilters = {}): Promise<{
    skills: SkillTeacher[];
    total: number;
    pages: number;
    current_page: number;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/skills/browse?${params}`);
    return response.data;
  },

  // Request to learn from someone
  requestMatch: async (data: {
    teacher_id: number;
    skill_id: number;
    message: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/api/skills/request-match', data);
    return response.data;
  },

  // Get skill match requests
  getMatchRequests: async (type: 'received' | 'sent' = 'received', status?: string): Promise<{
    matches: SkillMatch[];
  }> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (status) params.append('status', status);
    
    const response = await api.get(`/api/skills/match-requests?${params}`);
    return response.data;
  },

  // Respond to skill match request
  respondToMatch: async (matchId: number, data: {
    action: 'accept' | 'reject';
    message?: string;
  }): Promise<{ message: string }> => {
    const response = await api.post(`/api/skills/match-requests/${matchId}/respond`, data);
    return response.data;
  },

  // Get user's badges
  getUserBadges: async (): Promise<{ badges: UserBadge[] }> => {
    const response = await api.get('/api/skills/badges');
    return response.data;
  },

  // Get skill statistics
  getSkillStats: async (): Promise<SkillStats> => {
    const response = await api.get('/api/skills/stats');
    return response.data;
  },

  // Delete user skill
  deleteUserSkill: async (skillId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/skills/user-skills/${skillId}`);
    return response.data;
  },

  // Rate a skill exchange
  rateSkillExchange: async (data: {
    rated_user_id: number;
    skill_id: number;
    rating: number;
    review?: string;
    match_id?: number;
  }): Promise<{ message: string }> => {
    const response = await api.post('/api/skills/rate', data);
    return response.data;
  }
};

export default skillSwapApi;