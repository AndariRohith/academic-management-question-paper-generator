// Ensure this file's code runs only once
if (!window.hodDashboardLoaded) {
    window.hodDashboardLoaded = true;

    let hodChart = null;

    function loadHodData() {
        fetch("http://127.0.0.1:5001/get_hod_stats")
            .then(res => res.json())
            .then(data => {
                document.getElementById('facultyCount').textContent = data.faculty;
                document.getElementById('subjectCount').textContent = data.subjects;
                document.getElementById('paperCount').textContent = data.papers;
                document.getElementById('qbCount').textContent = data.questionbanks;

                updateChart(data);
            })
            .catch(err => console.error("Error loading HOD stats:", err));
    }

    function updateChart(data) {
        const ctx = document.getElementById('hodChart').getContext('2d');

        if (hodChart) hodChart.destroy();

        hodChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Faculty', 'Subjects', 'Papers', 'Banks'],
                datasets: [{
                    label: 'Statistics',
                    data: [
                        data.faculty,
                        data.subjects,
                        data.papers,
                        data.questionbanks
                    ],
                    backgroundColor: ['#6A1B9A', '#8E24AA', '#AB47BC', '#BA68C8']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Expose initializer to SPA loader
    window.initHodDashboard = function () {
        loadHodData();
    };
}
