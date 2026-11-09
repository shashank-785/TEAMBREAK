import React from 'react';
import { UserRound } from 'lucide-react';

export const avatarOptions = [
  { id: 'student', emoji: '🎓', label: 'Student', color: 'bg-indigo-500/20' },
  { id: 'developer', emoji: '👩‍💻', label: 'Developer', color: 'bg-cyan-500/20' },
  { id: 'explorer', emoji: '🚀', label: 'Explorer', color: 'bg-violet-500/20' },
  { id: 'fox', emoji: '🦊', label: 'Fox', color: 'bg-orange-500/20' },
  { id: 'panda', emoji: '🐼', label: 'Panda', color: 'bg-slate-400/20' },
  { id: 'robot', emoji: '🤖', label: 'Robot', color: 'bg-emerald-500/20' },
] as const;

interface AvatarProps {
  avatarUrl: string;
  name: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatarUrl, name, className = '' }) => {
  const selectedAvatar = avatarOptions.find(avatar => avatarUrl === `learnos-avatar:${avatar.id}`);

  if (selectedAvatar) {
    return (
      <span
        role="img"
        aria-label={`${name}'s ${selectedAvatar.label} avatar`}
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-2xl ${selectedAvatar.color} ${className}`}
      >
        {selectedAvatar.emoji}
      </span>
    );
  }

  if (avatarUrl) {
    return <img src={avatarUrl} alt={`${name}'s avatar`} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ${className}`}>
      <UserRound aria-hidden="true" size={20} />
    </span>
  );
};
