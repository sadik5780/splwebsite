import { supabase } from '../lib/supabase';

export const createTeam = async (auctionId, teamData) => {
    try {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('auction_teams')
            .insert([{
                auction_id: auctionId,
                team_name: teamData.team_name,
                team_color: teamData.team_color || null,
                team_logo_url: teamData.team_logo_url || null
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        throw error;
    }
};

export const fetchTeamsByAuction = async (auctionId) => {
    try {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('auction_teams')
            .select('*')
            .eq('auction_id', auctionId)
            .order('team_name', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

export const updateTeam = async (teamId, teamData) => {
    try {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('auction_teams')
            .update(teamData)
            .eq('id', teamId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        throw error;
    }
};

export const deleteTeam = async (teamId) => {
    try {
        if (!supabase) return;
        // First, unassign all players from this team
        await supabase
            .from('auction_players')
            .update({ team_id: null })
            .eq('team_id', teamId);

        // Then delete the team
        const { error } = await supabase
            .from('auction_teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;
    } catch (error) {
        throw error;
    }
};

export const assignPlayerToTeam = async (auctionPlayerId, teamId) => {
    try {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('auction_players')
            .update({ team_id: teamId })
            .eq('id', auctionPlayerId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        throw error;
    }
};

export const removePlayerFromTeam = async (auctionPlayerId) => {
    try {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('auction_players')
            .update({ team_id: null })
            .eq('id', auctionPlayerId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        throw error;
    }
};

export const getSoldPlayersByTeam = async (auctionId) => {
    try {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('auction_players')
            .select(`
                *,
                players (*),
                auction_teams (*)
            `)
            .eq('auction_id', auctionId)
            .eq('is_reserved', false)
            .eq('is_removed', false)
            .not('team_id', 'is', null)
            .order('team_id');

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

export const getUnsoldPlayersByAgeGroup = async (auctionId) => {
    try {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('auction_players')
            .select(`
                *,
                players (*)
            `)
            .eq('auction_id', auctionId)
            .eq('is_reserved', false)
            .eq('is_removed', false)
            .is('team_id', null)
            .order('age_group')
            .order('position_number');

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};
