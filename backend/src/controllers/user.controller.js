import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import { Meeting } from "../models/meeting.model.js";

import crypto from "crypto"


const login = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" })
    }

    try {
        const user = await User.findOne({ username }).select("+password +token");
        if (!user || !user.password) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }


        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` })
    }
}


const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    if (!name?.trim() || !username?.trim() || !password || password.length < 6) {
      return res.status(400).json({ message: "Name, username, and a password of at least 6 characters are required." });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name: name.trim(),
        username: username,
        password: hashedPassword
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User Registered" })

  } catch(e) {
    res.status(500).json({ message: "Unable to register right now." })
  }

};

const getUserHistory = async (req, res) => {
    //const { token } = req.query;
    const token = req.headers.authorization;

    try {
        const user = await User.findOne({ token }).select("+token");
        if (!user) return res.json([]);

        const meetings = await Meeting.find({ user_id: user.username });
        res.json({meetings});
    } catch (e) {
        res.json([]);
    }
};


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token }).select("+token");
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const alreadyRecorded = await Meeting.exists({ user_id: user.username, meetingCode: meeting_code });
        if (alreadyRecorded) return res.status(httpStatus.OK).json({ message: "Meeting already recorded" });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        res.json({ message: "Error saving history" });
    }
};

const googleStart = (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${frontendUrl}/auth?error=google_not_configured`);
    }

    const state = crypto.randomBytes(32).toString("hex");
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/v1/users/google/callback`;
    res.cookie("google_oauth_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 5 * 60 * 1000,
        path: "/api/v1/users/google/callback"
    });

    const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account"
    }).toString();
    return res.redirect(authorizeUrl.toString());
};

const googleCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const fail = (reason = "google_failed") => res.redirect(`${frontendUrl}/auth?error=${reason}`);
    const cookieState = req.headers.cookie?.split(";")
        .map(part => part.trim())
        .find(part => part.startsWith("google_oauth_state="))
        ?.slice("google_oauth_state=".length);
    res.clearCookie("google_oauth_state", { path: "/api/v1/users/google/callback" });

    if (!req.query.code || !req.query.state || !cookieState || req.query.state !== decodeURIComponent(cookieState)) {
        return fail("google_state_invalid");
    }

    try {
        const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/v1/users/google/callback`;
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: req.query.code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: "authorization_code"
            })
        });
        if (!tokenResponse.ok) return fail();
        const googleTokens = await tokenResponse.json();
        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${googleTokens.access_token}` }
        });
        if (!profileResponse.ok) return fail();
        const profile = await profileResponse.json();
        if (!profile.email || profile.email_verified !== true) return fail("google_email_unverified");

        let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email }, { username: profile.email }] });
        if (!user) {
            user = new User({ username: profile.email, email: profile.email, name: profile.name || profile.email, googleId: profile.sub });
        } else {
            user.email ||= profile.email;
            user.name ||= profile.name || profile.email;
            user.googleId ||= profile.sub;
        }
        const token = crypto.randomBytes(32).toString("hex");
        user.token = token;
        await user.save();
        return res.redirect(`${frontendUrl}/auth#token=${encodeURIComponent(token)}`);
    } catch (error) {
        console.error("Google sign-in failed:", error.message);
        return fail();
    }
};



export { login, register, getUserHistory, addToHistory, googleStart, googleCallback }
