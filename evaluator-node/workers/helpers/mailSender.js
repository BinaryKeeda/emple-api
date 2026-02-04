import transporter from "../../../config/transporter.js";

export const mailSender = async (job) => {
    const { from ,to, subject, text, html } = job.data;
        const mailOptions = {
        from,
        to,
        subject,
        text,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        throw error;
    }
}