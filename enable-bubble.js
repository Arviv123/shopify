const SHOP = "arviv-dev-shop.myshopify.com";
const TOKEN = "shpat_XXXXXXXXXXXX";   // שים כאן את ה-Admin API Access Token האמיתי שלך
const EXT = "chat-bubble";

(async () => {
  try {
    const r = await fetch(`https://${SHOP}/admin/api/2025-07/themes.json`, {
      headers: { "X-Shopify-Access-Token": TOKEN }
    });
    const d = await r.json();
    const t = d.themes.find(x => x.role === "main");
    if (!t) throw new Error("❌ לא נמצאה תבנית ראשית");

    const r2 = await fetch(
      `https://${SHOP}/admin/api/2025-07/themes/${t.id}/assets.json?asset[key]=config/settings_data.json`,
      { headers: { "X-Shopify-Access-Token": TOKEN } }
    );
    const d2 = await r2.json();
    let s = JSON.parse(d2.asset.value);

    s.current.blocks = s.current.blocks || {};
    s.current.blocks[EXT] = { type: `apps.${EXT}`, disabled: false };

    await fetch(
      `https://${SHOP}/admin/api/2025-07/themes/${t.id}/assets.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: {
            key: "config/settings_data.json",
            value: JSON.stringify(s, null, 2),
          },
        }),
      }
    );

    console.log("✅ ה־chat-bubble הופעל בהצלחה!");
  } catch (err) {
    console.error("❌ שגיאה:", err.message);
  }
})();
