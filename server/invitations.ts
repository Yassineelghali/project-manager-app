import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Generate random token
function generateToken(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

// Create invitation
router.post('/api/invitations/create', async (req, res) => {
  try {
    const { email, subprojectId, tlId } = req.body;
    
    if (!email || !subprojectId || !tlId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const token = generateToken();
    
    const { error } = await supabase
      .from('invitation_tokens')
      .insert([{
        token,
        email,
        subprojectId,
        tlId,
        createdAt: new Date().toISOString(),
        acceptedAt: null
      }]);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create invitation' });
    }
    
    res.json({ token, inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?invite=${token}` });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invitation by token
router.get('/api/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data, error } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation
router.post('/api/invitations/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { error } = await supabase
      .from('invitation_tokens')
      .update({ acceptedAt: new Date().toISOString() })
      .eq('token', token);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to accept invitation' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user from invitation
router.post('/api/users/create-from-invitation', async (req, res) => {
  try {
    const { token, name, password, department, team } = req.body;
    
    if (!token || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (invError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation already used' });
    }
    
    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        name,
        email: invitation.email,
        password,
        role: 'Collaborator',
        department: department || '',
        team: team || '',
        joinDate: new Date().toISOString()
      }]);
    
    if (userError) {
      console.error('Supabase error:', userError);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Mark invitation as accepted
    await supabase
      .from('invitation_tokens')
      .update({ acceptedAt: new Date().toISOString() })
      .eq('token', token);
    
    res.json({ success: true, userId, email: invitation.email });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
