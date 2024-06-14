const express = require('express');
const multer  = require('multer');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

function encrypt(buffer, key) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return encrypted;
}

function decrypt(buffer, key) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
    return decrypted;
}

app.use(express.static('public'));

app.post('/upload', upload.single('image'), (req, res) => {
    const key = crypto.randomBytes(32);
    const encryptedImage = encrypt(fs.readFileSync(req.file.path), key);
    fs.writeFileSync(`${req.file.path}.enc`, encryptedImage);
    res.send('Image encrypted successfully. Secure key: ' + key.toString('hex'));
});

app.post('/decrypt', upload.single('encryptedImage'), (req, res) => {
    const key = Buffer.from(req.body.key, 'hex');
    try {
        const decryptedImage = decrypt(fs.readFileSync(req.file.path), key);
        res.setHeader('Content-Type', 'image/jpg');
        res.send(decryptedImage);
    } catch (error) {
        res.status(400).send('Invalid key or encrypted image');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});