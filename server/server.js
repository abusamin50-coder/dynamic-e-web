const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app'); // নিশ্চিত করুন এই লাইনটি আছে

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});