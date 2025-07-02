export async function handler(event) {
  try {
    console.log("Received M-Pesa Callback:", event.body);
    
    const callbackData = JSON.parse(event.body);
    
    // Process the callback data
    if (callbackData.Body && callbackData.Body.stkCallback) {
      const stkCallback = callbackData.Body.stkCallback;
      
      if (stkCallback.ResultCode === 0) {
        // Payment was successful
        console.log("Payment successful:", stkCallback);
        
        // Here you could update the order status in Supabase
        // const { supabase } = require('@supabase/supabase-js');
        // Update order status to 'paid' or 'confirmed'
        
      } else {
        // Payment failed
        console.log("Payment failed:", stkCallback.ResultDesc);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Callback processed successfully" })
    };
  } catch (error) {
    console.error("Callback processing error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Callback processing failed" })
    };
  }
}