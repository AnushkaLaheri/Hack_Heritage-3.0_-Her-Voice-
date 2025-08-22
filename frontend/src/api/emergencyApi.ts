import api from './axios';

export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
}

export interface EmergencyContactInput {
  name: string;
  phone: string;
  relationship?: string;
}

// Get user's emergency contacts
export const getEmergencyContacts = async (userId: number): Promise<EmergencyContact[]> => {
  const response = await api.get(`/api/emergency/contacts/${userId}`);
  return response.data;
};

// Add a new emergency contact
export const addEmergencyContact = async (userId: number, contact: EmergencyContactInput): Promise<EmergencyContact> => {
  const response = await api.post('/api/emergency/contacts', {
    user_id: userId,
    ...contact
  });
  return response.data.contact;
};

// Update emergency contact (using the profile endpoint)
export const updateEmergencyContact = async (contact: EmergencyContactInput): Promise<void> => {
  await api.put('/api/profile/emergency-contact', contact);
};

// Delete emergency contact
export const deleteEmergencyContact = async (contactId: number): Promise<void> => {
  await api.delete(`/api/emergency/contacts/${contactId}`);
};

// SOS related functions
export const startSOS = async (userId: number, latitude?: number, longitude?: number) => {
  const response = await api.post('/api/sos/start', {
    user_id: userId,
    latitude,
    longitude
  });
  return response.data;
};

export const stopSOS = async (sosId: number) => {
  const response = await api.post('/api/sos/stop', {
    sos_id: sosId
  });
  return response.data;
};

export const updateSOSLocation = async (sosId: number, latitude: number, longitude: number) => {
  const response = await api.post('/api/sos/update', {
    sos_id: sosId,
    latitude,
    longitude
  });
  return response.data;
};

export const getActiveSOSStatus = async (userId: number) => {
  const response = await api.get(`/api/sos/active/${userId}`);
  return response.data;
};