import React from 'react';

const Command = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
Command.displayName = 'Command';

const CommandInput = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <input
        ref={ref}
        className={`flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`max-h-[300px] overflow-y-auto overflow-x-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
CommandList.displayName = 'CommandList';

const CommandEmpty = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`py-6 text-center text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
CommandGroup.displayName = 'CommandGroup';

const CommandItem = React.forwardRef(({ className = '', children, onSelect, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      onSelect={onSelect}
      {...props}
    >
      {children}
    </div>
  );
});
CommandItem.displayName = 'CommandItem';

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };

