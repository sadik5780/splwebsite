import React, { useState, useEffect } from 'react';
import {
    fetchAllAuctions,
    createAuction,
    setActiveAuction,
    updateAuction,
    deleteAuction,
} from '../services/auctionService';
import '../styles/AuctionManager.css';
import '../styles/AuctionManagerButtons.css';

const AuctionManager = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAuction, setEditingAuction] = useState(null);

    const [formData, setFormData] = useState({
        auction_name: '',
        auction_season: '',
        welcome_text: 'Welcome to SPL Season 6 Auction Hall',
    });

    useEffect(() => {
        loadAuctions();
    }, []);

    const loadAuctions = async () => {
        try {
            setLoading(true);
            const data = await fetchAllAuctions();
            setAuctions(data);
            setError(null);
        } catch (err) {
            setError('Failed to load auctions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createAuction(
                formData.auction_name,
                formData.auction_season,
                formData.welcome_text
            );
            await loadAuctions();
            setShowCreateForm(false);
            setFormData({
                auction_name: '',
                auction_season: '',
                welcome_text: 'Welcome to SPL Season 6 Auction Hall',
            });
            setError(null);
        } catch (err) {
            setError('Failed to create auction: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (auctionId) => {
        try {
            setLoading(true);
            await setActiveAuction(auctionId);
            await loadAuctions();
            setError(null);
        } catch (err) {
            setError('Failed to set active auction: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (auction) => {
        setEditingAuction(auction);
        setFormData({
            auction_name: auction.auction_name,
            auction_season: auction.auction_season,
            welcome_text: auction.welcome_text,
        });
        setShowCreateForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateAuction(editingAuction.id, formData);
            await loadAuctions();
            setShowCreateForm(false);
            setEditingAuction(null);
            setFormData({
                auction_name: '',
                auction_season: '',
                welcome_text: 'Welcome to SPL Season 6 Auction Hall',
            });
            setError(null);
        } catch (err) {
            setError('Failed to update auction: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete auction "${name}"?`)) return;

        try {
            setLoading(true);
            await deleteAuction(id);
            await loadAuctions();
            setError(null);
        } catch (err) {
            setError('Failed to delete auction: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManagePlayers = (auctionId) => {
        window.location.hash = `auction-players?auctionId=${auctionId}`;
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setEditingAuction(null);
        setFormData({
            auction_name: '',
            auction_season: '',
            welcome_text: 'Welcome to SPL Season 6 Auction Hall',
        });
    };

    return (
        <div className="auction-manager-container">
            <div className="auction-header">
                <h1>Auction Manager</h1>
                <div className="header-actions">
                    <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                        + Create Auction
                    </button>
                    <a href="#admin" className="btn-secondary">Players Admin</a>
                    <a href="#slider" className="btn-secondary">View Slider</a>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="loading">Loading auctions...</div>}

            <div className="auctions-list">
                {auctions.length === 0 && !loading && (
                    <div className="no-auctions">
                        <p>No auctions yet. Create your first auction to get started!</p>
                    </div>
                )}

                {auctions.map((auction) => (
                    <div key={auction.id} className={`auction-card ${auction.is_active ? 'active' : ''}`}>
                        <div className="auction-card-header">
                            <div className="auction-info">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="active-auction"
                                        checked={auction.is_active}
                                        onChange={() => handleSetActive(auction.id)}
                                        disabled={loading}
                                    />
                                    <div className="auction-details">
                                        <h3>{auction.auction_name}</h3>
                                        <span className="season">{auction.auction_season}</span>
                                        {auction.is_active && <span className="active-badge">ACTIVE</span>}
                                    </div>
                                </label>
                            </div>
                            <div className="auction-actions">
                                <button onClick={() => handleEdit(auction)} className="btn-edit">
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(auction.id, auction.auction_name)}
                                    className="btn-delete"
                                    disabled={auction.is_active}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div className="auction-card-body">
                            <p className="welcome-text">{auction.welcome_text}</p>
                            <button
                                onClick={() => handleManagePlayers(auction.id)}
                                className="btn-manage-players"
                            >
                                Manage Players →
                            </button>
                            <a
                                href={`#auction-teams?auctionId=${auction.id}`}
                                className="btn-teams"
                            >
                                Teams
                            </a>
                            <a
                                href={`#auction-overview?auctionId=${auction.id}`}
                                className="btn-overview"
                            >
                                Overview
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Form Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingAuction ? 'Edit Auction' : 'Create New Auction'}</h2>
                        <form onSubmit={editingAuction ? handleUpdate : handleCreate} className="auction-form">
                            <div className="form-group">
                                <label>Auction Name *</label>
                                <input
                                    type="text"
                                    value={formData.auction_name}
                                    onChange={(e) => setFormData({ ...formData, auction_name: e.target.value })}
                                    placeholder="e.g. SPL Auction"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Season *</label>
                                <input
                                    type="text"
                                    value={formData.auction_season}
                                    onChange={(e) => setFormData({ ...formData, auction_season: e.target.value })}
                                    placeholder="e.g. Season 6"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Welcome Text *</label>
                                <textarea
                                    value={formData.welcome_text}
                                    onChange={(e) => setFormData({ ...formData, welcome_text: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={handleCancel} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? 'Saving...' : editingAuction ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionManager;
