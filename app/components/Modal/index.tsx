"use client";
import React, { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  children?: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onRequestClose, children }) => {
  // Prevent scrolling when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onRequestClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white max-w-lg w-full mx-4 rounded shadow-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-xl font-bold text-gray-700 hover:text-gray-900"
          onClick={onRequestClose}
          aria-label="Close Modal"
          type="button"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
