import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Canvasanimation from "./CanvasAnimation";
import playersData from "./playersData.json"; 

const Slider = () => {
  const [players, setPlayers] = useState(playersData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("")
  

  // Create an Audio instance for the main.mp3 sound
  const audio = new Audio("/images/main.mp3"); 

  const handleSold = (id) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === id
          ? { ...player, sold: true, gifPlayed: true }
          : player
      )
    );
  
    // Save sold status to local storage
    localStorage.setItem(`player-${id}-sold`, true);
  
    // Play the audio when "MARK SOLD" is clicked
    audio.play();
  
    setTimeout(() => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, gifPlayed: false } : player
        )
      );
  
      // Save updated sold status to local storage
      localStorage.setItem(`player-${id}-sold`, true);
    }, 2000);
  };
  
  const handleNotSold = (id) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === id ? { ...player, sold: false, gifPlayed: false } : player
      )
    );
  
    // Save unsold status to local storage
    localStorage.setItem(`player-${id}-sold`, false);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === players.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? players.length - 1 : prevIndex - 1
    );
  };

  // const currentPlayer = players[currentIndex];
  

  const imageVariants = {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0, transition: { duration: 1 } },
    exit: { opacity: 0, x: -100, transition: { duration: 1 } },
  };

  const textVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0, transition: { duration: .5 } },
    exit: { opacity: 0, x: 100, transition: { duration: .5 } },
  };
  const maxId = Math.max(...players.map(player => player.id));
const filteredPlayers = players.filter((player) =>
  searchQuery ? player.id.toString() === searchQuery.toString() : true
);
if (searchQuery && Number(searchQuery) > maxId) {
  filteredPlayers = [];
}
const currentPlayer = filteredPlayers[currentIndex];

  // const currentPlayer = filteredPlayers[currentIndex];

  return (
    <div
      className="slider-container"
      style={{ backgroundImage: `url("/images/bg.png")` }}
    >
      <Canvasanimation />
      {/* Constant Header */}
      <div className="header-section">
        <img src="/images/SPLlogo.png" alt="SPL Logo" className="spl-logo" />
        <h1>
          <span style={{ fontWeight: "bold", color: "yellow", margin:'0 10px 0' }}>IMRAN KHANSAHAB</span>{" "}
          PRESENTS &nbsp; <span className="spl">SPL SEASON-8</span>
        </h1>
      </div>
      <div className="search-container">
  <input
    type="text"
    placeholder="Search players..."
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>

      <div className="constant-text text-center">
        <span>Presented by</span> <br /> SPL
      </div>
      <div className="constant-text2">
        <span>Developed by - </span>Orient Software Solutions, 77 0909 5899 (Sadik Sir)
      </div>

      <AnimatePresence mode="wait">
  {currentPlayer ? (
    <motion.div
      key={currentPlayer.id}
      className="slider-content"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={textVariants}
    >
      {currentPlayer && currentPlayer.type === "label" ? (
        <motion.h1
          key={currentPlayer.id}
          className="category-label"
          // variants={textVariants}
        >
          {currentPlayer.label}
        </motion.h1>
      ) : (
        <>
          {/* Player Image */}
          <AnimatePresence mode="wait">
            <motion.div
              className="player-image"
              key={`${currentPlayer.id}-image`}
              // variants={imageVariants}
            >
              <div className="player-image-wrapper">
                <img
                  src={currentPlayer.image}
                  alt={currentPlayer.name}
                  className={currentPlayer.sold ? "sold-overlay" : ""}
                />
                {currentPlayer.sold && currentPlayer.gifPlayed && (
                  <img
                    src="/images/congratulations-7600.gif"
                    alt="Congratulations"
                    className="gif-overlay"
                  />
                )}
                {currentPlayer.sold && !currentPlayer.gifPlayed && (
                  <img
                    src="/images/Stamp-01.png"
                    alt="Stamp"
                    className="stamp-overlay"
                  />
                )}
                {currentPlayer.sold && currentPlayer.gifPlayed && (
                  <img
                    src="/images/Stamp.gif"
                    alt="Stamp Animation"
                    className="gif-overlay"
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Player Info */}
          <AnimatePresence mode="wait">
            <motion.div
              className="player-info"
              key={`${currentPlayer.id}-info`}
              // variants={textVariants}
            >
              <h2>
                Name : <br /> <span> {currentPlayer.name} </span>
              </h2>
              <div className="desc_text">
                <div className="splty">
                  <h3>
                    Speciality <br />{" "}
                    <span> {currentPlayer.speciality} </span>
                  </h3>
                </div>
                <div className="age">
                  <h3>
                    Age <br /> <span> {currentPlayer.age}</span>
                  </h3>
                </div>
              </div>
              <div className="button-group">
                <button
                  onClick={() => handleSold(currentPlayer.id)}
                  disabled={currentPlayer.sold}
                  style={{
                    backgroundColor: currentPlayer.sold ? "gray" : "green",
                  }}
                >
                  {currentPlayer.sold ? "SOLD" : "MARK SOLD"}
                </button>
                <button
                  onClick={() => handleNotSold(currentPlayer.id)}
                  style={{
                    backgroundColor: currentPlayer.sold ? "red" : "gray",
                  }}
                  disabled={!currentPlayer.sold}
                >
                  NOT SOLD
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.div>
  ) : (
    <div className="player-not-found">
      <h2>Player not found</h2>
      <p>Please try again with a different ID.</p>
    </div>
  )}
</AnimatePresence>

      <div className="navigation">
        <button onClick={prevSlide} 
        // disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button onClick={nextSlide}>Next</button>
      </div>
    </div>
  );
};

export default Slider;
