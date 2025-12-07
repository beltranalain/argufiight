# Fix Lock File Issue

If you see "Unable to acquire lock" error, run these commands:

```powershell
# 1. Stop any running Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 2. Remove the .next folder (this will clear the lock)
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Start the server again
npm run dev
```

**Note:** The server is running on port 3001 (since 3000 is in use). Visit:
- http://localhost:3001
- http://localhost:3001/login
- http://localhost:3001/signup



