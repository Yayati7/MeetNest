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



const server_url = server;


var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    const { addToUserHistory } = useContext(AuthContext);


    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    }, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            // create media stream ONCE with both tracks
            const userMediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            window.localStream = userMediaStream;

            if (localVideoref.current) {
                localVideoref.current.srcObject = userMediaStream;
            }

        } catch (error) {
            console.log(error);
        }
    };

    // useEffect(() => {
    //     if (video !== undefined && audio !== undefined) {
    //         getUserMedia();
    //         console.log("SET STATE HAS ", video, audio);

    //     }


    // }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    // let getUserMedia = () => {
    //     if ((video && videoAvailable) || (audio && audioAvailable)) {
    //         navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
    //             .then(getUserMediaSuccess)
    //             .then((stream) => { })
    //             .catch((e) => console.log(e))
    //     } else {
    //         try {
    //             let tracks = localVideoref.current.srcObject.getTracks()
    //             tracks.forEach(track => track.stop())
    //         } catch (e) { }
    //     }
    // }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            // restore camera stream after screen share ends
            if (localVideoref.current && window.localStream) {
                localVideoref.current.srcObject = window.localStream;
            }


        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




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

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
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

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
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


    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {

     // ✅ ADD THIS (save meeting to history)
        try {
            addToUserHistory(
                window.location.pathname.split("/").pop()
            );
        } catch (e) {}

        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }

        const token = localStorage.getItem("token");
        if (token) {
            window.location.href = "/home"
        } else {
            window.location.href = "/"
        }
    }


    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    };
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
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
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setMessages([]);
        setNewMessages(0);
        setAskForUsername(false);
        getMedia();
    };


    const totalParticipants = videos.length + 1; // you + others

    return (
                <div>

                    {askForUsername === true ? (

                    <div className="lobbyRoot">

                        <h1 className="lobbyTitle">Enter into Lobby</h1>

                        <div className="lobbyCard">

                        {/* VIDEO PREVIEW */}
                        <div className="previewBox">
                            <video
                            ref={localVideoref}
                            autoPlay
                            muted
                            playsInline
                            />
                        </div>

                        {/* USERNAME INPUT */}
                        <TextField
                            fullWidth
                            label="Username"
                            variant="outlined"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        {/* CONNECT BUTTON */}
                        <Button
                            className="connectBtn"
                            variant="contained"
                            onClick={connect}
                        >
                            CONNECT
                        </Button>

                        </div>

                    </div>

                    ) : (

                    <div className={styles.meetVideoContainer}>

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
                            <Button variant="contained" onClick={sendMessage}>
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
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                            {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="orange">
                            <IconButton
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