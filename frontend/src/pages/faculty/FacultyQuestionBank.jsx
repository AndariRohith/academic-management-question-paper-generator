import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DashboardShared.css';

const FacultyQuestionBank = () => {
    const { user } = useAuth();
    const [regulations, setRegulations] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterData, setFilterData] = useState({
        regulation: '',
        semester: ''
    });
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showManageModal, setShowManageModal] = useState(false);
    const [qbFiles, setQbFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const subjectsApiUrl = 'http://127.0.0.1:5003';
    const qbApiUrl = 'http://127.0.0.1:5004';

    useEffect(() => {
        fetchRegulations();
        fetchSemesters();
    }, []);

    const fetchRegulations = async () => {
        try {
            const res = await fetch(`${subjectsApiUrl}/get_regulations`);
            const data = await res.json();
            setRegulations(data || []);
        } catch (err) {
            console.error('Failed to fetch regulations:', err);
        }
    };

    const fetchSemesters = async () => {
        try {
            const res = await fetch(`${subjectsApiUrl}/get_subjects`);
            const data = await res.json();
            // Filter likely not needed for semesters, but good to have context
            const uniqueSemesters = [...new Set(data.map(s => s.semester))].sort((a, b) => a - b);
            setSemesters(uniqueSemesters.length > 0 ? uniqueSemesters : [1, 2, 3, 4, 5, 6]);
        } catch (err) {
            setSemesters([1, 2, 3, 4, 5, 6]);
        }
    };

    // Auto-fetch subjects when regulation or semester changes
    useEffect(() => {
        if (filterData.regulation && filterData.semester) {
            handleFilter();
        } else {
            setSubjects([]);
        }
    }, [filterData.regulation, filterData.semester]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilter = async () => {
        if (!filterData.regulation || !filterData.semester) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${subjectsApiUrl}/get_subjects?regulation=${filterData.regulation}&semester=${filterData.semester}`);
            const data = await res.json();

            // FILTER: Only show subjects assigned to this faculty
            const facultySubjects = data.filter(s =>
                s.faculty_assign &&
                s.faculty_assign.toLowerCase() === user.username.toLowerCase()
            );

            // Fetch QB count for each subject
            const subjectsWithCount = await Promise.all(
                facultySubjects.map(async (subject) => {
                    const qbRes = await fetch(`${qbApiUrl}/list_qb/${subject.subject_id}`);
                    const qbData = await qbRes.json();
                    return {
                        ...subject,
                        qb_count: qbData.length || 0
                    };
                })
            );

            setSubjects(subjectsWithCount);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManage = async (subject) => {
        setSelectedSubject(subject);
        setShowManageModal(true);
        await fetchQBFiles(subject.subject_id);
    };

    const fetchQBFiles = async (subjectId) => {
        try {
            const res = await fetch(`${qbApiUrl}/list_qb/${subjectId}`);
            const data = await res.json();
            setQbFiles(data || []);
        } catch (err) {
            console.error('Failed to fetch QB files:', err);
        }
    };

    const handleFileUpload = async (files) => {
        if (!selectedSubject) return;

        setUploading(true);
        try {
            for (const file of files) {
                if (file.type !== 'application/pdf') {
                    alert(`${file.name} is not a PDF file`);
                    continue;
                }

                const formData = new FormData();
                formData.append('subject_id', selectedSubject.subject_id);
                formData.append('file', file);

                const res = await fetch(`${qbApiUrl}/upload_qb`, {
                    method: 'POST',
                    body: formData
                });

                const result = await res.json();
                if (!res.ok) {
                    alert(`Error uploading ${file.name}: ${result.error}`);
                }
            }

            alert('Files uploaded successfully!');
            await fetchQBFiles(selectedSubject.subject_id);
            // Refresh subject list to update QB count
            handleFilter();
        } catch (err) {
            alert('Error uploading files');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteQB = async (filename) => {
        if (!confirm(`Delete ${filename}?`)) return;

        try {
            const res = await fetch(`${qbApiUrl}/delete_qb?subject_id=${selectedSubject.subject_id}&filename=${filename}`, {
                method: 'DELETE'
            });

            const result = await res.json();
            if (res.ok) {
                alert(result.message);
                await fetchQBFiles(selectedSubject.subject_id);
                handleFilter();
            } else {
                alert(result.error);
            }
        } catch (err) {
            alert('Error deleting file');
        }
    };

    const handleViewQB = (filename) => {
        const url = `${qbApiUrl}/download_qb?subject_id=${selectedSubject.subject_id}&filename=${filename}`;
        window.open(url, '_blank');
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(Array.from(e.target.files));
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="questionbank-page">
            <div className="page-header">
                <h1>📝 Question Bank Management</h1>
                <p>Upload and manage question bank PDFs for your assigned subjects</p>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="form-group">
                    <label>Regulation</label>
                    <select name="regulation" value={filterData.regulation} onChange={handleFilterChange}>
                        <option value="">-- Select --</option>
                        {regulations.map((r) => (
                            <option key={r.id} value={r.id}>{r.code}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Semester</label>
                    <select name="semester" value={filterData.semester} onChange={handleFilterChange}>
                        <option value="">-- Select --</option>
                        {semesters.map((sem) => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Subjects Table */}
            <div className="content-card">
                <h3>📚 Assigned Subjects</h3>
                <div className="table-container">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : subjects.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📚</div>
                            <p>No assigned subjects found for this selection.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>QB Count</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subj, i) => (
                                    <tr key={subj.subject_id}>
                                        <td>{i + 1}</td>
                                        <td className="accent">{subj.subject_code}</td>
                                        <td className="primary">{subj.subject_name}</td>
                                        <td><span className="badge">{subj.qb_count}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => handleManage(subj)}>📂 Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Manage Modal */}
            {showManageModal && selectedSubject && (
                <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📂 Manage Question Banks - {selectedSubject.subject_code}</h3>
                            <button className="modal-close" onClick={() => setShowManageModal(false)}>✖</button>
                        </div>
                        <div className="modal-body">
                            {/* Upload Zone */}
                            <div
                                className={`dropzone ${dragActive ? 'active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="dropzone-icon">📄</div>
                                <h3>Drag & Drop PDF files here</h3>
                                <p>or click to browse</p>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    multiple
                                    onChange={handleFileInputChange}
                                    disabled={uploading}
                                />
                                {uploading && <p className="uploading-text">Uploading...</p>}
                            </div>

                            {/* Files List */}
                            <div className="qb-files-list">
                                <h4>📋 Uploaded Question Banks ({qbFiles.length})</h4>
                                {qbFiles.length === 0 ? (
                                    <p className="empty-text">No question banks uploaded yet.</p>
                                ) : (
                                    <div className="files-grid">
                                        {qbFiles.map((file) => (
                                            <div key={file.filename} className="file-card">
                                                <div className="file-icon">📄</div>
                                                <div className="file-info">
                                                    <div className="file-name" title={file.filename}>{file.filename}</div>
                                                    <div className="file-size">{formatFileSize(file.size)}</div>
                                                </div>
                                                <div className="file-actions">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleViewQB(file.filename)} title="View PDF">👁️</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQB(file.filename)} title="Delete">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowManageModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyQuestionBank;
