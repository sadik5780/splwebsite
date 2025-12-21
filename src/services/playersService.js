import { supabase } from '../lib/supabase';

/**
 * Fetch all players from Supabase and transform to slider format with grouped headers
 * @returns {Promise<Array>} Array of slides (headers + players) in correct sequence
 */
export const fetchPlayers = async () => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*');

        if (error) {
            throw error;
        }

        console.log('📊 Fetched', data?.length, 'players from Supabase');

        // Group players by age_group
        const under16 = data.filter(p =>
            p.age_group === 'Under 16' || p.age_group === 'U16'
        );
        const under19 = data.filter(p =>
            p.age_group === 'Under 19' || p.age_group === 'U19'
        );
        const open = data.filter(p =>
            p.age_group === 'Open'
        );

        console.log('📊 Groups - U16:', under16.length, 'U19:', under19.length, 'Open:', open.length);

        // Build slides array with headers and players
        const slides = [];
        let idCounter = 1;

        // Intro slide
        slides.push({
            id: `intro-${idCounter++}`,
            type: 'label',
            label: 'Welcome to SPL Season 6 Auction Hall'
        });

        // Under 16 section
        if (under16.length > 0) {
            slides.push({
                id: `header-u16-${idCounter++}`,
                type: 'label',
                label: 'UNDER 16'
            });
            under16.forEach(player => {
                slides.push({
                    id: idCounter++,
                    type: 'player',
                    name: player.full_name,
                    speciality: player.role,
                    age: player.age_group,
                    image: player.photo_url,
                    sold: false,
                    gifPlayed: false
                });
            });
        }

        // Under 19 section
        if (under19.length > 0) {
            slides.push({
                id: `header-u19-${idCounter++}`,
                type: 'label',
                label: 'UNDER 19'
            });
            under19.forEach(player => {
                slides.push({
                    id: idCounter++,
                    type: 'player',
                    name: player.full_name,
                    speciality: player.role,
                    age: player.age_group,
                    image: player.photo_url,
                    sold: false,
                    gifPlayed: false
                });
            });
        }

        // Open section
        if (open.length > 0) {
            slides.push({
                id: `header-open-${idCounter++}`,
                type: 'label',
                label: 'OPEN'
            });
            open.forEach(player => {
                slides.push({
                    id: idCounter++,
                    type: 'player',
                    name: player.full_name,
                    speciality: player.role,
                    age: player.age_group,
                    image: player.photo_url,
                    sold: false,
                    gifPlayed: false
                });
            });
        }

        console.log('✅ Built', slides.length, 'total slides (headers + players)');
        return slides;
    } catch (error) {
        console.error('Error fetching players from Supabase:', error);
        throw error;
    }
};

// ====== CRUD OPERATIONS FOR ADMIN PAGE ======

/**
 * Fetch all players (raw data, no grouping) for admin page
 * @returns {Promise<Array>} Array of player objects from database
 */
export const fetchAllPlayers = async () => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;

        console.log('📋 Fetched', data?.length, 'players for admin');
        return data;
    } catch (error) {
        console.error('Error fetching all players:', error);
        throw error;
    }
};

/**
 * Search players by name, mobile, or email
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching players
 */
export const searchPlayers = async (query) => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .or(`full_name.ilike.%${query}%,mobile.ilike.%${query}%,email.ilike.%${query}%`);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching players:', error);
        throw error;
    }
};

/**
 * Create a new player
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Created player
 */
export const createPlayer = async (playerData) => {
    try {
        const { data, error } = await supabase
            .from('players')
            .insert([playerData])
            .select();

        if (error) throw error;

        console.log('✅ Created player:', data[0].full_name);
        return data[0];
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
};

/**
 * Update an existing player
 * @param {string} id - Player ID
 * @param {Object} playerData - Updated data
 * @returns {Promise<Object>} Updated player
 */
export const updatePlayer = async (id, playerData) => {
    try {
        const { data, error } = await supabase
            .from('players')
            .update(playerData)
            .eq('id', id)
            .select();

        if (error) throw error;

        console.log('✅ Updated player:', data[0].full_name);
        return data[0];
    } catch (error) {
        console.error('Error updating player:', error);
        throw error;
    }
};

/**
 * Delete a player
 * @param {string} id - Player ID
 * @returns {Promise<void>}
 */
export const deletePlayer = async (id) => {
    try {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('✅ Deleted player:', id);
    } catch (error) {
        console.error('Error deleting player:', error);
        throw error;
    }
};
