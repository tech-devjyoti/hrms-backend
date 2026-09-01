const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPasswordResetEmail = async ({ email, resetLink }) => {
  await transporter.sendMail({
    from: `"HRMS" <${process.env.SMTP_FROM}>`,

    to: email,

    subject: "Reset your HRMS password",

    text: `
You requested a password reset for your HRMS account.

Reset your password using the link below:

${resetLink}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.
    `,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 40px auto;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        "
      >

        <h2 style="color: #0f172a;">
          Reset your HRMS password
        </h2>

        <p style="color: #475569;">
          You requested a password reset for your
          HRMS account.
        </p>

        <p style="color: #475569;">
          Click the button below to create a new password.
        </p>

        <div style="margin: 30px 0;">
          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            Reset Password
          </a>
        </div>

        <p style="color: #64748b;">
          This link will expire in
          <strong>15 minutes</strong>.
        </p>

        <p style="color: #64748b;">
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
};
