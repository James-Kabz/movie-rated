import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIl_SERVER_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
    },
})
export async function sendWatchListEmail(
    userMail: string,
    userName: string,
    movieTitle: string,
    moviePoster?: string
) {

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userMail,
        subject: `${movieTitle} added to your watchlist`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${userName}!</h2>
          <p>You've successfully added <strong>${movieTitle}</strong> to your watchlist.</p>
          ${moviePoster ? `<img src="${moviePoster}" alt="${movieTitle}" style="max-width: 200px; border-radius: 8px;">` : ""}
          <p>You can view your complete watchlist anytime by visiting your dashboard.</p>
          <p>Happy watching!</p>
        </div>`,
    }
    await transporter.sendMail(mailOptions)
}