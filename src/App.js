import React, { useState, useEffect } from "react";
import Slider from "./component/slider";
import PlayersAdmin from "./pages/PlayersAdmin";
import AuctionManager from "./pages/AuctionManager";
import AuctionPlayersManager from "./pages/AuctionPlayersManager";
import AuctionTeams from "./pages/AuctionTeams";
import AuctionOverview from "./pages/AuctionOverview";
import "./App.css";

const App = () => {
  const [page, setPage] = useState('slider');
  const [auctionId, setAuctionId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const [pageName, queryString] = hash.split('?');

      setPage(pageName || 'slider');

      if (queryString) {
        const params = new URLSearchParams(queryString);
        const id = params.get('auctionId');
        if (id) {
          setAuctionId(id);
          localStorage.setItem('activeAuctionId', id);
        }
      } else if (['auction-players', 'auction-teams', 'auction-overview'].includes(pageName)) {
        const stored = localStorage.getItem('activeAuctionId');
        if (stored) setAuctionId(stored);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div>
      {page === 'admin' && <PlayersAdmin />}
      {page === 'auction-manager' && <AuctionManager />}
      {page === 'auction-players' && <AuctionPlayersManager auctionId={auctionId} />}
      {page === 'auction-teams' && <AuctionTeams auctionId={auctionId} />}
      {page === 'auction-overview' && <AuctionOverview auctionId={auctionId} />}
      {(page === 'slider' || page === '') && <Slider />}
    </div>
  );
};

export default App;
