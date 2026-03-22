import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
  let strength = 0;
  let color = '';
  let label = '';

  if (password.length > 0) {
    strength += 10;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  }

  if (strength < 30) {
    color = '#ef4444';
    label = 'Weak';
  } else if (strength < 60) {
    color = '#f59e0b';
    label = 'Fair';
  } else if (strength < 85) {
    color = '#10b981';
    label = 'Good';
  } else {
    color = '#059669';
    label = 'Strong';
  }

  return (
    <div className="strength-meter">
      <div className="strength-bar" style={{ width: `${strength}%`, backgroundColor: color }}></div>
      <span className="strength-label" style={{ color }}>{label}</span>
    </div>
  );
};

export default PasswordStrengthMeter;
</xai:function_call > 

<xai:function_call name="edit_file">
<parameter name="path">frontend/src/App.css
