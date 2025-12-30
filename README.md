# MeetNest

MeetNest is a full-stack real-time video conferencing web application that allows users to host and join secure online meetings with live video, audio, chat, and screen sharing. Built with React, WebRTC, Socket.IO, Node.js, Express.js, and MongoDB, MeetNest provides a modern and interactive meeting experience similar to popular video conferencing platforms.

## Features

- Real-time multi-user video conferencing using WebRTC (mesh architecture)
- Live audio and video controls (mute/unmute, camera on/off)
- Screen sharing with seamless fallback handling
- Real-time in-meeting chat with message grouping
- Participant join and leave detection
- Media state synchronization across all participants
- Secure user authentication with token-based sessions
- Meeting history tracking for authenticated users
- Lobby preview before joining a meeting
- Responsive UI built with Material UI

## Tech Stack

- **Frontend:** React, JavaScript, Material UI, CSS Modules
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB (Mongoose)
- **Real-Time Communication:** WebRTC, Socket.IO
- **Authentication:** Token-based authentication, bcrypt

### Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Modern web browser with WebRTC support

## Usage

- Open the application in your browser.
- Register or log in to your account.
- Create a new meeting or join an existing meeting using a meeting code.
- Allow camera and microphone permissions.
- Participate in real-time video calls with chat and screen sharing.
- End the call and view past meetings in the meeting history section.

## Acknowledgements

- [React](https://react.dev/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.IO](https://socket.io/)
- [WebRTC](https://webrtc.org/)
- [Material UI](https://mui.com/)

> Inspired by real-time WebRTC-based video conferencing systems and modern full-stack web application architectures.
