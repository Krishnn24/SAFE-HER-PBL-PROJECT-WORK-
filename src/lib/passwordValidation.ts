export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const checkPasswordRequirements = (password: string): PasswordRequirements => ({
  minLength: password.length >= 10,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
});

export const isStrongPassword = (password: string): boolean => {
  const reqs = checkPasswordRequirements(password);
  return reqs.minLength && reqs.hasUppercase && reqs.hasLowercase && reqs.hasNumber && reqs.hasSpecialChar;
};

export const PASSWORD_ERROR_MESSAGE = 
  "Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.";
