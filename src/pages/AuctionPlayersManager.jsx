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
import { fetchTeamsByAuction, assignPlayerToTeam, removePlayerFromTeam } from '../services/auctionTeamsService';
import '../styles/AuctionPlayersManager.css';
import '../styles/AuctionPlayersSearch.css';
import '../styles/AuctionCurrentPlayer.css';
import '../styles/TeamSelect.css';

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
    const [teams, setTeams] = useState([]);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('Under 16');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('Under 16');

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

            // Load teams
            const auctionTeams = await fetchTeamsByAuction(auctionId);
            setTeams(auctionTeams);

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
            // Use activeTab as the age group to ensure consistency
            await addPlayerToAuction(auctionId, playerId, activeTab);
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

    const handleTeamAssign = async (auctionPlayerId, teamId) => {
        try {
            setLoading(true);
            if (teamId) {
                await assignPlayerToTeam(auctionPlayerId, teamId);
            } else {
                await removePlayerFromTeam(auctionPlayerId);
            }
            await loadData();
            setError(null);
        } catch (err) {
            setError('Failed to assign team: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAvailablePlayers = () => {
        const auctionPlayerIds = auctionPlayers.map(ap => ap.player_id);

        let available = allPlayers.filter(p => {
            // 1. Must not already be in auction
            if (auctionPlayerIds.includes(p.id)) return false;

            // 2. Normalize category strings for comparison
            // Handle 'U16' vs 'Under 16' aliases if necessary
            const playerCategory = p.age_group;

            // Strict Filter: Only show players that match the active Tab
            // This prevents adding Open players to U16 section
            if (activeTab === 'Under 16' && playerCategory !== 'Under 16' && playerCategory !== 'U16') return false;
            if (activeTab === 'Under 19' && playerCategory !== 'Under 19' && playerCategory !== 'U19') return false;
            if (activeTab === 'Open' && playerCategory !== 'Open') return false;

            return true;
        });

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

    const getAuctionPlayersByTab = () => {
        return auctionPlayers
            .filter(ap => ap.age_group === activeTab)
            .sort((a, b) => a.position_number - b.position_number);
    };

    const currentTabPlayers = getAuctionPlayersByTab();

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
            {/* Header */}
            <div className="auction-players-header">
                <div>
                    <h1>Manage Players</h1>
                    <p className="auction-name">
                        {auction?.auction_name || 'Loading...'}
                    </p>
                </div>
                <div className="header-actions">
                    <a href="#auction-manager" className="btn-secondary">Back</a>
                    <a href="#slider" className="btn-primary">Open Slider</a>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error} <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="loading-overlay">Updating...</div>}

            <div className="players-manager-layout">

                {/* 1. Available Players Section (Top) */}
                <div className="available-players-section">
                    <div className="section-header">
                        <div>
                            <h2>Add Players</h2>
                            <div className="category-filter-pills" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                {['Under 16', 'Under 19', 'Open'].map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setActiveTab(category)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: activeTab === category ? 'none' : '1px solid #cbd5e1',
                                            background: activeTab === category ? '#2563eb' : 'white',
                                            color: activeTab === category ? 'white' : '#64748b',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="search-controls">
                            <input
                                type="text"
                                className="search-input"
                                placeholder={`Search by name...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="available-grid">
                        {getAvailablePlayers().map(player => (
                            <div key={player.id} className="player-card-available">
                                <img
                                    src={player.photo_url || '/fallback-player.png'}
                                    className="avail-thumb"
                                    onError={(e) => e.target.src = '/fallback-player.png'}
                                    alt=""
                                />
                                <div className="avail-info">
                                    <div className="avail-name">{player.full_name}</div>
                                    <div className="avail-meta">{player.role} • {player.age_group}</div>
                                </div>
                                <button
                                    className="btn-add-quick"
                                    onClick={() => handleAddPlayer(player.id)}
                                    title="Add to Auction"
                                >
                                    +
                                </button>
                            </div>
                        ))}
                        {getAvailablePlayers().length === 0 && (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px' }}>
                                No available players found for <strong>{activeTab}</strong> category.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Auction Players Section (Bottom) */}
                <div className="auction-players-section">

                    {/* Tabs */}
                    <div className="tabs-container">
                        {['Under 16', 'Under 19', 'Open'].map(tab => (
                            <button
                                key={tab}
                                className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab} ({auctionPlayers.filter(ap => ap.age_group === tab).length})
                            </button>
                        ))}
                    </div>

                    {/* Auction Grid */}
                    {currentTabPlayers.length === 0 ? (
                        <div className="empty-tab-state">
                            <h3>No players added to {activeTab} yet</h3>
                            <p>Use the section above to add players to this category.</p>
                        </div>
                    ) : (
                        <div className="auction-grid">
                            {currentTabPlayers.map((ap, index) => (
                                <div key={ap.id} className={`team-style-card ${ap.is_reserved ? 'reserved' : ''} ${ap.is_current ? 'current' : ''}`}>

                                    <div className="card-header-row">
                                        <div className="card-num-badge">#{ap.position_number}</div>
                                        <img
                                            src={ap.players.photo_url || '/fallback-player.png'}
                                            className="card-photo"
                                            onError={(e) => e.target.src = '/fallback-player.png'}
                                            alt=""
                                        />
                                        <div className="card-info">
                                            <div className="card-name">{ap.players.full_name}</div>
                                            <div className="card-role">{ap.players.role}</div>
                                            <div className="card-badges">
                                                {ap.is_current && <span className="badge-live">LIVE</span>}
                                                {ap.is_reserved && <span className="badge-reserved">RESERVED</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {!ap.is_reserved && (
                                        <div className="team-select-container">
                                            <select
                                                value={ap.team_id || ''}
                                                onChange={(e) => handleTeamAssign(ap.id, e.target.value || null)}
                                            >
                                                <option value="">Select Team...</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.team_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="position-controls-row">
                                        <button
                                            className="move-btn"
                                            onClick={() => handleMoveUp(activeTab, ap.position_number)}
                                            disabled={index === 0}
                                        >
                                            ▲
                                        </button>
                                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Position</span>
                                        <button
                                            className="move-btn"
                                            onClick={() => handleMoveDown(activeTab, ap.position_number)}
                                            disabled={index === currentTabPlayers.length - 1}
                                        >
                                            ▼
                                        </button>
                                    </div>

                                    <div className="card-actions-row">
                                        <button
                                            className="btn-card-action primary"
                                            onClick={() => handleSetCurrent(ap.player_id)}
                                            disabled={ap.is_current}
                                        >
                                            {ap.is_current ? 'Live' : 'Set Live'}
                                        </button>
                                        <button
                                            className="btn-card-action warning"
                                            onClick={() => handleToggleReserved(ap.player_id, ap.is_reserved)}
                                        >
                                            {ap.is_reserved ? 'Unreserve' : 'Reserve'}
                                        </button>
                                        <button
                                            className="btn-card-action remove"
                                            onClick={() => handleRemovePlayer(ap.player_id)}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuctionPlayersManager;
