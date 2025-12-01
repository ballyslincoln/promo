import React from 'react';
import { Announcement } from '../types';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface Props {
  announcement: Announcement;
  onDismiss: () => void;
}

const AnnouncementBanner: React.FC<Props> = ({ announcement, onDismiss }) => {
  const getStyles = () => {
    switch (announcement.type) {
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getIcon = () => {
    switch (announcement.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 mr-2" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 mr-2" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 mr-2" />;
    }
  };

  return (
    <div className={`${getStyles()} px-4 py-3 shadow-md relative flex items-center justify-center w-full z-50`}>
      <div className="flex items-center max-w-4xl mx-auto text-center">
        {getIcon()}
        <span className="font-medium">{announcement.message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:opacity-75 focus:outline-none"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
