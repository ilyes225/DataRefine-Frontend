// src/api/projects.js
import client from './client';

export const getProjects = () => client.get('/projects/');
export const createProject = (name, domain) => client.post('/projects/', { name, domain });
export const assignUser = (projectId, userId) => client.post(`/projects/${projectId}/assign`, { user_id: userId });
export const unassignUser = (projectId, userId) => client.delete(`/projects/${projectId}/unassign/${userId}`);
export const deleteProject = (projectId) => client.delete(`/projects/${projectId}`);
export const getMyTeam = () => client.get('/projects/my-team');