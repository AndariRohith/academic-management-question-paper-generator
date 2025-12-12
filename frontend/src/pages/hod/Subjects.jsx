import { useState, useEffect } from 'react';
import '../../styles/DashboardShared.css';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [regulations, setRegulations] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [formMode, setFormMode] = useState('add');
    const [formData, setFormData] = useState({
        subject_id: '',
        subject_code: '',
        subject_name: '',
        regulation_id: '',
        semester: '',
        faculty_assign: '',
        credits: ''
    });
    const [filterData, setFilterData] = useState({
        regulation: '',
        semester: ''
    });
    const [activeFilter, setActiveFilter] = useState(null);

    const apiUrl = 'http://127.0.0.1:5003';

    useEffect(() => {
        fetchSubjects();
        fetchRegulations();
        fetchSemesters();
    }, []);

    const fetchSubjects = async (regulation = '', semester = '') => {
        try {
            setLoading(true);
            let url = `${apiUrl}/get_subjects`;
            if (regulation && semester) {
                url += `?regulation=${regulation}&semester=${semester}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            setSubjects(data || []);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegulations = async () => {
        try {
            const res = await fetch(`${apiUrl}/get_regulations`);
            const data = await res.json();
            setRegulations(data || []);
        } catch (err) {
            console.error('Failed to fetch regulations:', err);
        }
    };

    const fetchSemesters = async () => {
        // Fetch unique semesters from subjects or use predefined list
        try {
            const res = await fetch(`${apiUrl}/get_subjects`);
            const data = await res.json();
            const uniqueSemesters = [...new Set(data.map(s => s.semester))].sort((a, b) => a - b);
            setSemesters(uniqueSemesters.length > 0 ? uniqueSemesters : [1, 2, 3, 4, 5, 6]);
        } catch (err) {
            setSemesters([1, 2, 3, 4, 5, 6]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = formMode === 'update'
            ? `${apiUrl}/update_subject`
            : `${apiUrl}/add_subject`;

        const method = formMode === 'update' ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (res.ok) {
                alert(result.msg);
                setShowForm(false);
                resetForm();
                fetchSubjects();
            } else {
                alert(result.msg || 'Operation failed');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleFilterSubmit = () => {
        if (!filterData.regulation || !filterData.semester) {
            alert('Please select both Regulation and Semester');
            return;
        }
        fetchSubjects(filterData.regulation, filterData.semester);
        setActiveFilter({ regulation: filterData.regulation, semester: filterData.semester });
        setShowFilterModal(false);
    };

    const clearFilter = () => {
        setActiveFilter(null);
        setFilterData({ regulation: '', semester: '' });
        fetchSubjects();
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        try {
            const res = await fetch(`${apiUrl}/delete_subject/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok) {
                alert(result.msg);
                if (activeFilter) {
                    fetchSubjects(activeFilter.regulation, activeFilter.semester);
                } else {
                    fetchSubjects();
                }
            } else {
                alert(result.msg || 'Error deleting subject');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleEdit = (subj) => {
        setFormData({
            subject_id: subj.subject_id,
            subject_code: subj.subject_code,
            subject_name: subj.subject_name,
            regulation_id: subj.regulation_id || '',
            semester: subj.semester,
            faculty_assign: subj.faculty_assign || '',
            credits: subj.credits
        });
        setFormMode('update');
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            subject_id: '',
            subject_code: '',
            subject_name: '',
            regulation_id: '',
            semester: '',
            faculty_assign: '',
            credits: ''
        });
        setFormMode('add');
    };

    const handleAddClick = () => {
        resetForm();
        setFormMode('add');
        setShowForm(true);
    };

    const handleViewClick = () => {
        setShowFilterModal(true);
    };

    return (
        <div className="subjects-page">
            <div className="page-header">
                <h1>📚 Subject Management</h1>
                <p>Add, update, and manage course subjects across regulations</p>
            </div>

            {/* Modes Bar */}
            <div className="modes-bar">
                <button className="btn btn-primary" onClick={handleAddClick}>➕ Add Subject</button>
                <button className="btn btn-secondary" onClick={handleViewClick}>📄 View Subjects</button>
            </div>

            {/* Active Filter Badge */}
            {activeFilter && (
                <div className="active-filter-badge">
                    <span>🔍 Filtered: {activeFilter.regulation} - Semester {activeFilter.semester}</span>
                    <button className="btn btn-sm btn-secondary" onClick={clearFilter}>✖ Clear Filter</button>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📄 View Subjects</h3>
                            <button className="modal-close" onClick={() => setShowFilterModal(false)}>✖</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Regulation</label>
                                <select
                                    name="regulation"
                                    value={filterData.regulation}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">-- Select Regulation --</option>
                                    {regulations.map((r) => (
                                        <option key={r.id} value={r.id}>{r.code}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Select Semester</label>
                                <select
                                    name="semester"
                                    value={filterData.semester}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">-- Select Semester --</option>
                                    {semesters.map((sem) => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleFilterSubmit}>🔍 View</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="form-card">
                    <h3>{formMode === 'update' ? '✏️ Update Subject' : '➕ Add New Subject'}</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label>Subject ID</label>
                            <input
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleInputChange}
                                disabled={formMode === 'update'}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject Code</label>
                            <input
                                name="subject_code"
                                value={formData.subject_code}
                                onChange={handleInputChange}
                                placeholder="e.g., MCA101"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject Name</label>
                            <input
                                name="subject_name"
                                value={formData.subject_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Data Structures"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Regulation</label>
                            <select
                                name="regulation_id"
                                value={formData.regulation_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">-- Select --</option>
                                {regulations.map((r) => (
                                    <option key={r.id} value={r.id}>{r.code}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Semester</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">-- Select --</option>
                                {semesters.map((sem) => (
                                    <option key={sem} value={sem}>{sem}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Credits</label>
                            <input
                                type="number"
                                name="credits"
                                value={formData.credits}
                                onChange={handleInputChange}
                                placeholder="e.g., 4"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Faculty Assigned</label>
                            <input
                                name="faculty_assign"
                                value={formData.faculty_assign}
                                onChange={handleInputChange}
                                placeholder="Faculty ID (optional)"
                            />
                        </div>
                        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-success">💾 Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="content-card">
                <h3>📄 All Subjects</h3>
                <div className="table-container">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : subjects.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📚</div>
                            <p>No subjects found</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Regulation</th>
                                    <th>Semester</th>
                                    <th>Credits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subj) => (
                                    <tr key={subj.subject_id}>
                                        <td>{subj.subject_id}</td>
                                        <td className="accent">{subj.subject_code}</td>
                                        <td className="primary">{subj.subject_name}</td>
                                        <td>{subj.regulation_id || subj.reg_name || '-'}</td>
                                        <td>{subj.semester}</td>
                                        <td>{subj.credits}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-sm btn-primary" title="Edit" onClick={() => handleEdit(subj)}>✏️ Edit</button>
                                                <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(subj.subject_id)}>🗑️ Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subjects;
