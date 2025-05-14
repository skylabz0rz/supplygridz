import express from 'express';
import adminRoutes from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';
import playersAPI from './api/players.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/players', playersAPI);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/admin', adminRoutes);

const PORT = 5050;
app.listen(PORT, () => console.log(`🛠️ Admin panel live at http://localhost:${PORT}/admin`));
