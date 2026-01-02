/**
 * Stories API
 *
 * API functions for managing user stories (24-hour temporary posts)
 */

import { apiGet, apiPost, apiDelete } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';

/**
 * Get all active stories (within 24 hours)
 * @returns {Promise} Array of story objects
 */
export const getStoriesApi = async () => {
  try {
    // Public endpoint - no authentication required
    const result = await apiGet('/Stories', false);
    
    // Handle different response formats
    let stories = [];
    if (Array.isArray(result.data)) {
      stories = result.data;
    } else if (result.data?.Data && Array.isArray(result.data.Data)) {
      stories = result.data.Data;
    }
    
    return { success: true, data: stories };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return { success: false, message: error.message, data: [] };
  }
};

/**
 * Get stories for a specific user
 * @param {string} userId - User ID
 * @returns {Promise} Array of user's stories
 */
export const getUserStoriesApi = async (userId) => {
  try {
    // Public endpoint - no authentication required
    const result = await apiGet(`/Stories/user/${userId}`, false);
    return { success: true, data: result.data || [] };
  } catch (error) {
    console.error('Error fetching user stories:', error);
    return { success: false, message: error.message, data: [] };
  }
};

/**
 * Upload a new story
 * @param {FormData} formData - Story data with image
 * @returns {Promise} Created story object
 */
export const uploadStoryApi = async (formData) => {
  try {
    // Authentication required + FormData
    const result = await apiPost('/Stories', formData, true, true);
    return { success: true, data: result.data, message: 'Story đã được đăng!' };
  } catch (error) {
    console.error('Error uploading story:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Mark a story as viewed by the current user
 * @param {string} storyId - Story ID
 * @param {string} viewerId - Viewer's user ID
 * @returns {Promise} Updated story object
 */
export const viewStoryApi = async (storyId, viewerId) => {
  try {
    // Authentication required
    const result = await apiPost(`/Stories/${storyId}/view`, { viewerId }, true);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error viewing story:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete a story (only owner can delete)
 * @param {string} storyId - Story ID
 * @returns {Promise} Success status
 */
export const deleteStoryApi = async (storyId) => {
  try {
    // Authentication required
    const result = await apiDelete(`/Stories/${storyId}`, true);
    return { success: true, message: 'Story đã được xóa' };
  } catch (error) {
    console.error('Error deleting story:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Helper function to check if a story is still active (within 24 hours)
 * @param {string} createdAt - Story creation timestamp
 * @returns {boolean} True if story is still active
 */
export const isStoryActive = (createdAt) => {
  const storyDate = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now - storyDate) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

/**
 * Get time remaining for a story (in hours)
 * @param {string} createdAt - Story creation timestamp
 * @returns {number} Hours remaining (0 if expired)
 */
export const getStoryTimeRemaining = (createdAt) => {
  const storyDate = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now - storyDate) / (1000 * 60 * 60);
  const remaining = 24 - hoursDiff;
  return remaining > 0 ? Math.floor(remaining) : 0;
};

/**
 * Normalize image URL (handle both relative and absolute URLs)
 * @param {string} imageUrl - Image URL from API
 * @returns {string} Absolute image URL
 */
export const normalizeStoryImageUrl = (imageUrl) => {
  if (!imageUrl) return '';

  // If already absolute URL (http/https), keep as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert relative path to absolute backend URL
  const backendBaseUrl = API_BASE_URL.replace('/api', '');
  return `${backendBaseUrl}${imageUrl}`;
};
