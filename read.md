Legend: ✅ = done   🟡 = almost done / partial   ❌ = not started

1.	To digitize and organize the following: 
1.1	✅ Individual Inventory forms 
1.2	✅ Referral forms 
1.3	✅ Follow-up forms 
1.4	✅ Uploaded related documents of students — counselor and coordinator can upload (JPG/PNG/GIF/WebP, 10MB max, server-side MIME-sniffed not just trusted from the client), list, preview, and delete a student's scanned documents (inventory/referral/follow-up/case), scoped to their own school. New `documents` DB table + `api/list-documents.php`, `api/upload-document.php`, `api/download-document.php`, `api/delete-document.php`, files stored under `uploads/documents/` (same non-executable `.htaccess` as `uploads/consent-forms/`). Counselor's page previously had no upload button at all — added to match coordinator's.
1.5	✅ Case documents to reduce record loss 
1.6	✅ Duplication, and 
1.7	✅ Misplacement of files caused by manual filing 
 
2.	To implement a module that allows students to: 
2.1	✅ Input and update personal information 
2.2	✅ Schedule counselling appointments 
2.3	✅ Provide feedback, and — real, database-backed feedback tied to a specific counseling session, appointment, or calendar event the student was actually involved in (not a generic comment box). Counselor/coordinator/other-school see it on a dedicated "Student Feedback" page and reply in a live, Messenger-style conversation thread — status flips automatically between "Needs Reply" and "Replied" as messages go back and forth.
2.4	✅ Receive notifications via email regarding their appointments — students get an email (submitted/approved/declined/proposed-change) whenever their appointment status changes, plus a reminder email the day before an approved appointment. Sent via EmailJS (api/EmailJsMailer.php), configured and enabled in api/mail-config.php (gitignored — real credentials live only on each deployed copy, not in git). The reminder isn't triggered by anything in the app itself — api/send-appointment-reminders.php needs an external scheduler hitting it once a day (e.g. a free cron-job.org ping), since InfinityFree's free tier has no real cron. Not yet set up on the live site.
3.	✅ To enable teachers to efficiently input student referral forms and printing of acknowledgement slip through the system. 
4.	To enable Guidance Counselors to: 
4.1	✅ Efficiently update and store student guidance records — counselors and other-school staff can now also log a referral directly ("Create Referral" walk-in flow) for a student who comes to the office in person, not just review teacher-submitted ones.
4.2	✅ Generate child summary cases, and — per-student history view is real; the case-category report table now shows real counts (per category/grade/gender) aggregated from logged cases, grouped under the real 6 sections / 27 categories. Cases still awaiting a category show under "Uncategorized" rather than being dropped.
4.3	✅ Documentation of follow-up actions 
5.	To allow the Guidance Coordinator or the Guidance Counselor if there is no dedicated Coordinator, to effectively perform the following functions across all year levels: 
5.1	✅ Monitor records 
5.2	✅ Manage user accounts  
5.3	✅ View case trends, and — Analytics was rebuilt into a per-school Reports Dashboard (see 7.1/7.2/7.3/7.5), with real appointment/referral/case data, charts, and CSV export on every tab. The previous case-status-by-stage, follow-up-status, and 6-week referral timeline charts were retired as part of that redesign, in favor of the report-aligned structure below.
5.4	✅ Verify submitted information 
6.	✅ To develop an admin monitoring module for School Division Office that allows to monitor student cases from all public secondary schools in Calapan City and adding of school data. — dashboard, school list, and adding schools/staff are all real. District is now set automatically to match each school's own name and can no longer be manually edited or grouped (the earlier editable District field was removed by request), so district-level breakdowns are effectively one row per school until a real grouping mechanism is reintroduced.
7.	To generate the following report: 
7.1	✅ Counseling appointment — new per-school Reports Dashboard (counselor/coordinator/other-school → Analytics) shows every staff-scheduled, in-person appointment with status/reason breakdowns, a daily trend chart, and CSV export. Backed by a new durable `booking_type` column on appointments, replacing an earlier fragile text-based heuristic that could silently misclassify a row after a later status update.
7.2	✅ Online appointment — same Reports Dashboard, the student-self-booked half of the same data (`booking_type = 'online'`), same charts and CSV export.
7.3	✅ Referral distribution — moved from the old Analytics page into the new Reports Dashboard; full reason breakdown (not just the top 5) plus a new urgency split, still CSV-exportable.
7.4	✅ Division-wide summary case — SDO's district summary tables (School Reports, District Report Cases) now show real per-district counts aggregated from the database, same "Unassigned" caveat as item 6 until districts are assigned. Intentionally not duplicated on the new per-school Reports Dashboard — a school-scoped account has no business seeing cross-school data.
7.5	✅ Child summary case — Student History gives a real full per-student record (now including complete personal-info fields: LRN, address, religion, contact, etc.). The new Reports Dashboard adds a lighter, CSV-exportable version of the same record with a student picker.
        