// Student Dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadDashboardData();
});

function loadUserInfo() {
    // Try multiple storage keys for compatibility
    let user = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    if (!user.first_name) {
        user = JSON.parse(sessionStorage.getItem('user') || '{}');
    }
    
    if (user.first_name || user.name) {
        const fullName = user.first_name ? `${user.first_name} ${user.last_name}` : user.name;
        document.getElementById('userName').textContent = fullName || 'Student';
        if (document.getElementById('userRole')) {
            const role = user.user_type || user.role || 'Student';
            document.getElementById('userRole').textContent = role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ');
        }
        const initials = (user.first_name?.[0] || user.name?.[0] || '') + (user.last_name?.[0] || '');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadDashboardData() {
    // Try multiple storage keys for compatibility
    let user = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    if (!user.id) {
        user = JSON.parse(sessionStorage.getItem('user') || '{}');
    }
    
    const userSchool = user?.school_attended || '';
    const studentName = user?.name || (user.first_name ? `${user.first_name} ${user.last_name}` : '');
    const studentId = user?.id;
    
    console.log('=== DASHBOARD DATA LOAD ===');
    console.log('User object:', user);
    console.log('Loading dashboard for:', { studentName, userSchool, studentId });
    
    if (!studentName && !studentId) {
        console.warn('No student name or ID found');
        return;
    }

    // Build API URL with available data - prioritize student_id
    let apiUrl = `/guidancemanagment/api/referral.php?role=student`;
    if (studentId) {
        apiUrl += `&student_id=${encodeURIComponent(studentId)}`;
        console.log('✓ Using student_id:', studentId);
    }
    if (studentName) {
        apiUrl += `&student_name=${encodeURIComponent(studentName)}`;
        console.log('✓ Using student_name:', studentName);
    }
    if (userSchool) {
        apiUrl += `&school=${encodeURIComponent(userSchool)}`;
        console.log('✓ Using school:', userSchool);
    }
    
    console.log('Final API URL:', apiUrl);
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(result => {
            console.log('=== API RESPONSE ===');
            console.log('Full response:', result);
            console.log('Success:', result.success);
            console.log('Count:', result.count);
            console.log('Data items:', result.data?.length || 0);
            
            // Show the actual SQL query for debugging
            if (result.query_params) {
                console.log('--- DEBUG INFO ---');
                console.log('SQL Query executed:', result.query_params.sql_query);
                console.log('Number of rows found:', result.query_params.num_rows_found);
                
                // Show what's actually in the database if no match
                if (result.count === 0 && result.debug_all_referrals_by_name && result.debug_all_referrals_by_name.length > 0) {
                    console.log('--- DATABASE CONTAINS ---');
                    console.log('Referrals matching student name:');
                    result.debug_all_referrals_by_name.forEach((ref, idx) => {
                        console.log(`[${idx}] student_id:"${ref.student_id}", student_name:"${ref.student_name}"`);
                    });
                }
            }
            
            if (result.success && result.data) {
                const referrals = result.data;
                document.getElementById('referralCount').textContent = referrals.length;
                displayReferralProgress(referrals);
            } else {
                console.log('No referrals found or API error');
                displayReferralProgress([]);
            }
        })
        .catch(error => console.error('Error loading referrals:', error));
}

function displayReferralProgress(referrals) {
    const preview = document.getElementById('referralProgressPreview');
    
    if (referrals.length === 0) {
        preview.innerHTML = '<p style="color: #999; margin: 0; text-align: center;">No referrals yet</p>';
        return;
    }
    
    // Show quick progress for most recent referral
    const latest = referrals[0];
    const currentStage = parseInt(latest.stage || latest.progress_stage || 1) || 1;
    const progress = (currentStage / 6) * 100;
    
    const stageLabels = {
        1: 'Submitted',
        2: 'Under Review',
        3: 'Scheduled',
        4: 'In Progress',
        5: 'Follow-up',
        6: 'Completed'
    };
    
    const statusColor = getProgressColor(latest.status);
    
    preview.innerHTML = `
        <div style="margin-bottom: 8px; text-align: center;">
            <small style="color: #6b7280; display: block; margin-bottom: 8px;">Latest: ${latest.referral_reason || latest.reason || 'Referral'}</small>
            <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                <div style="height: 100%; width: ${progress}%; background: ${statusColor}; transition: width 0.3s ease;"></div>
            </div>
            <small style="color: #6b7280; display: block;">
                <strong>Stage ${currentStage}/6</strong> - ${stageLabels[currentStage] || 'In Progress'}
            </small>
        </div>
    `;
}

function getProgressColor(status) {
    const colors = {
        'pending': '#f59e0b',
        'in-progress': '#3b82f6',
        'completed': '#10b981',
        'rejected': '#ef4444'
    };
    return colors[status?.toLowerCase?.()] || colors[status] || '#6b7280';
}

function loadActivityFeed() {
    const feed = document.getElementById('activityFeed');
    feed.innerHTML = '<p style="text-align: center; color: #999; padding: 30px;">No recent activity</p>';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    clearAllUserData();
    window.location.href = '../../index.php';
});
