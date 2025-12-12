import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../../styles/DashboardShared.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Stats = () => {
    const [stats, setStats] = useState({
        faculty: 0,
        subjects: 0,
        papers: 0,
        questionbanks: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch general stats
            const res = await fetch('http://127.0.0.1:5001/get_hod_stats');
            const data = await res.json();

            // Fetch QB stats
            const qbRes = await fetch('http://127.0.0.1:5004/get_qb_count');
            const qbData = await qbRes.json();

            setStats({
                ...data,
                questionbanks: qbData.count || 0
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const statCards = [
        { id: 'faculty', label: 'Total Faculty', icon: '👨‍🏫', color: 'purple' },
        { id: 'subjects', label: 'Total Subjects', icon: '📚', color: 'blue' },
        { id: 'papers', label: 'Papers Generated', icon: '🧾', color: 'green' },
        { id: 'questionbanks', label: 'Question Banks', icon: '📝', color: 'orange' },
    ];

    // Chart Configuration
    const chartData = {
        labels: ['Faculty', 'Subjects', 'Papers Generated', 'Question Banks'],
        datasets: [
            {
                label: 'Count',
                data: [stats.faculty, stats.subjects, stats.papers, stats.questionbanks],
                backgroundColor: [
                    'rgba(124, 58, 237, 0.7)', // Purple
                    'rgba(14, 165, 233, 0.7)', // Blue
                    'rgba(16, 185, 129, 0.7)', // Green
                    'rgba(245, 158, 11, 0.7)', // Orange
                ],
                borderColor: [
                    'rgba(124, 58, 237, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#F1F5F9' }
            },
            title: {
                display: true,
                text: 'Department Statistics',
                color: '#F1F5F9'
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94A3B8' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94A3B8' }
            }
        }
    };

    return (
        <div className="stats-page">
            <div className="page-header">
                <h1>📊 Department Overview</h1>
                <p>Real-time statistics and performance metrics for MCA Department</p>
            </div>

            <div className="stats-grid">
                {statCards.map((card) => (
                    <div key={card.id} className="stat-card">
                        <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                        <div className="stat-content">
                            <h3>{card.label}</h3>
                            <div className="number">{stats[card.id] || 0}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chart-section">
                <div className="chart-header">
                    <h2>Performance Overview</h2>
                    <span className="badge">Live Data</span>
                </div>
                <div className="chart-container" style={{ position: 'relative', height: '400px', width: '100%' }}>
                    <Bar options={chartOptions} data={chartData} />
                </div>
            </div>
        </div>
    );
};

export default Stats;
