import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ClientRelativeTimeProps {
  timestamp: string;
  className?: string;
}

const ClientRelativeTime: React.FC<ClientRelativeTimeProps> = ({ timestamp, className }) => {
  return (
    <time dateTime={timestamp} className={className}>
      {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
    </time>
  );
};

export default ClientRelativeTime; 