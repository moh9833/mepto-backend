import express from "express";
import axios from "axios";
import cors from "cors";
import crypto from "crypto";

const app = express();

// 🔥 CORS allow
app.use(cors({
  origin: "https://www.meptoshop.com",
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// 🔗 Google Sheet API
const SHEET_API = "https://script.google.com/macros/s/AKfycbzvxbb0wqHoKT3WaKvapMq9WH3ZGb3qJV5nmqBC5OeOJ1dUEwNQ4tqGK1VLAdxuDEFX/exec";

/* =========================
   SERVER TEST
========================= */

app.get("/", (req,res)=>{
  res.send("Mepto Backend Running ✅");
});

/* =========================
   PRODUCTS API
========================= */

app.get("/products", async (req, res) => {
  try {

    const response = await axios.get(SHEET_API);
    const data = response.data;

    const products = data
      .filter(p => String(p.status).toLowerCase() === "active")
      .map(p => ({
        id: String(p.id),
        title: String(p.title),
        status: "active",
        variants: [
          {
            id: "variant_" + p.id,
            price: String(p.price),
            quantity: parseInt(p.quantity) || 0
          }
        ],
        image: {
          src: String(p.image)
        }
      }));

    res.json({ products });

  } catch (error) {

    console.log("Product error:", error.message);

    res.status(500).json({
      error: "Product fetch failed"
    });

  }
});

/* =========================
   GENERATE TOKEN
========================= */

app.post("/generate-token", async (req,res)=>{

  try{

    const {variant_id} = req.body;

    if(!variant_id){
      return res.status(400).json({
        success:false,
        message:"variant_id required"
      });
    }

    const payload = { variant_id };

    const hmac = crypto
      .createHmac("sha256", process.env.SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/checkout/token",
      payload,
      {
        headers:{
          "Content-Type":"application/json",
          "X-API-KEY":process.env.API_KEY,
          "X-HMAC-SHA256":hmac
        }
      }
    );

    res.json({
      success:true,
      token:response.data.token
    });

  }catch(error){

    console.log("Shiprocket Error:",error.response?.data || error.message);

    res.status(500).json({
      success:false,
      error:error.response?.data || error.message
    });

  }

});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log("Server running on",PORT);
});
