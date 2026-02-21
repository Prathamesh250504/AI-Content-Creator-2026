/**
 * NotificationItem Component
 * Individual notification item
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const NotificationItem = ({ notification, onRemove, onMarkAsRead, formatTimeAgo, getNotificationIcon, getNotificationColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`relative p-3 rounded-lg border mb-2 cursor-pointer transition-all duration-300 hover:bg-white/5 group ${
        getNotificationColor(notification.type)
      } ${!notification.read ? 'ring-1 ring-purple-500/30' : ''}`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="text-lg flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white truncate">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {formatTimeAgo(notification.timestamp)}
              </span>
              {!notification.read && (
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-300 mt-1 line-clamp-2">
            {notification.message}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="text-gray-400 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationItem;