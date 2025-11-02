import React, { useState } from 'react';

const Slider = React.forwardRef(({ className = '', value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue || min);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const setValue = isControlled ? onValueChange : setInternalValue;

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className="relative flex w-full touch-none select-none items-center">
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary ${className}`}
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((currentValue - min) / (max - min)) * 100}%, hsl(var(--secondary)) ${((currentValue - min) / (max - min)) * 100}%, hsl(var(--secondary)) 100%)`
        }}
        {...props}
      />
      <div className="absolute -bottom-1 text-xs text-muted-foreground">
        {currentValue}
      </div>
    </div>
  );
});
Slider.displayName = 'Slider';

export { Slider };

