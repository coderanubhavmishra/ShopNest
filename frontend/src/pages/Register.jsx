import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Arriving from Login with an unverified account → jump straight to OTP stage
  const [stage, setStage] = useState(
    location.state?.verifyEmail ? 'otp' : 'form'
  );
  const [email, setEmail] = useState(location.state?.verifyEmail || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(location.state?.verifyMessage || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setStage('otp');
        setMessage(data.message || 'OTP sent to your email.');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { message: text.slice(0, 120) || 'No response from server' }; }
      if (res.ok) {
        // Verification successful — backend now returns the auth token
        login(data);
        navigate('/');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Could not reach the server. Is the backend running? (' + err.message + ')');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Could not resend OTP. Please try again.');
    }
  };

  if (stage === 'otp') {
    return (
      <div className="auth-container">
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <h2>Verify Your Email</h2>
          <p style={{ color: '#a1a1aa', marginBottom: '10px' }}>
            We sent a 6-digit OTP to <strong style={{ color: '#f97316' }}>{email}</strong>.
          </p>
          {message && <p style={{ color: '#10b981', marginBottom: '10px' }}>{message}</p>}
          {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" className="btn" style={{ background: '#3b82f6' }} onClick={handleResendOtp}>
            Resend OTP
          </button>
          <p><Link to="/login">Back to Login</Link></p>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2>Register</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
};

export default Register;