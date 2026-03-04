// User service - handles all user-related API calls

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string;
  team?: string;
  joinDate?: string;
  color?: string;
  collabId?: string;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  department?: string;
  team?: string;
  role?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create user' };
    }

    const data = await response.json();
    return { success: true, userId: data.userId };
  } catch (err) {
    console.error('Error creating user:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Login failed' };
    }

    const data = await response.json();
    return { success: true, user: data.user };
  } catch (err) {
    console.error('Error logging in:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      console.error('Failed to fetch users');
      return [];
    }
    return await response.json();
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}
