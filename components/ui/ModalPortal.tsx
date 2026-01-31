
import React from 'react';
import { createPortal } from 'react-dom';

export const ModalPortal = ({ children }: { children?: React.ReactNode }) => {
  if (typeof document === 'undefined' || !children) return null;
  return createPortal(children, document.body);
};
