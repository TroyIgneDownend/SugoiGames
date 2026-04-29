# **DTech 2D Game Development — IT Setup Guide**

**Document Version:** 2.0 **Last Updated:** 04-04-2026 **Compatible OS:** Windows 10 (build 1809+), Windows 11 **Target Audience:** IT and technical support personnel

---

## Overview — Who Does What

| Task                                                 | Owner                                            |
| ---------------------------------------------------- | ------------------------------------------------ |
| Install software on each machine                     | **IT**                                           |
| Install VS Code extensions                           | **IT**                                           |
| Open firewall/allowlist domains                      | **IT**                                           |
| Verify installs                                      | **IT**                                           |
| Push StarterProject to GitHub                        | **Instructor (before Day 1)**                    |
| GitHub account creation + Education signup           | **Students (pre-assigned via Google Classroom)** |
| Git identity config + `git clone` of starter project | **Students (in-class Git lesson)**               |
| Create personal project repo from template           | **Students (in-class Git lesson)**               |

**Key change from previous setup:** IT no longer needs to manually create or seed the starter project files on each machine. The instructor pushes the starter project to a GitHub repository (main branch), and students clone it during a dedicated Git class. This means fewer brittle PowerShell scripts for IT and a real Git workflow for students from day one.

---

## Phase 1: Per Machine (IT)

### Step 1 — Install All Software

Run in an **elevated (administrator) PowerShell** window.

_(Copy and paste the entire block)_

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install all software
choco install nodejs-lts -y
choco install git -y
choco install vscode -y
choco install gimp --version=2.10.38 -y
choco install audacity -y
choco install tiled -y
choco install googlechrome -y
```

---

### Step 2 — Install VS Code Extensions

**Close PowerShell and reopen with admin privileges before running. Machine may need a reboot beforehand.**

_(Copy and paste the entire block)_

```powershell
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
code --install-extension ritwickdey.LiveServer
code --install-extension esbenp.prettier-vscode
```

---

### Step 3 — Verify Installs

**Via Command Prompt**

Open Command Prompt and run each line separately:

```
node --version
npm --version
git --version
```

All three should return a version number. If any say "not recognized," that package did not install correctly — re-run the Chocolatey install for that package.

**Via Start Menu**

Press the Windows key and confirm each of these opens:

- Chrome
- GIMP
- Audacity
- Tiled

**VS Code Extensions**

Open VS Code, click the **Extensions icon** on the left sidebar (four squares icon). Confirm these are installed and enabled:

- GitHub Copilot
- GitHub Copilot Chat
- Live Server
- Prettier

**Live Server Smoke Test**

1. Open VS Code
2. File → New File → save it as `test.html` anywhere
3. Paste in: `<h1>Live Server works</h1>`
4. Right-click the file tab → **Open with Live Server**
5. Chrome should open and display the heading

If Chrome doesn't open, check that port 5500 is not blocked locally. Delete the test file when done.

**Note:** You do not need to test a full game project. Students will clone and open the real starter project during the Git class.

---

## Network Requirements (Submit to District IT/Network Admin)

The following outbound HTTPS (port 443) connections must be allowed. **Submit this list at least 2 weeks before the course start date.** Ticket turnaround is typically 5–10 business days.

| Domain                          | Purpose                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `github.com`                    | Git clone, repositories, student account creation                                  |
| `api.github.com`                | GitHub Copilot                                                                     |
| `copilot.github.com`            | GitHub Copilot AI                                                                  |
| `objects.githubusercontent.com` | GitHub file downloads / Copilot                                                    |
| `education.github.com`          | Student GitHub Education verification                                              |
| `classroom.github.com`          | GitHub Classroom (used by instructor)                                              |
| `registry.npmjs.org`            | npm packages                                                                       |
| `marketplace.visualstudio.com`  | VS Code extension installs                                                         |
| `*.gallerycdn.vsassets.io`      | VS Code extension downloads (CDN)                                                  |
| `vscode.blob.core.windows.net`  | VS Code updates                                                                    |
| `itch.io`                       | Asset browsing                                                                     |
| `*.itch.zone`                   | itch.io asset file downloads (CDN) — **required separately from itch.io**          |
| `community.chocolatey.org`      | Chocolatey installs (only needed during IT imaging)                                |
| `piskelapp.com`                 | Piskel download                                                                    |
| `classroom.google.com`          | Google Classroom — instructor uses this for pre-class assignments                  |
| `gemini.google.com`             | Nano Banana image generation tool (age-gated features may not function for minors) |

**No inbound ports need to be opened.** Live Server runs on localhost only.

⚠️ **Content Filtering Note:** `itch.io` is frequently blocked by default as a gaming site. Submit an explicit unblock request for both `itch.io` AND `*.itch.zone` — asset downloads will silently fail if only one is unblocked. GitHub Copilot API endpoints may be flagged by DLP rules; confirm `copilot.github.com` and `api.github.com` are fully unblocked.

---

## Phase 2: Instructor Pre-Work (Before Day 1)

IT does not handle this. Listed here so IT knows what the instructor is responsible for.

- **StarterProject is already on GitHub** at https://github.com/sgoodale-collab/StarterProject and is configured as a **Template repository**. Students create their own personal copy using the "Use this template" button during the in-class Git lesson (Phase 4) — they never clone or push to the instructor's repo directly.
- **Set up GitHub Classroom** (via https://classroom.github.com) using the GitHub Education for Teachers account to assign the starter repo to students — not yet configured as of this version.
- **Post pre-class tasks to Google Classroom** (see Phase 3 below). Students should complete GitHub signup and GitHub Education verification _before_ Day 1 of the Git lesson.

---

## Phase 3: Student Pre-Work (Assigned via Google Classroom Before Git Class)

IT does not need to be present. Instructor assigns these steps through Google Classroom before the Git lesson day.

**1. Create a GitHub account** (if not already done)

- Go to https://github.com/signup
- Must use school email

⚠️ GitHub requires users to be 13+. Students under 18 should have a parent or guardian review GitHub's Terms of Service.

**2. Apply for GitHub Education** (free Copilot access)

- Go to https://education.github.com/students
- Submit verification with school email or student ID

⚠️ Approval can take 24 hours to 2 weeks. Do not count on Copilot being active on Day 1. If approval is delayed for multiple students, the instructor can use a GitHub Education for Teachers organization license to grant Copilot access to the whole class immediately without waiting for individual approvals.

---

## Phase 4: Git Class — Students Do This In Class (Instructor-Led)

**Estimated time: 45–60 minutes**  
This replaces the old "copy from Public folder" setup. Students end up with a real Git repo connected to GitHub from the very first day.

**1. Sign in to GitHub in VS Code**

- Open VS Code
- Click the **Accounts icon** (bottom-left)
- Sign in with GitHub account
- GitHub Copilot activates automatically once Education is approved

**2. Configure Git identity** (one-time, run in VS Code terminal)

Open the terminal in VS Code (View → Terminal) and run:

```bash
git config --global user.name "yourusername"
git config --global user.email "you@school.edu"
```

To find your GitHub username and email: go to github.com, sign in, click your profile picture → **Settings** → **Emails**.

**Note:** Git uses these values to label commits. Using your GitHub username and email ensures commits link properly to your GitHub profile when students push their projects later.

**3. Create your project from the template**

- Go to https://github.com/sgoodale-collab/StarterProject and sign in
- Click the green **Use this template** button → **Create a new repository**
- Choose a name for your project (e.g., `MyPlatformerGame` — no spaces)
- Set it to **Public** or **Private** (your choice)
- Click **Create repository**
- Copy the HTTPS URL of your new repo (e.g., `https://github.com/yourusername/MyPlatformerGame.git`)

**4. Clone your project**

Use the HTTPS URL of your own repo that you just created. Copy and paste **both lines together** into the VS Code terminal:

```bash
cd Documents
git clone https://github.com/yourusername/MyPlatformerGame.git
```

Replace `yourusername` and `MyPlatformerGame` with your actual values. When complete, a folder named after your project will appear in `Documents`.

**5. Open the cloned project**

- In VS Code: **File → Open Folder**
- Navigate to `Documents` → your project folder and select it

**6. Install Phaser (npm install)**

The cloned repo does not include `node_modules`. Run this once in the VS Code terminal:

```bash
npm install
```

**7. Verify Live Server works**

- In VS Code, open `index.html`
- Right-click → **Open with Live Server**
- Chrome should open and display the game

If the browser does not open or the page is blank, notify the instructor — this usually means a network port-blocking issue IT needs to resolve.

---

## Phase 5: Saving and Accessing Your Work (Students)

Since you cloned your own repo in Phase 4, pushing to GitHub is already set up — no extra configuration needed.

**1. Save your work to GitHub (do this regularly)**

In VS Code, open Copilot Chat (the chat icon in the left sidebar) and type:

> _Save and push my changes to GitHub_

Copilot will run the necessary commands for you. If it asks for a commit message, describe what you changed (e.g., "added spikes to level 1").

⚠️ **Advanced — Accessing your project from another computer**

This is an advanced technique for working on your project outside of school computers. Most students won’t need this.

If you want to work from home or a different machine, open Copilot Chat on that computer and type:

> _Help me clone my project from GitHub so I can work on it here_

Copilot will walk you through the steps. You’ll need your GitHub repo URL (find it at https://github.com under your repositories).

---

## Additional Notes for Instructor

- **Disk space:** Monitor student `Documents\StarterProject` folder size during weeks 2–3. Uncompressed audio and art assets can accumulate. Remind students to delete unused asset copies.
- **npm install:** The cloned repo does not include `node_modules`. On first open, students run `npm install` in the terminal to install Phaser locally. The instructor should walk through this during the Git class.
- **Template repo:** The StarterProject is configured as a GitHub Template repository. Each student creates their own copy via "Use this template" during the in-class Git lesson — they own that repo from day one and can push freely without touching the instructor's repo. If you later move to GitHub Classroom, you can use the same template repo as the Classroom assignment source.
