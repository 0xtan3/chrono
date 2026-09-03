import React from 'react';
import styles from './Avatar.module.css';

export const AVATARS = [
  { id: 'avatar-1', name: 'Phantom', emoji: '👻', color: '#a78bfa' },
  { id: 'avatar-2', name: 'Kitsune', emoji: '🦊', color: '#f97316' },
  { id: 'avatar-3', name: 'Ninja', emoji: '🥷', color: '#f87171' },
  { id: 'avatar-4', name: 'Wizard', emoji: '🧙‍♂️', color: '#60a5fa' },
  { id: 'avatar-5', name: 'Astronaut', emoji: '🧑‍🚀', color: '#34d399' },
  { id: 'avatar-6', name: 'Cyborg', emoji: '🤖', color: '#94a3b8' },
  { id: 'avatar-7', name: 'Oni', emoji: '👹', color: '#ef4444' },
  { id: 'avatar-8', name: 'Reaper', emoji: '☠️', color: '#64748b' },
  { id: 'avatar-9', name: 'Alien', emoji: '👽', color: '#a3e635' },
  { id: 'avatar-10', name: 'Dragon', emoji: '🐉', color: '#10b981' },
];

export default function Avatar({ id = 'avatar-1', size = 'md', className = '' }) {
  const avatar = AVATARS.find(a => a.id === id) || AVATARS[0];
  
  return (
    <div 
      className={`${styles.avatarContainer} ${styles[size]} ${className}`}
      style={{
        '--avatar-color': avatar.color,
        '--avatar-glow': `${avatar.color}40`,
        '--avatar-bg': `${avatar.color}15`
      }}
      title={avatar.name}
    >
      <span className={styles.emoji}>{avatar.emoji}</span>
    </div>
  );
}
