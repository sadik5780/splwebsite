import React, { useState, useEffect } from 'react';
import {
    createTeam,
    fetchTeamsByAuction,
    updateTeam,
    deleteTeam
} from '../services/auctionTeamsService';
import { fetchAllAuctions } from '../services/auctionService';
import { uploadPlayerPhoto } from '../services/uploadService';
import '../styles/AuctionTeams.css';
import '../styles/TeamLogoUpload.css';

const AuctionTeams = ({ auctionId: propAuctionId }) => {
    const hash = window.location.hash.slice(1);
    const searchParams = hash.includes('?') ? hash.split('?')[1] : '';
    const hashAuctionId = new URLSearchParams(searchParams).get('auctionId');
    const storedAuctionId = localStorage.getItem('activeAuctionId');
    const auctionId = propAuctionId || hashAuctionId || storedAuctionId;

    const [auction, setAuction] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({
        team_name: '',
        franchise_name: '',
        team_color: '',
        team_logo_url: ''
    });

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

            const teamsData = await fetchTeamsByAuction(auctionId);
            setTeams(teamsData);
            setError(null);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingTeam) {
                await updateTeam(editingTeam.id, formData);
            } else {
                await createTeam(auctionId, formData);
            }
            await loadData();
            handleCancel();
        } catch (err) {
            setError('Failed to save team: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (team) => {
        setEditingTeam(team);
        setFormData({
            team_name: team.team_name,
            franchise_name: team.franchise_name || '',
            team_color: team.team_color || '',
            team_logo_url: team.team_logo_url || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (teamId, teamName) => {
        if (!window.confirm(`Delete team "${teamName}"? All players will be unassigned.`)) return;
        try {
            setLoading(true);
            await deleteTeam(teamId);
            await loadData();
        } catch (err) {
            setError('Failed to delete team: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadPlayerPhoto(file);
            setFormData({ ...formData, team_logo_url: result.photo_url });
            setError(null);
        } catch (err) {
            setError('Failed to upload logo: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingTeam(null);
        setFormData({ team_name: '', franchise_name: '', team_color: '', team_logo_url: '' });
    };

    if (!auctionId) {
        return (
            <div className="auction-teams-container">
                <div className="error-message">
                    <strong>No auction selected</strong>
                    <p>Please select an auction from the <a href="#auction-manager">Auction Manager</a></p>
                </div>
            </div>
        );
    }

    return (
        <div className="auction-teams-container">
            <div className="auction-teams-header">
                <div>
                    <h1>Team Management</h1>
                    {auction && <p className="auction-name">{auction.auction_name} - {auction.auction_season}</p>}
                </div>
                <div className="header-actions">
                    <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Team</button>
                    <a href="#auction-manager" className="btn-secondary">← Back</a>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading">Loading...</div>}

            <div className="teams-grid">
                {teams.map(team => (
                    <div key={team.id} className="team-card">
                        <div className="team-header">
                            {team.team_logo_url && (
                                <img src={team.team_logo_url} alt={team.team_name} className="team-logo" />
                            )}
                            {team.team_color && !team.team_logo_url && (
                                <div className="team-color" style={{ backgroundColor: team.team_color }}></div>
                            )}
                            <div className="team-info">
                                <h3>{team.team_name}</h3>
                                {team.franchise_name && <p className="franchise-name">{team.franchise_name}</p>}
                            </div>
                        </div>
                        <div className="team-actions">
                            <button onClick={() => handleEdit(team)} className="btn-edit">Edit</button>
                            <button onClick={() => handleDelete(team.id, team.team_name)} className="btn-delete">Delete</button>
                        </div>
                    </div>
                ))}
                {teams.length === 0 && !loading && (
                    <div className="no-teams">No teams created yet</div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingTeam ? 'Edit Team' : 'Create Team'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Team Name *</label>
                                <input
                                    type="text"
                                    value={formData.team_name}
                                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Franchise Name</label>
                                <input
                                    type="text"
                                    value={formData.franchise_name}
                                    onChange={(e) => setFormData({ ...formData, franchise_name: e.target.value })}
                                    placeholder="e.g., Mumbai Indians, CSK"
                                />
                            </div>
                            <div className="form-group">
                                <label>Team Color</label>
                                <input
                                    type="color"
                                    value={formData.team_color}
                                    onChange={(e) => setFormData({ ...formData, team_color: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Team Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                                {uploading && <span className="upload-status">Uploading...</span>}
                                {formData.team_logo_url && (
                                    <img src={formData.team_logo_url} alt="Logo preview" className="logo-preview" />
                                )}
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={handleCancel} className="btn-cancel">Cancel</button>
                                <button type="submit" className="btn-submit">{editingTeam ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionTeams;
