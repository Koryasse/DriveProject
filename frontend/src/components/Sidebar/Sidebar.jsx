import React from 'react';
import './Sidebar.css';
import NewIcon from '../../assets/img/icons/new.svg';
import HomeIcon from '../../assets/img/icons/home.svg';
import ProfileIcon from '../../assets/img/icons/profile.svg';
import CloudIcon from '../../assets/img/icons/cloud.svg';
import Logo from '../../assets/img/nebulaLogo/nebulaBlack.svg';

function Sidebar({ openFilePicker, fileInputRef, handleUpload }) {

  // Exemple temporaire
  const usedStorage = 2.05;
  const totalStorage = 10;

  const percent = (usedStorage / totalStorage) * 100;

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <img src={Logo} alt="Logo" />
        <h2>Nebula</h2>
      </div>

      <nav className="sidebar-menu">

        <button className="sidebar-item" onClick={openFilePicker}>
          <img src={NewIcon} alt="New" />
          <span>New</span>
        </button>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleUpload}
        />

        <button className="sidebar-item">
          <img src={HomeIcon} alt="Home" />
          <span>Home</span>
        </button>

        <button className="sidebar-item">
          <img src={ProfileIcon} alt="Profile" />
          <span>Profile</span>
        </button>

      </nav>

      <div className="sidebar-footer">

        <div className="storage-box">

          <div className="storage-header">
            <img src={CloudIcon} alt="cloud" />
            <span>Espace de stockage</span>
          </div>

          <div className="storage-bar">
            <div
              className="storage-progress"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <p className="storage-text">
            {usedStorage.toFixed(2).replace('.', ',')} Go utilisé(s) sur {totalStorage} Go
          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;