import database from '@/service/database/index.js';
import logger from '@/service/logger/index.js';

export default async function cleanupExpiredTokens() {
  const db = await database.getConnection();

  try {
    logger.info('Starting expired tokens cleanup...');

    // Delete expired tokens
    const result = await db.query(
      'DELETE FROM tokens WHERE expires_at < NOW() RETURNING token'
    );

    logger.info(`Expired tokens cleanup completed. Deleted ${result.rowCount} tokens.`);

    return {
      deleted_tokens: result.rowCount,
    };
  } catch (error) {
    logger.error('Error during expired tokens cleanup:', error);
    throw error;
  } finally {
    db.release();
  }
}
