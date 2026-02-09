const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Organization = require('../models/Organization');

async function getOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/travel-web-app');
        const org = await Organization.findOne();
        console.log('ORG_DATA:' + JSON.stringify(org));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getOrg();
