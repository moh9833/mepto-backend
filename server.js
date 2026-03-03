import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔗 Your Apps Script URL
const SHEET_API = "https://script.google.com/macros/s/AKfycbzvxbb0wqHoKT3WaKvapMq9WH3ZGb3qJV5nmqBC5OeOJ1dUEwNQ4tqGK1VLAdxuDEFX/exec";

/* =========================
   1️⃣ PRODUCTS API
========================= */

app.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const response = await axios.get(SHEET_API);
    const allProductsRaw = response.data;

    // Filter active products
    const activeProducts = allProductsRaw.filter(
      (p) => String(p.status).toLowerCase() === "active"
    );

    // Pagination logic
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = activeProducts.slice(start, end);

    // Format for Shiprocket
    const formattedProducts = paginated.map((p) => ({
      id: String(p.id),
      title: String(p.title),
      body_html: "",
      vendor: "Mepto",
      product_type: p.collection || "General",
      status: "active",
      variants: [
        {
          id: "variant_" + p.id,
          title: "Default",
          price: String(p.price),
          quantity: parseInt(p.quantity) || 0,
          sku: String(p.sku),
          weight: parseFloat(p.weight) || 0,
          image: {
            src: String(p.image)
          }
        }
      ],
      image: {
        src: String(p.image)
      }
    }));

    res.json({
      products: formattedProducts,
      total: activeProducts.length,
      page: page,
      limit: limit
    });

  } catch (error) {
    console.error("Product Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


/* =========================
   2️⃣ COLLECTIONS API
========================= */

app.get("/collections", async (req, res) => {
  try {
    const response = await axios.get(SHEET_API);
    const data = response.data;

    const collections = [
      ...new Set(
        data
          .filter(p => String(p.status).toLowerCase() === "active")
          .map(p => p.collection || "General")
      )
    ];

    const formatted = collections.map((c) => ({
      id: String(c),
      title: String(c),
      body_html: "",
      image: { src: "" }
    }));

    res.json({ collections: formatted });

  } catch (error) {
    console.error("Collections Error:", error.message);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});


/* =========================
   3️⃣ COLLECTION PRODUCTS
========================= */

app.get("/collection-products", async (req, res) => {
  try {
    const collectionId = req.query.collection_id;

    if (!collectionId) {
      return res.status(400).json({ error: "collection_id required" });
    }

    const response = await axios.get(SHEET_API);
    const data = response.data;

    const filtered = data
      .filter(
        (p) =>
          String(p.status).toLowerCase() === "active" &&
          String(p.collection) === collectionId
      )
      .map((p) => ({
        id: String(p.id)
      }));

    res.json({ products: filtered });

  } catch (error) {
    console.error("Collection Products Error:", error.message);
    res.status(500).json({ error: "Failed to fetch collection products" });
  }
});


/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
