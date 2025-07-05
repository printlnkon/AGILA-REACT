import { toast } from "sonner";

export const CustomToast = {
    success: (title, description, duration = 5000) => {
        toast.success(title, {
            description,
            duration,
            style: {
                 color: "#0d47a1"
            },
            descriptionStyle: { 
                color: "#1976d2" 
            }
        });
    },
    error: (title, description, duration = 5000) => {
        toast.success(title, {
            description,
            duration,
            style: {
                 color: "#0d47a1"
            },
            descriptionStyle: { 
                color: "#1976d2" 
            }
        });
    }
}