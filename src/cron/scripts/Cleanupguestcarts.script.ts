import database from '@/service/database/index.js';
import logger from '@/service/logger/index.js';

export default async function cleanupGuestCarts() {
  const db = await database.getConnection();

  try {
    logger.info('Starting guest cart cleanup...');

    // Delete cart items from orphaned guest carts older than 30 days
    await db.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (
         SELECT id FROM carts
         WHERE customer_id IS NULL
         AND created_at < NOW() - INTERVAL '30 days'
       )`
    );

    // Delete orphaned guest carts older than 30 days
    const deletedCarts = await db.query(
      `DELETE FROM carts
       WHERE customer_id IS NULL
       AND created_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );

    logger.info(
      `Guest cart cleanup completed. Deleted ${deletedCarts.rowCount} carts and their items.`
    );

    return {
      deleted_carts: deletedCarts.rowCount,
    };
  } catch (error) {
    logger.error('Error during guest cart cleanup:', error);
    throw error;
  } finally {
    db.release();
  }
}
