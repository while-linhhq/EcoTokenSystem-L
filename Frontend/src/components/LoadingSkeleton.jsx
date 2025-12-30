import './LoadingSkeleton.css';

/**
 * Loading Skeleton Component
 * Displays animated loading placeholders while content loads
 */

// Base Skeleton component
export const Skeleton = ({ width, height, className = '', style = {} }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        ...style,
      }}
    />
  );
};

// Card Skeleton - for card-based content
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton height="200px" className="skeleton-card-image" />
          <div className="skeleton-card-content">
            <Skeleton width="70%" height="24px" />
            <Skeleton width="100%" height="16px" style={{ marginTop: '8px' }} />
            <Skeleton width="90%" height="16px" style={{ marginTop: '4px' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <Skeleton width="80px" height="32px" />
              <Skeleton width="60px" height="32px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Post Skeleton - for social feed posts
export const SkeletonPost = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-post">
          <div className="skeleton-post-header">
            <Skeleton width="48px" height="48px" style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Skeleton width="150px" height="18px" />
              <Skeleton width="100px" height="14px" style={{ marginTop: '4px' }} />
            </div>
          </div>
          <Skeleton width="100%" height="300px" style={{ marginTop: '12px' }} />
          <div className="skeleton-post-footer">
            <Skeleton width="60px" height="16px" />
            <Skeleton width="60px" height="16px" />
            <Skeleton width="60px" height="16px" />
          </div>
        </div>
      ))}
    </>
  );
};

// List Item Skeleton - for list-based content
export const SkeletonListItem = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton width="40px" height="40px" style={{ borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="18px" />
            <Skeleton width="40%" height="14px" style={{ marginTop: '4px' }} />
          </div>
          <Skeleton width="80px" height="28px" />
        </div>
      ))}
    </>
  );
};

// Table Row Skeleton - for table-based content
export const SkeletonTableRow = ({ columns = 4, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? '40%' : '15%'}
              height="20px"
            />
          ))}
        </div>
      ))}
    </>
  );
};

// Text Block Skeleton - for text content
export const SkeletonText = ({ lines = 3 }) => {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height="16px"
          style={{ marginBottom: '8px' }}
        />
      ))}
    </div>
  );
};

// Stat Card Skeleton - for stat cards
export const SkeletonStatCard = ({ count = 2 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-stat-card">
          <Skeleton width="48px" height="48px" style={{ borderRadius: '12px' }} />
          <div style={{ flex: 1 }}>
            <Skeleton width="80px" height="16px" />
            <Skeleton width="120px" height="32px" style={{ marginTop: '8px' }} />
            <Skeleton width="100px" height="14px" style={{ marginTop: '4px' }} />
          </div>
        </div>
      ))}
    </>
  );
};

export default Skeleton;
