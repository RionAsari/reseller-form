const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const database = admin.database();
const storage = admin.storage();

exports.submitForm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const data = req.body;

      const ref = database.ref("orders");
      await ref.push(data);

      return res.status(200).send({ success: true, message: "Data submitted" });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({ success: false, error: error.message });
    }
  });
});
