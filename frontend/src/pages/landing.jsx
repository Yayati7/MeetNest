import React, { useState } from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {

    const router = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <div className='landingPageContainer'>

            <nav>
                <div className='navHeader'>
                    <img
                        onClick={() => router("/")}
                        src="/meetnest-icon.png"
                        alt="MeetNest logo"
                        className="navIcon"
                    />
                    <h2 onClick={() => router("/")}>MeetNest</h2>
                </div>

                {/* DESKTOP NAV */}
                <div className='navlist desktopNav'>
                    <p role="button" onClick={() => router("/aljk23")}>Join as Guest</p>
                    <p role="button" onClick={() => router("/auth?mode=signup")}>Register</p>
                    <div role='button' onClick={() => router("/auth")}>
                        <p>Login</p>
                    </div>
                </div>

                {/* MOBILE HAMBURGER */}
                <div className="hamburger" onClick={() => setOpen(true)}>
                    ☰
                </div>

                {/* MOBILE SIDEBAR */}
                <div className={`mobileSidebar ${open ? "open" : ""}`}>
                    <span className="closeBtn" onClick={() => setOpen(false)}>✕</span>

                    <p onClick={() => { router("/aljk23"); setOpen(false); }}>
                        Join as Guest
                    </p>

                    <p onClick={() => { router("/auth?mode=signup"); setOpen(false); }}>
                        Register
                    </p>

                    <p onClick={() => { router("/auth"); setOpen(false); }}>
                        Login
                    </p>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1>
                        <span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones
                    </h1>

                    <p>Your space for seamless video conversations</p>

                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>

                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>

        </div>
    )
}
