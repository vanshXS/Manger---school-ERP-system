'use client';

import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Reusable Password Input component with visibility toggle and smooth animations.
 * 
 * Props:
 * - ringColor: Tailwind class for focus ring (e.g., 'focus:ring-blue-500')
 * - borderColor: Tailwind class for focus border (e.g., 'focus:border-blue-500')
 * - iconColor: Tailwind class for the eye icons (e.g., 'text-slate-400')
 * - All standard input props (value, onChange, placeholder, disabled, etc.)
 */
const PasswordInput = React.forwardRef(({ 
  className, 
  ringColor = 'focus:ring-blue-500', 
  borderColor = 'focus:border-blue-500', 
  iconColor = 'text-slate-400',
  icon: Icon,
  disabled,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    if (!disabled) {
      setShowPassword(!showPassword);
    }
  };

  return (
    <div className="relative group">
      {Icon && (
        <Icon className={cn("absolute left-3 top-2.5 h-5 w-5 pointer-events-none transition-colors", iconColor)} />
      )}
      <input
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          "block w-full pr-12 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-all",
          Icon ? "pl-10" : "pl-3",
          "border-slate-300 placeholder:text-slate-400",
          ringColor,
          borderColor,
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          className
        )}
        ref={ref}
        {...props}
      />
      
      {/* Eye Button Toggle */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300",
            disabled && "cursor-not-allowed hidden"
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={showPassword ? 'visible' : 'hidden'}
              initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {showPassword ? (
                <EyeOff className={cn("h-4 w-4", iconColor)} />
              ) : (
                <Eye className={cn("h-4 w-4", iconColor)} />
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
