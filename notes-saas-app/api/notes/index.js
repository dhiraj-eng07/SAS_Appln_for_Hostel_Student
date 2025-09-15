import { getSession } from '../../lib/auth';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const notes = await query(
        'SELECT * FROM notes WHERE tenant_id = $1 ORDER BY created_at DESC',
        [session.tenantId]
      );
      res.status(200).json(notes.rows);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      // Check note limit for free plan
      if (session.tenantPlan === 'free') {
        const noteCount = await query(
          'SELECT COUNT(*) FROM notes WHERE tenant_id = $1',
          [session.tenantId]
        );
        if (parseInt(noteCount.rows[0].count) >= 3) {
          return res.status(403).json({ 
            message: 'Free plan limit reached. Upgrade to Pro to add more notes.' 
          });
        }
      }

      const { title, content } = req.body;
      const newNote = await query(
        'INSERT INTO notes (title, content, tenant_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, session.tenantId, session.userId]
      );
      res.status(201).json(newNote.rows[0]);
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
