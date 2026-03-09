import bcrypt from "bcryptjs";

export const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const validateUsername = (value: string) => {
  const username = normalizeUsername(value);

  if (!USERNAME_REGEX.test(username)) {
    throw new Error(
      "Username must be 3-20 characters and use only letters, numbers, underscores, or hyphens."
    );
  }

  return username;
};

export const validatePassword = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("Password must be at least 8 characters long.");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Password must be 72 characters or less.");
  }

  return password;
};

export const hashPassword = async (password: string) => {
  validatePassword(password);
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  passwordHash: string
) => {
  validatePassword(password);
  return bcrypt.compare(password, passwordHash);
};
