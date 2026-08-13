import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const data = await signUp(email, password, fullName, role);

      if (data.session) {
        // Email confirmation is off in the Supabase project -> logged in immediately.
        navigate(role === 'landlord' ? '/dashboard/landlord' : '/dashboard/tenant');
      } else {
        // Email confirmation is on -> they need to check their inbox first.
        setNotice('Account created! Check your email to confirm before logging in.');
      }
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-card-sub">Join as a tenant looking for a home, or a landlord listing one.</p>

        {error && <div className="form-error">{error}</div>}
        {notice && <div className="auth-note">{notice}</div>}

        {!notice && (
          <form onSubmit={handleSubmit}>
            <div className="role-select">
              <label className={`role-option ${role === 'tenant' ? 'active-tenant' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="tenant"
                  checked={role === 'tenant'}
                  onChange={() => setRole('tenant')}
                />
                I&rsquo;m a Tenant
              </label>
              <label className={`role-option ${role === 'landlord' ? 'active-landlord' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="landlord"
                  checked={role === 'landlord'}
                  onChange={() => setRole('landlord')}
                />
                I&rsquo;m a Landlord
              </label>
            </div>

            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-accent btn-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
