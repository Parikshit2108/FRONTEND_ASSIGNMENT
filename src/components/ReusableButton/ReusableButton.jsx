import React from "react";

export default function ReusableButton({
    children,
    onClick,
    type = "button",
    className = "",
    disabled = false,
    title = "",
    icon = null,
    ...props
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            disabled={disabled}
            title={title}
            {...props}
        >
            {icon && <span className="flex items-center">{icon}</span>}
            {children}
        </button>
    );
}
