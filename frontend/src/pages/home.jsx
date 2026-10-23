import React, { useEffect, useRef, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, TextField } from '@mui/material';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [now, setNow] = useState(() => new Date());

    const joinSectionRef = useRef(null);

    const handleJoinVideoCall = async (event) => {
        event.preventDefault();
        const code = meetingCode.trim();
        if (!code) return;
        navigate(`/${encodeURIComponent(code)}`);
    };

    const handleJoinClick = () => {
        joinSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    /* 🕒 TIME & DATE */
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="homeRoot">

            {/* TOP NAVBAR */}
            <header className="homeNav">
                <div className="navHeader" onClick={() => navigate("/home")}>
                    <img
                        src="/meetnest-icon.png"
                        alt="MeetNest logo"
                        className="navIcon"
                    />
                    <h2>MeetNest</h2>
                </div>

                <Button
                    onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/")
                    }}
                >
                    Sign Out
                </Button>
            </header>


            <div className="homeLayout">

                {/* SIDEBAR */}
                <aside className="homeSidebar">
                    <button type="button" className="active" aria-current="page" onClick={() => navigate("/home")}>Home</button>
                    <button type="button" onClick={handleJoinClick}>Join Meeting</button>
                    <button type="button" onClick={() => navigate("/history")}>History</button>
                </aside>

                {/* MAIN CONTENT */}
                <main className="homeMain">

                    <div className="homeWelcome">
                        <span className="eyebrow">MAKE ROOM FOR A GOOD CONVERSATION</span>
                        <h1>Your next great<br className="welcomeBreak" /> conversation starts here.</h1>
                    </div>

                    {/* TIME / DATE CARD */}
                    <div className="timeCard">
                        <span className="timeEyebrow">YOUR LOCAL TIME</span>
                        <h1>{time}</h1>
                        <p className="date">{date}</p>
                    </div>

                    {/* ACTION BOXES */}
                    <div className="actionGrid">
                    <button type="button" className="actionCard join animate-in" onClick={handleJoinClick}>
                        <div className="icon">📹</div>
                        <h3>Join Meeting</h3>
                        <p>Enter a code and join instantly</p>
                    </button>

                    <button type="button"
                        className="actionCard history animate-in"
                        onClick={() => navigate("/history")}
                    >
                        <div className="icon">▶</div>
                        <h3>View History</h3>
                        <p>Check out your recent meetings</p>
                    </button>
                    </div>
                                        


        

                    {/* JOIN SECTION (HIDDEN BELOW) */}
                   <div ref={joinSectionRef} className="joinSection">
                        <div className="joinCard">

                            <div className="joinLeft">
                            <h2>Join a meeting</h2>
                            <p className="subtitle">
                                Enter a code and join instantly
                            </p>
                            

                            <form className="joinBox" onSubmit={handleJoinVideoCall}>
                                <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                value={meetingCode}
                                label="Meeting Code"
                                variant="outlined"
                                fullWidth
                                required
                                inputProps={{ "aria-label": "Meeting code" }}
                                />
                                <Button
                                variant="contained"
                                type="submit"
                                >
                                Join
                                </Button>
                            </form>

                            </div>
                            


                        </div>
                    </div>


                </main>
            </div>
        </div>
    )
}

export default withAuth(HomeComponent)
