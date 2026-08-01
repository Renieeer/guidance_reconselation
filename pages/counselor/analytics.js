// Analytics Script

// Canonical 6-stage referral pipeline labels — same mapping used by
// pages/other-school/analytics.js and pages/student/referral-status.js.
const STAGE_LABELS = {
    1: 'Admission of Case',
    2: 'Initial Screening',
    3: 'Parent Consent',
    4: 'Assessment Proper',
    5: 'Parent Conference',
    6: 'External Referral'
};

let referralReasonChart = null;
let reportCaseChart = null;
let followUpChart = null;
let timelineChart = null;

// Full reason -> count breakdown for the current referrals, kept separately
// from the doughnut chart's top-5-only slice so the export button (7.3) can
// download every reason, not just the ones that fit on the chart.
let referralReasonCounts = {};

function loadAnalytics() {
    initPage();

    const user = getCurrentUser();
    const school = (user && user.school_attended) || '';
    const gradeScope = getCurrentGradeScope();
    const referralUrl = `../../api/referral.php?role=counselor&school=${encodeURIComponent(school)}&grade_scope=${encodeURIComponent(gradeScope)}`;
    // Real case records (section/category, status, follow-up log) — used to
    // build the follow-up status chart from actual data instead of fallback.
    const caseUrl = `../../api/case-scenario.php?school_attended=${encodeURIComponent(school)}&grade_scope=${encodeURIComponent(gradeScope)}&limit=200`;

    Promise.all([
        fetch(referralUrl).then(r => r.json()),
        fetch(caseUrl).then(r => r.json())
    ])
        .then(([referralResult, caseResult]) => {
            if (!referralResult.success) {
                throw new Error(referralResult.message || 'Failed to load referrals');
            }
            const cases = caseResult.success ? (caseResult.data || []) : [];
            renderAnalytics(referralResult.data || [], cases);
        })
        .catch(error => {
            console.error('Error loading analytics:', error);
            ['analyticsSub', 'analyticsReview', 'analyticsProgress', 'analyticsCounseling', 'analyticsClosed',
             'resolved', 'closureRate', 'successRate', 'avgTime']
                .forEach(id => { document.getElementById(id).textContent = '—'; });
            loadDetailedStats([], 0);
            initializeChartsWithFallback();
        });
}

function renderAnalytics(referrals, cases) {
    // NOTE: the "Referrals by Reason" card (analyticsAcademic/Behavioral/
    // Mental/Family/Other) is intentionally left alone here — referral_reason
    // is free text typed by the referring teacher (see referral-form.php),
    // there's no fixed category on the referral itself, so bucketing it into
    // those 5 labels can't be done by exact match against real data. Needs
    // either a controlled category field on the referral form or a mapping
    // decision before this card can show real numbers.

    // By stage
    document.getElementById('analyticsSub').textContent = referrals.filter(r => r.stage === 1).length;
    document.getElementById('analyticsReview').textContent = referrals.filter(r => r.stage === 2).length;
    document.getElementById('analyticsProgress').textContent = referrals.filter(r => r.stage === 5).length;
    document.getElementById('analyticsCounseling').textContent = referrals.filter(r => r.stage === 4).length;
    document.getElementById('analyticsClosed').textContent = referrals.filter(r => r.stage === 6).length;

    // Performance metrics
    const resolved = referrals.filter(r => r.stage === 6).length;
    const total = referrals.length;
    const closure = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const resolutionDays = referrals
        .filter(r => r.stage === 6 && r.date_submitted && r.updated_at)
        .map(r => Math.max(0, Math.floor((new Date(r.updated_at) - new Date(r.date_submitted)) / (1000 * 60 * 60 * 24))));
    const avgTime = resolutionDays.length > 0
        ? Math.round(resolutionDays.reduce((sum, d) => sum + d, 0) / resolutionDays.length) + ' days'
        : 'N/A';

    document.getElementById('resolved').textContent = resolved;
    document.getElementById('closureRate').textContent = closure + '%';
    document.getElementById('successRate').textContent = closure >= 70 ? 'On Track' : 'Needs Attention';
    document.getElementById('avgTime').textContent = avgTime;

    loadDetailedStats(referrals, total);

    initializeChartsFromReferrals(referrals, cases);
}

function loadDetailedStats(referrals, total) {
    const tbody = document.getElementById('statsTableBody');
    
    const stats = [
        { metric: 'Total Referrals', value: total, percentage: 100, trend: '→' },
        { metric: 'Pending Review', value: referrals.filter(r => r.stage <= 2).length, percentage: Math.round((referrals.filter(r => r.stage <= 2).length / total * 100) || 0), trend: '↓' },
        { metric: 'In Active Casework (Stage 3-5)', value: referrals.filter(r => r.stage >= 3 && r.stage < 6).length, percentage: Math.round(((referrals.filter(r => r.stage >= 3 && r.stage < 6).length) / total * 100) || 0), trend: '↑' },
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

// Build chart data from the real referrals/cases already fetched for this
// page. referralReasons, reportCaseStatus, and caseTimeline come straight
// from the referral list; followUpStatus is derived from the counselor's
// actual logged cases (api/case-scenario.php).
function initializeChartsFromReferrals(referrals, cases) {
    const fallback = fallbackChartData();

    const reasonCounts = {};
    referrals.forEach(r => {
        const reason = (r.referral_reason || '').trim() || 'Unspecified';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    referralReasonCounts = reasonCounts;
    // Top 5 reasons by volume so the doughnut stays readable.
    const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const referralReasons = topReasons.length > 0
        ? { labels: topReasons.map(([label]) => label), values: topReasons.map(([, count]) => count) }
        : fallback.referralReasons;

    initializeCharts({
        referralReasons,
        reportCaseStatus: buildCaseStatusChart(referrals),
        followUpStatus: buildFollowUpStatusChart(cases),
        caseTimeline: buildCaseTimeline(referrals) || fallback.caseTimeline
    });
}

// Real referral-pipeline distribution, using the same stage buckets as the
// stat cards above (analyticsSub/Review/etc.), just with the canonical
// 6-stage labels instead of the 5-label fallback set.
function buildCaseStatusChart(referrals) {
    return {
        labels: Object.values(STAGE_LABELS),
        values: Object.keys(STAGE_LABELS).map(stage => referrals.filter(r => r.stage === Number(stage)).length)
    };
}

// Derives a 4-bucket follow-up status from real fields on each logged case
// (api/case-scenario.php): status ('pending'|'closed'), followUpDate (the
// next scheduled date), and followUps (sessions already logged against it).
// There's no explicit per-follow-up "status" field in the schema, so this is
// the most direct honest read of those fields:
//   Completed  - case has been closed
//   Overdue    - still open, and its next follow-up date has passed
//   In Progress - still open, not overdue, but at least one follow-up logged
//   Pending    - still open, no follow-up logged yet
function buildFollowUpStatusChart(cases) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let pending = 0, inProgress = 0, completed = 0, overdue = 0;

    (cases || []).forEach(c => {
        if (c.status === 'closed') {
            completed++;
            return;
        }

        const followUpDate = c.followUpDate ? new Date(c.followUpDate) : null;
        const hasLoggedFollowUp = Array.isArray(c.followUps) && c.followUps.length > 0;

        if (followUpDate && !isNaN(followUpDate) && followUpDate < today) {
            overdue++;
        } else if (hasLoggedFollowUp) {
            inProgress++;
        } else {
            pending++;
        }
    });

    return {
        labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        values: [pending, inProgress, completed, overdue]
    };
}

// Buckets referrals into the last 6 weeks by submission date, split by
// each referral's CURRENT stage. This approximates a trend line without a
// stage-history table: a referral submitted 5 weeks ago that's closed now
// counts as "closed" in week 5's bucket, not as of when it actually closed.
function buildCaseTimeline(referrals) {
    const withDates = referrals.filter(r => r.date_submitted);
    if (withDates.length === 0) return null;

    const weekCount = 6;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const labels = [];
    const newReferrals = new Array(weekCount).fill(0);
    const inProgress = new Array(weekCount).fill(0);
    const closed = new Array(weekCount).fill(0);

    for (let i = 0; i < weekCount; i++) {
        labels.unshift(`${weekCount - i} wk${weekCount - i === 1 ? '' : 's'} ago`);
    }
    labels[weekCount - 1] = 'This week';

    withDates.forEach(r => {
        const submitted = new Date(r.date_submitted);
        const weeksAgo = Math.floor((now - submitted) / msPerWeek);
        const bucket = weekCount - 1 - weeksAgo; // index 0 = oldest, last = this week
        if (bucket < 0 || bucket >= weekCount) return;

        if (r.stage <= 2) newReferrals[bucket]++;
        else if (r.stage < 6) inProgress[bucket]++;
        else closed[bucket]++;
    });

    return { labels, newReferrals, inProgress, closed };
}

function fallbackChartData() {
    return {
        referralReasons: {
            labels: ['Academic Concerns', 'Behavioral Issues', 'Mental Health', 'Family Issues', 'Other'],
            values: [12, 18, 14, 10, 8]
        },
        reportCaseStatus: {
            labels: Object.values(STAGE_LABELS),
            values: [15, 20, 5, 12, 8, 10]
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
                    '#9b59b6',
                    '#1abc9c'
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
    initializeCharts(fallbackChartData());
}

// Standalone CSV export of the real referral-reason breakdown — the
// on-page doughnut only shows the top 5 for readability, so the export
// includes every reason (see referralReasonCounts in initializeChartsFromReferrals).
function exportReferralDistribution() {
    const entries = Object.entries(referralReasonCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    let csv = 'Referral Reason,Count,Percentage\n';
    entries.forEach(([reason, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        csv += `"${reason.replace(/"/g, '""')}",${count},${pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-distribution-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    document.getElementById('exportReferralDistributionBtn')?.addEventListener('click', exportReferralDistribution);
});

