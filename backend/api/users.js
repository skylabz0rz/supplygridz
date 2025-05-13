import express from 'express';
import { users } from '../data/db.js';

const router = express.Router();

// GET all users
router.get('/', (req, res) => {
  res.json(users);
});

// PATCH update user (role, money, vouchers)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { role, money, vouchers } = req.body;

  const user = users.find(u => u.id === parseInt(id));
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (role) user.role = role;
  if (money !== undefined) user.money = money;
  if (vouchers !== undefined) user.vouchers = vouchers;

  res.json(user);
});

export default router;
