export const getMailTemplate = (verifyLink, mailNo) => {
  let title = '';
  let message = '';
  let buttonText = '';
  let showLink = true;

  switch (mailNo) {
    case 1:
      title = 'Verify Your Email';
      message = `Thank you for registering with <b>BinaryKeeda</b>. Please verify your email below.`;
      buttonText = 'Verify Email';
      break;
    case 2:
      title = 'Reset Your Password';
      message = `You requested a password reset for <b>BinaryKeeda</b>. Click below to continue.`;
      buttonText = 'Reset Password';
      break;
    case 3:
      title = 'Welcome to BinaryKeeda!';
      message = `Thank you for signing up! We're excited to have you with us.`;
      showLink = false;
      break;
    default:
      title = 'Notification';
      message = `Hello, this is a system-generated email.`;
      showLink = false;
      break;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body style="font-family: sans-serif; background-color: #f9f9f9; padding: 0; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #fff; border: 1px solid #e0e0e0;">
    <tr>
      <td style="text-align: center; padding: 20px;">
        <img src="https://res.cloudinary.com/drzyrq7d5/image/upload/v1744699895/binarykeeda/zipjouvv161c11xywrwk.jpg" alt="BinaryKeeda" width="120" style="border: none; outline: none;">
      </td>
    </tr>
    <tr>
      <td style="padding: 15px 20px; font-size: 15px; color: #333;">
        <p>Dear User,</p>
        <p>${message}</p>

        ${
          showLink
            ? `
              <p style="text-align: center; margin: 25px 0;">
                <a href="${verifyLink}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${buttonText}</a>
              </p>`
              : ''
        }

        <p style="margin-top: 20px;">Regards,<br>Team BinaryKeeda</p>
      </td>
    </tr>
    <tr>
      <td style="font-size: 12px; color: #777; text-align: center; padding: 15px; border-top: 1px solid #ddd;">
        <p>&copy; ${new Date().getFullYear()} BinaryKeeda. All rights reserved.</p>
        <p>This is an automated email. Please don’t reply.</p>
        <p>📞 +91 74979 18739 | ✉️ support@binarykeeda.com</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
