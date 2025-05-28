const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const multer = require("multer");
const cors = require("cors");

admin.initializeApp();

const database = admin.database();
const bucket = admin.storage().bucket();

const app = express();
app.use(cors({ origin: true }));

const upload = multer({ storage: multer.memoryStorage() });

app.post("/", upload.any(), async (req, res) => {
  if (!req.body.data) {
    return res.status(400).json({ success: false, error: "Missing data field" });
  }

  let data;
  try {
    data = JSON.parse(req.body.data);
  } catch (e) {
    return res.status(400).json({ success: false, error: "Invalid JSON in data field" });
  }

  const fileUploads = {};

  try {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `uploads/${file.fieldname}_${Date.now()}`;
        const fileUpload = bucket.file(fileName);
        await fileUpload.save(file.buffer, { contentType: file.mimetype });
        await fileUpload.makePublic(); // pastikan storage rules memperbolehkan ini
        fileUploads[file.fieldname] = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      }
    }

    const finalData = { ...data, ...fileUploads };
    await database.ref("orders").push(finalData);

    res.status(200).json({ success: true, message: "Data submitted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.submitForm = functions.https.onRequest(app);
