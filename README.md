# Guidance Management System 📚

A comprehensive student guidance and referral management system with role-based access control for Teachers, Coordinators, Counselors, and School District Officers (SDO).

## System Overview

The Guidance Management System is designed to streamline the process of identifying, referring, and counseling students who need guidance and support. The system features a **6-stage referral workflow** where:

- **Stage 1-2**: Referral submitted and under review by coordinator
- **Stage 3**: Follow-up form required (counselor uploads follow-up documentation)
- **Stage 4-5**: Active counseling and ongoing support
- **Stage 6**: Case closed

## 🔐 User Roles & Capabilities

### 1. **Teacher**
Teachers can submit referrals for students who need guidance and track their status.

**Features:**
- 📝 Submit Student Referral Form
- 📋 View Referral Status (6 stages)
- 📊 Dashboard with referral stats
- ✅ Track submitted referrals

**Access:** `pages/teacher/`

### 2. **Coordinator**
Coordinators manage all referrals, review cases, schedule meetings, and maintain records.

**Features:**
- 📋 Manage All Referrals (review, approve, reject)
- 🔄 Update Referral Stages
- 📝 Create & Report Cases
- 👤 Account Settings & Preferences
- 📅 Schedule Management
- 💬 Feedback & Communication
- 📊 Dashboard with system analytics

**Access:** `pages/coordinator/`

### 3. **Counselor**
Counselors work directly with students in counseling sessions and complete follow-up forms.

**Features:**
- 📊 View Analytics & Reports
- 📝 Create Case Reports
- 👥 Manage Student Records
- 📋 Track Referral Status
- ✏️ Complete Follow-up Forms (Stage 3)
- 📅 Schedule Counseling Sessions
- 💬 Provide Feedback
- 🔄 Advance Cases Through Stages

**Access:** `pages/counselor/`

### 4. **SDO (School District Officer)**
SDOs oversee all guidance services across all 11 districts and view comprehensive analytics.

**Features:**
- 📊 District Overview Dashboard
- 📈 District-Wide Analytics
- 📋 School Reports & Comparative Analysis
- 📌 System-wide Performance Metrics
- 🏫 All 11 District Data

**Access:** `pages/sdo/`

## 🚀 Getting Started

### Login Credentials (Demo)

```
Teacher:
Email: teacher@school.com
Password: password123

Coordinator:
Email: coordinator@school.com
Password: password123

Counselor:
Email: counselor@school.com
Password: password123

SDO:
Email: sdo@school.com
Password: password123
```

### How to Run

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Select your role from the dropdown
3. Enter your email and password
4. Click "Login"

## 📋 Referral Form Fields

### Student Information
- Student Name
- Student ID / LRN
- Grade Level
- Section
- Age
- Gender

### Referral Details
- Reason for Referral (dropdown with options)
- Detailed Description of Concern
- Previous Interventions Attempted
- Observed Behaviors/Symptoms

### Family Information
- Parent/Guardian Name
- Contact Number
- Email Address
- Family Background Notes

### Additional Information
- Date of Referral
- Urgency Level (Low, Medium, High, Crisis)
- Notes/Comments

## 🔄 Referral Process Flow

```
STAGE 1: SUBMITTED
↓
Teacher submits referral form → System notifies Coordinator
↓
STAGE 2: UNDER REVIEW
↓
Coordinator reviews referral, assigns to counselor
↓
STAGE 3: FOLLOW-UP REQUIRED
↓
Counselor completes follow-up form with:
  - Student observations
  - Interventions applied
  - Recommendations for next stage
↓
STAGE 4: IN COUNSELING
↓
Active counseling sessions with student
↓
STAGE 5: IN PROGRESS
↓
Ongoing support and monitoring
↓
STAGE 6: CLOSED
↓
Case completed, final reports submitted
```

## 📊 Key Features

### Dashboard Features
- **Real-time Statistics**: View referral counts by status
- **Quick Actions**: Fast access to common tasks
- **Performance Metrics**: Track resolution times and success rates
- **Activity Feed**: See recent case updates

### Reference Tables
- Searchable and filterable data tables
- Export capabilities (PDF)
- Sorting by various columns
- Status badges for quick identification

### Analytics
- Referral distribution by reason
- Case status breakdown
- Urgency level analysis
- District-wide comparative reports
- Performance tracking

### Schedule Management
- Create counseling sessions
- Track upcoming appointments
- Session duration management
- Location/notes tracking

### Feedback System
- Collect feedback from all users
- Anonymous submission option
- Track feedback status
- Response tracking

## 💾 Data Storage

The system uses browser **localStorage** for data persistence:

- **referrals**: Main referral records
- **caseReports**: Case reports created by coordinators
- **counselorReports**: Case reports from counselors
- **caseFollowUps**: Follow-up forms (Stage 3)
- **counselingSchedule**: Scheduled counseling sessions
- **scheduleEvents**: General schedule events
- **feedback**: Feedback submissions
- **counselorFeedback**: Counselor feedback

**Note:** Data is stored locally in the browser and persists across sessions on the same device/browser.

## 🎨 Technical Stack

- **HTML5**: Semantic markup and forms
- **CSS3**: Responsive design with flexbox and grid
- **JavaScript (ES6+)**: Interactive features and data management
- **localStorage API**: Client-side data persistence
- **Session Storage**: User authentication state

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📞 System Contacts

Each role has contact/assignment capabilities:

- **Teachers** contact Coordinators
- **Coordinators** assign to Counselors
- **Counselors** track student progress
- **SDOs** monitor all districts

## 🔒 Security Features

- Role-based access control (RBAC)
- Session-based authentication
- Form validation on all inputs
- Secure password demo (change in production)
- User identification on all records

## 🎯 Common Workflows

### Teacher: Submit a Referral
1. Login as Teacher
2. Click "Submit Referral"
3. Fill in student information
4. Describe the concern with details
5. Submit form
6. View status in Dashboard or Referral Status

### Coordinator: Review & Assign Referral
1. Login as Coordinator
2. Go to Referrals
3. Click on pending referral
4. Review all details
5. Update stage (move to Stage 3 to require follow-up)
6. Assign to counselor

### Counselor: Complete Follow-up (Stage 3)
1. Login as Counselor
2. Go to Referral Status
3. Find referral in Stage 3
4. Fill in follow-up form:
   - Student observations
   - Interventions applied
   - Recommendations
5. Save and advance to Stage 4

### SDO: View District Analytics
1. Login as SDO
2. Go to District Analytics
3. Select district from filter
4. View comparative metrics
5. Export reports as needed

## 🛠️ Customization Guide

### Adding New Referral Reasons
Edit `js/utils.js` and add to referral reasons in the form:

```javascript
<option value="Your Reason">Your Reason</option>
```

### Adding New Districts
Edit SDO pages and update the districts array:

```javascript
const districts = [
    'District 1', 'District 2', ... 'District 12'
];
```

### Changing Color Scheme
Edit `css/style.css` and modify the CSS variables:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    /* ... other colors ... */
}
```

## 📈 Future Enhancements

- Backend API integration
- Real database (MySQL/PostgreSQL)
- Email notifications
- PDF generation for reports
- Multiple language support
- Mobile app version
- Advanced analytics with charts
- Appointment reminders
- Document upload capability
- Multi-district user management
- Audit logs and user activity tracking

## 📝 File Structure

```
guidancemanagment/
├── index.html                 # Login page
├── css/
│   └── style.css             # All styles
├── js/
│   ├── auth.js               # Authentication logic
│   └── utils.js              # Utility functions
├── pages/
│   ├── teacher/
│   │   ├── dashboard.html
│   │   ├── referral-form.html
│   │   ├── referral-status.html
│   │   ├── teacher.js
│   │   ├── referral-form.js
│   │   └── referral-status.js
│   ├── coordinator/
│   │   ├── dashboard.html
│   │   ├── referrals.html
│   │   ├── report-case.html
│   │   ├── account.html
│   │   ├── schedule.html
│   │   ├── feedback.html
│   │   └── *.js
│   ├── counselor/
│   │   ├── dashboard.html
│   │   ├── analytics.html
│   │   ├── report-case.html
│   │   ├── student-record.html
│   │   ├── referral-status.html
│   │   ├── schedule.html
│   │   ├── feedback.html
│   │   └── *.js
│   └── sdo/
│       ├── dashboard.html
│       ├── district-analytics.html
│       ├── school-reports.html
│       └── *.js
└── README.md                 # This file
```

## ✨ Key Highlights

✅ **Complete Referral Management**: From submission to closure
✅ **6-Stage Workflow**: Standardized process for all cases
✅ **Role-Based Access**: Each actor has specific capabilities
✅ **Real-time Analytics**: Dashboard metrics and reports
✅ **Follow-up Forms**: Stage 3 specialized forms
✅ **Schedule Management**: Built-in appointment tracking
✅ **Feedback System**: Collect input from users
✅ **District Overview**: SDO can monitor all 11 districts
✅ **Responsive Design**: Works on desktop and tablets
✅ **Easy to Use**: Intuitive interface for all roles

## 📞 Support

For questions or issues:
1. Check the README section above
2. Review common workflows
3. Verify you're using the correct role
4. Check browser console for errors (F12)

---

**Version**: 1.0
**Last Updated**: March 2026
**Status**: Production Ready

Enjoy using the Guidance Management System! 🎓
