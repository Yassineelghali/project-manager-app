import { useState, useEffect } from 'react';
import { signUp } from '@/lib/supabaseAuth';

export default function InvitationPage() {
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    department: '',
    team: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkInvitation = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('invite');

      if (!token) {
        setError('Aucun token d\'invitation fourni');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          setError('Lien d\'invitation invalide ou expiré');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.acceptedAt) {
          setError('Ce lien d\'invitation a déjà été utilisé');
        } else {
          setInvitation(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking invitation:', err);
        setError('Erreur lors de la vérification de l\'invitation');
        setLoading(false);
      }
    };

    checkInvitation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('invite');

      // Sign up with Supabase Auth
      const signUpResult = await signUp(invitation.email, formData.password, {
        name: formData.name,
        department: formData.department,
        team: formData.team
      });

      if (!signUpResult.success) {
        setError(signUpResult.error || 'Erreur lors de la création du compte');
        setSubmitting(false);
        return;
      }

      // Mark invitation as accepted
      const acceptResponse = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!acceptResponse.ok) {
        console.warn('Failed to mark invitation as accepted');
      }

      alert(`Compte créé avec succès! Email: ${invitation.email}\n\nVous pouvez maintenant vous connecter.`);
      window.location.href = '/';
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors de la création du compte');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Vérification de l'invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ color: '#ff4444', marginBottom: '20px' }}>
          <strong>Erreur:</strong> {error}
        </div>
        <a href="/" style={{ color: '#0088cc', textDecoration: 'none' }}>
          Retour à la page d'accueil
        </a>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Invitation non trouvée</p>
        <a href="/" style={{ color: '#0088cc', textDecoration: 'none' }}>
          Retour à la page d'accueil
        </a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A1628 0%, #162945 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#0F1E35',
        border: '1px solid rgba(100,180,220,0.15)',
        borderRadius: '8px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ color: '#E8F4F8', marginBottom: '10px', fontSize: '24px' }}>
          Créer votre compte
        </h1>
        <p style={{ color: '#A8CDE0', marginBottom: '30px', fontSize: '14px' }}>
          Vous avez été invité à rejoindre l'équipe
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              EMAIL (auto-rempli)
            </label>
            <input
              type="email"
              value={invitation.email}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#A8CDE0',
                fontFamily: 'Arial, sans-serif',
                opacity: 0.7
              }}
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              NOM COMPLET *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Votre nom complet"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#E8F4F8',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              MOT DE PASSE *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Au moins 6 caractères"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#E8F4F8',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              CONFIRMER LE MOT DE PASSE *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirmez votre mot de passe"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#E8F4F8',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>

          {/* Department */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              DÉPARTEMENT
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Votre département"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#E8F4F8',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>

          {/* Team */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#A8CDE0', display: 'block', marginBottom: '8px', fontSize: '12px' }}>
              ÉQUIPE
            </label>
            <input
              type="text"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder="Votre équipe"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1D3557',
                border: '1px solid rgba(100,180,220,0.2)',
                borderRadius: '4px',
                color: '#E8F4F8',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)',
              color: '#FF4444',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '12px'
            }}>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: submitting ? '#666' : '#00A8CC',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting) (e.target as HTMLButtonElement).style.background = '#0096B8';
            }}
            onMouseLeave={(e) => {
              if (!submitting) (e.target as HTMLButtonElement).style.background = '#00A8CC';
            }}
          >
            {submitting ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ color: '#6B92AC', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>
          Vous avez déjà un compte? <a href="/" style={{ color: '#00A8CC', textDecoration: 'none' }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
