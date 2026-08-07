import express from 'express';
import ctrl from '../Controllers/watchlistController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';
import { validateCreateWatchlist, validateAddWatchlistItem } from '../Middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/',                                         ctrl.getWatchlists);
router.post('/',          validateCreateWatchlist,      ctrl.createWatchlist);
router.put('/:id',                                      ctrl.updateWatchlist);
router.delete('/:id',                                   ctrl.deleteWatchlist);
router.post('/:id/items', validateAddWatchlistItem,     ctrl.addItem);
router.delete('/:watchlistId/items/:itemId',            ctrl.removeItem);

export default router;