import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export players to Excel
 */
export const exportPlayersToExcel = (players, filename = 'players.xlsx') => {
    const data = players.map(player => ({
        Photo: player.photo_url || '',
        'Full Name': player.full_name,
        Role: player.role || '',
        'Age Group': player.age_group || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');

    // Auto-size columns
    const maxWidth = 50;
    const cols = [
        { wch: 30 }, // Photo URL
        { wch: 25 }, // Full Name
        { wch: 20 }, // Role
        { wch: 15 }  // Age Group
    ];
    ws['!cols'] = cols;

    XLSX.writeFile(wb, filename);
};

/**
 * Export players to PDF
 */
export const exportPlayersToPDF = (players, filename = 'players.pdf') => {
    const doc = new jsPDF();

    const tableData = players.map(player => [
        player.photo_url || 'No Photo',
        player.full_name,
        player.role || '',
        player.age_group || ''
    ]);

    autoTable(doc, {
        head: [['Photo', 'Full Name', 'Role', 'Age Group']],
        body: tableData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 40 }, // Photo
            1: { cellWidth: 50 }, // Full Name
            2: { cellWidth: 40 }, // Role
            3: { cellWidth: 30 }  // Age Group
        },
        margin: { top: 15 }
    });

    doc.save(filename);
};

/**
 * Export auction players to Excel (ordered by age group)
 */
export const exportAuctionPlayersToExcel = (auctionPlayers, filename = 'auction_players.xlsx') => {
    // Sort by age group order: Under 16 -> Under 19 -> Open
    const ageGroupOrder = { 'Under 16': 1, 'Under 19': 2, 'Open': 3 };

    const sortedPlayers = [...auctionPlayers].sort((a, b) => {
        const orderA = ageGroupOrder[a.age_group] || 99;
        const orderB = ageGroupOrder[b.age_group] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.position_number - b.position_number;
    });

    const data = sortedPlayers.map(ap => ({
        Photo: ap.players?.photo_url || '',
        'Full Name': ap.players?.full_name || '',
        Role: ap.players?.role || '',
        'Age Group': ap.age_group || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auction Players');

    const cols = [
        { wch: 30 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 }
    ];
    ws['!cols'] = cols;

    XLSX.writeFile(wb, filename);
};

/**
 * Export auction players to PDF (ordered by age group)
 */
export const exportAuctionPlayersToPDF = (auctionPlayers, filename = 'auction_players.pdf') => {
    const doc = new jsPDF();

    // Sort by age group order: Under 16 -> Under 19 -> Open
    const ageGroupOrder = { 'Under 16': 1, 'Under 19': 2, 'Open': 3 };

    const sortedPlayers = [...auctionPlayers].sort((a, b) => {
        const orderA = ageGroupOrder[a.age_group] || 99;
        const orderB = ageGroupOrder[b.age_group] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.position_number - b.position_number;
    });

    const tableData = sortedPlayers.map(ap => [
        ap.players?.photo_url || 'No Photo',
        ap.players?.full_name || '',
        ap.players?.role || '',
        ap.age_group || ''
    ]);

    autoTable(doc, {
        head: [['Photo', 'Full Name', 'Role', 'Age Group']],
        body: tableData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 }
        },
        margin: { top: 15 }
    });

    doc.save(filename);
};
