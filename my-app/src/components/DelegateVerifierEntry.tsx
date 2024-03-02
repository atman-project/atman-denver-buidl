import React, { useState } from 'react';
import styles from './DelegateVerifierEntry.module.css';

function DelegateVerifierRow({ id, onRemove }) {
  const [role, setRole] = useState('verifier');
  const [text, setText] = useState('');
  const [timestamp, setTimestamp] = useState('');

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  const handleVerifierChange = (event) => {
    setText(event.target.value);
  };

  const handleTimestampChange = (event) => {
    setTimestamp(event.target.value);
  };

  return (
    <div className={styles.row}>
      <input
        type="text"
        value={text}
        onChange={handleVerifierChange}
        placeholder="Recipient address"
      />
      <div>
        <input
          type="radio"
          id={`verifier-${id}`}
          name={`role-${id}`}
          value="verifier"
          checked={role === 'verifier'}
          onChange={handleRoleChange}
        />
        <label htmlFor={`verifier-${id}`}>Verifier</label>

        <input
          type="radio"
          id={`delegate-${id}`}
          name={`role-${id}`}
          value="delegate"
          checked={role === 'delegate'}
          onChange={handleRoleChange}
        />
        <label htmlFor={`delegate-${id}`}>Delegate</label>
      </div>
      <input
        type="text"
        value={timestamp}
        onChange={handleTimestampChange}
        placeholder="Enter timestamp"
      />
      <button type="button" className={styles.removeButton} onClick={() => onRemove(id)}>Remove</button>
    </div>
  );
}

export default DelegateVerifierRow;
