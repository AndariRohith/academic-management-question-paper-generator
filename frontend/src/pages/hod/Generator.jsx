import { useState, useEffect } from 'react';
import '../../styles/DashboardShared.css';

const Generator = () => {
    const [regulations, setRegulations] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        regulation: '',
        semester: '',
        subject: '',
        sets: '4'
    });
    const [uploadedFile, setUploadedFile] = useState(null);
    const [parsedId, setParsedId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedPapers, setGeneratedPapers] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const apiUrl = 'http://127.0.0.1:5005';

    useEffect(() => {
        fetchRegulations();
    }, []);

    // Fetch semesters when regulation changes
    useEffect(() => {
        if (formData.regulation) {
            fetchSemesters(formData.regulation);
        } else {
            setSemesters([]);
            setSubjects([]);
        }
    }, [formData.regulation]);

    // Fetch subjects when semester changes
    useEffect(() => {
        if (formData.regulation && formData.semester) {
            fetchSubjects(formData.regulation, formData.semester);
        } else {
            setSubjects([]);
        }
    }, [formData.regulation, formData.semester]);

    const fetchRegulations = async () => {
        try {
            const res = await fetch(`${apiUrl}/get_regulations`);
            const data = await res.json();
            setRegulations(data.regulations || []);
        } catch (err) {
            console.error('Failed to fetch regulations:', err);
        }
    };

    const fetchSemesters = async (regId) => {
        try {
            const res = await fetch(`${apiUrl}/get_semesters/${regId}`);
            const data = await res.json();
            setSemesters(data.semesters || []);
        } catch (err) {
            console.error('Failed to fetch semesters:', err);
        }
    };

    const fetchSubjects = async (regId, semester) => {
        try {
            const res = await fetch(`${apiUrl}/get_subjects/${regId}/${semester}`);
            const data = await res.json();
            setSubjects(data.subjects || []);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Reset dependent fields
            if (name === 'regulation') {
                updated.semester = '';
                updated.subject = '';
            } else if (name === 'semester') {
                updated.subject = '';
            }
            return updated;
        });
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
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                handleFileUpload(file);
            } else {
                showToast('Please upload a PDF file', 'error');
            }
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                handleFileUpload(file);
            } else {
                showToast('Please upload a PDF file', 'error');
            }
        }
    };

    const handleFileUpload = async (file) => {
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await fetch(`${apiUrl}/upload_question_bank`, {
                method: 'POST',
                body: formDataUpload
            });

            const result = await res.json();
            if (res.ok) {
                setUploadedFile(file.name);
                setParsedId(result.parsed_id);
                showToast(`Question bank uploaded successfully! Found ${Object.keys(result.units_count).length} units.`);
            } else {
                showToast(`Upload failed: ${result.error}`, 'error');
            }
        } catch (err) {
            showToast('Error uploading file', 'error');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleGeneratePapers = async () => {
        if (!formData.regulation || !formData.semester || !formData.subject) {
            showToast('Please select Regulation, Semester, and Subject', 'error');
            return;
        }

        if (!parsedId) {
            showToast('Please upload a question bank PDF first', 'error');
            return;
        }

        setGenerating(true);
        try {
            const selectedSubject = subjects.find(s => s.id === formData.subject);
            const selectedRegulation = regulations.find(r => r.id === formData.regulation);

            const payload = {
                parsed_id: parsedId,
                num_sets: parseInt(formData.sets),
                paper_meta: {
                    subject_name: selectedSubject?.name || '',
                    subject_code: selectedSubject?.code || '',
                    regulation: selectedRegulation?.name || '',
                    semester: formData.semester
                }
            };

            const res = await fetch(`${apiUrl}/generate_sets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (res.ok) {
                setGeneratedPapers(result.sets || []);
                showToast(`Successfully generated ${result.sets.length} question paper sets!`);
            } else {
                showToast(`Generation failed: ${result.error}`, 'error');
            }
        } catch (err) {
            showToast('Error generating papers', 'error');
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const showUploadAndResults = formData.regulation && formData.semester && formData.subject;

    return (
        <div className="generator-page">
            <div className="page-header">
                <h1>🎯 Question Paper Generator</h1>
                <p>Generate unique question paper sets from your question bank</p>
            </div>

            {/* Generator Settings - Moved to Top */}
            <div className="content-card">
                <h3>⚙️ Generator Settings</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Regulation</label>
                        <select
                            name="regulation"
                            value={formData.regulation}
                            onChange={handleInputChange}
                        >
                            <option value="">-- Select --</option>
                            {regulations.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Semester</label>
                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleInputChange}
                            disabled={!formData.regulation}
                        >
                            <option value="">-- Select --</option>
                            {semesters.map((sem) => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            disabled={!formData.semester}
                        >
                            <option value="">-- Select --</option>
                            {subjects.map((subj) => (
                                <option key={subj.id} value={subj.id}>
                                    {subj.code} - {subj.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Number of Sets</label>
                        <select name="sets" value={formData.sets} onChange={handleInputChange}>
                            <option value="4">4 Sets</option>
                            <option value="3">3 Sets</option>
                            <option value="2">2 Sets</option>
                            <option value="1">1 Set</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Upload Section - Conditional */}
            {showUploadAndResults && (
                <div className="content-card">
                    <h3>📤 Upload Question Bank PDF</h3>
                    <div
                        className={`dropzone ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="dropzone-icon">📄</div>
                        <h3>Drag & Drop PDF file here</h3>
                        <p>or click to browse</p>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileInputChange}
                            disabled={uploading}
                        />
                        {uploading && <p className="uploading-text">Uploading and parsing...</p>}
                        {uploadedFile && <p className="success-text">✅ Uploaded: {uploadedFile}</p>}
                    </div>

                    {/* Generate Papers Button - Moved below upload */}
                    <div className="form-actions">
                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleGeneratePapers}
                            disabled={generating || !parsedId}
                        >
                            {generating ? '⏳ Generating...' : '🚀 Generate Papers'}
                        </button>
                    </div>
                </div>
            )}

            {/* Generated Papers - Conditional */}
            {showUploadAndResults && (
                <div className="content-card">
                    <h3>📥 Generated Papers</h3>
                    {generatedPapers.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📋</div>
                            <p>No papers generated yet</p>
                            <small>Upload a question bank and click generate to create paper sets</small>
                        </div>
                    ) : (
                        <div className="papers-grid">
                            {generatedPapers.map((paper, idx) => (
                                <div key={idx} className="paper-card">
                                    <div className="paper-icon">📄</div>
                                    <div className="paper-info">
                                        <h4>{paper.set}</h4>
                                        <p>Question Paper</p>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => window.open(`${apiUrl}${paper.url.replace('/download/', '/view/')}`, '_blank')}
                                    >
                                        👁️ View
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Toast Notification */}
            {toast.visible && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' ? '✅' : '🚫'}
                        </div>
                        <div className="toast-content">
                            <p className="toast-message">{toast.message}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Generator;
