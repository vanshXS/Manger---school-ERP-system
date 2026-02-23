import toast from 'react-hot-toast';

/**
 * Always show a string in toasts to avoid "[object Object]" when API returns an object.
 * Use for success/error messages from API responses.
 */
function toMessage(value, fallback = 'Done.') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && typeof value.message === 'string') return value.message;
  return fallback;
}

export function showSuccess(message, options = {}) {
  toast.success(toMessage(message, 'Success.'), { duration: 4000, ...options });
}

export function showError(message, options = {}) {
  toast.error(toMessage(message, 'Something went wrong. Please try again.'), { duration: 5000, ...options });
}

export function showLoading(message = 'Please wait...') {
  return toast.loading(message);
}

export function dismissToast(toastId) {
  if (toastId) toast.dismiss(toastId);
}
