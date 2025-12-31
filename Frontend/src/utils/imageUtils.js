/**
 * Image URL Utilities
 * Helper functions for handling S3, CloudFront, and data:image URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Check if URL is a valid image URL (S3, CloudFront, http, https, or data:image)
 * @param {string} url - URL to check
 * @returns {boolean} True if valid image URL
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image') ||
         url.startsWith('http://') ||
         url.startsWith('https://');
};

/**
 * Normalize image URL - convert relative paths to absolute, keep absolute URLs as-is
 * @param {string} imageUrl - Image URL from API
 * @returns {string} Normalized absolute URL or empty string
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '';

  // Already absolute URL (http, https, or data:image), keep as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:image')) {
    return imageUrl;
  }

  // Relative path from root (starts with /)
  if (imageUrl.startsWith('/')) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }

  // Relative path without leading slash
  return `${BACKEND_BASE_URL}/${imageUrl}`;
};

/**
 * Get avatar image URL if valid, otherwise return null
 * Used to distinguish between image avatars and emoji avatars
 * @param {string} avatar - Avatar value (could be emoji, URL, or data:image)
 * @returns {string|null} Image URL or null if avatar is emoji
 */
export const getAvatarImageUrl = (avatar) => {
  if (!avatar) return null;
  return isValidImageUrl(avatar) ? normalizeImageUrl(avatar) : null;
};
