function generatePassword(length = 12, options = {}) {
  const {
    upper = true,
    lower = true,
    numbers = true,
    symbols = true,
  } = options;

  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()-_=+[]{};:,.<>?';

  let allChars = '';
  if (upper) allChars += upperChars;
  if (lower) allChars += lowerChars;
  if (numbers) allChars += numberChars;
  if (symbols) allChars += symbolChars;

  if (!allChars.length) throw new Error('No character types selected');

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}


export default generatePassword;