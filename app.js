const express = require('express');
const multer = require('multer');
const ImageKit = require('imagekit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ejs = require('ejs');

const app = express();
dotenv.config()

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.imagekit_PUBLIC_KEY,
    privateKey: process.env.imagekit_PRIVATE_KEY,
    urlEndpoint: process.env.imagekit_URL_ENDPOINT,
 });

// Connect to MongoDB (replace 'your_mongodb_connection_string' with your actual MongoDB connection string)
mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define a MongoDB schema and model
const itemSchema = new mongoose.Schema({
   description: String,
   imageUrl: String,
});

const Item = mongoose.model('Item', itemSchema);

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Define a route to render the form
app.get('/', (req, res) => {
   res.render('upload');
});

// Define a route to handle file uploads and MongoDB save
app.post('/upload', upload.single('image'), async (req, res) => {
   try {
      const fileBuffer = req.file.buffer;
      const description = req.body.description;
      const originalFileName = req.file.originalname;

      const response = await imagekit.upload({
         file: fileBuffer,
         fileName: originalFileName, // You can customize the filename
         folder:"folder_name" //folder name where you want to store you files
      });

      // Save the description and ImageKit URL to MongoDB
      const newItem = new Item({
         description: description,
         imageUrl: response.url,
      });

      await newItem.save();

      // Render success view with the uploaded image URL and MongoDB ID
      res.render('success', { imageUrl: response.url, itemId: newItem._id });
   } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).send('Internal Server Error');
   }
});


// Start the server
app.listen(process.env.PORT, () => {
   console.log(`Server running at http://localhost:${process.env.PORT}`);
});
