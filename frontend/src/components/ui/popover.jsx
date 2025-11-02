import React, { useState } from 'react';

const PopoverContext = React.createContext();

const Popover = ({ open, onOpenChange, children }) => {
  return (
    <PopoverContext.Provider value={{ open, onOpenChange }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef(({ asChild, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  
  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      onClick: () => onOpenChange(!open),
      ref,
      ...props,
    });
  }
  
  return (
    <button
      ref={ref}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverContent = React.forwardRef(({ className = '', align = 'center', children, ...props }, ref) => {
  const { open } = React.useContext(PopoverContext);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef(null);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      if (align === 'start') {
        left = triggerRect.left;
      } else if (align === 'end') {
        left = triggerRect.right - contentRect.width;
      } else {
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      }

      if (top + contentRect.height > window.innerHeight) {
        top = triggerRect.top - contentRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [open, align]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      {...props}
    >
      {children}
    </div>
  );
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };

