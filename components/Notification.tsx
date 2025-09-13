import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute top-4 right-4 z-[100] bg-brand-danger text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in-down">
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="text-lg leading-none opacity-80 hover:opacity-100">&times;</button>
    </div>
  );
};

export default Notification;
