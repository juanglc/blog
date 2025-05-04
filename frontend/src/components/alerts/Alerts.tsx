import "./Alerts.css";

type CustomAlertProps = {
    type: "success" | "error" | "info" | "warning";
    message: string;
    show: boolean;
    onClose: () => void;
};

export function CustomAlert({
                                type = "info",
                                message,
                                show,
                                onClose,
                            }: CustomAlertProps) {
    if (!show) return null;

    // Map type to color for CSS classes
    const colorMap = {
        success: "success",
        error: "failure",
        info: "info",
        warning: "warning"
    };

    const color = colorMap[type];

    // Determine alert title based on type
    const getAlertText = () => {
        switch(type) {
            case "info": return "Info alert!";
            case "success": return "Success alert!";
            case "warning": return "Warning alert!";
            case "error": return "Error alert!";
            default: return "Info alert!";
        }
    };

    return (
        <div className={`custom-alert custom-alert-${color}`} role="alert">
            <div className="alert-content">
                <span className="alert-text-bold">{getAlertText()}</span> {message}
            </div>
            {onClose && (
                <button
                    type="button"
                    className={`close-button close-button-${color}`}
                    aria-label="Close"
                    onClick={onClose}
                >
                    <span className="sr-only">Close</span>
                    <svg aria-hidden="true" width="20" height="20" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                </button>
            )}
        </div>
    );
}