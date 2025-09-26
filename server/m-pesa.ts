import axios from "axios";

export async function initiateSTKPush(phone: string, amount: number) {
  const shortCode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;

  // Get access token
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const { data: tokenRes } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const accessToken = tokenRes.access_token;

  // Password
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

  // STK push request
  const { data } = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: "AlmarkQuote",
      TransactionDesc: "Quote Payment",
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  console.log("📲 STK Push Response:", data);
  return data;
}
