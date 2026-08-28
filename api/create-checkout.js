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

    const response = await fetch(
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
              description: "PinkPages Book Purchase"
            }
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("PayMongo:", result);

      return res.status(response.status).json({
        error: "PayMongo error",
        details: result
      });
    }

    const checkoutUrl =
      result?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return res.status(500).json({
        error: "No checkout URL returned"
      });
    }

    return res.status(200).json({
      checkoutUrl
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}

