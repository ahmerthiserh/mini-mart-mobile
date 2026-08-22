import { ActionAlertModal } from '@/components/action-alert-modal';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useState } from 'react';

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
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => { },
  showSuccess: () => { },
  showError: () => { },
  showWarning: () => { },
  showConfirm: () => { },
  hideAlert: () => { },
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

  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      iconName: 'checkmark-circle-outline',
      iconColor: '#10B981',
      confirmText: 'OK',
      confirmBtnColor: '#10B981',
      onConfirm,
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      iconName: 'close-circle-outline',
      iconColor: '#EF4444',
      confirmText: 'OK',
      confirmBtnColor: '#EF4444',
      onConfirm,
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      iconName: 'warning-outline',
      iconColor: '#F59E0B',
      confirmText: 'OK',
      confirmBtnColor: '#F59E0B',
      onConfirm,
    });
  }, [showAlert]);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    ) => {
      showAlert({
        title,
        message,
        iconName: 'help-circle-outline',
        iconColor: '#0284C7',
        confirmText,
        confirmBtnColor: '#0284C7',
        cancelText,
        onConfirm,
        onCancel,
      });
    },
    [showAlert]
  );

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
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
        hideAlert,
      }}
    >
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
