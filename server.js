import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

function generateHmac(body) {
  const payload = JSON.stringify(body);
  const hmac = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("base64");
  return hmac;
}

// 🔥 Generate Checkout Token
app.post("/generate-token", async (req, res) => {
  try {
    const body = {
      cart_data: {
        items: [
          {
            variant_id: req.body.variant_id,
            quantity: 1,
          },
        ],
      },
      redirect_url: "https://www.meptoshop.com/p/thank-you.html",
      timestamp: new Date().toISOString(),
    };

    const hmac = generateHmac(body);

    const response = await axios.post(
      "https://checkout-api.shiprocket.com/api/v1/access-token/checkout",
      body,
      {
        headers: {
          "X-Api-Key": API_KEY,
          "X-Api-HMAC-SHA256": hmac,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      token: response.data.result.token,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// 🔥 Order Webhook
app.post("/order-webhook", (req, res) => {
  console.log("New Order:", req.body);
  res.status(200).send("Webhook Received");
});

app.listen(5000, () => console.log("Server running on port 5000"));