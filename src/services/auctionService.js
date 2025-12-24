import { supabase } from '../lib/supabase';

// ====== AUCTION CRUD ======

/**
 * Create a new auction
 */
export const createAuction = async (auctionName, auctionSeason, welcomeText = 'Welcome to SPL Season 6 Auction Hall') => {
    try {
        const { data, error } = await supabase
            .from('auctions')
            .insert([{
                auction_name: auctionName,
                auction_season: auctionSeason,
                welcome_text: welcomeText,
                is_active: false,
                is_locked: false
            }])
            .select();

        if (error) throw error;
        console.log('✅ Created auction:', data[0].auction_name);
        return data[0];
    } catch (error) {
        console.error('Error creating auction:', error);
        throw error;
    }
};

/**
 * Fetch all auctions
 */
export const fetchAllAuctions = async () => {
    try {
        const { data, error } = await supabase
            .from('auctions')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching auctions:', error);
        throw error;
    }
};

/**
 * Get the active auction
 */
export const getActiveAuction = async () => {
    try {
        const { data, error } = await supabase
            .from('auctions')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error getting active auction:', error);
        throw error;
    }
};

/**
 * Set an auction as active (deactivates others first)
 */
export const setActiveAuction = async (auctionId) => {
    try {
        const { error: deactivateError } = await supabase
            .from('auctions')
            .update({ is_active: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deactivateError) throw deactivateError;

        const { data, error } = await supabase
            .from('auctions')
            .update({ is_active: true })
            .eq('id', auctionId)
            .select();

        if (error) throw error;
        console.log('✅ Activated auction:', data[0].auction_name);
        return data[0];
    } catch (error) {
        console.error('Error setting active auction:', error);
        throw error;
    }
};

/**
 * Toggle auction lock status
 */
export const toggleAuctionLock = async (auctionId, isLocked) => {
    try {
        const { data, error } = await supabase
            .from('auctions')
            .update({ is_locked: isLocked })
            .eq('id', auctionId)
            .select();

        if (error) throw error;
        console.log('✅ Auction lock status:', isLocked);
        return data[0];
    } catch (error) {
        console.error('Error toggling auction lock:', error);
        throw error;
    }
};

/**
 * Update auction details
 */
export const updateAuction = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('auctions')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        console.log('✅ Updated auction:', data[0].auction_name);
        return data[0];
    } catch (error) {
        console.error('Error updating auction:', error);
        throw error;
    }
};

/**
 * Delete an auction
 */
export const deleteAuction = async (id) => {
    try {
        const { error } = await supabase
            .from('auctions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log('✅ Deleted auction:', id);
    } catch (error) {
        console.error('Error deleting auction:', error);
        throw error;
    }
};

// ====== AUCTION PLAYERS ======

const getNextPosition = async (auctionId, ageGroup) => {
    const { data, error } = await supabase
        .from('auction_players')
        .select('position_number')
        .eq('auction_id', auctionId)
        .eq('age_group', ageGroup)
        .order('position_number', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data.length > 0 ? data[0].position_number + 1 : 1;
};

export const addPlayerToAuction = async (auctionId, playerId, ageGroup) => {
    try {
        const positionNumber = await getNextPosition(auctionId, ageGroup);

        const { data, error } = await supabase
            .from('auction_players')
            .upsert([{
                auction_id: auctionId,
                player_id: playerId,
                age_group: ageGroup,
                position_number: positionNumber,
                is_reserved: false,
                is_current: false,
                is_removed: false
            }], { onConflict: 'auction_id, player_id' })
            .select();

        if (error) throw error;
        console.log('✅ Added player to auction at position', positionNumber);
        return data[0];
    } catch (error) {
        console.error('Error adding player to auction:', error);
        throw error;
    }
};

export const removePlayerFromAuction = async (auctionId, playerId) => {
    try {
        const { error } = await supabase
            .from('auction_players')
            .delete()
            .eq('auction_id', auctionId)
            .eq('player_id', playerId);

        if (error) throw error;
        console.log('✅ Removed player from auction');
    } catch (error) {
        console.error('Error removing player from auction:', error);
        throw error;
    }
};

/**
 * Soft remove player (set is_removed = true)
 */
export const softRemovePlayer = async (auctionId, playerId, isRemoved) => {
    try {
        const { data, error } = await supabase
            .from('auction_players')
            .update({ is_removed: isRemoved })
            .eq('auction_id', auctionId)
            .eq('player_id', playerId)
            .select();

        if (error) throw error;
        console.log('✅ Soft removed player:', isRemoved);
        return data[0];
    } catch (error) {
        console.error('Error soft removing player:', error);
        throw error;
    }
};

export const updateAuctionPlayerPosition = async (auctionId, playerId, newPosition) => {
    try {
        const { data, error } = await supabase
            .from('auction_players')
            .update({ position_number: newPosition })
            .eq('auction_id', auctionId)
            .eq('player_id', playerId)
            .select();

        if (error) throw error;
        console.log('✅ Updated player position to', newPosition);
        return data[0];
    } catch (error) {
        console.error('Error updating player position:', error);
        throw error;
    }
};

export const togglePlayerReserved = async (auctionId, playerId, isReserved) => {
    try {
        const { data, error } = await supabase
            .from('auction_players')
            .update({ is_reserved: isReserved })
            .eq('auction_id', auctionId)
            .eq('player_id', playerId)
            .select();

        if (error) throw error;
        console.log('✅ Toggled player reserved:', isReserved);
        return data[0];
    } catch (error) {
        console.error('Error toggling player reserved:', error);
        throw error;
    }
};

/**
 * Set a player as current (unsets previous current)
 */
export const setPlayerAsCurrent = async (auctionId, playerId) => {
    try {
        // Unset all current players in this auction
        await supabase
            .from('auction_players')
            .update({ is_current: false })
            .eq('auction_id', auctionId);

        // Set this player as current
        const { data, error } = await supabase
            .from('auction_players')
            .update({ is_current: true })
            .eq('auction_id', auctionId)
            .eq('player_id', playerId)
            .select();

        if (error) throw error;
        console.log('✅ Set player as current');
        return data[0];
    } catch (error) {
        console.error('Error setting player as current:', error);
        throw error;
    }
};

export const getAuctionPlayers = async (auctionId) => {
    try {
        const { data, error } = await supabase
            .from('auction_players')
            .select(`
                *,
                players (*)
            `)
            .eq('auction_id', auctionId)
            .eq('is_removed', false)
            .order('position_number', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting auction players:', error);
        throw error;
    }
};

export const getActiveAuctionSlides = async () => {
    try {
        const auction = await getActiveAuction();
        if (!auction) {
            console.warn('⚠️ No active auction found');
            return [];
        }

        const { data: auctionPlayers, error } = await supabase
            .from('auction_players')
            .select(`
                *,
                players (*)
            `)
            .eq('auction_id', auction.id)
            .eq('is_reserved', false)
            .eq('is_removed', false)
            .order('position_number', { ascending: true });

        if (error) throw error;

        const slides = [];
        let slideId = 1;

        slides.push({
            id: `intro-${slideId++}`,
            type: 'label',
            label: auction.welcome_text
        });

        const ageGroupOrder = ['Under 16', 'Under 19', 'Open'];

        ageGroupOrder.forEach(ageGroup => {
            const groupPlayers = auctionPlayers.filter(ap => ap.age_group === ageGroup);

            if (groupPlayers.length > 0) {
                slides.push({
                    id: `header-${ageGroup.replace(/\s+/g, '-').toLowerCase()}-${slideId++}`,
                    type: 'label',
                    label: ageGroup.toUpperCase()
                });

                groupPlayers.forEach(ap => {
                    slides.push({
                        id: slideId++,
                        type: 'player',
                        name: ap.players.full_name,
                        speciality: ap.players.role,
                        age: ap.age_group,
                        image: ap.players.photo_url || '/fallback-player.png',
                        sold: false,
                        gifPlayed: false,
                        isCurrent: ap.is_current || false
                    });
                });
            }
        });

        console.log('✅ Built', slides.length, 'auction slides');
        return slides;
    } catch (error) {
        console.error('Error getting active auction slides:', error);
        throw error;
    }
};
