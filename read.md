Legend: ✅ = done   🟡 = almost done / partial   ❌ = not started

1.	To digitize and organize the following: 
1.1	✅ Individual Inventory forms 
1.2	✅ Referral forms 
1.3	✅ Follow-up forms 
1.4	❌ Uploaded related documents of students — pages exist but there's no backend at all (list/upload/delete/download APIs are all missing, DB table has no filename/size/date columns). Not started.
1.5	✅ Case documents to reduce record loss 
1.6	✅ Duplication, and 
1.7	✅ Misplacement of files caused by manual filing 
 
2.	To implement a module that allows students to: 
2.1	✅ Input and update personal information 
2.2	✅ Schedule counselling appointments 
2.3	❌ Provide feedback, and — form exists but only saves to the browser's local storage, never to the database (same on the counselor/coordinator side, not student-specific). Not started for real.
2.4	❌ Receive notifications via email regarding their appointments — no email-sending code anywhere in the project. Not started.
3.	✅ To enable teachers to efficiently input student referral forms and printing of acknowledgement slip through the system. 
4.	To enable Guidance Counselors to: 
4.1	✅ Efficiently update and store student guidance records 
4.2	✅ Generate child summary cases, and — per-student history view is real; the case-category report table now shows real counts (per category/grade/gender) aggregated from logged cases, grouped under the real 6 sections / 27 categories. Cases still awaiting a category show under "Uncategorized" rather than being dropped.
4.3	✅ Documentation of follow-up actions 
5.	To allow the Guidance Coordinator or the Guidance Counselor if there is no dedicated Coordinator, to effectively perform the following functions across all year levels: 
5.1	✅ Monitor records 
5.2	✅ Manage user accounts  
5.3	✅ View case trends, and — all four analytics charts are now real: referral-reason and stage-distribution as before, plus case-status (real referral pipeline stage counts) and follow-up-status (derived from each case's real status/follow-up log/due date: Completed, Overdue, In Progress, Pending).
5.4	✅ Verify submitted information 
6.	✅ To develop an admin monitoring module for School Division Office that allows to monitor student cases from all public secondary schools in Calapan City and adding of school data. — dashboard, school list, and adding schools/staff are all real; schools now have a real, SDO-editable District field (School Control → Edit School), and the district-level breakdown is a true per-district aggregate. Schools show under "Unassigned" until the SDO assigns their district.
7.	To generate the following report: 
7.1	❌ Counseling appointment — no dedicated exportable report; only the live calendar/list view.
7.2	❌ Online appointment — same as above, no dedicated exportable report.
7.3	✅ Referral distribution — Analytics reason-breakdown now has a standalone "Export Report" CSV download (every reason, not just the top 5 shown on the chart).
7.4	✅ Division-wide summary case — SDO's district summary tables (School Reports, District Report Cases) now show real per-district counts aggregated from the database, same "Unassigned" caveat as item 6 until districts are assigned.
7.5	✅ Child summary case — Student History gives a real full per-student record.
     