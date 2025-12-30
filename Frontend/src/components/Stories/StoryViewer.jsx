import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { viewStoryApi, deleteStoryApi, normalizeStoryImageUrl, getStoryTimeRemaining } from '../../api/storiesApi';
import { showSuccess, showError } from '../../utils/toast';
import './Stories.css';

/**
 * StoryViewer Component
 *
 * Full-screen Instagram-style story viewer
 * Features: auto-advance, progress bars, swipe navigation, delete option
 */
const StoryViewer = ({ allStories, initialUserId, currentUserId, onClose, onStoryDeleted }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  // Find initial user index
  useEffect(() => {
    const initialIndex = allStories.findIndex(
      (userStories) => userStories[0]?.userId === initialUserId
    );
    if (initialIndex !== -1) {
      setCurrentUserIndex(initialIndex);
    }
  }, [allStories, initialUserId]);

  // Current user's stories
  const currentUserStories = allStories[currentUserIndex] || [];
  const currentStory = currentUserStories[currentStoryIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && currentStory.userId !== currentUserId) {
      const viewers = currentStory.viewers || [];
      if (!viewers.includes(currentUserId)) {
        viewStoryApi(currentStory.id, currentUserId).catch(console.error);
      }
    }
  }, [currentStory, currentUserId]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused || !currentStory) return;

    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentUserIndex, currentStoryIndex, isPaused]);

  const handleNext = () => {
    // Move to next story in current user's stories
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
    // Move to next user's stories
    else if (currentUserIndex < allStories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    }
    // End of all stories
    else {
      onClose();
    }
  };

  const handlePrevious = () => {
    // Move to previous story in current user's stories
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
    // Move to previous user's stories
    else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      const prevUserStories = allStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  };

  const handleDelete = async () => {
    if (!currentStory || currentStory.userId !== currentUserId) return;

    if (!window.confirm('Bạn có chắc muốn xóa Story này?')) return;

    try {
      const result = await deleteStoryApi(currentStory.id);
      if (result.success) {
        showSuccess(result.message);
        if (onStoryDeleted) {
          onStoryDeleted(currentStory.id);
        }
        // Move to next story or close if it was the last one
        if (currentUserStories.length > 1) {
          handleNext();
        } else {
          onClose();
        }
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError('Không thể xóa Story');
      console.error('Delete story error:', error);
    }
  };

  const handleClickLeft = () => {
    handlePrevious();
  };

  const handleClickRight = () => {
    handleNext();
  };

  if (!currentStory) {
    return null;
  }

  const isOwner = currentStory.userId === currentUserId;
  const timeRemaining = getStoryTimeRemaining(currentStory.createdAt);

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-container">
        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user-info">
            <div className="story-viewer-avatar-placeholder">
              {currentStory.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="story-viewer-user-details">
              <span className="story-viewer-username">
                {currentStory.userName || 'User'}
              </span>
              <span className="story-viewer-time">{timeRemaining}h</span>
            </div>
          </div>
          <div className="story-viewer-actions">
            {isOwner && (
              <button
                className="story-viewer-delete-btn"
                onClick={handleDelete}
                title="Xóa Story"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button className="story-viewer-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="story-viewer-progress-container">
          {currentUserStories.map((_, index) => (
            <div key={index} className="story-viewer-progress-bar">
              <div
                className="story-viewer-progress-fill"
                style={{
                  width:
                    index < currentStoryIndex
                      ? '100%'
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story content */}
        <div className="story-viewer-content">
          <img
            src={normalizeStoryImageUrl(currentStory.imageUrl)}
            alt="Story"
            className="story-viewer-image"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />

          {/* Navigation areas */}
          <div className="story-viewer-nav-left" onClick={handleClickLeft}>
            {currentStoryIndex > 0 || currentUserIndex > 0 ? (
              <ChevronLeft size={32} className="story-viewer-nav-icon" />
            ) : null}
          </div>
          <div className="story-viewer-nav-right" onClick={handleClickRight}>
            <ChevronRight size={32} className="story-viewer-nav-icon" />
          </div>
        </div>

        {/* View count (for owner) */}
        {isOwner && currentStory.viewers && currentStory.viewers.length > 0 && (
          <div className="story-viewer-views">
            👁️ {currentStory.viewers.length} lượt xem
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
