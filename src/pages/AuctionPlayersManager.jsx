import React, { useState, useEffect } from 'react';
import {
    getAuctionPlayers,
    addPlayerToAuction,
    removePlayerFromAuction,
    updateAuctionPlayerPosition,
    togglePlayerReserved,
    fetchAllAuctions,
    setPlayerAsCurrent,
    softRemovePlayer,
} from '../services/auctionService';
import { fetchAllPlayers } from '../services/playersService';
import '../styles/AuctionPlayersManager.css';
import '../styles/AuctionPlayersSearch.css';
import '../styles/AuctionCurrentPlayer.css';

const AuctionPlayersManager = ({ auctionId: propAuctionId }) => {
    // Use prop first, then hash, then localStorage
    const hash = window.location.hash.slice(1);
    const searchParams = hash.includes('?') ? hash.split('?')[1] : '';
    const hashAuctionId = new URLSearchParams(searchParams).get('auctionId');
    const storedAuctionId = localStorage.getItem('activeAuctionId');

    const auctionId = propAuctionId || hashAuctionId || storedAuctionId;

    const [auction, setAuction] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [auctionPlayers, setAuctionPlayers] = useState([]);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('Under 16');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (auctionId) {
            loadData();
        }
    }, [auctionId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load auction details
            const auctions = await fetchAllAuctions();
            const currentAuction = auctions.find(a => a.id === auctionId);
            setAuction(currentAuction);

            // Load all players
            const players = await fetchAllPlayers();
            setAllPlayers(players);

            // Load auction players
            const apPlayers = await getAuctionPlayers(auctionId);
            setAuctionPlayers(apPlayers);

            setError(null);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlayer = async (playerId) => {
        try {
            setLoading(true);
            await addPlayerToAuction(auctionId, playerId, selectedAgeGroup);
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to add player: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove player from auction?')) return;

        try {
            setLoading(true);
            await removePlayerFromAuction(auctionId, playerId);
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to remove player: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveUp = async (ageGroup, currentPosition) => {
        if (currentPosition === 1) return; // Already at top

        try {
            setLoading(true);

            // Find players in this age group
            const playersInGroup = auctionPlayers.filter(ap => ap.age_group === ageGroup);
            const currentPlayer = playersInGroup.find(p => p.position_number === currentPosition);
            const abovePlayer = playersInGroup.find(p => p.position_number === currentPosition - 1);

            if (currentPlayer && abovePlayer) {
                // Three-step swap to avoid unique constraint violation
                // Step 1: Move current to temporary position
                await updateAuctionPlayerPosition(auctionId, currentPlayer.player_id, -999);
                // Step 2: Move above player down
                await updateAuctionPlayerPosition(auctionId, abovePlayer.player_id, currentPosition);
                // Step 3: Move current player up
                await updateAuctionPlayerPosition(auctionId, currentPlayer.player_id, currentPosition - 1);
            }

            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to move player: ' + err.message);
            await loadData(); // Reload to reset any partial changes
        } finally {
            setLoading(false);
        }
    };

    const handleMoveDown = async (ageGroup, currentPosition) => {
        try {
            setLoading(true);

            // Find players in this age group
            const playersInGroup = auctionPlayers.filter(ap => ap.age_group === ageGroup);
            const maxPosition = Math.max(...playersInGroup.map(p => p.position_number));

            if (currentPosition === maxPosition) return; // Already at bottom

            const currentPlayer = playersInGroup.find(p => p.position_number === currentPosition);
            const belowPlayer = playersInGroup.find(p => p.position_number === currentPosition + 1);

            if (currentPlayer && belowPlayer) {
                // Three-step swap to avoid unique constraint violation
                // Step 1: Move current to temporary position
                await updateAuctionPlayerPosition(auctionId, currentPlayer.player_id, -999);
                // Step 2: Move below player up
                await updateAuctionPlayerPosition(auctionId, belowPlayer.player_id, currentPosition);
                // Step 3: Move current player down
                await updateAuctionPlayerPosition(auctionId, currentPlayer.player_id, currentPosition + 1);
            }

            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to move player: ' + err.message);
            await loadData(); // Reload to reset any partial changes
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReserved = async (playerId, currentStatus) => {
        try {
            setLoading(true);
            await togglePlayerReserved(auctionId, playerId, !currentStatus);
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to toggle reserved: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetCurrent = async (playerId) => {
        try {
            setLoading(true);
            await setPlayerAsCurrent(auctionId, playerId);
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to set current player: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSoftRemove = async (playerId) => {
        if (!window.confirm('Soft remove this player? (Can be restored later)')) return;

        try {
            setLoading(true);
            await softRemovePlayer(auctionId, playerId, true);
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to soft remove player: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAvailablePlayers = () => {
        const auctionPlayerIds = auctionPlayers.map(ap => ap.player_id);
        let available = allPlayers.filter(p => !auctionPlayerIds.includes(p.id));

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            available = available.filter(p =>
                p.full_name?.toLowerCase().includes(query) ||
                p.role?.toLowerCase().includes(query) ||
                p.mobile?.includes(query)
            );
        }

        return available;
    };

    const getPlayersByAgeGroup = (ageGroup) => {
        return auctionPlayers
            .filter(ap => ap.age_group === ageGroup)
            .sort((a, b) => a.position_number - b.position_number);
    };

    if (!auctionId) {
        return (
            <div className="auction-players-container">
                <div className="auction-players-header">
                    <h1>Manage Auction Players</h1>
                </div>
                <div className="error-message">
                    <strong>No auction selected</strong>
                    <p>Please select an auction from the <a href="#auction-manager">Auction Manager</a></p>
                </div>
            </div>
        );
    }

    return (
        <div className="auction-players-container">
            <div className="auction-players-header">
                <div>
                    <h1>Manage Auction Players</h1>
                    {auction && (
                        <p className="auction-name">
                            {auction.auction_name} - {auction.auction_season}
                        </p>
                    )}
                </div>
                <div className="header-actions">
                    <a href="#auction-manager" className="btn-secondary">← Back to Auctions</a>
                    <a href="#slider" className="btn-secondary">View Slider</a>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="loading">Loading...</div>}

            <div className="players-manager-layout">
                {/* Available Players Panel */}
                <div className="available-players-panel">
                    <h2>Available Players</h2>

                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by name, role, or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="clear-search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="age-group-selector">
                        <label>Add to Age Group:</label>
                        <select
                            value={selectedAgeGroup}
                            onChange={(e) => setSelectedAgeGroup(e.target.value)}
                        >
                            <option value="Under 16">Under 16</option>
                            <option value="Under 19">Under 19</option>
                            <option value="Open">Open</option>
                        </select>
                    </div>

                    <div className="players-list">
                        {getAvailablePlayers().map(player => (
                            <div key={player.id} className="player-item">
                                <div className="player-info">
                                    <img
                                        src={player.photo_url}
                                        alt={player.full_name}
                                        className="player-thumb"
                                        onError={(e) => { e.target.src = '/fallback-player.png'; }}
                                    />
                                    <div>
                                        <div className="player-name">{player.full_name}</div>
                                        <div className="player-role">{player.role} • {player.age_group}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddPlayer(player.id)}
                                    className="btn-add"
                                    disabled={loading}
                                >
                                    + Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Auction Players Panel */}
                <div className="auction-players-panel">
                    <h2>Auction Players</h2>

                    <div className="age-groups-tabs">
                        {['Under 16', 'Under 19', 'Open'].map(ageGroup => {
                            const players = getPlayersByAgeGroup(ageGroup);
                            return (
                                <div key={ageGroup} className="age-group-section">
                                    <h3>{ageGroup} ({players.length})</h3>

                                    {players.length === 0 ? (
                                        <div className="no-players">No players in this age group</div>
                                    ) : (
                                        <div className="auction-players-list">
                                            {players.map((ap, index) => (
                                                <div
                                                    key={ap.id}
                                                    className={`auction-player-item ${ap.is_reserved ? 'reserved' : ''} ${ap.is_current ? 'current' : ''}`}
                                                >
                                                    <div className="position-controls">
                                                        <div className="position-display">#{ap.position_number}</div>
                                                        <div className="position-arrows">
                                                            <button
                                                                onClick={() => handleMoveUp(ageGroup, ap.position_number)}
                                                                disabled={loading || index === 0 || auction?.is_locked}
                                                                className="arrow-btn"
                                                                title="Move up"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveDown(ageGroup, ap.position_number)}
                                                                disabled={loading || index === players.length - 1 || auction?.is_locked}
                                                                className="arrow-btn"
                                                                title="Move down"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="player-info">
                                                        <img
                                                            src={ap.players.photo_url}
                                                            alt={ap.players.full_name}
                                                            className="player-thumb"
                                                            onError={(e) => { e.target.src = '/fallback-player.png'; }}
                                                        />
                                                        <div>
                                                            <div className="player-name">
                                                                {ap.players.full_name}
                                                                {ap.is_current && <span className="current-badge">▶ NOW</span>}
                                                            </div>
                                                            <div className="player-role">{ap.players.role}</div>
                                                        </div>
                                                    </div>

                                                    <div className="player-actions">
                                                        <button
                                                            onClick={() => handleSetCurrent(ap.player_id)}
                                                            className="btn-current"
                                                            disabled={loading || ap.is_current}
                                                        >
                                                            Set Current
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleReserved(ap.player_id, ap.is_reserved)}
                                                            className={`btn-reserve ${ap.is_reserved ? 'active' : ''}`}
                                                            disabled={loading}
                                                        >
                                                            {ap.is_reserved ? '🔒 Reserved' : '⭐ Reserve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemovePlayer(ap.player_id)}
                                                            className="btn-remove"
                                                            disabled={loading || auction?.is_locked}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionPlayersManager;
