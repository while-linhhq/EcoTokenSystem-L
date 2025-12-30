/**
 * Toast Notification Utilities
 *
 * Wrapper functions for react-hot-toast to provide consistent
 * toast notifications throughout the application.
 */

import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 * @param {string} message - The message to display
 * @param {object} options - Additional toast options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show an error toast notification
 * @param {string} message - The error message to display
 * @param {object} options - Additional toast options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 4000,
    ...options,
  });
};

/**
 * Show an info toast notification
 * @param {string} message - The info message to display
 * @param {object} options - Additional toast options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    ...options,
  });
};

/**
 * Show a warning toast notification
 * @param {string} message - The warning message to display
 * @param {object} options - Additional toast options
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    icon: '⚠️',
    duration: 3500,
    style: {
      background: '#fff3e0',
      color: '#e65100',
    },
    ...options,
  });
};

/**
 * Show a loading toast notification
 * @param {string} message - The loading message to display
 * @param {object} options - Additional toast options
 * @returns {string} toastId - ID to use with toast.dismiss()
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, options);
};

/**
 * Show a promise toast - automatically shows loading/success/error states
 * @param {Promise} promise - The promise to track
 * @param {object} messages - Messages for each state { loading, success, error }
 * @param {object} options - Additional toast options
 */
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Đang xử lý...',
      success: messages.success || 'Thành công!',
      error: messages.error || 'Có lỗi xảy ra',
    },
    options
  );
};

/**
 * Dismiss a specific toast or all toasts
 * @param {string} toastId - Optional toast ID to dismiss specific toast
 */
export const dismissToast = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

// Export toast directly for advanced usage
export { toast };
