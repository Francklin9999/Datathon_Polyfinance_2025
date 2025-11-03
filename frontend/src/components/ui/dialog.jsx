import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
});

export const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <div className="relative z-50">{children}</div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const DialogContent = React.forwardRef(({ className = '', children, ...props }, ref) => {
  const { setOpen } = useContext(DialogContext);
  return (
    <div
      ref={ref}
      className={`rounded-lg border bg-gray-900 text-white shadow-lg ${className}`}
      {...props}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>
      {children}
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className = '', children, ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
      {children}
    </div>
  );
};

export const DialogTitle = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <h2 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h2>
  );
});
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = ({ className = '', children, ...props }) => {
  return (
    <p className={`text-sm text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
};

