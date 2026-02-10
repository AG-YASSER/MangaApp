import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // How strong the encryption is (10-12 is good)

export const passwordUtils = {
  // Hash password when user registers
  async hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  },
  
  // Check password when user logs in
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  
  // Check if password is strong enough
  isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }
};