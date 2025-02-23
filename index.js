const express=require('express');
const cors=require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)
const port =process.env.PORT || 5000;

const corsOption = {
  origin: [
    'http://localhost:5173',
    

  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// middleWare
app.use(cors(corsOption));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uslpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection=client.db('CrowdFundingDB').collection('users');
    const campignCollection=client.db('CrowdFundingDB').collection('campain');
    const paymentCollection=client.db('CrowdFundingDB').collection('payments');
    




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    
    app.post('/users',async(req,res)=>{
      const newUser=req.body;
      // console.log(newUser);
      const result=await userCollection.insertOne(newUser);
      res.send(result);
  
  })

  
  app.post('/campign',async(req,res)=>{
    const newCampign=req.body;
    console.log(newCampign);
    const result=await campignCollection.insertOne(newCampign);
    res.send(result);
   
})
// get all campains
app.get('/allcampign',async(req,res)=>{
    const cursor=campignCollection.find();
    const result=await cursor.toArray();
    res.send(result);


})

 // for update
 app.get('/allcampign/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await campignCollection.findOne(query);
    res.send(result);
  });











  


// Payment intent 
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { price } = req.body;

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: "Invalid price value" });
    }

    const amount = parseInt(price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card']
    });



    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// payment information
app.post('/payments',async(req,res)=>{
  const payment=req.body;
  const result=await paymentCollection.insertOne(payment);
  res.send(result);

})














    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);














app.get('/',(req,res)=>{
    res.send('crowd funding running   .. ');
});

app.listen(port,()=>{

    console.log(`crowd funding is running on port :${port}`);

})