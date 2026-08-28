import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body.data;

  // Process completed checkout session event
  if (event.attributes.type === 'checkout_session.payment.paid') {
    const session = event.attributes.data.attributes;
    const { bookId, sellerId, buyerId } = session.metadata;
    const amount = session.line_items[0].amount / 100;

    await supabase.from('orders').insert([{
      buyer_id: buyerId,
      seller_id: sellerId,
      book_id: bookId,
      amount: amount,
      status: 'paid',
      paymongo_checkout_id: session.id
    }]);
  }

  return res.status(200).json({ received: true });
}