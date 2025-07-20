import { shopData } from "../web_dashboard/frontend/src/components/shop/shopData";
import * as path from "path";
import * as sqlite3 from "sqlite3";

const db = new sqlite3.Database(path.resolve(__dirname, "../db/shop.db"));

db.serialize(() => {
  db.run("DELETE FROM shop_items");

  for (const section of shopData) {
    const cat = section.key;
    for (const item of section.items) {
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
  console.log("✅ shop items imported into shop.db");
});
