require('dotenv').config(); // .env faylidagi o'zgaruvchilarni yuklash
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // CORS xatolarini oldini olish uchun
const rateLimit = require('express-rate-limit'); // Spamdan himoya

const app = express();
const PORT = process.env.PORT || 5000; // Server porti

// Middleware'lar
app.use(cors()); // Barcha domenlardan so'rovlarni qabul qilish
app.use(express.json()); // JSON formatidagi so'rovlarni tahlil qilish

// Server ishlayotganini tekshirish uchun oddiy route
app.get('/', (req, res) => {
    res.send('Portfolio Backend Server is running...');
});

// Nodemailer transporterini sozlash
const transporter = nodemailer.createTransport({
    service: 'gmail', // Gmail xizmatidan foydalanish
    auth: {
        user: process.env.EMAIL_USER, // .env faylidan email
        pass: process.env.EMAIL_PASS  // .env faylidan ilova paroli
    }
});

// Rate limiter: 15 daqiqa ichida bitta IP dan maksimal 5 ta so'rov
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 5, // har bir IP uchun limit
    message: { msg: 'Juda ko\'p so\'rov yuborildi, iltimos keyinroq urinib ko\'ring.' }
});

// Aloqa formasi uchun API endpoint
app.post('/api/contact', limiter, async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ msg: 'Iltimos, barcha maydonlarni to\'ldiring.' });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Kimdan
            to: process.env.EMAIL_USER,   // Kimga (o'zingizga)
            subject: `Yangi xabar: ${name} dan`, // Xabar mavzusi
            html: `
                <p><strong>Ism:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Xabar:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Xabaringiz muvaffaqiyatli yuborildi!' });
    } catch (error) {
        console.error('Email yuborishda xato:', error); // Xato haqida terminalga yozish
        res.status(500).json({ msg: 'Xabar yuborishda xato yuz berdi. Iltimos, keyinroq urinib ko\'ring.' });
    }
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi.`);
    console.log(`http://localhost:${PORT}`);
});