import { normalizeStoryImageUrl } from '../../api/storiesApi';
import { getAvatarImageUrl } from '../../utils/imageUtils';
import './Stories.css';

/**
 * StoryCircle Component
 *
 * Displays a circular user avatar with story indicator
 * Shows gradient ring for unviewed stories
 */
const StoryCircle = ({ userStories, currentUserId, onClick }) => {
  // Extract user info from first story
  const firstStory = userStories[0];
  const userId = firstStory?.userId || firstStory?.UserId;
  const userName = firstStory?.userName || firstStory?.UserName || 'User';
  const userAvatar = firstStory?.userAvatar || firstStory?.UserAvatar || '';
  const isCurrentUser = userId === currentUserId;

  // Check if user has viewed all stories
  const hasUnviewedStories = userStories.some(story => {
    const viewers = story.viewers || story.Viewers || [];
    return currentUserId && !viewers.includes(currentUserId);
  });

  // Get avatar image URL
  const avatarImageUrl = getAvatarImageUrl(userAvatar);
  const displayAvatar = avatarImageUrl;
  const displayEmoji = !displayAvatar ? (userAvatar || userName.charAt(0).toUpperCase()) : null;

  const handleClick = () => {
    if (onClick) {
      onClick(userStories, userId);
    }
  };

  return (
    <div className="story-circle-container" onClick={handleClick}>
      <div className={`story-circle ${hasUnviewedStories ? 'unviewed' : 'viewed'}`}>
        <div className="story-circle-inner">
          {displayAvatar ? (
            <img
              src={normalizeStoryImageUrl(displayAvatar)}
              alt={userName}
              className="story-avatar"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.target.style.display = 'none';
                const placeholder = e.target.parentElement.querySelector('.story-avatar-placeholder-fallback');
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          {displayEmoji && (
            <div className={`story-avatar-placeholder ${displayAvatar ? 'story-avatar-placeholder-fallback' : ''}`} style={{ display: displayAvatar ? 'none' : 'flex' }}>
              {displayEmoji.length === 1 ? displayEmoji : displayEmoji.charAt(0).toUpperCase()}
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
