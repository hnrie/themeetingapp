
import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 40, className = '' }) => {
  const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div
      className={`relative rounded-full flex items-center justify-center bg-zinc-700 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        // Optional: Add an onError handler for extreme edge cases where the API might be down
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none'; 
          // You could render text-based initials here as a fallback
        }}
      />
    </div>
  );
};

export default Avatar;
