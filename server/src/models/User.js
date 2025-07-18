import mongoose from 'mongoose';



const userSchema = new mongoose.Schema({
 username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'admin' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
})


const User = mongoose.model('User', userSchema);

export default User;




