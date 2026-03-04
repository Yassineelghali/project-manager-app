import { supabase } from './supabase';

// In-memory fallback storage
const INVITATION_TOKENS: Record<string, any> = {};

export function generateInvitationToken(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

export async function createInvitationToken(email: string, subprojectId: string, tlId: string): Promise<string> {
  const token = generateInvitationToken();
  
  try {
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
      // Fallback to memory
      INVITATION_TOKENS[token] = { email, subprojectId, tlId, createdAt: new Date().toISOString(), acceptedAt: null };
    } else {
      console.log('Token saved to Supabase:', token);
    }
  } catch (err) {
    console.error('Error:', err);
    // Fallback to memory
    INVITATION_TOKENS[token] = { email, subprojectId, tlId, createdAt: new Date().toISOString(), acceptedAt: null };
  }
  
  return token;
}

export async function getInvitationByToken(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return INVITATION_TOKENS[token] || null;
    }
    
    console.log('Invitation found in Supabase:', token);
    return data;
  } catch (err) {
    console.error('Error:', err);
    return INVITATION_TOKENS[token] || null;
  }
}

export async function acceptInvitation(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invitation_tokens')
      .update({ acceptedAt: new Date().toISOString() })
      .eq('token', token);
    
    if (error) {
      console.error('Supabase error:', error);
      if (INVITATION_TOKENS[token]) {
        INVITATION_TOKENS[token].acceptedAt = new Date().toISOString();
        return true;
      }
      return false;
    }
    
    console.log('Invitation accepted in Supabase:', token);
    return true;
  } catch (err) {
    console.error('Error:', err);
    if (INVITATION_TOKENS[token]) {
      INVITATION_TOKENS[token].acceptedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}
