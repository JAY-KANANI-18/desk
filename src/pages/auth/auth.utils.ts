export const getPasswordStrength = (password: string) => {
  if (!password) {
    return { label: "", color: "", width: "0%" };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length < 12) {
    return { label: "Weak", color: "bg-red-400", width: "25%" };
  }

  if (!(hasUpper && hasLower)) {
    return { label: "Fair", color: "bg-yellow-400", width: "50%" };
  }

  if (hasUpper && hasLower && hasNumber && hasSymbol) {
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  }

  return { label: "Good", color: "bg-[var(--color-primary)]", width: "75%" };
};
