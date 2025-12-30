import React, { useContext, useEffect, useRef, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, TextField } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [canScroll, setCanScroll] = useState(false);

    const joinSectionRef = useRef(null);

    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    /* 🔒 LOCK SCROLL UNTIL JOIN CLICKED */
    useEffect(() => {
        document.body.style.overflow = canScroll ? "auto" : "hidden";
        return () => document.body.style.overflow = "auto";
    }, [canScroll]);

    const handleJoinClick = () => {
        setCanScroll(true);
        setTimeout(() => {
            joinSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    /* 🕒 TIME & DATE */
    const now = new Date();
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
                <div className="navHeader">
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
                    <p className="active">Home</p>
                    <p onClick={handleJoinClick}>Join Meeting</p>
                    <p onClick={() => navigate("/history")}>History</p>
                </aside>

                {/* MAIN CONTENT */}
                <main className="homeMain">

                    {/* TIME / DATE CARD */}
                    <div className="timeCard">
                        <h1>{time}</h1>
                        <p className="date">{date}</p>
                    </div>

                    {/* ACTION BOXES */}
                    <div className="actionGrid">
                    <div className="actionCard join animate-in" onClick={handleJoinClick}>
                        <div className="icon">📹</div>
                        <h3>Join Meeting</h3>
                        <p>Enter a code and join instantly</p>
                    </div>

                    <div
                        className="actionCard history animate-in"
                        onClick={() => navigate("/history")}
                    >
                        <div className="icon">▶</div>
                        <h3>View History</h3>
                        <p>Check out your recent meetings</p>
                    </div>
                    </div>
                                        


        

                    {/* JOIN SECTION (HIDDEN BELOW) */}
                   <div ref={joinSectionRef} className="joinSection">
                        <div className="joinCard">

                            <div className="joinLeft">
                            <h2>Join a meeting</h2>
                            <p className="subtitle">
                                Enter a code and join instantly
                            </p>
                            

                            <div className="joinBox">
                                <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                label="Meeting Code"
                                variant="outlined"
                                fullWidth
                                />
                                <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                >
                                Join
                                </Button>
                            </div>

                            </div>
                            


                        </div>
                    </div>


                </main>
            </div>
        </div>
    )
}

export default withAuth(HomeComponent)
