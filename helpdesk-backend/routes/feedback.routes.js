const router = require('express').Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const c = require('../controllers/feedbackController');

// Route khusus user (Harus didefinisikan dengan jelas)
router.get('/my-tickets', verifyToken, checkRole('Users'), c.getSolvedTickets);
router.get('/my-feedbacks', verifyToken, checkRole('Users'), c.getMyFeedbacks);

// Route admin & create
router.get('/', verifyToken, checkRole('Admin'), c.getAll);
router.post('/', verifyToken, checkRole('Users'), c.create);

module.exports = router;
