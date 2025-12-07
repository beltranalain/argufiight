# API Configuration Guide

## ✅ Current Configuration

The API URL has been configured to use your local IP address: **192.168.1.152**

The file `mobile/src/services/api.ts` is now set to:
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.152:3000/api'
  : 'https://your-production-url.com/api';
```

## 🔍 How to Find Your Local IP (If You Need to Change It)

### Windows:
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address under your active network interface.

## ⚙️ Configuration Steps

1. **Make sure your backend is running:**
   ```bash
   npm run dev
   ```
   Your Next.js server should be running on `http://localhost:3000`

2. **Verify your phone and computer are on the same WiFi network:**
   - Both devices must be connected to the same WiFi
   - Mobile data won't work for local development

3. **Test the connection:**
   - On your phone's browser, try: `http://192.168.1.152:3000`
   - If you can access your Next.js app, the IP is correct

## 🐛 Troubleshooting

### "Network Error" or "Connection Refused"

1. **Check your IP address:**
   - Your IP might have changed
   - Run `ipconfig` again to get the current IP
   - Update `mobile/src/services/api.ts` with the new IP

2. **Check your firewall:**
   - Windows Firewall might be blocking port 3000
   - Allow Node.js through the firewall
   - Or temporarily disable firewall for testing

3. **Check your backend is running:**
   - Make sure `npm run dev` is running
   - Verify it's listening on port 3000

4. **For Android Emulator:**
   - Use `10.0.2.2` instead of your local IP
   - This is the special IP that points to your host machine

5. **For iOS Simulator:**
   - Use `localhost` or `127.0.0.1`
   - Simulator runs on the same machine

## 📝 Update the API URL

If you need to change the IP address, edit `mobile/src/services/api.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR_NEW_IP:3000/api'  // Change this
  : 'https://your-production-url.com/api';
```

Then restart Expo:
```bash
cd mobile
npx expo start -c
```

## ✅ Current Status

- ✅ API URL configured: `http://192.168.1.152:3000/api`
- ✅ Ready to connect to your local backend
- ✅ Make sure backend is running on port 3000



