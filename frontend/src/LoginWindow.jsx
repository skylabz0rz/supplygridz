import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './LoginWindow.css';

const LoginWindow = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="win95-container">
      <div className="win95-header">
        <span>SupplyGridz Login</span>
        <button className="win95-close">X</button>
      </div>
      <div className="win95-body">
        <div className="win95-promo">
          <p>[ Promo or game update text goes here - customizable from backend later ]</p>
        </div>
        <div className="win95-login">
          <button className="win95-button" onClick={() => loginWithRedirect()}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginWindow;
