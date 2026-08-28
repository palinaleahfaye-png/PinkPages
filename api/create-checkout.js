export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { bookId, amount, sellerId, buyerId } = req.body;

    if (!bookId || !amount || !sellerId || !buyerId) {
      return res.status(400).json({
        error: "Missing payment information"
      });
    }

    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Basic " +
            Buffer.from(
              process.env.PAYMONGO_SECRET_KEY + ":"
            ).toString("base64")
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  currency: "PHP",
                  amount: Math.round(Number(amount) * 100),
                  name: "PinkPages Book",
                  quantity: 1
                }
              ],
              payment_method_types: [
                "gcash",
                "card",
                "paymaya"
              ],
              success_url:
                "https://pink-pages-6eyt.vercel.app",
              cancel_url:
                "https://pink-pages-6eyt.vercel.app"
            }
          }
        })
      }
    );

    const result = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", result);

      return res.status(paymongoResponse.status).json({
        error: "PayMongo error",
        details: result
      });
    }

    const checkoutUrl =
      result?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return res.status(500).json({
        error: "PayMongo did not return a checkout URL"
      });
    }

    return res.status(200).json({
      checkoutUrl
    });

  } catch (error) {
    console.error("Checkout error:", error);

    return res.status(500).json({
      error: "Payment initiation failed"
    });
  }
}
