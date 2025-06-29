// Import library yang dibutuhkan
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Port untuk server

// Middleware (Fungsi perantara)
app.use(cors()); // Izinkan request dari domain lain (frontend Anda)
app.use(express.json({ limit: '50mb' })); // Agar server bisa menerima data JSON dan menaikkan limit untuk gambar
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Agar server bisa memahami data dari form

// --- Koneksi ke Database MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Sukses terhubung ke MongoDB Atlas'))
    .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// --- Mongoose Schemas (Blueprint/Struktur Data di Database) ---
// Fungsi ini membantu kita membuat schema dengan rapi
const createGenericSchema = (definition) => new mongoose.Schema(definition, { timestamps: true });

// Schema untuk setiap bagian dari portofolio Anda
const HeroSchema = createGenericSchema({
    preTitle: String,
    name: String,
    highlight: String,
    description: String,
    imageData: String, // Gambar disimpan sebagai teks panjang (Base64)
});

const ItemSchema = createGenericSchema({
    title: String,
    description: String,
    tags: [String],
    imageData: String,
});

const EducationSchema = createGenericSchema({ title: String, degree: String, years: String });
const ExperienceSchema = createGenericSchema({ title: String, company: String });
const OrganizationSchema = createGenericSchema({ name: String, role: String });
const ActivitySchema = createGenericSchema({ title: String, description: String });
const SkillSchema = createGenericSchema({ name: String });

// --- Mongoose Models (Objek untuk berinteraksi dengan tabel/collection di DB) ---
const Hero = mongoose.model('Hero', HeroSchema);
const Portfolio = mongoose.model('Portfolio', ItemSchema);
const Article = mongoose.model('Article', ItemSchema);
const Education = mongoose.model('Education', EducationSchema);
const Experience = mongoose.model('Experience', ExperienceSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);
const Activity = mongoose.model('Activity', ActivitySchema);
const Skill = mongoose.model('Skill', SkillSchema);


// --- API Endpoint Factory (Pabrik URL API) ---
// Fungsi ini secara otomatis membuatkan kita endpoint GET, POST, PUT, DELETE untuk setiap model
function createCrudEndpoints(model) {
    const router = express.Router();

    // GET: Mengambil semua data
    router.get('/', async (req, res) => {
        try {
            const items = await model.find().sort({ createdAt: -1 }); // Ambil & urutkan dari yang terbaru
            res.json(items);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // POST: Membuat data baru
    router.post('/', async (req, res) => {
        const item = new model(req.body);
        try {
            const newItem = await item.save();
            res.status(201).json(newItem);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });
    
    // PUT: Memperbarui data berdasarkan ID
    router.put('/:id', async (req, res) => {
        try {
            const updatedItem = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedItem);
        } catch(err){
            res.status(400).json({ message: err.message });
        }
    });

    // DELETE: Menghapus data berdasarkan ID
    router.delete('/:id', async (req, res) => {
         try {
            const deletedItem = await model.findByIdAndDelete(req.params.id);
            if (!deletedItem) return res.status(404).json({ message: 'Item tidak ditemukan' });
            res.json({ message: 'Item berhasil dihapus' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });
    
    return router;
}

// --- API Endpoints Spesifik ---

// Endpoint untuk Hero Section (karena hanya ada satu data, tidak perlu CRUD lengkap)
app.get('/api/hero', async (req, res) => {
    try {
        const heroData = await Hero.findOne(); // Cari satu saja
        res.json(heroData || {});
    } catch(err) { res.status(500).json({ message: err.message }) }
});
app.post('/api/hero', async (req, res) => {
    try {
        // "upsert": update jika ada, buat baru jika tidak ada
        const heroData = await Hero.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(heroData);
    } catch(err) { res.status(400).json({ message: err.message }) }
});

// Endpoint untuk Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.status(200).json({ success: true, message: 'Login berhasil' });
    } else {
        res.status(401).json({ success: false, message: 'Password salah' });
    }
});


// --- Daftarkan semua URL API menggunakan "Pabrik" yang kita buat ---
app.use('/api/portfolio', createCrudEndpoints(Portfolio));
app.use('/api/articles', createCrudEndpoints(Article));
app.use('/api/education', createCrudEndpoints(Education));
app.use('/api/experience', createCrudEndpoints(Experience));
app.use('/api/organization', createCrudEndpoints(Organization));
app.use('/api/activity', createCrudEndpoints(Activity));
app.use('/api/skills', createCrudEndpoints(Skill));

// Export aplikasi Express agar bisa dijalankan oleh Vercel
module.exports = app;