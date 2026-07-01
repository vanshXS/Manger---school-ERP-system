import { useState, useCallback } from 'react';

export function useFormValidation(validationRules) {
  const [errors, setErrors] = useState({});

  const validate = useCallback(
    (values) => {
      const newErrors = {};
      Object.keys(validationRules).forEach((field) => {
        const value = values[field];
        const rules = validationRules[field];

        if (rules.required && !value) {
          newErrors[field] = rules.requiredMessage || 'This field is required.';
        } else if (rules.pattern && value && !rules.pattern.test(value)) {
          newErrors[field] = rules.patternMessage || 'Invalid format.';
        } else if (rules.minLength && value && value.length < rules.minLength) {
          newErrors[field] = rules.minLengthMessage || `Must be at least ${rules.minLength} characters long.`;
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validationRules]
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, clearErrors, setErrors };
}
