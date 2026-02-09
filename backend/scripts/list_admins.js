const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function listAdmins() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/travel-web-app');
        const users = await User.find().limit(20);
        console.log('USERS:' + JSON.stringify(users.map(u => ({ id: u._id, role: u.role, org_id: u.org_id, name: u.name, email: u.email }))));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAdmins();
