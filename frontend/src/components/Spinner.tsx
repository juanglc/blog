// src/components/ui/Spinner.tsx
import React from 'react';
import './Spinner.css';
import '../App.css';

interface SpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
                                                    size = 'medium',
                                                    color = 'var(--primary-color)'
                                                }) => {
    return (
        <div className={`spinner-container ${size}`}>
            <div
                className="spinner"
                style={{ borderColor: `${color} transparent transparent transparent` }}
            ></div>
        </div>
    );
};