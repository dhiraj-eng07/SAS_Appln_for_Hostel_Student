// frontend-only.js - Mock API for frontend demonstration
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Mock data for demonstration
const mockNotes = {
  'acme': [
    { id: 1, title: 'Welcome Note', content: 'Welcome to Acme notes', created_at: new Date() },
    { id: 2, title: 'Meeting Notes', content: 'Meeting with team', created_at: new Date() }
  ],
  'globex': [
    { id: 1, title: 'Globex Project', content: 'Project details', created_at: new Date() }
  ]
};

const mockUsers = {
  'admin@acme.test': { id: 1, email: 'admin@acme.test', role: 'admin', tenant: { slug: 'acme', plan: 'free' } },
  'user@acme.test': { id: 2, email: 'user@acme.test', role: 'member', tenant: { slug: 'acme', plan: 'free' } },
  'admin@globex.test': { id: 3, email: 'admin@globex.test', role: 'admin', tenant: { slug: 'globex', plan: 'free' } },
  'user@globex.test': { id: 4, email: 'user@globex.test', role: 'member', tenant: { slug: 'globex', plan: 'free' } }
};

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Mock API endpoints
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { email, password } = JSON.parse(body);
          
          if (password === 'password' && mockUsers[email]) {
            const user = mockUsers[email];
            const token = 'mock-jwt-token-' + Date.now();
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              token,
              user
            }));
          } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ message: 'Invalid credentials' }));
          }
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: 'Invalid request' }));
        }
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/notes') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token-')) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'Unauthorized' }));
        return;
      }

      // Extract tenant from token (simplified)
      const email = Object.keys(mockUsers).find(email => 
        authHeader.includes(mockUsers[email].id)
      );
      
      if (email) {
        const tenantSlug = mockUsers[email].tenant.slug;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mockNotes[tenantSlug] || []));
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'Unauthorized' }));
      }
      return;
    }

    // Handle all other requests with Next.js
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Frontend-only server running on http://localhost:3000');
    console.log('> Test accounts:');
    console.log('> admin@acme.test / password (Admin)');
    console.log('> user@acme.test / password (Member)');
    console.log('> admin@globex.test / password (Admin)');
    console.log('> user@globex.test / password (Member)');
  });
});
