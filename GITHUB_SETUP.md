# Setting Up GitHub Source Control for FlagTrivia

This project has no source control yet. Follow these steps to create a GitHub repository and push the project.

---

## Step 1 — Create a .gitignore for Unity

Unity generates a large amount of files that should not be committed. In WSL or Windows, create a `.gitignore` at the root of the project (`C:\Users\Bradley\Documents\GitHub\FlagTrivia\.gitignore`) with the following content:

```
# Unity generated
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
*.pidb
*.booproj
*.svd
*.userprefs
*.csproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.unityproj
.DS_Store
*.apk
*.aab
*.unitypackage

# Dojo / Cairo build artifacts
target/
manifest_dev.json
manifest_release.json

# OS
Thumbs.db
Desktop.ini
```

> Do NOT ignore `Assets/`, `Packages/`, `ProjectSettings/`, or `*.cairo` files — these are your source code.

---

## Step 2 — Create the GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `FlagTrivia` (or your preferred name)
3. Set it to **Public** (required for game jam submission)
4. Do **not** initialise with a README, .gitignore, or licence — you will push your own
5. Click **Create repository**
6. Copy the repository URL shown (e.g. `https://github.com/YourUsername/FlagTrivia.git`)

---

## Step 3 — Initialise git and push

Open WSL Ubuntu and run:

```bash
cd /mnt/c/Users/Bradley/Documents/GitHub/FlagTrivia
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YourUsername/FlagTrivia.git
git push -u origin main
```

Replace `https://github.com/YourUsername/FlagTrivia.git` with your actual repo URL from Step 2.

---

## Step 4 — Verify

Go to your GitHub repo in the browser. You should see:
- `Assets/` folder with your scripts and data
- `Packages/` folder
- `ProjectSettings/` folder
- `src/` folder with your Cairo contracts
- No `Library/` folder (excluded by .gitignore)

---

## Going forward

Commit and push changes regularly:

```bash
cd /mnt/c/Users/Bradley/Documents/GitHub/FlagTrivia
git add .
git commit -m "describe your changes"
git push
```
