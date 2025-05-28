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

// Pakai multer untuk parsing file
const upload = multer({ storage: multer.memoryStorage() });

app.post("/", upload.any(), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data); // data asli dari form
    const fileUploads = {};

    for (const file of req.files) {
      const fileName = `uploads/${file.fieldname}_${Date.now()}`;
      const fileUpload = bucket.file(fileName);
      await fileUpload.save(file.buffer, { contentType: file.mimetype });
      await fileUpload.makePublic(); // optional
      fileUploads[file.fieldname] = fileUpload.publicUrl(); // public link
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
