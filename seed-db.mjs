import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await connection.execute('DELETE FROM taskHistory');
  await connection.execute('DELETE FROM tasks');
  await connection.execute('DELETE FROM meetings');
  await connection.execute('DELETE FROM collaborators');
  await connection.execute('DELETE FROM subprojects');
  await connection.execute('DELETE FROM projects');

  console.log('✓ Cleared existing data');

  // Insert projects
  const [projectResult] = await connection.execute(
    'INSERT INTO projects (name, code, color, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['Powertrain ECU', 'ECU-24', '#00A8CC', '2024-01-01', '2025-12-31']
  );
  const projectId1 = projectResult.insertId;

  const [projectResult2] = await connection.execute(
    'INSERT INTO projects (name, code, color, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['ADAS Integration', 'ADAS-25', '#2E5EAA', '2025-01-01', '2026-06-30']
  );
  const projectId2 = projectResult2.insertId;

  console.log('✓ Created 2 projects');

  // Insert subprojects
  const [subResult1] = await connection.execute(
    'INSERT INTO subprojects (projectId, name) VALUES (?, ?)',
    [projectId1, 'Torque Management']
  );
  const subId1 = subResult1.insertId;

  const [subResult2] = await connection.execute(
    'INSERT INTO subprojects (projectId, name) VALUES (?, ?)',
    [projectId1, 'Fuel Control']
  );
  const subId2 = subResult2.insertId;

  const [subResult3] = await connection.execute(
    'INSERT INTO subprojects (projectId, name) VALUES (?, ?)',
    [projectId2, 'Sensor Fusion']
  );
  const subId3 = subResult3.insertId;

  const [subResult4] = await connection.execute(
    'INSERT INTO subprojects (projectId, name) VALUES (?, ?)',
    [projectId2, 'Path Planning']
  );
  const subId4 = subResult4.insertId;

  console.log('✓ Created 4 subprojects');

  // Insert collaborators
  const [collabResult1] = await connection.execute(
    'INSERT INTO collaborators (name, initials, subprojectId, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['Yassine Mansouri', 'YM', subId1, '2024-01-01', '2025-12-31']
  );
  const collabId1 = collabResult1.insertId;

  const [collabResult2] = await connection.execute(
    'INSERT INTO collaborators (name, initials, subprojectId, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['Inès Boudali', 'IB', subId2, '2024-03-01', '2025-12-31']
  );
  const collabId2 = collabResult2.insertId;

  const [collabResult3] = await connection.execute(
    'INSERT INTO collaborators (name, initials, subprojectId, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['Karim Sefrioui', 'KS', subId3, '2025-01-01', '2026-06-30']
  );
  const collabId3 = collabResult3.insertId;

  const [collabResult4] = await connection.execute(
    'INSERT INTO collaborators (name, initials, subprojectId, dateFrom, dateTo) VALUES (?, ?, ?, ?, ?)',
    ['Lina Ouhabi', 'LO', subId4, '2025-01-01', '2026-06-30']
  );
  const collabId4 = collabResult4.insertId;

  console.log('✓ Created 4 collaborators');

  // Insert meetings
  const [meetingResult1] = await connection.execute(
    'INSERT INTO meetings (projectId, date, title) VALUES (?, ?, ?)',
    [projectId1, '2025-02-10', 'Weekly Sync #8']
  );
  const meetingId1 = meetingResult1.insertId;

  const [meetingResult2] = await connection.execute(
    'INSERT INTO meetings (projectId, date, title) VALUES (?, ?, ?)',
    [projectId2, '2025-02-12', 'ADAS Planning Session']
  );
  const meetingId2 = meetingResult2.insertId;

  console.log('✓ Created 2 meetings');

  // Insert tasks for meeting 1
  const [taskResult1] = await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId1, 'current', 'DGO torque arbitration', 'Calibration of torque demand priority between driver and safety layers', 'Ongoing', '2025-02-14']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId1, 'current', 'CAN signal mapping', 'Map new ECU signals to torque management module', 'Open', '2025-02-17']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId1, 'upcoming', 'Validation test plan', 'Prepare HIL test cases for torque limiter', 'Open', '2025-02-28']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId1, 'openPoints', 'Arbitration strategy alignment', 'Waiting for System team decision on priority logic – impacts DGO delivery', 'Open', null]
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId1, 'closed', 'Spec review v1.2', 'Reviewed and approved', 'Closed', '2025-02-05']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId2, 'current', 'Lambda correction model', 'Update enrichment model based on bench tests', 'Ongoing', '2025-02-20']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId1, collabId2, 'outside', 'TSB documentation', 'Supporting warranty team — outside fuel control scope', 'Open', null]
  );

  console.log('✓ Created 7 tasks for meeting 1');

  // Insert tasks for meeting 2
  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId2, collabId3, 'current', 'Sensor calibration', 'Calibrate all sensors for accuracy', 'Ongoing', '2025-02-18']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId2, collabId3, 'upcoming', 'Fusion algorithm testing', 'Test sensor fusion algorithm with real data', 'Open', '2025-03-01']
  );

  await connection.execute(
    'INSERT INTO tasks (meetingId, collaboratorId, sectionKey, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [meetingId2, collabId4, 'current', 'Path planning module', 'Implement basic path planning algorithm', 'Ongoing', '2025-02-25']
  );

  console.log('✓ Created 3 tasks for meeting 2');

  console.log('✅ Database seed completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Seed error:', error);
  process.exit(1);
} finally {
  await connection.end();
}
