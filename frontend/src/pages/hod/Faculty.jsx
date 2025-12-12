import { useState, useEffect } from 'react';
import '../../styles/DashboardShared.css';

const Faculty = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        faculty_id: '',
        name: '',
        designation: '',
        date_of_joining: '',
        qualification: '',
        nature_of_association: '',
        password: ''
    });
    const [profilePdf, setProfilePdf] = useState(null);
    const [isUpdate, setIsUpdate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const apiUrl = 'http://127.0.0.1:5000';

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/get_faculty`);
            const data = await res.json();
            setFaculty(data.data || []);
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePdf(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.keys(formData).forEach(key => fd.append(key, formData[key]));
        if (profilePdf) {
            fd.append('profile_pdf', profilePdf);
        }

        const url = isUpdate
            ? `${apiUrl}/update_faculty/${formData.faculty_id}`
            : `${apiUrl}/add_faculty`;

        try {
            const res = await fetch(url, { method: 'POST', body: fd });
            const result = await res.json();
            if (result.status === 'success') {
                alert(result.message);
                setShowForm(false);
                resetForm();
                fetchFaculty();
            } else {
                alert(result.message || 'Error saving faculty');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this faculty member?')) return;
        try {
            const res = await fetch(`${apiUrl}/delete_faculty/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.status === 'success') {
                fetchFaculty();
            }
        } catch (err) {
            alert('Error deleting faculty');
        }
    };

    const handleEdit = (f) => {
        setFormData({
            faculty_id: f.faculty_id,
            name: f.name,
            designation: f.designation || '',
            date_of_joining: f.date_of_joining || '',
            qualification: f.qualification || '',
            nature_of_association: f.nature_of_association || '',
            password: f.password || ''
        });
        setProfilePdf(null); // Reset file input
        setIsUpdate(true);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            faculty_id: '',
            name: '',
            designation: '',
            date_of_joining: '',
            qualification: '',
            nature_of_association: '',
            password: ''
        });
        setProfilePdf(null);
        setIsUpdate(false);
    };

    const handleViewPdf = (filename) => {
        if (filename) {
            window.open(`${apiUrl}/view_profile/${filename}`, '_blank');
        } else {
            alert('No profile PDF available');
        }
    };

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.faculty_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="faculty-page">
            <div className="page-header">
                <h1>👨‍🏫 Faculty Management</h1>
                <div className="actions-bar">
                    <div className="search-input">
                        <span>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        ➕ Add Faculty
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="form-card">
                    <h3>{isUpdate ? '✏️ Update Faculty' : '➕ Add New Faculty'}</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label>Faculty ID</label>
                            <input
                                name="faculty_id"
                                value={formData.faculty_id}
                                onChange={handleInputChange}
                                disabled={isUpdate}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <input name="designation" value={formData.designation} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Date of Joining</label>
                            <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Qualification</label>
                            <input name="qualification" value={formData.qualification} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Nature of Association</label>
                            <input name="nature_of_association" value={formData.nature_of_association} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Profile PDF</label>
                            <input type="file" accept=".pdf" onChange={handleFileChange} />
                            {isUpdate && <small style={{ color: '#94A3B8' }}>Leave empty to keep existing PDF</small>}
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-success">💾 Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : filteredFaculty.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📭</div>
                        <p>No faculty records found</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Joining Date</th>
                                <th>Qualification</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.map((f, i) => (
                                <tr key={f.faculty_id}>
                                    <td>{i + 1}</td>
                                    <td className="accent">{f.faculty_id}</td>
                                    <td className="primary">{f.name}</td>
                                    <td>{f.designation || '-'}</td>
                                    <td>{f.date_of_joining || '-'}</td>
                                    <td>{f.qualification || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                title="View Profile PDF"
                                                onClick={() => handleViewPdf(f.profile_pdf)}
                                                disabled={!f.profile_pdf}
                                                style={{ opacity: f.profile_pdf ? 1 : 0.5 }}
                                            >
                                                👁️ View PDF
                                            </button>
                                            <button className="btn btn-sm btn-primary" title="Edit" onClick={() => handleEdit(f)}>✏️ Edit</button>
                                            <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(f.faculty_id)}>🗑️ Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Faculty;
