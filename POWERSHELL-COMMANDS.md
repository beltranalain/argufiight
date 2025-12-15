# PowerShell Commands for Honorable AI

## Quick Start Commands

### Install Dependencies
```powershell
npm install
```

### Run Development Server
```powershell
npm run dev
```
The development server will start at `http://localhost:3000`

### Build for Production
```powershell
npm run build
```

### Start Production Server
```powershell
npm start
```

### Type Checking
```powershell
npm run type-check
```

### Linting
```powershell
npm run lint
```

## Environment Setup

### Create .env.local file
```powershell
Copy-Item env.example .env.local
```
Then edit `.env.local` with your actual credentials.

## Git Commands

### Initial Commit (if not done yet)
```powershell
git add .
git commit -m "Phase 0: Project setup complete"
```

### Check Status
```powershell
git status
```

## Database Commands (Future Phases)

### Initialize Prisma (Phase 2)
```powershell
npx prisma init
```

### Run Migrations (Phase 2)
```powershell
npx prisma migrate dev
```

### Seed Database (Phase 2)
```powershell
npm run seed
```

## Troubleshooting

### Clear Next.js Cache
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### Reinstall Dependencies
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Check Node Version
```powershell
node --version
```
Should be 18 or higher.

### Check npm Version
```powershell
npm --version
```






