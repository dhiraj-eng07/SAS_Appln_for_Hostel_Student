import { initDatabase } from '../../lib/init-db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Add a simple security check (optional)
  const { secret } = req.body;
  if (secret !== process.env.INIT_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await initDatabase();
    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
}