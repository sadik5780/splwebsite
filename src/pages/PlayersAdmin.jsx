import React, { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    fetchAllPlayers,
    createPlayer,
    deletePlayer,
    updatePlayer,
} from '../services/playersService';
import { uploadPlayerPhoto } from '../services/uploadService';
import { exportPlayersToExcel, exportPlayersToPDF } from '../services/exportService';
import '../styles/PlayersAdmin.css';

const PlayersAdmin = () => {
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        mobile: '',
        role: 'Batsman',
        age_group: 'Under 16',
        photo_filename: '',
        photo_url: '',
    });

    // Image crop state
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const imgRef = useRef(null);

    // Load players on mount
    useEffect(() => {
        loadPlayers();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = players;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.full_name?.toLowerCase().includes(query) ||
                    p.mobile?.includes(query) ||
                    p.email?.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (roleFilter !== 'All') {
            filtered = filtered.filter((p) => p.role === roleFilter);
        }

        setFilteredPlayers(filtered);
    }, [players, searchQuery, roleFilter]);

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const data = await fetchAllPlayers();
            setPlayers(data);
            setFilteredPlayers(data);
            setError(null);
        } catch (err) {
            setError('Failed to load players: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingPlayer(null);
        setFormData({
            full_name: '',
            email: '',
            mobile: '',
            role: 'Batsman',
            age_group: 'Under 16',
            photo_filename: '',
            photo_url: '',
        });
        setSelectedFile(null);
        setImageSrc(null);
        setCroppedImageUrl(null);
        setIsFormOpen(true);
    };

    const handleEdit = (player) => {
        setEditingPlayer(player);
        setFormData({
            full_name: player.full_name || '',
            email: player.email || '',
            mobile: player.mobile || '',
            role: player.role || 'Batsman',
            age_group: player.age_group || 'Under 16',
            photo_filename: player.photo_filename || '',
            photo_url: player.photo_url || '',
        });
        setSelectedFile(null);
        setImageSrc(null);
        setCroppedImageUrl(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete player "${name}"?`)) return;

        try {
            setLoading(true);
            await deletePlayer(id);
            await loadPlayers();
            setError(null);
        } catch (err) {
            setError('Failed to delete player: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                setSelectedFile(file);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditExistingImage = () => {
        if (editingPlayer && editingPlayer.photo_url) {
            setImageSrc(editingPlayer.photo_url);
            setSelectedFile(null); // No file selected, using existing URL
            setShowCropModal(true);
        }
    };

    const getCroppedImg = (image, crop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Convert percentage to pixels if needed
        let pixelCrop = { ...crop };
        if (crop.unit === '%') {
            pixelCrop = {
                x: (crop.x / 100) * image.width,
                y: (crop.y / 100) * image.height,
                width: (crop.width / 100) * image.width,
                height: (crop.height / 100) * image.height,
                unit: 'px'
            };
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const file = new File([blob], selectedFile?.name || 'cropped.jpg', {
                    type: selectedFile?.type || 'image/jpeg',
                    lastModified: Date.now(),
                });
                resolve(file);
            }, selectedFile?.type || 'image/jpeg');
        });
    };

    const handleSaveCrop = async () => {
        if (!completedCrop || !imgRef.current) {
            return;
        }

        try {
            setUploading(true);

            const croppedFile = await getCroppedImg(imgRef.current, completedCrop);

            // Upload cropped image
            const uploadResult = await uploadPlayerPhoto(croppedFile);

            // Update form data with uploaded image URLs
            setFormData(prev => ({
                ...prev,
                photo_filename: uploadResult.photo_filename,
                photo_url: uploadResult.photo_url,
            }));

            setCroppedImageUrl(uploadResult.photo_url);
            setShowCropModal(false);
            setImageSrc(null);
            setSelectedFile(null);
            setError(null);
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCancelCrop = () => {
        setShowCropModal(false);
        setImageSrc(null);
        setSelectedFile(null);
        setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
        setCompletedCrop(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            setLoading(true);

            // Validate required fields
            if (!formData.full_name || !formData.role || !formData.age_group) {
                throw new Error('Full name, role, and age group are required');
            }

            if (!editingPlayer && !formData.photo_url) {
                throw new Error('Photo is required for new players');
            }

            // Prepare data (email and mobile can be empty)
            const playerData = {
                full_name: formData.full_name,
                email: formData.email || null,
                mobile: formData.mobile || null,
                role: formData.role,
                age_group: formData.age_group,
                photo_filename: formData.photo_filename,
                photo_url: formData.photo_url,
            };

            // Create or update
            if (editingPlayer) {
                await updatePlayer(editingPlayer.id, playerData);
            } else {
                await createPlayer(playerData);
            }

            await loadPlayers();

            // Clear form and states
            setIsFormOpen(false);
            setFormData({
                full_name: '',
                email: '',
                mobile: '',
                role: 'Batsman',
                age_group: 'Under 16',
                photo_filename: '',
                photo_url: '',
            });
            setEditingPlayer(null);
            setCroppedImageUrl(null);
            setImageSrc(null);
            setSelectedFile(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingPlayer(null);
        setFormData({
            full_name: '',
            email: '',
            mobile: '',
            role: 'Batsman',
            age_group: 'Under 16',
            photo_filename: '',
            photo_url: '',
        });
        setSelectedFile(null);
        setImageSrc(null);
        setCroppedImageUrl(null);
        setError(null);
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Players Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => exportPlayersToExcel(players, 'all_players.xlsx')} className="btn-primary" disabled={players.length === 0}>
                        📊 Export Excel
                    </button>
                    <button onClick={() => exportPlayersToPDF(players, 'all_players.pdf')} className="btn-primary" disabled={players.length === 0}>
                        📄 Export PDF
                    </button>
                    <button onClick={handleAdd} className="btn-primary">
                        + Add Player
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="search-filter-bar-sticky">
                <input
                    type="text"
                    placeholder="Search by name, mobile, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Roles</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                </select>
            </div>

            {loading && <div className="loading">Loading players...</div>}

            <div className="players-table-container">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Full Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Age Group</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlayers.map((player) => (
                            <tr key={player.id}>
                                <td>
                                    <img
                                        src={player.photo_url}
                                        alt={player.full_name}
                                        className="player-thumbnail"
                                        onError={(e) => {
                                            e.target.src = '/fallback-player.png';
                                        }}
                                    />
                                </td>
                                <td>{player.full_name}</td>
                                <td>{player.mobile || '-'}</td>
                                <td>{player.email || '-'}</td>
                                <td>{player.role}</td>
                                <td>{player.age_group}</td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(player)}
                                        className="btn-edit"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(player.id, player.full_name)}
                                        className="btn-delete"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredPlayers.length === 0 && !loading && (
                    <div className="no-results">No players found</div>
                )}
            </div>

            {/* Crop Modal */}
            {showCropModal && (
                <div className="modal-overlay crop-overlay" onClick={handleCancelCrop}>
                    <div className="modal-content crop-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Crop Player Photo</h2>
                        <div className="crop-container">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                            >
                                <img
                                    ref={imgRef}
                                    src={imageSrc}
                                    alt="Crop preview"
                                    crossOrigin="anonymous"
                                    style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                    onLoad={(e) => {
                                        const { width, height } = e.currentTarget;
                                        setCrop({
                                            unit: '%',
                                            width: 50,
                                            height: 50,
                                            x: 25,
                                            y: 25
                                        });
                                    }}
                                />
                            </ReactCrop>
                        </div>
                        <div className="crop-actions">
                            <button
                                onClick={handleCancelCrop}
                                className="btn-cancel"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCrop}
                                className="btn-submit"
                                disabled={uploading || !completedCrop}
                            >
                                {uploading ? 'Uploading...' : 'Save Image'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Form Modal */}
            {isFormOpen && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingPlayer ? 'Edit Player' : 'Add New Player'}</h2>
                        <form onSubmit={handleSubmit} className="player-form">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Player Photo *</label>

                                {/* Show current photo when editing */}
                                {editingPlayer && editingPlayer.photo_url && !imageSrc && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Current Photo:</div>
                                        <img
                                            src={editingPlayer.photo_url}
                                            alt="Current player"
                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleEditExistingImage}
                                            style={{
                                                display: 'block',
                                                marginTop: '10px',
                                                padding: '8px 16px',
                                                background: '#2563eb',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            ✏️ Edit Image
                                        </button>
                                    </div>
                                )}

                                <input
                                    id="photo-upload-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    style={{ display: imageSrc || !editingPlayer ? 'block' : 'none' }}
                                />
                                {!imageSrc && !editingPlayer && (
                                    <small>Upload a player photo (required for new players)</small>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Mobile</label>
                                <input
                                    type="text"
                                    value={formData.mobile}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mobile: e.target.value })
                                    }
                                    pattern="[0-9]{10}"
                                    title="10-digit mobile number (optional)"
                                />
                            </div>

                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                    }
                                    required
                                >
                                    <option value="Batsman">Batsman</option>
                                    <option value="Bowler">Bowler</option>
                                    <option value="All-Rounder">All-Rounder</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Age Group *</label>
                                <select
                                    value={formData.age_group}
                                    onChange={(e) =>
                                        setFormData({ ...formData, age_group: e.target.value })
                                    }
                                    required
                                >
                                    <option value="Under 16">Under 16</option>
                                    <option value="Under 19">Under 19</option>
                                    <option value="Open">Open</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    Photo {!editingPlayer && '*'}
                                    {editingPlayer && ' (optional - current photo will be kept if not changed)'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    required={!editingPlayer && !formData.photo_url}
                                />

                                {croppedImageUrl && (
                                    <div className="photo-preview">
                                        <p>Uploaded Image:</p>
                                        <img src={croppedImageUrl} alt="Preview" className="preview-img" />
                                    </div>
                                )}

                                {editingPlayer && formData.photo_url && !croppedImageUrl && (
                                    <div className="photo-preview">
                                        <p>Current Image (will be kept if not changed):</p>
                                        <img src={formData.photo_url} alt="Current" className="preview-img" />
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="btn-cancel"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={loading}
                                >
                                    {loading
                                        ? 'Saving...'
                                        : editingPlayer
                                            ? 'Update Player'
                                            : 'Add Player'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayersAdmin;
