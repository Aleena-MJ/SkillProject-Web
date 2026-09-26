/**
 * Automated End-to-End API Test Suite for SkillProject-Web
 * Tests user registration, authentication, skill creation, browsing,
 * request sending, and status management.
 */

// Start / attach to the express server
const { app, server } = require('../server/server.js');
const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Starting SkillProject-Web API Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Health check returns 200 OK');

    // 2. Demo User Login (Alex Johnson)
    const demoLogin = await request('POST', '/api/auth/login', {
      email: 'alex@college.edu',
      password: 'student123'
    });
    assert(demoLogin.status === 200 && demoLogin.body.token, 'Demo user Alex logged in successfully');
    const alexToken = demoLogin.body.token;

    // 3. Register a New Test Learner
    const uniqueEmail = `learner_${Date.now()}@college.edu`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Samantha Reed',
      email: uniqueEmail,
      password: 'mypassword123',
      college: 'College of Science',
      major: 'Bioinformatics',
      contact: 'samantha_reed on Discord'
    });
    assert(regRes.status === 201 && regRes.body.token, 'New learner registered successfully');
    const learnerToken = regRes.body.token;
    const learnerId = regRes.body.user.id;

    // 4. View Profile of New Learner
    const meRes = await request('GET', '/api/auth/me', null, learnerToken);
    assert(meRes.status === 200 && meRes.body.user.name === 'Samantha Reed', 'Get learner profile succeeds');

    // 5. Update Profile
    const updateRes = await request('PUT', '/api/auth/profile', {
      name: 'Samantha Reed (Updated)',
      college: 'College of Science',
      major: 'Bioinformatics & Data',
      bio: 'Excited to learn Python and web development!',
      contact: 'Discord: samantha#9999'
    }, learnerToken);
    assert(updateRes.status === 200 && updateRes.body.user.bio.includes('Excited'), 'Learner profile update succeeds');

    // 6. Learner adds a teaching skill
    const addSkillRes = await request('POST', '/api/skills', {
      title: 'Genetics & Molecular Biology Tutoring',
      category: 'Science',
      description: 'Can explain DNA replication, transcription, and Mendelian genetics.',
      proficiency: 'Advanced',
      availability: 'Friday afternoons'
    }, learnerToken);
    assert(addSkillRes.status === 201 && addSkillRes.body.skill.title.includes('Genetics'), 'Learner posted a teaching skill');
    const learnerSkillId = addSkillRes.body.skill.id;

    // 7. Browse and Search Skills
    const searchRes = await request('GET', '/api/skills?search=Python');
    assert(searchRes.status === 200 && searchRes.body.skills.length >= 1, 'Search for "Python" returns skills');

    const catRes = await request('GET', '/api/skills?category=Science');
    assert(catRes.status === 200 && catRes.body.skills.some(s => s.id === learnerSkillId), 'Category filter finds posted Science skill');

    // 8. Learner sends a request to Alex to learn Python
    const skillsList = await request('GET', '/api/skills?search=Python');
    const alexPythonSkill = skillsList.body.skills.find(s => s.title.includes('Python'));

    const reqRes = await request('POST', '/api/requests', {
      skill_id: alexPythonSkill.id,
      message: 'Hi Alex! I need help with Python lists and recursion for my class.',
      preferred_time: 'Thursday evenings on Zoom'
    }, learnerToken);
    assert(reqRes.status === 201 && reqRes.body.success, 'Learner sent learning request to Alex');
    const requestId = reqRes.body.requestId;

    // 9. Prevent duplicate pending request
    const dupRes = await request('POST', '/api/requests', {
      skill_id: alexPythonSkill.id,
      message: 'Trying to send again...'
    }, learnerToken);
    assert(dupRes.status === 400, 'Duplicate pending request is rejected as expected');

    // 10. Alex checks Received Requests
    const alexRecv = await request('GET', '/api/requests/received', null, alexToken);
    assert(alexRecv.status === 200 && alexRecv.body.requests.some(r => r.id === requestId), 'Alex received the learning request');

    // 11. Learner checks Sent Requests
    const learnerSent = await request('GET', '/api/requests/sent', null, learnerToken);
    assert(learnerSent.status === 200 && learnerSent.body.requests.some(r => r.id === requestId), 'Learner sees request in sent list');

    // 12. Alex accepts the request
    const acceptRes = await request('PUT', `/api/requests/${requestId}`, {
      status: 'accepted'
    }, alexToken);
    assert(acceptRes.status === 200 && acceptRes.body.success, 'Alex successfully accepted the request');

    // 13. Learner deletes their test skill
    const delRes = await request('DELETE', `/api/skills/${learnerSkillId}`, null, learnerToken);
    assert(delRes.status === 200 && delRes.body.success, 'Learner deleted their test skill');

    console.log(`\n=========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=========================================\n`);

    // Clean up server
    if (server && server.close) {
      server.close();
    }

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    if (server && server.close) {
      server.close();
    }
    process.exit(1);
  }
}

// Small timeout to allow server to bind if needed
setTimeout(runTests, 400);
