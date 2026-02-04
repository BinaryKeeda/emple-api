export const userEntryBoiler = ({name, role , email, password}) => `  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to BinaryKeeda</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <tr>
        <td style="text-align: center; padding: 20px;">
          <img src="https://res.cloudinary.com/drzyrq7d5/image/upload/v1744699895/binarykeeda/zipjouvv161c11xywrwk.jpg" alt="BinaryKeeda" width="160" />
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; color: #333;">
          <h2 style="color:#2c3e50;">Hey ${name || "User"},</h2>
          <p>
            You have been added to <strong>BinaryKeeda</strong> with the role of:
            <span style="color: #27ae60; font-weight: bold;">${role}</span>.
          </p>
          <p>
            You can now log in to your account using the following credentials:
          </p>
          <table style="background: #f4f6f8; padding: 15px; border-radius: 6px; margin: 15px 0; width: 100%;">
            <tr>
              <td><strong>Email:</strong></td>
              <td>${email}</td>
            </tr>
            <tr>
              <td><strong>Password:</strong></td>
              <td style="color:#e74c3c; font-weight: bold;">${password}</td>
            </tr>
          </table>
          <p>
        <a href="https://binarykeeda.com/login" style="background: #3498db; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Proceed </a>
          </p>
          <p style="margin-top: 20px; color: #555;">
            For security reasons, please change your password after your first login.
          </p>
          <p style="margin-top: 30px;">Cheers,<br/>Team BinaryKeeda</p>
        </td>
      </tr>
      <tr>
        <td style="background: #f4f6f8; text-align: center; padding: 15px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
          © ${new Date().getFullYear()} BinaryKeeda. All rights reserved.
        </td>
      </tr>
    </table>
  </body>
  </html>
`