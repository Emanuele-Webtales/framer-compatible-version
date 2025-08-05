import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  href, 
  target, 
  rel 
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}`;
  
  if (href) {
    return (
      <a 
        href={href} 
        target={target} 
        rel={rel}
        className={className}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button 
      onClick={onClick} 
      className={className}
    >
      {children}
    </button>
  );
} 