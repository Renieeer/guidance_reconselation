// Analytics Script

let referralReasonChart = null;
let reportCaseChart = null;
let followUpChart = null;
let timelineChart = null;

function loadAnalytics() {
    initPage();
    
    const referrals = getData('referrals') || [];

    // Calculate statistics by reason
    const byReason = {};
    referrals.forEach(r => {
        byReason[r.referralReason] = (byReason[r.referralReason] || 0) + 1;
    });

    document.getElementById('analyticsAcademic').textContent = byReason['Academic Concerns'] || 0;
    document.getElementById('analyticsBehavioral').textContent = byReason['Behavioral Issues'] || 0;
    document.getElementById('analyticsMental').textContent = byReason['Mental Health Concern'] || 0;
    document.getElementById('analyticsFamily').textContent = byReason['Family Issues'] || 0;
    document.getElementById('analyticsOther').textContent = 
        (byReason['Other'] || 0) + (byReason['Attendance Problems'] || 0) + 
        (byReason['Social/Peer Issues'] || 0) + (byReason['Substance Abuse'] || 0);

    // By stage
    document.getElementById('analyticsSub').textContent = referrals.filter(r => r.stage === 1).length;
    document.getElementById('analyticsReview').textContent = referrals.filter(r => r.stage === 2).length;
    document.getElementById('analyticsProgress').textContent = referrals.filter(r => r.stage === 5).length;
    document.getElementById('analyticsCounseling').textContent = referrals.filter(r => r.stage === 4).length;
    document.getElementById('analyticsClosed').textContent = referrals.filter(r => r.stage === 6).length;

    // By urgency
    document.getElementById('analyticsLow').textContent = referrals.filter(r => r.urgency === 'Low').length;
    document.getElementById('analyticsMedium').textContent = referrals.filter(r => r.urgency === 'Medium').length;
    document.getElementById('analyticsHigh').textContent = referrals.filter(r => r.urgency === 'High').length;
    document.getElementById('analyticsCrisis').textContent = referrals.filter(r => r.urgency === 'Crisis').length;

    // Performance metrics
    const resolved = referrals.filter(r => r.stage === 6).length;
    const total = referrals.length;
    const closure = total > 0 ? Math.round((resolved / total) * 100) : 0;

    document.getElementById('resolved').textContent = resolved;
    document.getElementById('closureRate').textContent = closure + '%';
    document.getElementById('successRate').textContent = 'Tracking';
    document.getElementById('avgTime').textContent = 'Calculating...';

    loadDetailedStats(referrals, total);
    
    // Load chart data from database
    fetchAnalyticsData();
}

function loadDetailedStats(referrals, total) {
    const tbody = document.getElementById('statsTableBody');
    
    const stats = [
        { metric: 'Total Referrals', value: total, percentage: 100, trend: '→' },
        { metric: 'Pending Review', value: referrals.filter(r => r.stage <= 2).length, percentage: Math.round((referrals.filter(r => r.stage <= 2).length / total * 100) || 0), trend: '↓' },
        { metric: 'In Counseling Stage', value: referrals.filter(r => r.stage >= 3 && r.stage < 6).length, percentage: Math.round(((referrals.filter(r => r.stage >= 3 && r.stage < 6).length) / total * 100) || 0), trend: '↑' },
        { metric: 'Closed Cases', value: referrals.filter(r => r.stage === 6).length, percentage: Math.round((referrals.filter(r => r.stage === 6).length / total * 100) || 0), trend: '↑' },
        { metric: 'High Urgency Cases', value: referrals.filter(r => r.urgency === 'High' || r.urgency === 'Crisis').length, percentage: Math.round(((referrals.filter(r => r.urgency === 'High' || r.urgency === 'Crisis').length) / total * 100) || 0), trend: '→' }
    ];

    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td><strong>${stat.metric}</strong></td>
            <td>${stat.value}</td>
            <td>${stat.percentage}%</td>
            <td style="text-align: center;">${stat.trend}</td>
        </tr>
    `).join('');
}

// Fetch analytics data from database
function fetchAnalyticsData() {
    fetch('/guidancemanagment/api/analytics-data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            initializeCharts(data.data);
        } else {
            initializeChartsWithFallback();
        }
    })
    .catch(error => {
        initializeChartsWithFallback();
    });
}

function initializeCharts(data) {
    // Referral Reason Doughnut Chart
    const referralReasonCtx = document.getElementById('referralReasonChart').getContext('2d');
    if (referralReasonChart) {
        referralReasonChart.destroy();
    }
    referralReasonChart = new Chart(referralReasonCtx, {
        type: 'doughnut',
        data: {
            labels: data.referralReasons.labels,
            datasets: [{
                label: 'Referral Reasons',
                data: data.referralReasons.values,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Report Case Status Bar Chart
    const reportCaseCtx = document.getElementById('reportCaseChart').getContext('2d');
    if (reportCaseChart) {
        reportCaseChart.destroy();
    }
    reportCaseChart = new Chart(reportCaseCtx, {
        type: 'bar',
        data: {
            labels: data.reportCaseStatus.labels,
            datasets: [{
                label: 'Case Status Count',
                data: data.reportCaseStatus.values,
                backgroundColor: [
                    '#3498db',
                    '#e74c3c',
                    '#f39c12',
                    '#2ecc71',
                    '#9b59b6'
                ],
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    // Follow-up Submission Status Pie Chart
    const followUpCtx = document.getElementById('followUpChart').getContext('2d');
    if (followUpChart) {
        followUpChart.destroy();
    }
    followUpChart = new Chart(followUpCtx, {
        type: 'pie',
        data: {
            labels: data.followUpStatus.labels,
            datasets: [{
                label: 'Follow-up Status',
                data: data.followUpStatus.values,
                backgroundColor: [
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#95a5a6'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // Case Processing Timeline Line Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    if (timelineChart) {
        timelineChart.destroy();
    }
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: data.caseTimeline.labels,
            datasets: [
                {
                    label: 'New Referrals',
                    data: data.caseTimeline.newReferrals,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Cases In Progress',
                    data: data.caseTimeline.inProgress,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Closed Cases',
                    data: data.caseTimeline.closed,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializeChartsWithFallback() {
    // Fallback data structure
    const fallbackData = {
        referralReasons: {
            labels: ['Academic Concerns', 'Behavioral Issues', 'Mental Health', 'Family Issues', 'Other'],
            values: [12, 18, 14, 10, 8]
        },
        reportCaseStatus: {
            labels: ['Submitted', 'In Review', 'In Counseling', 'In Progress', 'Closed'],
            values: [15, 20, 12, 8, 10]
        },
        followUpStatus: {
            labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
            values: [18, 12, 20, 5]
        },
        caseTimeline: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
            newReferrals: [8, 12, 10, 15, 9, 11],
            inProgress: [5, 10, 15, 18, 20, 22],
            closed: [2, 3, 5, 8, 10, 12]
        }
    };

    initializeCharts(fallbackData);
}

document.addEventListener('DOMContentLoaded', loadAnalytics);

