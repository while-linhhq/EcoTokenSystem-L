import { useState, useEffect } from 'react';
import { normalizeStoryImageUrl } from '../../api/storiesApi';
import './Stories.css';

/**
 * StoryCircle Component
 *
 * Displays a circular user avatar with story indicator
 * Shows gradient ring for unviewed stories
 */
const StoryCircle = ({ userStories, currentUserId, onClick }) => {
  const [profileImage, setProfileImage] = useState('');

  // Extract user info from first story
  const firstStory = userStories[0];
  const userId = firstStory?.userId;
  const userName = firstStory?.userName || 'User';
  const isCurrentUser = userId === currentUserId;

  // Check if user has viewed all stories
  const hasUnviewedStories = userStories.some(story => {
    const viewers = story.viewers || [];
    return !viewers.includes(currentUserId);
  });

  useEffect(() => {
    // Fetch user profile image
    const fetchUserProfile = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
        const response = await fetch(`${API_BASE_URL}/Users/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          setProfileImage(userData.profileImageUrl || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleClick = () => {
    if (onClick) {
      onClick(userStories, userId);
    }
  };

  return (
    <div className="story-circle-container" onClick={handleClick}>
      <div className={`story-circle ${hasUnviewedStories ? 'unviewed' : 'viewed'}`}>
        <div className="story-circle-inner">
          {profileImage ? (
            <img
              src={normalizeStoryImageUrl(profileImage)}
              alt={userName}
              className="story-avatar"
            />
          ) : (
            <div className="story-avatar-placeholder">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="story-username">
        {isCurrentUser ? 'Story của bạn' : userName}
      </div>
    </div>
  );
};

export default StoryCircle;
