const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();
const collections = require('../db/collections');
const db = require('../db/connect');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});


const Admin = mongoose.model(collections.ADMIN_COLLECTION, adminSchema);

const addUser = async () => {
    try {
        const username = process.env.ADMIN_USERNAME 
        const password = process.env.ADMIN_PASSWORD 

        console.log('Trying to add admin with username:', username);

        const hashedPassword = await bcrypt.hash(password, 10);

        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            console.log('Admin already exists:', existingAdmin);
            return;
        }

        const admin = new Admin({
            username,
            password: hashedPassword
        });

        const savedAdmin = await admin.save();
        console.log('Admin created:', savedAdmin);

    } catch (err) {
        console.error('Error creating admin:', err);
    }
};


const adminComp = async (adminData) => {
    try {
        console.log('Admin Login Attempt:', adminData);

        const admin = await Admin.findOne({ username: adminData.username });
        if (admin) {
            const match = await bcrypt.compare(adminData.pswd, admin.password);
            if (match) {
                console.log("Login success");
                return { status: true, admin };
            } else {
                console.log("Login failed");
                return { status: false };
            }
        } else {
            console.log("Admin not found in the database");
            return { status: false };
        }
    } catch (err) {
        console.error('Error during admin comparison:', err);
        return { status: false };
    }
};

addUser();

module.exports = {
    addUser,
    adminComp
};



