const DBService = require('../services/dbService');
const { sendEmailOtp } = require('../services/mailerService');
const { hashPassword, comparePassword, generateToken } = require('../utils/crypto');

// 1. Send OTP for Email Verification
async function sendOtp(req, res) {
  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  DBService.setOtp(cleanEmail, otp, expiresAt);

  console.log(`✨ [CYPR Auth OTP] Generated OTP [${otp}] for ${cleanEmail}`);

  let emailPreviewUrl = null;
  try {
    const mailPromise = sendEmailOtp(cleanEmail, otp);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 4500));
    const mailResult = await Promise.race([mailPromise, timeoutPromise]);
    if (mailResult && mailResult.previewUrl) {
      emailPreviewUrl = mailResult.previewUrl;
    }
  } catch (err) {
    console.warn(`⚠️ Failed to send OTP email:`, err.message);
  }

  res.json({
    success: true,
    message: `Verification OTP sent to ${cleanEmail}`,
    emailPreviewUrl
  });
}

// 2. Verify OTP
function verifyOtp(req, res) {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = DBService.getOtp(cleanEmail);

  if (!stored) {
    return res.status(400).json({ error: 'No OTP requested for this email or OTP expired.' });
  }

  if (Date.now() > stored.expiresAt) {
    DBService.deleteOtp(cleanEmail);
    return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
  }

  if (stored.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Invalid 6-digit OTP code.' });
  }

  res.json({ success: true, message: 'Email verified successfully!' });
}

// 3. User Sign Up
async function signup(req, res) {
  const {
    name, gender, phone, dob, favoriteGenre, bio, avatar,
    preferredQuality, preferredLanguage, subtitlesEnabled, autoPlayNext, theme,
    email, password, otp
  } = req.body || {};

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ error: 'Name, email, password and OTP code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Verify OTP
  const stored = DBService.getOtp(cleanEmail);
  if (!stored || stored.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Invalid or expired OTP. Please verify your email first.' });
  }

  if (DBService.getUserByEmail(cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const hashedPassword = await hashPassword(password);

  const user = {
    id: 'usr_' + Math.random().toString(36).substring(2, 10),
    name: name.trim(),
    gender: gender || 'Rather not say',
    phone: phone ? phone.trim() : '',
    dob: dob || '',
    favoriteGenre: favoriteGenre || 'Sci-Fi',
    bio: bio || 'Co-watching movies together ❤️',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    preferredQuality: preferredQuality || '1080p',
    preferredLanguage: preferredLanguage || 'en',
    subtitlesEnabled: subtitlesEnabled !== undefined ? !!subtitlesEnabled : true,
    autoPlayNext: autoPlayNext !== undefined ? !!autoPlayNext : true,
    theme: theme || 'dark',
    email: cleanEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const savedUser = DBService.createUser(user);
  DBService.deleteOtp(cleanEmail);

  console.log(`🎉 [CYPR Auth Signup] New account created for ${cleanEmail} (${user.name})`);

  const { password: _, ...safeUser } = savedUser;
  const token = generateToken(safeUser);

  res.json({ success: true, message: 'Account created successfully!', user: safeUser, token });
}

// 4. User Login
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = DBService.getUserByEmail(cleanEmail);

  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  console.log(`🔓 [CYPR Auth Login] Successful login: ${cleanEmail}`);

  const { password: _, ...safeUser } = user;
  const token = generateToken(safeUser);

  res.json({ success: true, message: 'Logged in successfully!', user: safeUser, token });
}

// 5. Update Profile & Personalization
async function updateProfile(req, res) {
  const {
    email, name, gender, phone, dob, favoriteGenre, bio, avatar,
    preferredQuality, preferredLanguage, subtitlesEnabled, autoPlayNext, theme
  } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required to update profile.' });
  }

  const updatedUser = DBService.updateUserProfile(email, {
    name, gender, phone, dob, favoriteGenre, bio, avatar,
    preferredQuality, preferredLanguage, subtitlesEnabled, autoPlayNext, theme
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  console.log(`✏️ [CYPR Profile Update] Profile & personalization updated for ${email}`);
  const { password: _, ...safeUser } = updatedUser;
  res.json({ success: true, message: 'Profile updated successfully!', user: safeUser });
}

// 6. Add Watch History Entry
function addWatchHistory(req, res) {
  const { userEmail, roomId, movieTitle, moviePoster, sourceType, url } = req.body || {};
  if (!userEmail || !movieTitle) {
    return res.status(400).json({ error: 'userEmail and movieTitle are required.' });
  }
  DBService.addWatchHistory({ userEmail, roomId, movieTitle, moviePoster, sourceType, url });
  res.json({ success: true, message: 'Watch history saved.' });
}

// 7. Get Watch History
function getWatchHistory(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required.' });
  const history = DBService.getWatchHistory(email, 30);
  res.json({ success: true, history });
}

// 8. Add Room History Entry
function addRoomHistory(req, res) {
  const { userEmail, roomId, isHost } = req.body || {};
  if (!userEmail || !roomId) {
    return res.status(400).json({ error: 'userEmail and roomId are required.' });
  }
  DBService.addRoomHistory({ userEmail, roomId, isHost });
  res.json({ success: true, message: 'Room history saved.' });
}

// 9. Get Room History
function getRoomHistory(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required.' });
  const history = DBService.getRoomHistory(email, 20);
  res.json({ success: true, history });
}

module.exports = {
  sendOtp, verifyOtp, signup, login,
  updateProfile, addWatchHistory, getWatchHistory,
  addRoomHistory, getRoomHistory
};
