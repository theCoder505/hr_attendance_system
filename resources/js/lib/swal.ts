import Swal, { SweetAlertIcon } from 'sweetalert2';

// Custom dark/light responsive styling for SweetAlert
const swalCustom = Swal.mixin({
    customClass: {
        confirmButton: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mx-1',
        cancelButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mx-1',
        popup: 'rounded-xl border shadow-2xl p-6 bg-card text-card-foreground',
        title: 'text-lg font-bold text-foreground',
    },
    buttonsStyling: false,
});

export const showAlert = (title: string, text: string = '', icon: SweetAlertIcon = 'info') => {
    return swalCustom.fire({
        title,
        text,
        icon,
    });
};

export const showSuccess = (title: string, text: string = '') => {
    return swalCustom.fire({
        title,
        text,
        icon: 'success',
        timer: 2500,
        timerProgressBar: true,
    });
};

export const showError = (title: string, text: string = '') => {
    return swalCustom.fire({
        title,
        text,
        icon: 'error',
    });
};

export const showWarning = (title: string, text: string = '') => {
    return swalCustom.fire({
        title,
        text,
        icon: 'warning',
    });
};

export const showConfirm = async (
    title: string,
    text: string = '',
    confirmButtonText: string = 'Yes, proceed',
    icon: SweetAlertIcon = 'warning'
): Promise<boolean> => {
    const result = await swalCustom.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    return result.isConfirmed;
};

export const showToast = (title: string, icon: SweetAlertIcon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    Toast.fire({
        icon,
        title,
    });
};

export default swalCustom;
