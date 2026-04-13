export const getPasswordStrength = (password: string) => {
  if (!password) {
    return { label: "", color: "", width: "0%" };
  }

  if (password.length < 6) {
    return { label: "Weak", color: "bg-red-400", width: "25%" };
  }

  if (password.length < 8) {
    return { label: "Fair", color: "bg-yellow-400", width: "50%" };
  }

  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  }

  return { label: "Good", color: "bg-indigo-400", width: "75%" };
};
