const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.resolve(__dirname, "../db/shop.db"));

const shopData = [
  {
    key: "tags",
    name: "Tags",
    description: "Visual titles for your profile",
    items: [
      {
        key: "verified",
        name: "Verified",
        description: "A checkmark tag that shows trust",
        price: 500,
        type: "tag",
      },
      {
        key: "founder",
        name: "Founder",
        description: "Early supporter badge",
        price: 1500,
        type: "tag",
      },
    ],
  },
  {
    key: "roles",
    name: "Roles",
    description: "Access and premium features",
    items: [
      {
        key: "premium",
        name: "Premium Member",
        description: "Unlocks all premium features",
        price: 1200,
        type: "role",
      },
    ],
  },
  {
    key: "cosmetics",
    name: "Cosmetics",
    description: "Profile and avatar styling",
    items: [
      {
        key: "aquaGlow",
        name: "Aqua Glow Frame",
        description: "Makes your avatar glow in neon",
        price: 300,
        type: "frame",
      },
    ],
  },
];

db.serialize(() => {
  db.run("DELETE FROM shop_items");

  for (const category of shopData) {
    const cat = category.key;
    for (const item of category.items) {
      db.run(
        `INSERT INTO shop_items (id, category, name, description, price, type, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${cat}:${item.key}`,
          cat,
          item.name,
          item.description,
          item.price,
          item.type || "tag",
          JSON.stringify({ key: item.key }),
        ]
      );
    }
  }
});

db.close(() => {
  console.log("✅ shop.db populated with static values from shopData.");
});
