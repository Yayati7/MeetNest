import React, { useContext, useEffect, useState } from 'react'
import withAuth from '../utils/withAuth'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import "../App.css";

import HomeIcon from '@mui/icons-material/Home'

function History() {

  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history?.meetings || history || []);
      } catch {
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [getHistoryOfUser]);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="historyRoot">

      {/* TOP BAR */}
        <header className="historyNav">
        <button type="button"
            className="historyBack"
            onClick={() => routeTo("/home")}
        >
            <HomeIcon />
            <span>Back to Home</span>
        </button>

        <h2 className="historyTitle">Meeting History</h2>
        </header>


      {/* CONTENT */}
      <div className="historyContent">

        {loading ? (
          <div className="historyEmpty"><p>Loading your meetings…</p></div>
        ) : meetings.length !== 0 ? (
            meetings.map((e, i) => (
            <div className="historyCard" key={e._id || `${e.meetingCode}-${e.date}-${i}`}>
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

export default withAuth(History)
