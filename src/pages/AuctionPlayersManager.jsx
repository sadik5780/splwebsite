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
    sellPlayer,
    unsoldPlayer,
} from '../services/auctionService';
import { fetchAllPlayers } from '../services/playersService';
import { fetchTeamsByAuction, assignPlayerToTeam, removePlayerFromTeam } from '../services/auctionTeamsService';
import { exportAuctionPlayersToExcel, exportAuctionPlayersToPDF } from '../services/exportService';
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
    const [sellingPlayer, setSellingPlayer] = useState(null);
    const [sellPoints, setSellPoints] = useState('');
    const [teamPoints, setTeamPoints] = useState([]);

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

            // Load team points
            const { getTeamRemainingPoints } = await import('../services/auctionService');
            const points = await getTeamRemainingPoints(auctionId);
            setTeamPoints(points);
            console.log('✅ Team points updated:', points);

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

    const handleSellPlayer = (auctionPlayer) => {
        setSellingPlayer(auctionPlayer);
        setSellPoints(auctionPlayer.sold_points || '');
    };

    const handleCompleteSale = async (player, points) => {
        if (!player || !player.team_id) {
            setError('Please select a team first');
            return;
        }

        try {
            setLoading(true);
            const pointsInt = parseInt(points);
            if (isNaN(pointsInt) || pointsInt <= 0) {
                throw new Error('Please enter a valid positive number for sold points');
            }

            await sellPlayer({
                auctionPlayerId: player.id,
                teamId: player.team_id,
                soldPoints: pointsInt
            });

            await loadData();
            setSellingPlayer(null);
            setSellPoints('');
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsoldPlayer = async (auctionPlayerId) => {
        if (!window.confirm('Unsold this player? This will remove the sold points.')) {
            return;
        }

        try {
            setLoading(true);
            await unsoldPlayer(auctionPlayerId);
            await loadData();
            setError(null);
        } catch (err) {
            setError(err.message);
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
            <div className="players-manager-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1>Manage Players</h1>
                    {auction && <p className="auction-subtitle">{auction.auction_name} - {auction.auction_season}</p>}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            const nonReservedPlayers = auctionPlayers.filter(ap => !ap.is_reserved);
                            exportAuctionPlayersToExcel(nonReservedPlayers, `${auction?.auction_name || 'auction'}_players.xlsx`);
                        }}
                        disabled={auctionPlayers.length === 0}
                        style={{
                            padding: '10px 20px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: auctionPlayers.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: auctionPlayers.length === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>📊</span> Export Excel
                    </button>
                    <button
                        onClick={() => {
                            const nonReservedPlayers = auctionPlayers.filter(ap => !ap.is_reserved);
                            exportAuctionPlayersToPDF(nonReservedPlayers, `${auction?.auction_name || 'auction'}_players.pdf`);
                        }}
                        disabled={auctionPlayers.length === 0}
                        style={{
                            padding: '10px 20px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: auctionPlayers.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: auctionPlayers.length === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>📄</span> Export PDF
                    </button>
                    <button onClick={() => window.history.back()} className="btn-back">
                        ← Back to Auction
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error} <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="loading-overlay">Updating...</div>}

            <div className="players-manager-layout">

                {/* Team Points Panel */}
                {teamPoints.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Team Points</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                            {teamPoints.map(team => (
                                <div key={team.team_id} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>{team.team_name}</div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', padding: '6px', background: '#ffffff', borderRadius: '4px' }}>
                                        <span style={{ color: '#64748b', fontWeight: '600' }}>Players Bought:</span>
                                        <span style={{ fontWeight: '700', color: (team.players_bought || 0) >= 11 ? '#16a34a' : '#2563eb' }}>
                                            {team.players_bought || 0}/11 ({(team.players_remaining !== undefined ? team.players_remaining : 11)} left)
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#64748b' }}>Total:</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{team.total_points}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#64748b' }}>Spent:</span>
                                        <span style={{ fontWeight: '600', color: '#dc2626' }}>{team.spent_points}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                                        <span style={{ fontWeight: '600', color: '#475569' }}>Remaining:</span>
                                        <span style={{ fontWeight: '700', color: team.remaining_points > 0 ? '#16a34a' : '#dc2626' }}>{team.remaining_points}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                                disabled={ap.sold_points > 0}
                                            >
                                                <option value="">Select Team...</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.team_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Inline Sell Controls */}
                                    {ap.team_id && !ap.sold_points && !ap.is_reserved && (
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                placeholder="Sold points"
                                                min="1"
                                                id={`sell-input-${ap.id}`}
                                                style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById(`sell-input-${ap.id}`);
                                                    const points = parseInt(input.value);
                                                    if (points > 0) {
                                                        handleCompleteSale(ap, points);
                                                    } else {
                                                        setError('Please enter valid points');
                                                    }
                                                }}
                                                style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >
                                                Sell
                                            </button>
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

                                    {ap.sold_points && (
                                        <div style={{ marginTop: '10px', padding: '8px', background: '#dcfce7', borderRadius: '6px', textAlign: 'center', border: '1px solid #86efac' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700' }}>
                                                    ✓ SOLD for {ap.sold_points} points
                                                </span>
                                                <button
                                                    onClick={() => handleUnsoldPlayer(ap.id)}
                                                    style={{ padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Unsold
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Sell Player Modal */}
            {sellingPlayer && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSellingPlayer(null)}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>Sell Player</h2>
                        <p style={{ color: '#64748b' }}>
                            {sellingPlayer.players.full_name} → {teams.find(t => t.id === sellingPlayer.team_id)?.team_name}
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Sold Points *
                            </label>
                            <input
                                type="number"
                                value={sellPoints}
                                onChange={(e) => setSellPoints(e.target.value)}
                                placeholder="Enter sold points"
                                min="1"
                                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setSellingPlayer(null)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleCompleteSale} disabled={loading} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                {loading ? 'Selling...' : 'Confirm Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionPlayersManager;
