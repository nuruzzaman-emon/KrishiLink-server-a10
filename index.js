const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require("./firebase-service-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.senxjb2.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());

const middlewar = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // console.log(decoded);

    next();
  } catch (error) {
    return res.status.send({ message: "unauthorized access" });
  }
};

app.get("/", (req, res) => {
  res.send("Krish Link Server is Running");
});

async function run() {
  try {
    await client.connect();
    const krishDB = client.db("krish_db");
    const usersCollection = krishDB.collection("users");
    const cropsCollection = krishDB.collection("crops");
    const interestsCollection = krishDB.collection("interests");
    // for home
    app.get("/latest-crops", async (req, res) => {
      const result = await cropsCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    // for allCrops
    app.get("/allcrops", async (req, res) => {
      const result = await cropsCollection.find().toArray();
      res.send(result);
    });

    app.post("/allcrops", async (req, res) => {
      const newCrop = req.body;
      const result = await cropsCollection.insertOne(newCrop);
      res.send(result);
    });

    app.get("/allcrops/:id", middlewar, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const crop = await cropsCollection.findOne(query);
      res.send(crop);
    });

    app.post("/users", async (req, res) => {
      const newuser = { name: "emon", age: "25" };
      const result = await usersCollection.insertOne(newuser);
      res.send(result);
    });

    app.get("/mypost", middlewar, async (req, res) => {
      const email = req.query.email;
      const result = await cropsCollection
        .find({ "owner.ownerEmail": email })
        .toArray();
      res.send(result);
    });

    app.post("/myinterest", middlewar, async (req, res) => {
      const newInterest = req.body;
      const result = await interestsCollection.insertOne(newInterest);
      res.send(result);
    });

    app.get("/myinterest", middlewar, async (req, res) => {
      const email = req.query.email;
      const result = await interestsCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    app.get("/product-interests/:id", async (req, res) => {
      const id = req.params.id;
      const params = { cropId: id };
      const result = await interestsCollection.find(params).toArray();
      res.send(result);
    });

    app.patch("/product-interests/:id", middlewar, async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const updateData = req.body;
      const result = await interestsCollection.updateOne(id, {
        $set: updateData,
      });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("KrishLink server connected to mongodb");
  } catch (error) {
    console.log(error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`KrishLink server is running on port${port}`);
});
