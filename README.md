# SkillProject-Web 🎓

A full-stack, college-level **Skill Exchange / Skill Sharing Platform** designed for students to share skills, tutor peers, and collaborate across campus. Built with **Node.js, Express, SQLite, and vanilla HTML5, CSS3, and JavaScript**.

---

## 🌟 Features Overview

- **Landing & Home Page**: Clear project overview, live campus stats, "How It Works" workflow, and featured skill previews.
- **User Authentication**: Secure student registration and login with `bcryptjs` password hashing and `jsonwebtoken` (JWT) session tokens.
- **Student Dashboard**: Real-time stats (skills taught, requests sent/received, active connections) and quick-action shortcuts.
- **Skill Directory & Live Search**:
  - Filter by category (*Programming, Design, Mathematics, Languages, Music, Science, Business, Writing, Other*).
  - Filter by proficiency level (*Beginner, Intermediate, Advanced, Expert*).
  - Search skills by title, description, or teacher name.
- **Teach a Skill**: Simple form for students to publish subjects they can teach, including availability format and course background.
- **Interactive Peer Requests**:
  - Students can send a personalized learning note and availability proposal to any peer tutor.
  - Teachers can **Accept** or **Decline** incoming requests.
  - Upon acceptance, contact methods (Discord, Telegram, phone, email) are unlocked for seamless peer communication.
- **Requests & Teaching Management**: Dedicated multi-tab interface to manage received requests, sent requests, and active listings.
- **Student Profile**: Editable bio, college/university, major, and contact preferences.
- **Responsive UI**: Hand-crafted CSS design system optimized for desktop, tablet, and mobile browsers.
- **Automatic Seed Data**: Comes pre-populated with realistic student accounts and skill listings for instant evaluation.

---

## 📂 Project Structure

```text
SkillProject-Web/
├── .env.example              # Sample environment variables template
├── .env                      # Active environment configuration
├── .gitignore                # Git ignore rules (node_modules, .env, *.db)
├── package.json              # Project dependencies, scripts, and metadata
├── README.md                 # Complete documentation and deployment guide
│
├── server/                   # Backend Express application
│   ├── server.js             # Main server entry point & static file hosting
│   ├── config/
│   │   └── db.js             # SQLite database setup, schema, and demo seed data
│   ├── middleware/
│   │   └── auth.js           # JWT authentication and authorization middleware
│   └── routes/
│       ├── authRoutes.js     # User registration, login, and profile APIs
│       ├── skillRoutes.js    # Skill browsing, search, creation, and deletion
│       └── requestRoutes.js  # Learning requests (send, view, accept, reject)
│
├── public/                   # Frontend client files (served by Express)
│   ├── index.html            # Public home page
│   ├── login.html            # Student login page (includes 1-click demo filler)
│   ├── register.html         # Student account creation page
│   ├── dashboard.html        # Authenticated student dashboard
│   ├── skills.html           # Browse, filter, and request skills
│   ├── add-skill.html        # Form to post a skill you can teach
│   ├── requests.html         # Multi-tab view for incoming & outgoing requests
│   ├── profile.html          # Student profile view and editor
│   │
│   ├── css/
│   │   └── styles.css        # Clean, modern, responsive CSS design system
│   │
│   └── js/
│       ├── api.js            # Central API fetch wrapper with token management & toasts
│       ├── navbar.js         # Dynamic navigation bar with auth-state detection
│       ├── home.js           # Landing page dynamic statistics and featured cards
│       ├── auth.js           # Login & registration form handlers
│       ├── dashboard.js      # Dashboard metrics & incoming request interactions
│       ├── skills.js         # Live search, filters, and request modal
│       ├── add-skill.js      # Skill creation form validation and submission
│       ├── requests.js       # Request approval/rejection and skill deletion
│       └── profile.js        # Profile loader and update handler
│
├── data/                     # SQLite storage directory
│   └── skills.db             # Auto-generated database file
│
└── test/
    └── api-test.js           # Automated end-to-end integration test suite
```

---

## 🚀 Getting Started Locally (VS Code / Local Machine)

### Prerequisites

- **Node.js** (v18.x, v20.x, v22.x, or v24.x)
- **npm** (comes bundled with Node.js)
- A code editor like **Visual Studio Code**

### Step 1: Open the Project

Open VS Code and open the `SkillProject-Web` folder (`File > Open Folder...`).

Open an integrated terminal (`Ctrl + \`` or ``Cmd + \``).

### Step 2: Install Dependencies

Run the following command to install all necessary packages:

```bash
npm install
```

### Step 3: Configure Environment Variables

A `.env` file has been provided for local development. If setting up from scratch, copy the example file:

```bash
cp .env.example .env
```

Default configuration in `.env`:

```ini
PORT=3000
NODE_ENV=development
JWT_SECRET=skillproject_dev_jwt_secret_987654321_secure_key
DB_PATH=./data/skills.db
```

### Step 4: Run the Application

Start the web application in normal mode:

```bash
npm start
```

Or start with auto-reload during development:

```bash
npm run dev
```

### Step 5: Access the Web App

Open your web browser and navigate to:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Demo Accounts for Testing

When the server starts for the first time, it automatically creates sample college students and skills. You can test immediately using either account (or click the **1-Click Demo Buttons** on the login page):

| Student Name | Email | Password | Role / Skills |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** | `alex@college.edu` | `student123` | Teaches: *Python & Algorithms*, *Git & GitHub* |
| **Priya Sharma** | `priya@college.edu` | `student123` | Teaches: *UI/UX Design in Figma* |
| **Marcus Chen** | `marcus@college.edu` | `student123` | Teaches: *Calculus II*, *Data Analysis* |
| **Sophia Martinez** | `sophia@college.edu` | `student123` | Teaches: *Conversational Spanish* |

---

## 🧪 Running Automated Tests

An automated test suite tests all 14 core API endpoints and SQLite database operations (health check, register, login, profile update, post skill, search, request creation, duplicate prevention, and request approval):

```bash
npm test
```

Expected output:
```text
🧪 Starting SkillProject-Web API Tests...

  ✅ PASS: Health check returns 200 OK
  ✅ PASS: Demo user Alex logged in successfully
  ✅ PASS: New learner registered successfully
  ✅ PASS: Get learner profile succeeds
  ✅ PASS: Learner profile update succeeds
  ✅ PASS: Learner posted a teaching skill
  ✅ PASS: Search for "Python" returns skills
  ✅ PASS: Category filter finds posted Science skill
  ✅ PASS: Learner sent learning request to Alex
  ✅ PASS: Duplicate pending request is rejected as expected
  ✅ PASS: Alex received the learning request
  ✅ PASS: Learner sees request in sent list
  ✅ PASS: Alex successfully accepted the request
  ✅ PASS: Learner deleted their test skill

=========================================
Test Results: 14 Passed, 0 Failed
=========================================
```

---

## 🌐 Deploying to an AWS EC2 Linux Server

This guide covers deploying **SkillProject-Web** on **Ubuntu 22.04 / 24.04 LTS** or **Amazon Linux 2023** on an AWS EC2 instance.

### 1. Launch & Configure Your EC2 Instance

1. In the **AWS Management Console**, navigate to **EC2 > Instances > Launch an instance**.
2. **Name**: `SkillProject-Server`
3. **AMI**: Ubuntu Server 22.04/24.04 LTS (Free Tier eligible) or Amazon Linux 2023.
4. **Instance Type**: `t2.micro` or `t3.micro`.
5. **Key Pair**: Select an existing key pair or create a new `.pem` key pair (e.g. `skillproject-key.pem`).
6. **Network Settings (Security Group)**:
   - Allow **SSH** (port `22`) from your IP.
   - Allow **HTTP** (port `80`) from Anywhere (`0.0.0.0/0`).
   - Allow **Custom TCP** (port `3000`) from Anywhere (`0.0.0.0/0`) if not using Nginx.
7. Click **Launch instance**.

---

### 2. Connect to the EC2 Instance via SSH

On your local machine terminal:

```bash
# Set appropriate permissions for your private key
chmod 400 skillproject-key.pem

# Connect to Ubuntu EC2 (replace with your instance's Public IPv4 address or DNS)
ssh -i "skillproject-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

*(If using Amazon Linux, replace `ubuntu@` with `ec2-user@`)*.

---

### 3. Install Node.js, Git, and Build Tools on EC2

#### For Ubuntu:
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Git and build tools
sudo apt install -y git build-essential curl

# Install Node.js (v20 LTS recommended for production)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v
npm -v
```

#### For Amazon Linux 2023:
```bash
sudo dnf update -y
sudo dnf install -y git gcc gcc-c++ make
sudo dnf install -y nodejs
node -v
npm -v
```

---

### 4. Clone or Transfer Project Files to the Server

You can clone from your GitHub repository:

```bash
git clone https://github.com/YOUR_USERNAME/SkillProject-Web.git
cd SkillProject-Web
```

*(Alternatively, use `scp` or `rsync` from your local machine to upload the folder).*

---

### 5. Install Dependencies and Configure Environment

```bash
# Install production dependencies
npm install

# Create production .env file
cp .env.example .env
nano .env
```

Set strong production values in `.env`:
```ini
PORT=3000
NODE_ENV=production
JWT_SECRET=your_super_strong_random_secret_string_here_998877
DB_PATH=./data/skills.db
```
*(Save and exit nano: `Ctrl + O`, `Enter`, then `Ctrl + X`).*

---

### 6. Run Permanently in the Background with PM2

To ensure the application keeps running after you close your SSH terminal and restarts automatically if the server reboots:

```bash
# Install PM2 process manager globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start server/server.js --name "skillproject"

# Ensure PM2 starts on server boot
pm2 startup
# (Copy and run the command printed by PM2 if prompted)

# Save the process list
pm2 save
```

Useful PM2 commands:
- View logs: `pm2 logs skillproject`
- Status: `pm2 status`
- Restart: `pm2 restart skillproject`

---

### 7. (Recommended) Set Up Nginx as a Reverse Proxy

Using Nginx allows users to access the application via standard HTTP port `80` (or HTTPS port `443`) without typing `:3000` in the URL.

```bash
# Install Nginx
sudo apt install -y nginx

# Edit default site configuration
sudo nano /etc/nginx/sites-available/default
```

Replace the `location /` block with:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

Now open your browser and visit:
👉 `http://YOUR_EC2_PUBLIC_IP`

---

## 🛠️ REST API Specification

### Authentication & Profile (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register a new student account (`name`, `email`, `password`, `college`, `major`, `bio`, `contact`). |
| `POST` | `/api/auth/login` | No | Login student and return JWT token and profile info. |
| `GET` | `/api/auth/me` | Yes | Get currently authenticated student profile & KPI statistics. |
| `PUT` | `/api/auth/profile` | Yes | Update profile details (`name`, `college`, `major`, `bio`, `contact`). |

### Skills Management (`/api/skills`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/skills` | No | Browse & search skills. Query params: `search`, `category`, `proficiency`. |
| `GET` | `/api/skills/categories`| No | Get list of skill categories with item counts. |
| `GET` | `/api/skills/my-skills` | Yes | Retrieve all skills taught by the logged-in student. |
| `GET` | `/api/skills/:id` | No | Retrieve detailed information for a single skill. |
| `POST` | `/api/skills` | Yes | Post a new teaching skill (`title`, `category`, `description`, `proficiency`, `availability`). |
| `DELETE` | `/api/skills/:id` | Yes | Delete a skill listing (owner only). |

### Learning Requests (`/api/requests`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | Yes | Send a learning request for a skill (`skill_id`, `message`, `preferred_time`). |
| `GET` | `/api/requests/received`| Yes | View requests sent by students to learn skills you teach. |
| `GET` | `/api/requests/sent` | Yes | View requests you have sent to learn from peer mentors. |
| `PUT` | `/api/requests/:id` | Yes | Accept or reject a received request (`status`: `'accepted'` or `'rejected'`). |
| `DELETE` | `/api/requests/:id` | Yes | Cancel an outgoing request (requester only). |

---

## 🛡️ Security & Best Practices Implemented

1. **No Hard-coded Secrets**: All sensitive keys, port configurations, and database locations use `.env` via `dotenv`.
2. **Password Hashing**: Passwords stored using `bcryptjs` with salt rounds.
3. **JWT Authentication**: Protected API endpoints enforce `Authorization: Bearer <token>` verification.
4. **Parameterized Queries**: All database queries use `better-sqlite3` prepared statements to prevent SQL Injection.
5. **Cross-Site Scripting (XSS) Prevention**: Frontend input rendering is escaped via `escapeHTML()` before DOM injection.
6. **Foreign Key Integrity**: SQLite configured with `PRAGMA foreign_keys = ON;` and cascading deletes on user/skill deletions.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and extend for academic and personal projects.
