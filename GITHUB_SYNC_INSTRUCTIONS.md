# GitHub Sync Instructions

## Prerequisites
- Git installed on your system
- GitHub account with access to the repository
- SSH key or personal access token configured

## Using SSH Key (Recommended)

### 1. Generate SSH Key (if you don't have one)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. Add SSH Key to GitHub
1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste your public key and save

### 3. Configure Git Remote
```bash
# Check current remotes
git remote -v

# Add SSH remote (if not already added)
git remote add origin git@github.com:argufight/argufight.git

# Or update existing remote
git remote set-url origin git@github.com:argufight/argufight.git
```

### 4. Sync to GitHub
```bash
# Stage all changes
git add -A

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## Using Personal Access Token (Alternative)

### 1. Generate Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Generate and copy the token (you won't see it again!)

### 2. Configure Git Remote with Token
```bash
# Update remote URL with token
git remote set-url origin https://YOUR_TOKEN@github.com/argufight/argufight.git

# Or use this format
git remote set-url origin https://github.com/argufight/argufight.git
```

### 3. Sync to GitHub
```bash
# When prompted for password, use your personal access token
git add -A
git commit -m "Your commit message"
git push origin main
```

## Current Setup (Based on Your Project)

Your project is already configured with the `argufight` remote:

```bash
# Check remotes
git remote -v

# Should show:
# argufight  https://github.com/argufight/argufight.git (fetch)
# argufight  https://github.com/argufight/argufight.git (push)
```

### Standard Sync Command
```bash
git add -A
git commit -m "Your commit message"
git push argufight main
```

## Troubleshooting

### Authentication Failed
- **SSH**: Check your SSH key is added to GitHub and agent is running
  ```bash
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519
  ```
- **Token**: Ensure token has `repo` scope and hasn't expired

### Permission Denied
- Check you have write access to the repository
- Verify your GitHub account has the correct permissions

### Remote Not Found
```bash
# Add remote
git remote add argufight https://github.com/argufight/argufight.git

# Or if using SSH
git remote add argufight git@github.com:argufight/argufight.git
```

## Best Practices

1. **Always pull before pushing**:
   ```bash
   git pull argufight main
   git push argufight main
   ```

2. **Use descriptive commit messages**:
   ```bash
   git commit -m "Fix: King of the Hill Round 2 participant submission issue"
   ```

3. **Check status before committing**:
   ```bash
   git status
   git diff
   ```

4. **Create branches for major changes**:
   ```bash
   git checkout -b feature/king-of-the-hill-fix
   git push argufight feature/king-of-the-hill-fix
   ```

