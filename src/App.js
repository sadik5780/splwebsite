import React, { useState, useEffect } from "react";
import Slider from "./component/slider";
import PlayersAdmin from "./pages/PlayersAdmin";
import AuctionManager from "./pages/AuctionManager";
import AuctionPlayersManager from "./pages/AuctionPlayersManager";
import "./App.css";

const App = () => {
  const [page, setPage] = useState('slider');
  const [auctionId, setAuctionId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      const [pageName, queryString] = hash.split('?');

      setPage(pageName || 'slider');

      // Parse query params
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const id = params.get('auctionId');
        if (id) {
          setAuctionId(id);
          localStorage.setItem('activeAuctionId', id);
        }
      } else if (pageName === 'auction-players') {
        // Try to restore from localStorage if no query param
        const stored = localStorage.getItem('activeAuctionId');
        if (stored) setAuctionId(stored);
      }
    };

    handleHashChange(); // Initial load
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div>
      {page === 'admin' && <PlayersAdmin />}
      {page === 'auction-manager' && <AuctionManager />}
      {page === 'auction-players' && <AuctionPlayersManager auctionId={auctionId} />}
      {(page === 'slider' || page === '') && <Slider />}
    </div>
  );
};

export default App;
