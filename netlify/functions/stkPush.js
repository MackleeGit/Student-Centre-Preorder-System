import axios from "axios";

export async function handler(event) {
  try {
    const { phoneNumber, amount } = JSON.parse(event.body);

    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;
    const callbackURL = process.env.DARAJA_CALLBACK_URL;


    // Step 1: Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const { data: tokenRes } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` }
      }
    );
    const accessToken = tokenRes.access_token;

    // Step 2: Timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    // Step 3: STK push
    const stkPushRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackURL,
        AccountReference: "STC_Order",
        TransactionDesc: "Payment for food order"
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "STK Push initiated successfully",
        response: stkPushRes.data
      })
    };
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.response?.data?.errorMessage || error.message || "STK Push failed",
        details: error.response?.data || null
      })
    };
  }
}
