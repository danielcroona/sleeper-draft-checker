import React, { useState } from 'react';
import axios from 'axios';
import UserForm from './UserForm';
import DraftList from './DraftList';

function App() {
  const [userId, setUserId] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [isUserValid, setIsUserValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUserSubmit = async (username) => {
    setErrorMessage(''); // Återställ felmeddelande först
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/user/${username}`);
      if (response.data) {
        setUserId(response.data.user_id);
        setIsUserValid(true);
        fetchDrafts(response.data.user_id);
      } else {
        setErrorMessage(`No user found with username "${username}"`);
        setIsUserValid(false);
        setDrafts([]);
      }
    } catch (error) {
      setErrorMessage(`No user found with username "${username}"`);
      setIsUserValid(false);
      setDrafts([]);
    }
  };



  const formatMilliseconds = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    let formattedTime = "";

    if (hours > 0) {
      formattedTime += `${hours}h `;
    }

    if (minutes > 0) {
      formattedTime += `${minutes}min `;
    }

    if ((seconds > 0 && hours <= 0) || formattedTime === "") {
      formattedTime += `${seconds}s`;
    }

    return formattedTime.trim();
  };
  

  const fetchDrafts = async (userId) => {
    const year = new Date().getFullYear();
    try {
      const response = await axios.get(`https://api.sleeper.app/v1/user/${userId}/drafts/nfl/${year}`);
      const drafts = response.data;
  
      const updatedDrafts = await Promise.all(drafts.map(async draft => {
        if (draft.status !== 'drafting' && draft.status !== 'paused') {
          return null;
        }
  
        const draftResponse = await axios.get(`https://api.sleeper.app/v1/draft/${draft.draft_id}`);
        const draftOrder = draftResponse.data.draft_order;
  
        if (!draftOrder) {
          return null;
        }

        const picksResponse = await axios.get(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
        const picksMade = picksResponse.data.length;
        const currentPickNo = picksMade + 1;
        const totalTeams = Object.keys(draftOrder).length;
        const currentRound = Math.ceil(currentPickNo / totalTeams);
        const picksInCurrentRound = currentPickNo % totalTeams || totalTeams;
        const reversalRound = draftResponse.data.settings.reversal_round || 0;
        const pick_timer = draftResponse.data.settings.pick_timer || 120;
        
        let adjustedUserPosition;
  
        if (draftResponse.data.type === 'linear') {
          adjustedUserPosition = draftOrder[userId];
        } else if (draftResponse.data.type === 'snake') {
          if (reversalRound === 3) {
            // Hantera 3rd round reversal
            if (currentRound === 1) {
              adjustedUserPosition = draftOrder[userId];
            } else if (currentRound === 2 || currentRound === 3) {
              adjustedUserPosition = totalTeams + 1 - draftOrder[userId];
            } else if (currentRound >= 4 && currentRound % 2 === 0) {
              adjustedUserPosition = draftOrder[userId];
            } else if (currentRound >= 4 && currentRound % 2 === 1) {
              adjustedUserPosition = totalTeams + 1 - draftOrder[userId];
            }
          } else {
            // Hantera vanlig snake-draft
            if (currentRound % 2 === 1) {
              adjustedUserPosition = draftOrder[userId];
            } else {
              adjustedUserPosition = totalTeams + 1 - draftOrder[userId];
            }
          }
        } else {
          return null;
        }

        
  
        const currentPickPosition = picksInCurrentRound;
  
        // Kontrollera om det är användarens tur att välja
        const isMyTurn = adjustedUserPosition === currentPickPosition;
  
        let picksUntilMyTurn;
  
        if (isMyTurn) {
          picksUntilMyTurn = 0;
        } else if (picksInCurrentRound >= adjustedUserPosition) {
          // Användaren har redan valt i denna runda, räkna picks tills nästa runda
          const nextRoundPosition = currentRound % 2 === 1 ? (totalTeams + 1 - adjustedUserPosition) : adjustedUserPosition;
          picksUntilMyTurn = (totalTeams - picksInCurrentRound) + nextRoundPosition;
        } else {
          // Användaren har ännu inte valt i denna runda
          picksUntilMyTurn = adjustedUserPosition - currentPickPosition;
        }

        const currentClock = formatMilliseconds((pick_timer * 1000) - (Date.now() - draftResponse.data.last_picked));

        return {
          draft_id: draft.draft_id,
          metadata: draftResponse.data.metadata,
          draftType: draftResponse.data.type,
          status: draft.status,
          isMyTurn: isMyTurn,
          picksUntilMyTurn: picksUntilMyTurn,
          currentRound: currentRound,
          currentPickPosition: currentPickPosition,
          currentClock: currentClock,
        };
      }));
  
      const validDrafts = updatedDrafts.filter(draft => draft !== null);
      if (validDrafts.length === 0) {
        setErrorMessage('No active drafts were found');
        setDrafts([]);
      } else {
        const sortedDrafts = validDrafts.sort((a, b) => a.isMyTurn ? -1 : b.isMyTurn ? 1 : a.picksUntilMyTurn - b.picksUntilMyTurn);
        setDrafts(sortedDrafts);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error fetching drafts', error);
      setErrorMessage('An error occurred while fetching drafts.');
      setDrafts([]);
    }
  };
  
    
  
  
  

  const handleRefresh = () => {
    if (userId) {
      fetchDrafts(userId);
      setRefreshDisabled(true);
      setTimeout(() => setRefreshDisabled(false), 10 * 60 * 1000); // 10 minuter
    }
  };

  return (
    <div className="App container">
      <h1>Sleeper Draft Checker</h1>
      {!isUserValid && (
        <UserForm onSubmit={handleUserSubmit} />
      )}
      {isUserValid && (
        <button onClick={handleRefresh} disabled={refreshDisabled} className="btn btn-success mt-3">
          Refresh Drafts
        </button>
      )}
      {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
      {isUserValid && <DraftList drafts={drafts} />}
    </div>
  );
  
}

export default App;
