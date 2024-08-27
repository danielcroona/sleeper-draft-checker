import React from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';

function DraftList({ drafts }) {
  if (drafts.length === 0) {
    return null;  // Ingen lista visas om det inte finns några drafter
  }

  return (
    <ListGroup>
      {drafts.map(draft => (
        <ListGroupItem key={draft.draft_id} className="mb-3">
          <h5>
            <a href={`https://sleeper.com/draft/nfl/${draft.draft_id}`} target="_blank" rel="noopener noreferrer">
              {draft.metadata.name}
            </a> ({draft.metadata.scoring_type}, {draft.draftType}, {draft.status})
          </h5>
          <p>
            <strong>Round: </strong> {draft.currentRound} <br />
            <strong>Currrently Picking: </strong> {draft.currentPickPosition} <br />
            {draft.isMyTurn ? (
              <strong className="text-success">Your turn to pick!</strong>
            ) : (
              <span>
                <strong>Picks until your turn: </strong>{draft.picksUntilMyTurn}
              </span>
            )}
          </p>
        </ListGroupItem>
      ))}
    </ListGroup>
  );
}

export default DraftList;
