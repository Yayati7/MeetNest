import React, { useEffect, useRef, useState, useContext } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../utils/environment';
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";




const server_url = server;


var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

const renegotiatePeer = (peerId, stream, socket) => {
    const connection = connections[peerId];
    if (!connection) return;
    try { connection.addStream(stream); } catch (error) { console.warn("Unable to update peer media:", error); }
    connection.createOffer()
        .then(description => connection.setLocalDescription(description))
        .then(() => socket?.emit("signal", peerId, JSON.stringify({ sdp: connection.localDescription })))
        .catch(error => console.warn("Unable to refresh peer media:", error));
};

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();
    const cameraStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    let [videoAvailable, setVideoAvailable] = useState(false);

    let [audioAvailable, setAudioAvailable] = useState(false);

    let [video, setVideo] = useState(false);

    let [audio, setAudio] = useState(false);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState(() => `Guest ${Math.floor(100 + Math.random() * 900)}`);
    let [mediaStatus, setMediaStatus] = useState("requesting");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    const { addToUserHistory } = useContext(AuthContext);
    const navigate = useNavigate();



    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        let cancelled = false;
        const acquireMedia = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setMediaStatus("unavailable");
                setScreenAvailable(false);
                return;
            }
            let stream = null;
            try {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                } catch (combinedError) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    } catch (videoError) {
                        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    }
                }
                if (cancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                window.localStream = stream;
                cameraStreamRef.current = stream;
                setVideoAvailable(stream.getVideoTracks().length > 0);
                setAudioAvailable(stream.getAudioTracks().length > 0);
                setMediaStatus(stream.getVideoTracks().length ? "ready" : "unavailable");
                if (localVideoref.current) localVideoref.current.srcObject = stream;
            } catch (error) {
                if (!cancelled) console.warn("Camera or microphone unavailable:", error);
                if (!cancelled) { setVideoAvailable(false); setAudioAvailable(false); setMediaStatus("unavailable"); }
            }
            if (!cancelled) setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));
        };
        acquireMedia();
        return () => {
            cancelled = true;
            socketRef.current?.disconnect();
            Object.values(connections).forEach(connection => connection.close());
            connections = {};
            cameraStreamRef.current?.getTracks().forEach(track => track.stop());
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
            window.localStream?.getTracks().forEach(track => track.stop());
            window.localStream = null;
        };
    }, []);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }
    const restoreCameraAfterShare = () => {
        if (!screenStreamRef.current) return;
        setScreen(false);
        screenStreamRef.current = null;
        const cameraStream = cameraStreamRef.current;
        if (!cameraStream) return;
        window.localStream = cameraStream;
        if (localVideoref.current) localVideoref.current.srcObject = cameraStream;
        for (const id in connections) {
            if (id === socketIdRef.current) continue;
            renegotiatePeer(id, cameraStream, socketRef.current);
        }
    };

    let getDislayMediaSuccess = (stream) => {
        screenStreamRef.current = stream;
        const cameraAudio = cameraStreamRef.current?.getAudioTracks() || [];
        window.localStream = new MediaStream([...stream.getVideoTracks(), ...cameraAudio]);
        if (localVideoref.current) localVideoref.current.srcObject = window.localStream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            renegotiatePeer(id, window.localStream, socketRef.current)
        }

        stream.getVideoTracks().forEach(track => track.onended = restoreCameraAfterShare)
    }

    let gotMessageFromServer = async (fromId, message) => {
        if (!connections[fromId]) return;

        const signal = JSON.parse(message);

        if (signal.sdp) {
            await connections[fromId].setRemoteDescription(
                new RTCSessionDescription(signal.sdp)
            );

            if (signal.sdp.type === "offer") {
                const answer = await connections[fromId].createAnswer();
                await connections[fromId].setLocalDescription(answer);

                socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({ sdp: connections[fromId].localDescription })
                );
            }
        }

        if (signal.ice) {
            await connections[fromId].addIceCandidate(
                new RTCIceCandidate(signal.ice)
            );
        }
    };


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', { path: window.location.href, username})
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            // 🔧 STEP 2: Listen for media updates
           socketRef.current.on("media-update", (socketId, media) => {
                setVideos(prev =>
                    prev.map(v =>
                        v.socketId === socketId
                            ? { ...v, ...media }
                            : v
                    )
                );
            });



            socketRef.current.on('user-left', (id) => {

                // ✅ CLOSE PEER CONNECTION
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }

                // ✅ REMOVE VIDEO TILE
                setVideos((videos) =>
                    videos.filter((video) => video.socketId !== id)
                );
            });


            socketRef.current.on('user-joined', (id, clients, usernames) => {
                clients.forEach((socketListId) => {

                    if (connections[socketListId]) return;
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                username: usernames?.[socketListId],
                                autoplay: true,
                                playsinline: true,
                                video: true,
                                audio: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        renegotiatePeer(id2, window.localStream, socketRef.current)
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        if (!window.localStream) return;

        const enabled = !video;   // ✅ derive state safely

        window.localStream.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });

        setVideo(enabled);

        // ✅ update your own tile
        setVideos(prev =>
            prev.map(v =>
                v.socketId === socketIdRef.current
                    ? { ...v, video: enabled }
                    : v
            )
        );

        // ✅ notify others
        socketRef.current.emit("media-update", socketIdRef.current, {
            video: enabled,
            audio
        });
    };


    let handleAudio = () => {
        if (!window.localStream) return;

        const enabled = !audio;

        window.localStream.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });

        setAudio(enabled);

        // ✅ update your own tile
        setVideos(prev =>
            prev.map(v =>
                v.socketId === socketIdRef.current
                    ? { ...v, audio: enabled }
                    : v
            )
        );

        // ✅ notify others
        socketRef.current.emit("media-update", socketIdRef.current, {
            video,
            audio: enabled
        });
    };


    let handleScreen = async () => {
        if (screen) {
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
            restoreCameraAfterShare();
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                getDislayMediaSuccess(stream);
                setScreen(true);
            } catch (error) {
                console.warn("Screen sharing was not started:", error);
                setScreen(false);
            }
        }
    }

    let handleEndCall = async () => {

        const token = localStorage.getItem("token");

        // save meeting history
        if (token) {
            try {
                await addToUserHistory(
                    window.location.pathname.split("/").pop()
                );
            } catch (e) {
                console.warn("History save failed:", e);
            }
        }

        // 🔥 STOP LOCAL MEDIA
        try {
            localVideoref.current?.srcObject
                ?.getTracks()
                ?.forEach(track => track.stop());
        } catch (e) {}
        cameraStreamRef.current?.getTracks().forEach(track => track.stop());
        screenStreamRef.current?.getTracks().forEach(track => track.stop());

        // 🔥 CLOSE ALL PEER CONNECTIONS
        Object.values(connections).forEach(conn => {
            try {
                conn.close();
            } catch (e) {}
        });
        connections = {}; // 🔥 RESET GLOBAL

        // 🔥 RESET VIDEO STATE
        setVideos([]);
        videoRef.current = [];

        // 🔥 DISCONNECT SOCKET
        try {
            socketRef.current?.disconnect();
            socketRef.current = null;
        } catch (e) {}

        // navigate
        if (token) {
            navigate("/home", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    };




    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    };
    let closeChat = () => {
        setModal(false);
    }
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (
            socketIdSender !== socketIdRef.current &&
            !showModal
        ) {
            setNewMessages(prev => prev + 1);
        }

    };

    useEffect(() => {
        if (!askForUsername && localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    }, [askForUsername]);


    let sendMessage = () => {
        const text = message.trim();
        if (!text || !socketRef.current?.connected) return;
        socketRef.current.emit('chat-message', text, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setMessages([]);
        setNewMessages(0);

        // 🔥 RESET PREVIOUS SESSION COMPLETELY
        setVideos([]);
        videoRef.current = [];
        connections = {};

        setAskForUsername(false);
        getMedia();
    };



    const totalParticipants = videos.length + 1; // you + others

    return (
                <div>

                    {askForUsername === true ? (

                    <div className="lobbyRoot">
                        <div className="lobbyTopbar">
                            <button type="button" className="lobbyBack" onClick={() => navigate(-1)}>← <span>Back</span></button>
                            <div className="lobbyBrand"><img src="/meetnest-icon.png" alt="" /><span>MeetNest</span></div>
                            <span className="lobbyPrivate"><i /> Private room</span>
                        </div>
                        <main className="lobbyMain">
                            <div className="lobbyIntro">
                                <span className="eyebrow">ONE MOMENT BEFORE YOU JOIN</span>
                                <h1 className="lobbyTitle">Look good.<br /><em>Feel ready.</em></h1>
                                <p>Your camera preview is live here. Add a name, check your setup, then step into the conversation.</p>
                            </div>
                            <section className="lobbyCard" aria-label="Meeting setup">
                                <div className="previewBox">
                                    <video ref={localVideoref} autoPlay muted playsInline />
                                    {mediaStatus !== "ready" && <div className="previewState"><span className={mediaStatus === "requesting" ? "previewSpinner" : "previewCameraIcon"}>{mediaStatus === "requesting" ? "" : "◉"}</span><strong>{mediaStatus === "requesting" ? "Connecting your camera…" : "Camera unavailable"}</strong><span>{mediaStatus === "requesting" ? "Your browser may ask for camera permission." : "You can still join and turn your camera on later."}</span></div>}
                                    <div className="previewCaption"><span className="previewLive"><i /> {mediaStatus === "ready" ? "Camera ready" : mediaStatus === "requesting" ? "Setting up" : "Preview unavailable"}</span><span>Only you can see this preview</span></div>
                                </div>
                                <div className="lobbySetup">
                                    <div className="setupHeading"><span className="setupStep">01</span><div><h2>Make yourself at home</h2><p>Choose how you’ll appear in the room.</p></div></div>
                                    <label className="lobbyNameLabel" htmlFor="meeting-name">Your name</label>
                                    <TextField id="meeting-name" className="lobbyNameInput" fullWidth variant="outlined" value={username} onChange={(event) => setUsername(event.target.value)} inputProps={{ maxLength: 32 }} />
                                    <div className="deviceChecks"><span className={mediaStatus === "ready" ? "deviceReady" : "deviceWaiting"}><i />{mediaStatus === "ready" ? "Camera connected" : mediaStatus === "requesting" ? "Checking camera" : "Camera off"}</span><span className={audioAvailable ? "deviceReady" : "deviceWaiting"}><i />{audioAvailable ? "Microphone ready" : mediaStatus === "requesting" ? "Checking microphone" : "Microphone unavailable"}</span></div>
                                    <Button className="connectBtn" variant="contained" disabled={!username.trim() || mediaStatus === "requesting"} onClick={connect}>{mediaStatus === "requesting" ? "PREPARING YOUR CAMERA…" : "JOIN THE MEETING"}<span aria-hidden="true">→</span></Button>
                                    <p className="lobbyPrivacy">You can change your camera and microphone any time in the meeting.</p>
                                </div>
                            </section>
                        </main>
                    </div>

                    ) : (

                    <div className={styles.meetVideoContainer}>

                        <header className={styles.meetingHeader}>
                            <div className={styles.meetingInfo}><span className={styles.meetingMark}>✦</span><div><h1 className={styles.meetingHeaderTitle}>MeetNest room</h1><p className={styles.meetingHeaderMeta}>{window.location.pathname.slice(1)} · {totalParticipants} {totalParticipants === 1 ? "person" : "people"} here</p></div></div>
                            <div className={styles.meetingSecure}><span /> You’re connected</div>
                        </header>

                        {/* CHAT PANEL */}
                                                {/* CHAT PANEL */}
                        <div
                        className={`${styles.chatRoom} ${
                            showModal ? styles.chatOpen : styles.chatClosed
                        }`}
                        >
                        <div className={styles.chatContainer}>
                            <div className={styles.chatHeader}> <h1>Chat</h1> </div>

                            <div className={styles.chattingDisplay}>
                                {messages
                                .filter(item => item && typeof item.data === "string")
                                .map((item, index) => {
                                    const isMe = item.sender === username;
                                    const prev = messages[index - 1];
                                    const next = messages[index + 1];

                                    const isFirst =
                                    !prev || prev.sender !== item.sender;

                                    const isLast =
                                    !next || next.sender !== item.sender;

                                    return (
                                    <div
                                        key={index}
                                        className={`${styles.messageRow} ${
                                        isMe ? styles.me : styles.other
                                        }`}
                                    >
                                        {/* USER HEADER — ONLY ON FIRST MESSAGE */}
                                        {isFirst && (
                                        <div className={styles.senderBar}>
                                            <div className={styles.avatar}>
                                            {(item.sender[0] || "?").toUpperCase()}
                                            </div>
                                            <span className={styles.senderName}>
                                            {item.sender || "Unknown"}
                                            </span>
                                        </div>
                                        )}

                                        <div
                                        className={`${styles.messageBubble}
                                            ${isFirst ? styles.firstMsg : ""}
                                            ${!isLast ? styles.middleMsg : styles.lastMsg}
                                        `}
                                        >
                                        {item.data}
                                        </div>
                                    </div>
                                    );
                                })}
                                </div>



                            <div className={styles.chattingArea}>
                            <TextField
                                fullWidth
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                label="Type a message"
                                variant="outlined"
                            />
                            <Button variant="contained" onClick={sendMessage} disabled={!message.trim()}>
                                Send
                            </Button>
                            </div>
                        </div>
                        </div>


                        

                        {/* VIDEO GRID (ZOOM-LIKE) */}
                        <div
                            className={styles.conferenceView}
                            data-count={totalParticipants}
                        >

                            {/* YOUR VIDEO — PART OF GRID */}
                            <div className={styles.videoTile}>
                                <video
                                className={styles.meetUserVideo}
                                ref={localVideoref}
                                autoPlay
                                muted
                                />
                                <div className={styles.videoLabel}>You</div>
                            </div>

                            {/* REMOTE USERS */}
                            {videos.map((video) => (
                                <div key={video.socketId} className={styles.videoTile}>
                                <video
                                    ref={ref => {
                                    if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                    }
                                    }}
                                    autoPlay
                                />
                               <div className={styles.videoLabel}>
                                    <div className={styles.namePill}>
                                        <span className={styles.nameText}>{video.username}</span>

                                        <div className={styles.mediaIcons}>
                                            <span className={video.video ? styles.on : styles.off}>
                                                {video.video ? <VideocamIcon /> : <VideocamOffIcon />}
                                            </span>

                                            <span className={video.audio ? styles.on : styles.off}>
                                                {video.audio ? <MicIcon /> : <MicOffIcon />}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                </div>
                            ))}

                        </div>


                        {/* BOTTOM CONTROL BAR */}
                        <div className={styles.buttonContainers}>
                        <IconButton aria-label={video ? "Turn camera off" : "Turn camera on"} onClick={handleVideo} style={{ color: "white" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton aria-label="End call" onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>

                        <IconButton aria-label={audio ? "Mute microphone" : "Unmute microphone"} onClick={handleAudio} style={{ color: "white" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton aria-label={screen ? "Stop screen sharing" : "Share screen"} onClick={handleScreen} style={{ color: "white" }}>
                            {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="warning">
                            <IconButton
                            aria-label={showModal ? "Close chat" : "Open chat"}
                            onClick={() => showModal ? closeChat() : openChat()}
                            style={{ color: "white" }}
                            >
                            <ChatIcon />
                            </IconButton>
                        </Badge>
                        </div>

                    </div>

                    )}

                </div>
                );

}
