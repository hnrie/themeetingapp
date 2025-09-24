<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Meet - Video Conferencing App

A modern video conferencing web application built with React, TypeScript, and WebRTC.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start signaling server (new terminal):**
   ```bash
   npm run signaling
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```
   - Optional: set `VITE_SIGNALING_URL` env to a remote WS, else defaults to `ws://localhost:3001/ws`.

4. **Open your browser:** Navigate to `http://localhost:5173`

## ✨ Features

- **Video Conferencing**: High-quality video calls with multiple participants
- **Audio Controls**: Mute/unmute microphone with visual indicators
- **Camera Controls**: Turn camera on/off with preview
- **Screen Sharing**: Share your screen with other participants
- **Real-time Chat**: Text messaging during meetings
- **Participant Management**: Host controls for muting participants
- **Device Selection**: Choose camera and microphone devices
- **Video Quality Settings**: Adjust video quality from 360p to 4K
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with dark theme

## 🛠️ Recent Fixes Applied

This application was completely fixed and is now fully functional:

### ✅ **Dependencies & TypeScript**
- Added missing React type definitions (`@types/react`, `@types/react-dom`)
- Added WebSocket type definitions (`@types/ws`)
- Added Vite React plugin (`@vitejs/plugin-react`)
- Updated Vite configuration for proper React support

### ✅ **WebRTC Service**
- Fixed undefined variable references in message handling
- Improved signaling URL configuration
- Enhanced error handling and connection management
- Fixed peer connection management and cleanup

### ✅ **Component Issues**
- Fixed TypeScript compilation errors
- Improved error handling in camera/media access
- Enhanced component prop types and interfaces
- Fixed spread operator usage in camera hook

### ✅ **Configuration**
- Added proper environment variable setup (`.env` file)
- Fixed signaling server URL configuration
- Updated Vite config with React plugin and server settings

### ✅ **Build System**
- All TypeScript errors resolved
- Build process working correctly
- Development server starts without issues

## 🎯 Usage

### Creating a Meeting
1. Click "New Meeting" on the dashboard
2. You'll be redirected to a lobby where you can test your camera/microphone
3. Enter your name and click "Join now"

### Joining a Meeting
1. Enter a meeting ID or paste a meeting link on the dashboard
2. Click "Join"
3. Test your devices in the lobby and enter your name

### During a Meeting
- **Mute/Unmute**: Click the microphone button
- **Camera On/Off**: Click the camera button  
- **Screen Share**: Click the screen share button
- **Chat**: Click the chat icon to open the sidebar
- **Participants**: View and manage participants in the sidebar
- **Settings**: Access device and quality settings
- **Leave**: Click the red end call button

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run signaling` - Start signaling server

### Environment Variables

The `.env` file is already configured:

```env
VITE_SIGNALING_URL=ws://localhost:3001/ws
```

## 🐛 Troubleshooting

### Camera/Microphone Issues
- Ensure browser permissions are granted
- Check if devices are available and not used by other applications
- Try refreshing the page

### Connection Issues  
- Ensure signaling server is running on port 3001
- Check firewall settings
- Verify STUN server accessibility

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (18+ required)

## 📋 System Requirements

- **Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **WebRTC Support**: Required
- **Microphone/Camera**: Optional but recommended
- **Network**: Stable internet connection

---

**Status**: ✅ **FULLY FIXED AND FUNCTIONAL**

All major issues have been resolved and the application is ready for use!