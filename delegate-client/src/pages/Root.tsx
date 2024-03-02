import React, { useState } from 'react';

const Root = () => {
  const [cid, setCid] = useState('');

  const handleInputChange = (e) => {
    setCid(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Redirect to the same domain with the CID as a query parameter
      window.location.href = `${window.location.origin}?cid=${cid}`;
    }
  };

  return (
    <div>
      <input
        type="text"
        value={cid}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter CID"
      />
    </div>
  );
};

export default Root;