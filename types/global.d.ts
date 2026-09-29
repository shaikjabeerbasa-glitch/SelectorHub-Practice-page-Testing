declare global {
  interface Window {
    windowAlertFunction: () => void;
    promptAlertFunction: (defaultValue?: string) => string | null;
    validateCardName: () => void;
    validateCardNumber: () => void;
    validateExpiry: () => void;
    validateCVV: () => void;
  }
}

export {};
