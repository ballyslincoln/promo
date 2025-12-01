import { sql } from '../db';
import type { Announcement } from '../types';

// Ensure the table exists
export const initAnnouncementTable = async () => {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        "expirationDate" TEXT,
        "createdAt" TEXT NOT NULL
      )
    `;
  } catch (error) {
    console.error('Failed to init announcements table:', error);
  }
};

export const getActiveAnnouncement = async (): Promise<Announcement | null> => {
  if (!sql) return null;
  
  try {
    // Fetch the most recent active announcement that hasn't expired
    const now = new Date().toISOString();
    const results = await sql`
      SELECT * FROM announcements 
      WHERE active = true 
      AND ("expirationDate" IS NULL OR "expirationDate" > ${now})
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    
    if (results && results.length > 0) {
      return results[0] as Announcement;
    }
    return null;
  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return null;
  }
};

export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  if (!sql) return [];
  
  try {
    const results = await sql`
      SELECT * FROM announcements 
      ORDER BY "createdAt" DESC
    `;
    return results as Announcement[];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
};

export const createAnnouncement = async (announcement: Announcement): Promise<void> => {
  if (!sql) return;
  
  try {
    await sql`
      INSERT INTO announcements (id, message, type, active, "expirationDate", "createdAt")
      VALUES (${announcement.id}, ${announcement.message}, ${announcement.type}, ${announcement.active}, ${announcement.expirationDate || null}, ${announcement.createdAt})
    `;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const updateAnnouncement = async (announcement: Announcement): Promise<void> => {
    if (!sql) return;
    
    try {
      await sql`
        UPDATE announcements
        SET message = ${announcement.message},
            type = ${announcement.type},
            active = ${announcement.active},
            "expirationDate" = ${announcement.expirationDate || null}
        WHERE id = ${announcement.id}
      `;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
};

export const updateAnnouncementStatus = async (id: string, active: boolean): Promise<void> => {
  if (!sql) return;
  
  try {
    await sql`
      UPDATE announcements 
      SET active = ${active}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error updating announcement status:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  if (!sql) return;

  try {
    await sql`
      DELETE FROM announcements
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}
