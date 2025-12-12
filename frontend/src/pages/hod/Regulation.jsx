import { useState, useEffect } from 'react';
import '../../styles/DashboardShared.css';

const Regulation = () => {
    const [regulations, setRegulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        reg_id: '',
        reg_name: ''
    });
    const [isUpdate, setIsUpdate] = useState(false);

    // Backend runs on port 5002 for regulations
    const apiUrl = 'http://127.0.0.1:5002';

    useEffect(() => {
        fetchRegulations();
    }, []);

    const fetchRegulations = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/get_regulations`);
            const data = await res.json();
            setRegulations(data || []);
        } catch (err) {
            console.error('Failed to fetch regulations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isUpdate
            ? `${apiUrl}/update_regulation`
            : `${apiUrl}/add_regulation`;

        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (res.ok) {
                alert(result.msg);
                setShowForm(false);
                resetForm();
                fetchRegulations();
            } else {
                alert(result.msg || 'Operation failed');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this regulation?')) return;
        try {
            const res = await fetch(`${apiUrl}/delete_regulation/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok) {
                alert(result.msg);
                fetchRegulations();
            } else {
                alert(result.msg || 'Error deleting regulation');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleEdit = (reg) => {
        setFormData({
            reg_id: reg.reg_id,
            reg_name: reg.reg_name
        });
        setIsUpdate(true);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ reg_id: '', reg_name: '' });
        setIsUpdate(false);
    };

    return (
        <div className="regulation-page">
            <div className="page-header">
                <h1>📋 Regulation Management</h1>
                <p>Add, update, and manage academic regulations</p>
                <div className="actions-bar" style={{ marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        ➕ Add Regulation
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="form-card">
                    <h3>{isUpdate ? '✏️ Update Regulation' : '➕ Add New Regulation'}</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label>Regulation ID (e.g., R20)</label>
                            <input
                                name="reg_id"
                                value={formData.reg_id}
                                onChange={handleInputChange}
                                disabled={isUpdate}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Regulation Name (e.g., Regulation 2020)</label>
                            <input
                                name="reg_name"
                                value={formData.reg_name}
                                onChange={handleInputChange}
                                required
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
                <h3>📄 All Regulations</h3>
                <div className="table-container">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : regulations.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📋</div>
                            <p>No regulations found</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regulations.map((reg) => (
                                    <tr key={reg.reg_id}>
                                        <td className="accent">{reg.reg_id}</td>
                                        <td className="primary">{reg.reg_name}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-sm btn-primary" title="Edit" onClick={() => handleEdit(reg)}>✏️ Edit</button>
                                                <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(reg.reg_id)}>🗑️ Delete</button>
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

export default Regulation;
