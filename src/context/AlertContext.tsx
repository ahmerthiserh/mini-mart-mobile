import React, { createContext, useContext, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActionAlertModal } from '@/components/action-alert-modal';

export interface AlertOptions {
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  confirmBtnColor?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setAlertConfig(null);
    }, 200);
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig(options);
    setVisible(true);
  }, []);

  const handleConfirm = () => {
    const callback = alertConfig?.onConfirm;
    hideAlert();
    if (callback) {
      callback();
    }
  };

  const handleCancel = () => {
    const callback = alertConfig?.onCancel;
    hideAlert();
    if (callback) {
      callback();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertConfig && (
        <ActionAlertModal
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          iconName={alertConfig.iconName}
          iconColor={alertConfig.iconColor}
          confirmText={alertConfig.confirmText}
          confirmBtnColor={alertConfig.confirmBtnColor}
          cancelText={alertConfig.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </AlertContext.Provider>
  );
};
