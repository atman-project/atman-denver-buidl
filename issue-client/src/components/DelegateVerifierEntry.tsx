import React, { useState } from 'react';
import styles from './DelegateVerifierEntry.module.css';

export type Role = 'verifier' | 'delegate';

export interface Permission {
  id: number;
  address: string;
  role: Role;
  timestamp: number;
}

interface DelegateVerifierRowProps {
  id: number;
  address: string;
  role: Role;
  timestamp: number;
  onRemove: (id: number) => void;
  onRowChange: (id: number, field: keyof Permission, value: string | number) => void;
}

function DelegateVerifierRow({ 
  id,
  address,
  role,
  timestamp,
  onRemove,
  onRowChange }: DelegateVerifierRowProps
) {
  
  const handleRoleChange = (event) => {
    onRowChange(id, 'role', event.target.value)
  };

  const handleAddressChange = (event) => {
    onRowChange(id, 'address', event.target.value)
  };

  return (
    <div className={styles.row}>
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
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
        placeholder="Enter timestamp"
        readOnly={true}
      />
      <button type="button" className={styles.removeButton} onClick={() => onRemove(id)}>Remove</button>
    </div>
  );
}

export default DelegateVerifierRow;
