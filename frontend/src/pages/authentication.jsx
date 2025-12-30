import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { useSearchParams, useNavigate } from "react-router-dom";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0b0b0b",
      paper: "#111",
    },
    primary: {
      main: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
  }
});

export default function Authentication() {
  const router = useNavigate();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const [searchParams] = useSearchParams();
  const initialFormState = searchParams.get("mode") === "signup" ? 1 : 0;
  const [formState, setFormState] = React.useState(initialFormState);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setFormState(0);
        setUsername("");
        setPassword("");
        setName("");
        setError("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Grid container component="main" sx={{ height: '100vh', position: "relative" }}>
        <CssBaseline />

        {/* HEADER (matches landing) */}
        <nav className="authNav">
  <div className="navHeader" onClick={() => router("/")}>
    <img
      src="/meetnest-icon.png"
      alt="MeetNest logo"
      className="navIcon"
    />
    <h2>MeetNest</h2>
  </div>
</nav>


        {/* BACKGROUND */}
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)),
              url('/bg-dark.jpg')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* AUTH PANEL */}
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={0}
          square
          sx={{
            position: "absolute",
            right: 0,
            height: "100vh",
            background: "rgba(15,15,15,0.95)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            animation: "authEnter 0.8s ease forwards",
          }}
        >
          <Box
            sx={{
              my: 10,
              mx: 5,
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Avatar sx={{ mb: 2, bgcolor: "transparent", border: "1px solid #555" }}>
              <LockOutlinedIcon />
            </Avatar>

            <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
              {formState === 0 ? "Welcome back" : "Create your account"}
            </Typography>

            <Typography sx={{ color: "#aaa", mb: 4 }}>
              {formState === 0
                ? "Sign in to continue to MeetNest"
                : "Join MeetNest in just a few steps"}
            </Typography>

            {/* TOGGLE */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Button
                variant={formState === 0 ? "contained" : "outlined"}
                onClick={() => setFormState(0)}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : "outlined"}
                onClick={() => setFormState(1)}
              >
                Sign Up
              </Button>
            </Box>

            {/* FORM */}
            <Box sx={{ width: "100%" }}>
              {formState === 1 && (
                <TextField
                  fullWidth
                  label="Full Name"
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <TextField
                fullWidth
                label="Username"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <Typography sx={{ color: "#ff6b6b", mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 4, py: 1.2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={4000} message={message} />
    </ThemeProvider>
  );
}
