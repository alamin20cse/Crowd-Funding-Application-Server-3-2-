const express=require('express');
const cors=require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)
const SSLCommerzPayment = require('sslcommerz-lts')
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


 
// Store ID: bistr67ab628c506cc
// Store Password (API/Secret Key): bistr67ab628c506cc@ssl


// Merchant Panel URL: https://sandbox.sslcommerz.com/manage/ (Credential as you inputted in the time of registration)


 
// Store name: testbistrngzj
// Registered URL: www.bistroboss.com
// Session API to generate transaction: https://sandbox.sslcommerz.com/gwprocess/v3/api.php
// Validation API: https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?wsdl
// Validation API (Web Service) name: https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
 
// You may check our plugins available for multiple carts and libraries: https://github.com/sslcommerz








// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const store_id = process.env.STOREID;
const store_passwd = process.env.STOREPASS;
const is_live = false //true for live, false for sandbox



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
  // get all users
  app.get('/allusers',async(req,res)=>{
    const cursor=userCollection.find();
    const result=await cursor.toArray();
    res.send(result);
})

  // get user logged
  app.get('/users',async(req,res)=>{
    const email=req.query.email;
    const query={email:email};

    const result=await userCollection.find(query).toArray();
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


















// ssLC
app.post('/order', async (req, res) => {
  // Generate unique transaction ID
  const transactionId = new ObjectId().toString();

  // Extract payment details from request body
  const { email, name, amount, campaignTitle, campaignId, thumbnail } = req.body;
  const payDetails=req.body;

  const data = {
    total_amount: parseFloat(amount), // Ensure amount is a number
    currency: "BDT",
    tran_id: transactionId, // Unique transaction ID
    success_url: `http://localhost:5000/payment/success/${transactionId}`,
    fail_url: `http://localhost:5000/payment/fail/${transactionId}`,
    cancel_url: "http://localhost:3030/cancel",
    ipn_url: "http://localhost:3030/ipn",
    shipping_method: "Courier",
    product_name: campaignTitle || "Donation",
    product_category: "Donation",
    product_profile: "general",
    cus_name: name || "Anonymous",
    cus_email: email || "unknown@example.com",
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    ship_name: name || "Anonymous",
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: "1000",
    ship_country: "Bangladesh",
  };

  console.log(data);

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  sslcz.init(data).then((apiResponse) => {
    // Redirect the user to payment gateway
    let GatewayPageURL = apiResponse.GatewayPageURL;
    res.send({ url: GatewayPageURL });
const finalpay= {
  email, name, amount, campaignTitle, campaignId, thumbnail,
  paidStatus:false,
  TranstionID: transactionId,

}
const result=paymentCollection.insertOne(finalpay);


    console.log('Redirecting to: ', GatewayPageURL);
  });
});



// ✅ Fix: Move this route outside of '/order' and ensure correct path
app.post('/payment/success/:tranId', async (req, res) => {
  console.log("Transaction ID:", req.params.tranId);

  const result=await paymentCollection.updateOne({TranstionID:req.params.tranId},{$set:{
    paidStatus:true,
  }


  })
  if(result.modifiedCount>0)
  {
    res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)

  }


});



app.post('/payment/fail/:tranId', async (req, res) => {
  console.log("Transaction ID:", req.params.tranId);

  const result=await paymentCollection.deleteOne({TranstionID:req.params.tranId})
  

 if(result.deletedCount>0)
  {
    res.redirect(`http://localhost:5173/payment/fail/${req.params.tranId}`)

  }


});




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