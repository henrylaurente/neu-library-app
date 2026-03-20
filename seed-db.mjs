import mysql from 'mysql2/promise.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const reasons = ['Study', 'Research', 'Borrowing Books', 'Group Project', 'Quiet Reading', 'Computer Lab'];
const colleges = ['College of Engineering', 'College of Arts', 'College of Science', 'College of Business', 'College of Education'];
const employeeTypes = ['teacher', 'staff', 'non-employee'];

// Generate sample data for the last 30 days
const today = new Date();
const sampleLogs = [];

for (let i = 0; i < 100; i++) {
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

  sampleLogs.push({
    date: date,
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    college: colleges[Math.floor(Math.random() * colleges.length)],
    employeeType: employeeTypes[Math.floor(Math.random() * employeeTypes.length)],
  });
}

// Insert the sample data
for (const log of sampleLogs) {
  await connection.execute(
    'INSERT INTO visitorLogs (date, reason, college, employeeType) VALUES (?, ?, ?, ?)',
    [log.date, log.reason, log.college, log.employeeType]
  );
}

console.log(`✓ Seeded ${sampleLogs.length} visitor logs`);
await connection.end();
