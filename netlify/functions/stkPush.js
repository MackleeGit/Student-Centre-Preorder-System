// File: netlify/functions/stkPush.mjs
import axios from "axios";

export async function handler(event) {
   console.log("🟡 Function called — top-level log");
  try {
    console.log("📦 Payload Received:", event.body);
    const { phoneNumber, amount } = JSON.parse(event.body);
    console.log("Parsed Payload:", { phoneNumber, amount });

    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;
    const callbackURL = process.env.DARAJA_CALLBACK_URL;
    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;

    // Validate inputs
    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackURL) {
      console.error("❌ Missing required environment variables.");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server misconfiguration. Missing credentials." }),
      };
    }

    // Step 1: Generate access token
    console.log("🔐 Getting Access Token...");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const { data: tokenRes } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    const accessToken = tokenRes.access_token;
    console.log("✅ Access Token:", accessToken);

    // Step 2: Create Timestamp + Password
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    console.log("🧮 Password Generation Details:", {
      shortcode,
      passkey,
      timestamp,
      raw: shortcode + passkey + timestamp,
      password,
    });

    // Step 3: Send STK Push request
    const stkPayload = {
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
      TransactionDesc: "Payment for food order",
    };

    console.log("📤 STK Payload:", stkPayload);

    const { data: stkRes } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ STK Push Success:", stkRes);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "STK Push initiated successfully",
        response: stkRes,
      }),
    };

  } catch (error) {
    console.error("❌ STK Push Error:", {
      message: error.message,
      response: error.response?.data,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.response?.data?.errorMessage || error.message || "STK Push failed",
        raw: error.response?.data || null,
      }),
    };
  }
}
