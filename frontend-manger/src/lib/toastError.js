import toast from "react-hot-toast"

export function showErrorToast(error, toastId) {
    const message = 
    error?.customMessage ||
    error?.message ||
    'An unexpected error occurred.'

    toast.error(message, toastId ? {id: toastId}:  undefined);
}