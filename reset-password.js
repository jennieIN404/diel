const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Direct MongoDB connection string
const MONGODB_URI = 'mongodb+srv://infodialectica91:XKSQkS5jsR8WMI1D@dielecctica.zjyifc6.mongodb.net/?retryWrites=true&w=majority&appName=Dielecctica';

console.log('Connecting to MongoDB...');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => {
  console.log('MongoDB Connection Error: ', err);
  process.exit(1);
});

// Define User Schema (simplified version of your actual schema)
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  avatar: String,
  isAdmin: Boolean,
  isBlocked: Boolean,
  blockedReason: String
});

const User = mongoose.model('User', UserSchema);

// Function to reset password
async function resetPassword() {
  try {
    // New password you want to set
    const newPassword = 'yourNewPassword123'; // Change this to your desired password
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    const result = await User.findOneAndUpdate(
      { email: 'ojha13291@gmail.com' }, // Target email
      { $set: { password: hashedPassword } },
      { new: true }
    );
    
    if (result) {
      console.log('Password reset successful!');
      console.log('New password: ' + newPassword);
      console.log('User:', result.email);
    } else {
      console.log('User not found');
    }
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (err) {
    console.error('Error resetting password:', err);
    mongoose.disconnect();
  }
}

// Run the password reset function
resetPassword();
