require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const connectDatabase = require('./configs/database');

const authRoutes = require('./src/modules/auth/auth.route');
const fieldRoutes = require('./src/modules/farmer/field.route');
const diseaseRoutes = require('./src/modules/disease/disease.route');
const soilRoutes = require('./src/modules/soil/soil.route');
const expertRoutes = require('./src/modules/expert/expert.route');
const adminRoutes = require('./src/modules/admin/admin.route');

const app = express();

app.get('/', (req, res) => {
    res.send('Server Running.... Developed By Abhay Vijayan!!!!!')
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        secure: false, // set to true in production if testing over https
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.use('/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on Port : ${PORT}`);
    connectDatabase();
});