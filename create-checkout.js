export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { bookId, amount, sellerId, buyerId } = req.body;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64')}`
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [{
            amount: Math.round(amount * 100), // convert to centavos
            currency: 'PHP',
            quantity: 1,
            name: 'PinkPages Book Purchase'
          }],
          payment_method_types: ['gcash', 'card', 'paymaya'],
          success_url: 'https://your-vercel-domain.vercel.app/#dashboard',
          cancel_url: 'https://your-vercel-domain.vercel.app/#browse',
          metadata: { bookId, sellerId, buyerId }
        }
      }
    })
  };

  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
    const data = await response.json();
    return res.status(200).json({ checkoutUrl: data.data.attributes.checkout_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}