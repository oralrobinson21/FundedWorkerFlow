const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { pool } = require('./db');

const router = express.Router();

const generateSecureId = () => crypto.randomUUID();

const logAdminAction = async (adminId, adminEmail, action, resourceType, resourceId, beforeState, afterState, ipAddress) => {
  try {
    await pool.query(`
      INSERT INTO admin_audit_logs (admin_id, admin_email, action, resource_type, resource_id, before_state, after_state, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [adminId, adminEmail, action, resourceType, resourceId, 
        beforeState ? JSON.stringify(beforeState) : null, 
        afterState ? JSON.stringify(afterState) : null, 
        ipAddress]);
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

const requireAdminAuth = async (req, res, next) => {
  const sessionId = req.headers['x-admin-session'];
  if (!sessionId) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const result = await pool.query(`
      SELECT s.*, a.email, a.role, a.is_active 
      FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.id
      WHERE s.id = $1 AND s.expires_at > NOW() AND s.otp_verified = true AND a.is_active = true
    `, [sessionId]);

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Invalid or expired admin session' });
    }

    req.admin = result.rows[0];
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

router.get('/setup-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM admin_users');
    const adminExists = parseInt(result.rows[0].count) > 0;
    res.json({ setupRequired: !adminExists });
  } catch (err) {
    res.json({ setupRequired: true });
  }
});

router.post('/setup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password.length < 12) {
    return res.status(400).json({ error: 'Password must be at least 12 characters' });
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
    return res.status(400).json({ 
      error: 'Password must contain uppercase, lowercase, number, and symbol' 
    });
  }

  try {
    const existingAdmin = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(existingAdmin.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Admin already exists. Setup is disabled.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otpSecret = speakeasy.generateSecret({ 
      name: `CityTasks Admin (${email})`,
      length: 20 
    });

    const recoveryCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    const adminId = generateSecureId();

    await pool.query(`
      INSERT INTO admin_users (id, email, password_hash, role, otp_secret, otp_enabled, recovery_codes)
      VALUES ($1, $2, $3, 'super_admin', $4, false, $5)
    `, [adminId, email.toLowerCase(), passwordHash, otpSecret.base32, recoveryCodes]);

    const qrCodeUrl = await QRCode.toDataURL(otpSecret.otpauth_url);

    await logAdminAction(adminId, email, 'admin_setup', 'admin_users', adminId, null, { email, role: 'super_admin' }, req.ip);

    res.json({
      success: true,
      adminId,
      otpSecret: otpSecret.base32,
      qrCode: qrCodeUrl,
      recoveryCodes,
      message: 'Scan the QR code with your authenticator app'
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

router.post('/enable-otp', async (req, res) => {
  const { adminId, otpCode } = req.body;

  if (!adminId || !otpCode) {
    return res.status(400).json({ error: 'Admin ID and OTP code required' });
  }

  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [adminId]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.otp_secret,
      encoding: 'base32',
      token: otpCode,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    await pool.query('UPDATE admin_users SET otp_enabled = true WHERE id = $1', [adminId]);

    await logAdminAction(adminId, admin.email, 'otp_enabled', 'admin_users', adminId, { otp_enabled: false }, { otp_enabled: true }, req.ip);

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    console.error('Enable OTP error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.otp_enabled) {
      return res.status(403).json({ error: '2FA must be enabled to login. Complete admin setup first.' });
    }

    const sessionId = generateSecureId();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO admin_sessions (id, admin_id, ip_address, user_agent, otp_verified, expires_at)
      VALUES ($1, $2, $3, $4, false, $5)
    `, [sessionId, admin.id, req.ip, req.headers['user-agent'], expiresAt]);

    res.json({ 
      requiresOtp: true, 
      sessionId,
      message: 'Enter your authenticator code' 
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { sessionId, otpCode } = req.body;

  if (!sessionId || !otpCode) {
    return res.status(400).json({ error: 'Session ID and OTP code required' });
  }

  try {
    const sessionResult = await pool.query(`
      SELECT s.*, a.otp_secret, a.email, a.role, a.id as admin_id
      FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.id
      WHERE s.id = $1 AND s.expires_at > NOW()
    `, [sessionId]);

    const session = sessionResult.rows[0];
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const verified = speakeasy.totp.verify({
      secret: session.otp_secret,
      encoding: 'base32',
      token: otpCode,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    await pool.query('UPDATE admin_sessions SET otp_verified = true WHERE id = $1', [sessionId]);
    await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [session.admin_id]);

    await logAdminAction(session.admin_id, session.email, 'admin_login', 'admin_sessions', sessionId, null, { ip: req.ip, otp_verified: true }, req.ip);

    res.json({ 
      success: true,
      admin: { id: session.admin_id, email: session.email, role: session.role }
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

router.post('/logout', requireAdminAuth, async (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  
  try {
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
    await logAdminAction(req.admin.admin_id, req.admin.email, 'admin_logout', 'admin_sessions', sessionId, null, null, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const [tasksStats, usersStats, paymentsStats, recentActivity] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'requested') as pending_tasks,
          COUNT(*) FILTER (WHERE status = 'accepted') as active_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as tasks_24h,
          COUNT(*) as total_tasks
        FROM tasks
      `),
      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'poster' OR role IS NULL) as posters,
          COUNT(*) FILTER (WHERE role = 'helper') as helpers,
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h
        FROM users
      `),
      pool.query(`
        SELECT 
          COALESCE(SUM(price), 0) as total_gmv,
          COALESCE(SUM(platform_fee_amount) / 100.0, 0) as total_platform_fees,
          COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_payments,
          COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_payments
        FROM tasks WHERE status = 'completed'
      `),
      pool.query(`
        SELECT * FROM activity_logs 
        ORDER BY created_at DESC 
        LIMIT 20
      `)
    ]);

    res.json({
      tasks: tasksStats.rows[0],
      users: usersStats.rows[0],
      payments: paymentsStats.rows[0],
      recentActivity: recentActivity.rows
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/users', requireAdminAuth, async (req, res) => {
  const { search, role, limit = 50, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM users');

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/users/:userId', requireAdminAuth, async (req, res) => {
  try {
    const [user, tasks, offers] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]),
      pool.query('SELECT * FROM tasks WHERE poster_id = $1 OR helper_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.userId]),
      pool.query('SELECT * FROM offers WHERE helper_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.userId])
    ]);

    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.rows[0],
      tasks: tasks.rows,
      offers: offers.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

router.put('/users/:userId/suspend', requireAdminAuth, async (req, res) => {
  const { reason } = req.body;

  try {
    const beforeResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    const beforeState = beforeResult.rows[0];

    await pool.query('UPDATE users SET is_suspended = true, suspended_reason = $1 WHERE id = $2', [reason, req.params.userId]);

    await logAdminAction(req.admin.admin_id, req.admin.email, 'user_suspended', 'users', req.params.userId, beforeState, { is_suspended: true, reason }, req.ip);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

router.put('/users/:userId/unsuspend', requireAdminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_suspended = false, suspended_reason = NULL WHERE id = $1', [req.params.userId]);

    await logAdminAction(req.admin.admin_id, req.admin.email, 'user_unsuspended', 'users', req.params.userId, null, { is_suspended: false }, req.ip);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

router.get('/tasks', requireAdminAuth, async (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR id = $${paramIndex + 1})`;
      params.push(`%${search}%`, search);
      paramIndex += 2;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

router.get('/tasks/:taskId', requireAdminAuth, async (req, res) => {
  try {
    const [task, offers, chat, disputes] = await Promise.all([
      pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]),
      pool.query('SELECT * FROM offers WHERE task_id = $1 ORDER BY created_at', [req.params.taskId]),
      pool.query(`
        SELECT m.*, t.id as thread_id 
        FROM chat_threads t 
        LEFT JOIN chat_messages m ON m.thread_id = t.id 
        WHERE t.task_id = $1 
        ORDER BY m.created_at
      `, [req.params.taskId]),
      pool.query('SELECT * FROM disputes WHERE task_id = $1', [req.params.taskId])
    ]);

    if (!task.rows[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      task: task.rows[0],
      offers: offers.rows,
      chatMessages: chat.rows.filter(m => m.id),
      disputes: disputes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load task' });
  }
});

router.put('/tasks/:taskId/cancel', requireAdminAuth, async (req, res) => {
  const { reason, refundAmount } = req.body;

  try {
    const beforeResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    const beforeState = beforeResult.rows[0];

    await pool.query(`
      UPDATE tasks 
      SET status = 'cancelled', canceled_at = NOW(), canceled_by = 'admin'
      WHERE id = $1
    `, [req.params.taskId]);

    await logAdminAction(req.admin.admin_id, req.admin.email, 'task_cancelled', 'tasks', req.params.taskId, beforeState, { status: 'cancelled', reason, refundAmount }, req.ip);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

router.get('/disputes', requireAdminAuth, async (req, res) => {
  const { status = 'pending' } = req.query;

  try {
    const result = await pool.query(`
      SELECT d.*, t.title as task_title, t.price as task_price
      FROM disputes d
      JOIN tasks t ON d.task_id = t.id
      WHERE d.status = $1
      ORDER BY d.created_at DESC
    `, [status]);

    res.json({ disputes: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load disputes' });
  }
});

router.put('/disputes/:disputeId/resolve', requireAdminAuth, async (req, res) => {
  const { resolution, amountReleased, amountRefunded } = req.body;

  try {
    await pool.query(`
      UPDATE disputes 
      SET status = 'resolved', resolution = $1, amount_released = $2, amount_refunded = $3, resolved_at = NOW()
      WHERE id = $4
    `, [resolution, amountReleased, amountRefunded, req.params.disputeId]);

    await logAdminAction(req.admin.admin_id, req.admin.email, 'dispute_resolved', 'disputes', req.params.disputeId, null, { resolution, amountReleased, amountRefunded }, req.ip);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

router.get('/audit-logs', requireAdminAuth, async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM admin_audit_logs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

module.exports = router;
