import { createClient } from '@supabase/supabase-js';

// Initialized with your specific URL and Publishable Key
const supabaseUrl = 'https://ixthowwozsxjwmxemivq.supabase.co';
const supabaseKey = 'sb_publishable_iBnbsDOqvg5m_uUJaMMgEA_zRzjw2hE'; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // ---------------------------------------------------------
  // GET REQUEST: Fetch the visitor logs
  // ---------------------------------------------------------
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('visitor_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }

  // ---------------------------------------------------------
  // POST REQUEST: Log a new visitor
  // ---------------------------------------------------------
  if (req.method === 'POST') {
    // Extract IP address (headers vary slightly by hosting provider like Vercel/Netlify)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    
    // Extract Device/Browser details from the User-Agent header
    const userAgent = req.headers['user-agent'] || 'Unknown Device/Browser';

    // Insert into Supabase
    const { data, error } = await supabase
      .from('visitor_logs')
      .insert([
        { 
          ip_address: ipAddress, 
          user_agent: userAgent 
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).json({ message: 'Visitor logged successfully', data });
  }

  // ---------------------------------------------------------
  // FALLBACK: Reject other methods (PUT, DELETE, etc.)
  // ---------------------------------------------------------
  return res.status(405).json({ message: 'Method Not Allowed' });
}
