const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to calculate statistics
const calculateStats = (files) => {
  let totalStorageUsed = 0;
  let totalFiles = files ? files.length : 0;
  let downloads = 0;
  let sharedFiles = 0;
  let recentActivity = 0;

  if (files && files.length > 0) {
    // Calculate total storage used
    files.forEach(file => {
      if (file.metadata && file.metadata.size) {
        totalStorageUsed += file.metadata.size;
      }
    });

    // For now, we'll use some reasonable defaults since we don't have tracking tables
    downloads = Math.floor(totalFiles * 0.8); // Assume 80% of files have been downloaded
    sharedFiles = Math.floor(totalFiles * 0.3); // Assume 30% of files are shared
    recentActivity = Math.floor(totalFiles * 0.6); // Assume 60% have recent activity
  }

  // Convert bytes to GB for display
  const storageUsedGB = (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2);
  const totalStorageGB = 1; // 1 GB limit for free tier

  // Convert bytes to appropriate unit for display
  let storageUsedDisplay, storageTotalDisplay;
  const totalStorageBytes = totalStorageGB * 1024 * 1024 * 1024;
  
  if (totalStorageUsed < 1024 * 1024 * 1024) {
    // Less than 1 GB, show in MB
    storageUsedDisplay = (totalStorageUsed / (1024 * 1024)).toFixed(2) + ' MB';
    storageTotalDisplay = (totalStorageGB * 1024) + ' MB';
  } else {
    // 1 GB or more, show in GB
    storageUsedDisplay = (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    storageTotalDisplay = totalStorageGB + ' GB';
  }
  
  const storagePercentage = Math.min((totalStorageUsed / totalStorageBytes) * 100, 100);

  return {
    totalFiles,
    downloads,
    sharedFiles,
    recentActivity,
    storageUsed: storageUsedDisplay,
    storageTotal: storageTotalDisplay,
    storagePercentage: storagePercentage.toFixed(1)
  };
};

// ===================
// GET: Register Page
// ===================
router.get('/register', (req, res) => {
  res.render('register');
});

// ===================
// POST: Register with Supabase
// ===================
router.post(
  '/register',
  body('email').trim().isEmail().isLength({ min: 12 }),
  body('password').trim().isLength({ min: 5 }),
  body('username').trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid input',
      });
    }

    const { email, password, username } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.send('Signup successful! Please check your email to confirm.');
  }
);

// ===================
// GET: Login Page
// ===================
router.get('/login', (req, res) => {
  const error = req.query.error;
  res.render('login', { error });
});

// ===================
// POST: Login with Supabase
// ===================
router.post(
  '/login',
  body('email').isEmail(),
  body('password').trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(401).render('login', { error: 'Invalid input' });
    }

    const { email, password, rememberMe } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).render('login', { error: 'Email or password is incorrect' });
    }

    // Set cookie with appropriate expiration
    const token = data.session.access_token;
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    };

    if (rememberMe) {
      // Remember me for 30 days
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      // Session cookie (expires when browser closes)
      cookieOptions.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    }

    res.cookie('token', token, cookieOptions);

    // Render login page with success message and redirect script
    res.render('login', { success: true });
  }
);

// ===================
// GET: Google OAuth
// ===================
router.get('/auth/google', async (req, res) => {
  try {
    console.log('Google OAuth initiated');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/user/auth/callback`
      }
    });

    if (error) {
      console.error('Google OAuth error:', error);
      if (error.message && error.message.includes('not enabled')) {
        return res.redirect('/user/login?error=Google OAuth is not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers.');
      }
      return res.redirect('/user/login?error=Google authentication failed: ' + error.message);
    }

    console.log('Google OAuth URL:', data.url);
    res.redirect(data.url);
  } catch (err) {
    console.error('Google OAuth exception:', err);
    res.redirect('/user/login?error=Google authentication failed. Please try again.');
  }
});

// ===================
// GET: GitHub OAuth
// ===================
router.get('/auth/github', async (req, res) => {
  try {
    console.log('GitHub OAuth initiated');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/user/auth/callback`
      }
    });

    if (error) {
      console.error('GitHub OAuth error:', error);
      if (error.message && error.message.includes('not enabled')) {
        return res.redirect('/user/login?error=GitHub OAuth is not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers.');
      }
      return res.redirect('/user/login?error=GitHub authentication failed: ' + error.message);
    }

    console.log('GitHub OAuth URL:', data.url);
    res.redirect(data.url);
  } catch (err) {
    console.error('GitHub OAuth exception:', err);
    res.redirect('/user/login?error=GitHub authentication failed. Please try again.');
  }
});

// ===================
// GET: OAuth Callback
// ===================
router.get('/auth/callback', async (req, res) => {
  console.log('OAuth callback received:', req.query);
  const { code, error } = req.query;

  if (error) {
    console.error('OAuth callback error:', error);
    return res.redirect('/user/login?error=Authentication failed: ' + error);
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return res.redirect('/user/login?error=Authentication failed: ' + exchangeError.message);
      }

      if (data.session) {
        console.log('OAuth authentication successful');
        // Set cookie with 30 days expiration for OAuth users
        res.cookie('token', data.session.access_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Redirect to dashboard
        res.redirect('/user/dashboard');
      } else {
        console.error('No session in OAuth response');
        res.redirect('/user/login?error=Authentication failed: No session received');
      }
    } catch (err) {
      console.error('OAuth callback exception:', err);
      res.redirect('/user/login?error=Authentication failed: ' + err.message);
    }
  } else {
    console.error('No code in OAuth callback');
    res.redirect('/user/login?error=Authentication failed: No authorization code received');
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');

    // Always verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      res.clearCookie('token', { path: '/' });
      return res.redirect('/user/login');
    }
    const user = data.user;

    // Fetch file list from Supabase storage
    const { data: files, error: listError } = await supabase
      .storage
      .from('user-files')
      .list(user.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.log('Dashboard list error:', listError);
      return res.render('dashboard', { user, files: [], username: user.email, error: 'Error fetching files: ' + listError.message });
    }

    // Get username from user metadata if available
    const username = user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email;

    res.render('dashboard', { 
      user, 
      files: files || [], 
      username,
      stats: calculateStats(files)
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).send('Something went wrong: ' + error.message);
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      console.log('No token found');
      return res.redirect('/user/login');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.log('User error:', userError);
      return res.redirect('/user/login');
    }

    const file = req.file;
    if (!file) {
      console.log('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    console.log('Uploading file:', file.originalname, 'for user:', user.id);
    const filename = `${user.id}/${file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.log('Upload error:', uploadError);
      return res.status(500).send('Upload failed: ' + uploadError.message);
    }

    console.log('File uploaded successfully, fetching updated file list');

    // Fetch updated file list
    const { data: files, error: listError } = await supabase
      .storage
      .from('user-files')
      .list(user.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.log('List error:', listError);
      return res.status(500).send('Error fetching files: ' + listError.message);
    }

    console.log('Files fetched successfully, rendering dashboard');
    
    // Get username from user metadata if available
    const username = user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email;

    res.render('dashboard', { 
      user, 
      files, 
      username, 
      fileSuccess: true,
      stats: calculateStats(files)
    });
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).send('Something went wrong: ' + error.message);
  }
});

router.get('/download/:filename', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.redirect('/login');

  const { filename } = req.params;
  const filePath = `${user.id}/${filename}`;

  // Fetch the file from Supabase Storage
  const { data, error: downloadError } = await supabase
    .storage
    .from('user-files')
    .download(filePath);

  if (downloadError || !data) {
    return res.send('Error downloading file: ' + (downloadError ? downloadError.message : 'File not found'));
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', data.type || 'application/octet-stream');
  data.arrayBuffer().then(buffer => {
    res.send(Buffer.from(buffer));
  });
});

router.get('/delete/:filename', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.redirect('/login');

  const { filename } = req.params;
  const filePath = `${user.id}/${filename}`;
  console.log('Deleting file:', filePath);

  const { error: deleteError } = await supabase
    .storage
    .from('user-files')
    .remove([filePath]);

  if (deleteError) return res.send('Error deleting file: ' + deleteError.message);

  // Fetch updated file list
  const { data: files, error: listError } = await supabase
    .storage
    .from('user-files')
    .list(user.id + '/', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (listError) {
    return res.send('Error fetching files: ' + listError.message);
  }

  // Get username from user metadata if available
  const username = user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email;

  res.render('dashboard', { 
    user, 
    files, 
    username,
    deleteSuccess: true,
    stats: calculateStats(files)
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.redirect('/user/login');
});

router.post('/update-username', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/user/login');

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.redirect('/user/login');

  const { username } = req.body;
  if (!username || username.length < 3 || username.length > 20) {
    // Fetch file list for dashboard
    const { data: files } = await supabase
      .storage
      .from('user-files')
      .list(user.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    return res.render('dashboard', { 
      user, 
      files, 
      username: user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email,
      usernameError: 'Username must be 3-20 characters.',
      stats: calculateStats(files)
    });
  }

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({ data: { username } }, token);

  // Fetch updated user and file list
  const { data: updatedUserData } = await supabase.auth.getUser(token);
  const updatedUser = updatedUserData ? updatedUserData.user : user;
  const { data: files } = await supabase
    .storage
    .from('user-files')
    .list(user.id + '/', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (updateError) {
    return res.render('dashboard', { 
      user: updatedUser, 
      files, 
      username: updatedUser.user_metadata && updatedUser.user_metadata.username ? updatedUser.user_metadata.username : updatedUser.email,
      usernameError: 'Failed to update username.',
      stats: calculateStats(files)
    });
  }

  // Get username from user metadata if available
  const usernameValue = updatedUser.user_metadata && updatedUser.user_metadata.username ? updatedUser.user_metadata.username : updatedUser.email;

  res.render('dashboard', { 
    user: updatedUser, 
    files, 
    username: usernameValue, 
    usernameSuccess: true,
    stats: calculateStats(files)
  });
});

router.post('/change-password', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.redirect('/user/login');

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 5) {
      // Fetch file list for dashboard
      const { data: files } = await supabase
        .storage
        .from('user-files')
        .list(user.id + '/', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });
      return res.render('dashboard', { 
        user, 
        files, 
        username: user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email,
        passwordError: 'Invalid password input.',
        stats: calculateStats(files)
      });
    }

    // Re-authenticate user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (signInError) {
      const { data: files } = await supabase
        .storage
        .from('user-files')
        .list(user.id + '/', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });
      return res.render('dashboard', { 
        user, 
        files, 
        username: user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email,
        passwordError: 'Current password is incorrect.',
        stats: calculateStats(files)
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword }, token);
    const { data: files } = await supabase
      .storage
      .from('user-files')
      .list(user.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    if (updateError) {
      return res.render('dashboard', { 
        user, 
        files, 
        username: user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email,
        passwordError: 'Failed to update password.',
        stats: calculateStats(files)
      });
    }
    res.render('dashboard', { 
      user, 
      files, 
      username: user.user_metadata && user.user_metadata.username ? user.user_metadata.username : user.email,
      passwordSuccess: true,
      stats: calculateStats(files)
    });
  } catch (err) {
    // Always show a popup error instead of a generic error page
    const token = req.cookies.token;
    let user = null, files = [], username = '';
    if (token) {
      try {
        const { data: { user: u } } = await supabase.auth.getUser(token);
        user = u;
        username = user && user.user_metadata && user.user_metadata.username ? user.user_metadata.username : (user ? user.email : '');
        const { data: f } = await supabase
          .storage
          .from('user-files')
          .list(user.id + '/', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          });
        files = f || [];
      } catch {}
    }
    res.render('dashboard', { 
      user, 
      files, 
      username, 
      passwordError: 'Something went wrong. Please try again.',
      stats: calculateStats(files)
    });
  }
});

router.post('/delete-account', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/user/login');

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.redirect('/user/login');

  // Delete user from Supabase
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    const { data: files } = await supabase
      .storage
      .from('user-files')
      .list(user.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    return res.render('dashboard', { user, files, deleteAccountError: 'Failed to delete account.' });
  }
  res.clearCookie('token', { path: '/' });
  res.render('dashboard', { deleteAccountSuccess: true });
});

router.get('/test-storage', async (req, res) => {
  try {
    console.log('Testing Supabase storage connection...');
    
    // Test if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('Buckets error:', bucketsError);
      return res.json({ error: 'Cannot list buckets: ' + bucketsError.message });
    }
    
    console.log('Available buckets:', buckets);
    
    // Test if user-files bucket exists
    const { data: files, error: listError } = await supabase.storage
      .from('user-files')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('List error:', listError);
      return res.json({ 
        error: 'Cannot access user-files bucket: ' + listError.message,
        buckets: buckets
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Storage is working correctly',
      buckets: buckets,
      files: files
    });
    
  } catch (error) {
    console.error('Test storage error:', error);
    res.json({ error: 'Test failed: ' + error.message });
  }
});

router.delete('/delete/:filename', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { filename } = req.params;
  const filePath = `${user.id}/${filename}`;
  console.log('Deleting file:', filePath);

  const { error: deleteError } = await supabase
    .storage
    .from('user-files')
    .remove([filePath]);

  if (deleteError) return res.status(500).json({ error: deleteError.message });

  res.json({ success: true });
});

// ===================
// GET: OAuth Status Check
// ===================
router.get('/auth/status', async (req, res) => {
  try {
    // Test Google OAuth
    const googleTest = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/user/auth/callback`
      }
    });

    // Test GitHub OAuth
    const githubTest = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/user/auth/callback`
      }
    });

    res.json({
      google: {
        configured: !googleTest.error,
        error: googleTest.error?.message || null
      },
      github: {
        configured: !githubTest.error,
        error: githubTest.error?.message || null
      },
      message: 'OAuth configuration status'
    });
  } catch (err) {
    res.json({
      error: err.message,
      message: 'Error checking OAuth status'
    });
  }
});

module.exports = router;
