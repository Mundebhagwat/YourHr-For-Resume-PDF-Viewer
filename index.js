const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const Port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const database = () => {
    mongoose.connect('mongodb+srv://Bhagwat-Munde:bhagwat900@cluster0.k85vhtd.mongodb.net/MyDataBase')
}
database();

//  The Schema for the user collection
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
})

const User = mongoose.model('abhishek', userSchema);

// PDF Schema for storing pdf files 
const pdfSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    pdf: Buffer,
    contentType: String
})

const Pdf = mongoose.model('Pdf', pdfSchema);

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    }
})

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    const { fullName, email } = req.body;
    const pdf = req.file.buffer; // This should contain the binary data of the PDF file

    const newPdf = new Pdf({
        fullName,
        email,
        pdf: pdf, // Save the binary data here
        contentType: req.file.mimetype // Save the MIME type
    });

    await newPdf.save(); // Save the document to MongoDB
    res.sendStatus(200);
});



app.get('/view-pdf', async (req, res) => {
    const pdfData = await Pdf.findOne().sort({ _id: -1 }).exec();
    if (pdfData) {
        res.contentType(pdfData.contentType); // set the content type 
        // pdfData.contentType: This contains the MIME type of the PDF (e.g., application/pdf).
        // res.contentType(): This method sets the Content-Type HTTP header of the response to application/pdf.
        // Purpose: The browser needs to know how to handle the incoming data. By setting this header, the browser knows to treat the data as a PDF file and will open it in a PDF viewer.
        res.send(pdfData.pdf); // get the buffer data from database
        // pdfData.pdf: This is the Buffer object containing the binary data of the PDF file retrieved from MongoDB.
        // res.send(): This method sends the binary data as the response body to the client.
    } else {
        res.status(404).send('No PDF found');
    }
})

// The request fro the Signup and Login
app.get('/signup', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.post('/signup', async (req, res) => {
    // console.log(req.body)
    const { username, email, password } = req.body;
    const newUser = new User({
        username,
        email,
        password
    })
    try {
        await newUser.save();
        res.json({ success: true });

    } catch (err) {
        res.json({ success: false })
    }
});

app.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await User.findOne({
        email,
        password
    })
    if (foundUser) {
        res.json({ success: true })
    } else {
        res.json({ success: false })
    }
})

// wlcome page on successful Login

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
})

// DB connection 
mongoose.connection.once('open', () => {
    app.listen(Port, () => {
        console.log("Ah we are now connected to moongoDB Atlas");
        console.log(`Server is listing on Port ${Port}...`);
    })
})

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});