import axios from "axios";
import httpStatus from "http-status";
import { createContext, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import server from "../utils/environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})


export const AuthProvider = ({ children }) => {
    const router = useNavigate();

    const handleRegister = useCallback(async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })


            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }, []);

    const handleLogin = useCallback(async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home")
            }
        } catch (err) {
            throw err;
        }
    }, [router]);

    const handleGoogleLogin = useCallback((token) => {
        localStorage.setItem("token", token);
        router("/home", { replace: true });
    }, [router]);

    const getHistoryOfUser = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            let request = await client.get("/history", {
                headers: {
                    Authorization: token
                }
            });

            return request.data;
        } catch (err) {
            console.error("Error fetching history:", err);
            return { meetings: [] };
        }
    }, []);



    const addToUserHistory = useCallback(async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }, []);


    const data = useMemo(() => ({
        addToUserHistory, getHistoryOfUser, handleRegister, handleLogin, handleGoogleLogin
    }), [addToUserHistory, getHistoryOfUser, handleRegister, handleLogin, handleGoogleLogin]);

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}
