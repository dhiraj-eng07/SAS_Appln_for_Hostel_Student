import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // Get user with tenant info
    const user = await query(
      `SELECT users.*, tenants.slug as tenant_slug, tenants.plan as tenant_plan 
       FROM users 
       JOIN tenants ON users.tenant_id = tenants.id 
       WHERE email = $1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userData = user.rows[0];
    
    // Check password (in production, use hashed passwords)
    if (password !== 'password') { // For demo purposes only
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = sign(
      { 
        userId: userData.id, 
        email: userData.email, 
        role: userData.role, 
        tenantId: userData.tenant_id,
        tenantSlug: userData.tenant_slug,
        tenantPlan: userData.tenant_plan
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      token, 
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        tenant: {
          id: userData.tenant_id,
          slug: userData.tenant_slug,
          plan: userData.tenant_plan
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
