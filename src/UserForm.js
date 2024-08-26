import React, { useState } from 'react';

function UserForm({ onSubmit }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      onSubmit(username);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <div className="row align-items-bottom">
        <div className="col-sm-8 col-md-6 col-lg-4 mb-3">
          <label htmlFor="username" className="sr-only">Sleeper Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Sleeper username"
          />
        </div>
        <div className="col-auto mb-3">
          <button type="submit" className="btn btn-success">
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}

export default UserForm;
