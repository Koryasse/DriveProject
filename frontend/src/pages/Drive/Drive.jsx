import { useState, useEffect, useMemo, useRef } from 'react';
import './Drive.css';

import FileIcon from '../../assets/img/icons/file.svg';
import DownloadIcon from '../../assets/img/icons/download.svg';
import RenameIcon from '../../assets/img/icons/rename.svg';
import DeleteIcon from '../../assets/img/icons/delete.svg';
import SearchIcon from '../../assets/img/icons/search.svg';
import DateIcon from '../../assets/img/icons/date.svg';

import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import { api } from '../../utils/api.js';

const STEP = 5;

function Drive() {

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [visibleCount, setVisibleCount] = useState(STEP);

  const [modal, setModal] = useState({ type: null, file: null, value: '' });

  const fileInputRef = useRef(null);
  const tableRef = useRef(null);

  const [storage, setStorage] = useState({ used_gb: 0, total_gb: 10, percent: 0 });

  const fetchStorage = async () => {
    try {
      const res = await api.getStorage();
      const data = await res.json();
      setStorage(data);
    } catch (err) {
      console.error("Erreur storage:", err);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  // ---------------- FETCH FILES ----------------

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.getFiles();

      if (!res.ok) throw new Error("Unable to fetch files");

      const data = await res.json();
      setFiles(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // ---------------- ESC CLOSE MODAL ----------------

  useEffect(() => {

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setModal({ type: null, file: null, value: "" });
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };

  }, [modal]);

  // ---------------- UPLOAD ----------------

  const openFilePicker = () => fileInputRef.current.click();

  const handleUpload = async (event) => {

    const uploadedFiles = event.target.files;

    for (let i = 0; i < uploadedFiles.length; i++) {

      const formData = new FormData();
      formData.append("file", uploadedFiles[i]);

      await api.upload(formData);
    }

    fetchStorage();
    fetchFiles();
  };

  // ---------------- DELETE ----------------

  const handleDelete = async () => {

    if (!modal.file) return;

    await api.delete(modal.file.name);

    setModal({ type: null, file: null, value: '' });

    fetchStorage();
    fetchFiles();
  };

  // ---------------- RENAME ----------------

  const handleRename = async () => {

    if (!modal.file || !modal.value) return;

    const originalName = modal.file.name;

    const ext = originalName.includes(".")
      ? "." + originalName.split(".").pop()
      : "";

    const newName = modal.value + ext;

    await api.rename(originalName, newName);

    setModal({ type: null, file: null, value: '' });

    fetchFiles();
  };

  // ---------------- DOWNLOAD ----------------

  const handleDownload = (file) => {
    api.download(file.name);
  };

  // ---------------- FILTER ----------------

  const filteredFiles = useMemo(() => {

    return files
      .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
      .filter(f => filterType === 'all' || f.type === filterType)
      .filter(f => {

        if (filterDate === 'all') return true;

        const now = new Date();
        const fileDate = new Date(f.date);

        const diffDays = (now - fileDate) / (1000 * 60 * 60 * 24);

        if (filterDate === 'last7') return diffDays <= 7;
        if (filterDate === 'last30') return diffDays <= 30;

        return true;
      });

  }, [files, search, filterType, filterDate]);

  const visibleFiles = filteredFiles.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(STEP);
  }, [search, filterType, filterDate]);

  const handleShowLess = () => {

    setVisibleCount(STEP);

    tableRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  // ---------------- RENDER ----------------

  return (

    <div className="drive-layout">
      <Sidebar openFilePicker={openFilePicker} fileInputRef={fileInputRef} handleUpload={handleUpload} storage={storage}/>
      <main className="drive-content">
        {/* ---------------- HEADER ---------------- */}
        <header className="drive-header">
          <h2>Welcome to Nebula</h2>
          <div className="search-bar">
            <img src={SearchIcon} alt="search" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="drive-filters">
            <div className="filter-box">
              <img src={FileIcon} alt="type" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All types</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word</option>
                <option value="sheet">Excel</option>
                <option value="ppt">PowerPoint</option>
                <option value="txt">Texte</option>
                <option value="image">Images</option>
                <option value="video">Vidéos</option>
                <option value="audio">Audio</option>
                <option value="archive">Archives</option>
                <option value="code">Code</option>
                <option value="other">Autres</option>
              </select>
            </div>
            <div className="filter-box">
              <img src={DateIcon} alt="date" />
              <select value={filterDate} onChange={e => setFilterDate(e.target.value)} >
                <option value="all">All dates</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
              </select>
            </div>
          </div>
        </header>

        {/* ---------------- CONTENT ---------------- */}
        {loading && <p>Loading...</p>}
        {error && (
          <p style={{ color: "red" }}> Error: {error} </p>
        )}
        {!loading && !error && (
          <>
            {filteredFiles.length === 0 ? (
              <p>No files found.</p>
            ) : (
              <>
                {/* ---------------- FILES & ACTIONS ---------------- */}
                <table ref={tableRef} className="drive-table" >
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFiles.map((file, idx) => (
                      <tr key={file.id + idx}>
                        <td data-label="Name" className="file-name" >
                          <img src={FileIcon} alt="file icon" />
                          <span> {file.name} </span>
                        </td>
                        <td data-label="Date"> {file.date} </td>
                        <td data-label="Type"> {file.type} </td>
                        <td data-label="Actions" className="drive-actions" >
                          <img
                            src={RenameIcon}
                            alt="rename"
                            onClick={() => {

                              const nameWithoutExt =
                                file.name.includes(".")
                                  ? file.name.substring(
                                      0,
                                      file.name.lastIndexOf(".")
                                    )
                                  : file.name;

                              setModal({
                                type: "rename",
                                file,
                                value: nameWithoutExt
                              });

                            }}
                          />
                          <img
                            src={DownloadIcon}
                            alt="download"
                            onClick={() => handleDownload(file)}
                          />
                          <img
                            src={DeleteIcon}
                            alt="delete"
                            onClick={() =>
                              setModal({
                                type: "delete",
                                file
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ---------------- PAGINATION ---------------- */}
                {filteredFiles.length > STEP && (
                  <div className="drive-pagination">
                    {visibleCount < filteredFiles.length && (
                      <button
                        onClick={() =>
                          setVisibleCount(v =>
                            Math.min(
                              v + STEP,
                              filteredFiles.length
                            )
                          )
                        }
                      > Show more </button>

                    )}
                    {visibleCount > STEP && (
                      <button onClick={handleShowLess}> Show less </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---------------- MODAL ---------------- */}

        {modal.type && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target.classList.contains("modal-overlay")) {
                setModal({
                  type: null,
                  file: null,
                  value: ""
                });
              }
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()} >
              {modal.type === 'delete' && (
                <div>
                  <p> Are you sure you want to delete <strong> {modal.file.name} </strong> ? </p>
                  <div className="modal-buttons">
                    <button
                      onClick={() =>
                        setModal({
                          type: null,
                          file: null,
                          value: ''
                        })
                      }
                    > Cancel </button>
                    <button className="danger" onClick={handleDelete} > Delete </button>
                  </div>
                </div>
              )}
              {modal.type === 'rename' && (
                <div>
                  <p> Rename <strong> {modal.file.name} </strong> </p>
                  <input
                    type="text"
                    autoFocus
                    value={modal.value}
                    onChange={e =>
                      setModal(prev => ({
                        ...prev,
                        value: e.target.value
                      }))
                    }
                  />
                  <div className="modal-buttons">
                    <button
                      onClick={() =>
                        setModal({
                          type: null,
                          file: null,
                          value: ''
                        })
                      }
                    > Cancel </button>
                    <button className='rename' onClick={handleRename}> Rename </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Drive;