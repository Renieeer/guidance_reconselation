// Student Referral Status
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadReferrals();
    setupEventListeners();
});

function loadUserInfo() {
    // Try multiple storage keys for compatibility
    let user = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    if (!user.name && !user.first_name) {
        user = JSON.parse(sessionStorage.getItem('user') || '{}');
    }
    
    if (user.name || user.first_name) {
        const fullName = user.first_name ? `${user.first_name} ${user.last_name}` : user.name;
        document.getElementById('userName').textContent = fullName || 'Student';        if (document.getElementById('userRole')) {
            const role = user.role || user.user_type || 'Student';
            document.getElementById('userRole').textContent = role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ');
        }
        const initials = ((user.first_name?.[0] || user.name?.[0]) || '') + ((user.last_name?.[0] || '') || '');
        document.getElementById('userAvatar').textContent = initials.substring(0, 2);
    }
}

function loadReferrals() {
    // Try multiple storage keys for compatibility
    let user = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    if (!user.id && !user.first_name) {
        user = JSON.parse(sessionStorage.getItem('user') || '{}');
    }
    
    const userSchool = user?.school_attended || '';
    const studentName = user?.name || (user.first_name ? `${user.first_name} ${user.last_name}` : '');
    const studentId = user?.id;
    
    console.log('=== REFERRAL STATUS LOAD ===');
    console.log('User object:', user);
    console.log('Loading referrals for:', { studentName, userSchool, studentId });
    
    if (!studentName && !studentId) {
        console.error('ERROR: No student name or ID found');
        document.getElementById('referralsTableBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">Unable to load referrals. Please log in again.</td></tr>';
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
                console.log('Full query_params:', result.query_params);
                
                // Show what we were searching for vs what exists
                console.log('--- MISMATCH ANALYSIS ---');
                console.log('You searched for:');
                console.log('  - student_id:', result.query_params.student_id);
                console.log('  - student_name:', result.query_params.student_name);
                console.log('  - school:', result.query_params.school);
                console.log('If count=0, the database doesnt have a matching referral!');
                
                // Show what's actually in the database
                if (result.debug_all_referrals_by_name && result.debug_all_referrals_by_name.length > 0) {
                    console.log('--- WHAT EXISTS IN DATABASE ---');
                    console.log('Found referrals matching student name "' + result.query_params.student_name + '":');
                    result.debug_all_referrals_by_name.forEach((ref, idx) => {
                        console.log(`[${idx}] ID:${ref.id}, student_name:"${ref.student_name}", student_id:"${ref.student_id}", school:"${ref.school_attended}"`);
                    });
                    console.log('⚠️ THE PROBLEM: student_id in database is different from user.id!');
                    if (result.debug_all_referrals_by_name.length > 0) {
                        const firstRef = result.debug_all_referrals_by_name[0];
                        console.log(`   Database has student_id="${firstRef.student_id}" but you searched for student_id="${result.query_params.student_id}"`);
                    }
                }
            }
            
            if (result.success && result.data) {
                displayReferrals(result.data);
            } else {
                throw new Error(result.message || 'Failed to load referrals');
            }
        })
        .catch(error => {
            console.error('=== ERROR LOADING REFERRALS ===', error);
            document.getElementById('referralsTableBody').innerHTML = 
                '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">Error loading referrals. Please try again.</td></tr>';
        });
}

function displayReferrals(referrals) {
    const tbody = document.getElementById('referralsTableBody');
    const progressContainer = document.getElementById('progressContainer');
    
    if (referrals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No referrals yet</td></tr>';
        progressContainer.style.display = 'none';
        return;
    }
    
    // Show progress overview
    progressContainer.style.display = 'block';
    displayProgressOverview(referrals);
    
    tbody.innerHTML = referrals.map(referral => `
        <tr>
            <td>${formatDate(referral.date_submitted)}</td>
            <td>${referral.referral_reason || referral.reason}</td>
            <td>${referral.teacher_name || 'Unknown'}</td>
            <td>
                <span class="badge" style="background: ${getStatusColor(referral.status)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em;">
                    ${referral.status || 'pending'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReferral(${referral.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function displayProgressOverview(referrals) {
    const progressList = document.getElementById('referralProgressList');
    
    const stageLabels = {
        1: 'Submitted',
        2: 'Under Review',
        3: 'Scheduled',
        4: 'In Progress',
        5: 'Follow-up',
        6: 'Completed'
    };
    
    const stageIcons = {
        1: '📋',
        2: '👀',
        3: '📅',
        4: '⚙️',
        5: '✅',
        6: '🎯'
    };
    
    progressList.innerHTML = referrals.map(referral => {
        const currentStage = parseInt(referral.stage) || 1;
        const totalStages = 6;
        const progress = (currentStage / totalStages) * 100;
        
        return `
            <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${getStatusColor(referral.status)};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <strong style="display: block; font-size: 1em; color: #1f2937; margin-bottom: 4px;">${referral.referral_reason}</strong>
                        <small style="color: #6b7280;">Submitted: ${formatDate(referral.date_submitted)} • By: ${referral.teacher_name || 'Unknown'}</small>
                    </div>
                    <span class="badge" style="background: ${getStatusColor(referral.status)}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.8em; white-space: nowrap;">
                        ${referral.status || 'pending'}
                    </span>
                </div>
                
                <!-- Progress Bar -->
                <div style="margin-bottom: 10px;">
                    <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${progress}%; background: ${getStatusColor(referral.status)}; transition: width 0.3s ease;"></div>
                    </div>
                </div>
                
                <!-- Stage Steps -->
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 12px;">
                    ${[1, 2, 3, 4, 5, 6].map(stage => `
                        <div style="text-align: center;">
                            <div style="
                                width: 36px;
                                height: 36px;
                                margin: 0 auto 6px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: ${stage <= currentStage ? getStatusColor(referral.status) : '#e5e7eb'};
                                color: white;
                                font-weight: bold;
                                font-size: 12px;
                            ">
                                ${stage <= currentStage ? '✓' : stage}
                            </div>
                            <small style="color: ${stage <= currentStage ? '#1f2937' : '#9ca3af'}; font-size: 11px; display: block; max-width: 50px; margin: 0 auto; word-break: break-word;">
                                ${stageLabels[stage] || 'Stage ' + stage}
                            </small>
                        </div>
                    `).join('')}
                </div>
                
                <small style="display: block; margin-top: 10px; color: #6b7280;">
                    Progress: Stage ${currentStage} of ${totalStages}
                </small>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}

function viewReferral(referralId) {
    // Fetch full referral details from the database
    fetch(`/guidancemanagment/api/referral.php?id=${encodeURIComponent(referralId)}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                const ref = result.data;
                
                // Populate modal fields with referral data
                document.getElementById('refStudentName').value = ref.student_name || '';
                document.getElementById('refStudentId').value = ref.student_id || '';
                document.getElementById('refGrade').value = ref.grade || '';
                document.getElementById('refSection').value = ref.section || '';
                document.getElementById('refAge').value = ref.age || '';
                document.getElementById('refGender').value = ref.gender || '';
                
                document.getElementById('refReason').value = ref.referral_reason || '';
                document.getElementById('refDescription').value = ref.description || '';
                document.getElementById('refIntervention').value = ref.intervention_attempts || '';
                document.getElementById('refBehaviors').value = ref.observed_behaviors || '';
                document.getElementById('refUrgency').value = ref.urgency || '';
                document.getElementById('refTeacher').value = ref.teacher_name || '';
                
                document.getElementById('refParent').value = ref.parent_guardian || '';
                document.getElementById('refParentContact').value = ref.parent_contact || '';
                document.getElementById('refParentEmail').value = ref.parent_email || '';
                document.getElementById('refFamilyBg').value = ref.family_background || '';
                
                document.getElementById('refStatus').value = (ref.status || 'pending').toUpperCase();
                document.getElementById('refDateSubmitted').value = formatDate(ref.date_submitted);
                
                // Update phase display
                const phase = parseInt(ref.stage) || 1;
                const phaseLabels = {
                    1: 'Phase 1: Submitted',
                    2: 'Phase 2: Under Review',
                    3: 'Phase 3: Scheduled',
                    4: 'Phase 4: In Progress',
                    5: 'Phase 5: Follow-up',
                    6: 'Phase 6: Completed'
                };
                document.getElementById('refPhase').value = phaseLabels[phase] || 'Phase ' + phase;
                
                // Update progress bar
                const progress = (phase / 6) * 100;
                const progressBar = document.getElementById('refProgressBar');
                progressBar.style.width = progress + '%';
                progressBar.style.background = getStatusColor(ref.status);
                
                // Color code the status field
                const statusField = document.getElementById('refStatus');
                statusField.style.background = getStatusColor(ref.status);
                statusField.style.color = 'white';
                statusField.style.borderColor = getStatusColor(ref.status);
                
                // Show modal with proper centering
                const modal = document.getElementById('referralModal');
                modal.classList.add('show');
                modal.style.display = 'flex';
                
                console.log('Referral details loaded:', ref);
            } else {
                alert('Error loading referral details: ' + (result.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error fetching referral:', error);
            alert('Error loading referral details. Please try again.');
        });
}

function setupEventListeners() {
    const closeBtn = document.getElementById('closeReferralModal');
    const closeBtnAlt = document.getElementById('closeReferralBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('referralModal');
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }
    
    if (closeBtnAlt) {
        closeBtnAlt.addEventListener('click', () => {
            const modal = document.getElementById('referralModal');
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('referralModal');
        if (e.target === modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b',
        'in-progress': '#3b82f6',
        'completed': '#10b981',
        'rejected': '#ef4444'
    };
    return colors[status?.toLowerCase?.()] || colors[status] || '#6b7280';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('userInfo');
    localStorage.removeItem('currentUser');
    window.location.href = '../../index.php';
});
