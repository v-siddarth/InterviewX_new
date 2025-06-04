// frontend/src/components/ui/Alert.jsx
import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  message, 
  title, 
  onClose, 
  className = '',
  showIcon = true 
}) => {
  const alertStyles = {
    success: {
      container: 'bg-green-50 border border-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    error: {
      container: 'bg-red-50 border border-red-200 text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500'
    },
    warning: {
      container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500'
    },
    info: {
      container: 'bg-blue-50 border border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    }
  };

  const currentStyle = alertStyles[type] || alertStyles.info;
  const IconComponent = currentStyle.icon;

  return (
    <div className={`rounded-lg p-4 ${currentStyle.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${currentStyle.iconColor}`} />
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className="text-sm">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>
        
        {onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`rounded-md inline-flex ${currentStyle.iconColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-400`}
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;