import React, { useState, useEffect } from 'react';
import { getSoldPlayersByTeam, getUnsoldPlayersByAgeGroup } from '../services/auctionTeamsService';
import { fetchAllAuctions } from '../services/auctionService';
import '../styles/AuctionOverview.css';

const AuctionOverview = ({ auctionId: propAuctionId }) => {
    const hash = window.location.hash.slice(1);
    const searchParams = hash.includes('?') ? hash.split('?')[1] : '';
    const hashAuctionId = new URLSearchParams(searchParams).get('auctionId');
    const storedAuctionId = localStorage.getItem('activeAuctionId');
    const auctionId = propAuctionId || hashAuctionId || storedAuctionId;

    const [auction, setAuction] = useState(null);
    const [soldPlayers, setSoldPlayers] = useState([]);
    const [unsoldPlayers, setUnsoldPlayers] = useState([]);
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
            const auctions = await fetchAllAuctions();
            const currentAuction = auctions.find(a => a.id === auctionId);
            setAuction(currentAuction);

            const sold = await getSoldPlayersByTeam(auctionId);
            setSoldPlayers(sold);

            const unsold = await getUnsoldPlayersByAgeGroup(auctionId);
            setUnsoldPlayers(unsold);

            setError(null);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const groupByTeam = () => {
        const teams = {};
        soldPlayers.forEach(ap => {
            const teamId = ap.team_id;
            if (!teams[teamId]) {
                teams[teamId] = {
                    teamInfo: ap.auction_teams,
                    players: []
                };
            }
            teams[teamId].players.push(ap);
        });
        return Object.values(teams);
    };

    const groupByAgeGroup = () => {
        const ageGroups = { 'Under 16': [], 'Under 19': [], 'Open': [] };
        unsoldPlayers.forEach(ap => {
            if (ageGroups[ap.age_group]) {
                ageGroups[ap.age_group].push(ap);
            }
        });
        return ageGroups;
    };

    if (!auctionId) {
        return (
            <div className="auction-overview-container">
                <div className="error-message">
                    <strong>No auction selected</strong>
                    <p>Please select an auction from the <a href="#auction-manager">Auction Manager</a></p>
                </div>
            </div>
        );
    }

    const teamGroups = groupByTeam();
    const ageGroups = groupByAgeGroup();

    return (
        <div className="auction-overview-container">
            <div className="overview-header">
                <div>
                    <h1>Auction Overview</h1>
                    {auction && <p className="auction-name">{auction.auction_name} - {auction.auction_season}</p>}
                </div>
                <div className="header-actions">
                    <a href="#auction-manager" className="btn-secondary">← Back to Manager</a>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading">Loading...</div>}

            {!loading && (
                <>
                    <section className="overview-section">
                        <h2>Sold Players</h2>
                        {teamGroups.length === 0 ? (
                            <div className="no-data">No players sold yet</div>
                        ) : (
                            <div className="teams-list">
                                {teamGroups.map((group, idx) => (
                                    <div key={idx} className="team-group">
                                        <div className="team-group-header">
                                            {group.teamInfo?.team_color && (
                                                <div className="team-color-dot" style={{ backgroundColor: group.teamInfo.team_color }}></div>
                                            )}
                                            <h3>{group.teamInfo?.team_name || 'Unknown Team'}</h3>
                                            <span className="player-count">({group.players.length} players)</span>
                                        </div>
                                        <div className="players-grid">
                                            {group.players.map(ap => (
                                                <div key={ap.id} className="player-card">
                                                    <img
                                                        src={ap.players.photo_url}
                                                        alt={ap.players.full_name}
                                                        onError={(e) => { e.target.src = '/fallback-player.png'; }}
                                                    />
                                                    <div className="player-details">
                                                        <div className="player-name">{ap.players.full_name}</div>
                                                        <div className="player-meta">{ap.players.role} • {ap.age_group}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <hr className="section-divider" />

                    <section className="overview-section">
                        <h2>Unsold Players</h2>
                        {unsoldPlayers.length === 0 ? (
                            <div className="no-data">All players have been sold</div>
                        ) : (
                            <div className="age-groups-list">
                                {Object.entries(ageGroups).map(([ageGroup, players]) => (
                                    players.length > 0 && (
                                        <div key={ageGroup} className="age-group-block">
                                            <h3>{ageGroup} <span className="player-count">({players.length} players)</span></h3>
                                            <div className="players-grid">
                                                {players.map(ap => (
                                                    <div key={ap.id} className="player-card">
                                                        <img
                                                            src={ap.players.photo_url}
                                                            alt={ap.players.full_name}
                                                            onError={(e) => { e.target.src = '/fallback-player.png'; }}
                                                        />
                                                        <div className="player-details">
                                                            <div className="player-name">{ap.players.full_name}</div>
                                                            <div className="player-meta">{ap.players.role}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default AuctionOverview;
