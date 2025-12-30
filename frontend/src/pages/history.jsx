import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import "../App.css";

import HomeIcon from '@mui/icons-material/Home'
import { IconButton } from '@mui/material'

export default function History() {

  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        console.log("HISTORY RESPONSE:", history);
        setMeetings(history?.meetings || history || []);
      } catch {
        setMeetings([]);
      }
    };
    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="historyRoot">

      {/* TOP BAR */}
        <header className="historyNav">
        <div
            className="historyBack"
            onClick={() => routeTo("/home")}
        >
            <HomeIcon />
            <span>Back to Home</span>
        </div>

        <h2 className="historyTitle">Meeting History</h2>
        </header>


      {/* CONTENT */}
      <div className="historyContent">

        {meetings.length !== 0 ? (
          meetings.map((e, i) => (
            <div className="historyCard" key={i}>
              <p className="historyCode">
                Code: <span>{e.meetingCode}</span>
              </p>
              <p className="historyDate">
                Date: {formatDate(e.date)}
              </p>
            </div>
          ))
        ) : (
          <div className="historyEmpty">
            <p>No meetings yet</p>
            <span>Your past meetings will appear here</span>
          </div>
        )}

      </div>
    </div>
  )
}
