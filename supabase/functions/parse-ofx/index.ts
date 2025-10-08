import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseOfxPayload {
  documentId: string;
  clientId: string;
}

// Supabase client with Service Role Key (server-side only - NEVER expose to client)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are supported." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let payload: ParseOfxPayload;

  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate required fields
  if (!payload.documentId || !payload.clientId) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: documentId, clientId.",
      }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { documentId, clientId } = payload;

  console.log("Starting OFX parse", { documentId, clientId });

  try {
    // 1. Fetch document metadata from database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // 2. Update status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // 3. Download file from Storage (RLS-scoped)
    const { data: fileData, error: storageError } = await supabase.storage
      .from("documents")
      .download(document.storage_path);

    if (storageError || !fileData) {
      throw new Error(`Failed to download file: ${storageError?.message}`);
    }

    // 4. Read OFX content
    const ofxContent = await fileData.text();

    // 5. Parse OFX (SGML format)
    const transactions = parseOfxTransactions(ofxContent, document, clientId);

    // 6. Insert transactions into database (with duplicate check)
    let insertedCount = 0;
    let skippedCount = 0;

    for (const transaction of transactions) {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from("bank_transactions")
        .select("id")
        .eq("client_id", clientId)
        .eq("account_id", transaction.account_id)
        .eq("transaction_id", transaction.transaction_id)
        .single();

      if (existing) {
        skippedCount++;
        continue;
      }

      // Insert new transaction
      const { error: insertError } = await supabase
        .from("bank_transactions")
        .insert(transaction);

      if (insertError) {
        console.error("Failed to insert transaction:", insertError);
        continue;
      }

      insertedCount++;
    }

    // 7. Update document status to completed
    await supabase
      .from("documents")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        metadata: {
          transactions_total: transactions.length,
          transactions_inserted: insertedCount,
          transactions_skipped: skippedCount,
        },
      })
      .eq("id", documentId);

    console.log("OFX parse completed", {
      documentId,
      total: transactions.length,
      inserted: insertedCount,
      skipped: skippedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactions_total: transactions.length,
        transactions_inserted: insertedCount,
        transactions_skipped: skippedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("OFX parse error:", error);

    // Update document status to failed
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: error.message,
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

// Helper function to extract value from OFX tag
function getOfxValue(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]+)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

// Helper function to parse OFX date (YYYYMMDD or YYYYMMDDHHMMSS)
function parseOfxDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  // Remove timezone info if present
  const cleanDate = dateStr.split("[")[0];
  
  // Extract date parts
  const year = cleanDate.substring(0, 4);
  const month = cleanDate.substring(4, 6);
  const day = cleanDate.substring(6, 8);
  
  return `${year}-${month}-${day}`;
}

// Helper function to parse OFX amount
function parseOfxAmount(amountStr: string): number {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(",", "."));
}

// Parse OFX transactions from SGML format
function parseOfxTransactions(ofxContent: string, document: any, clientId: string) {
  const transactions: any[] = [];

  // Extract account info
  const bankId = getOfxValue(ofxContent, "BANKID");
  const branchId = getOfxValue(ofxContent, "BRANCHID");
  const accountId = getOfxValue(ofxContent, "ACCTID");
  const accountType = getOfxValue(ofxContent, "ACCTTYPE");

  // Map OFX account type to our enum
  const mappedAccountType = accountType.toLowerCase() === "savings" 
    ? "savings" 
    : accountType.toLowerCase() === "creditline" 
    ? "investment" 
    : "checking";

  // Split by STMTTRN tags to get individual transactions
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  const matches = ofxContent.matchAll(stmtTrnRegex);

  for (const match of matches) {
    const transactionBlock = match[1];

    const trnType = getOfxValue(transactionBlock, "TRNTYPE");
    const dtPosted = getOfxValue(transactionBlock, "DTPOSTED");
    const trnAmt = getOfxValue(transactionBlock, "TRNAMT");
    const fitId = getOfxValue(transactionBlock, "FITID");
    const checkNum = getOfxValue(transactionBlock, "CHECKNUM");
    const memo = getOfxValue(transactionBlock, "MEMO");
    const name = getOfxValue(transactionBlock, "NAME");

    const amount = parseOfxAmount(trnAmt);
    const type = amount >= 0 ? "credit" : "debit";

    transactions.push({
      document_id: document.id,
      client_id: clientId,
      user_id: document.user_id,
      transaction_id: fitId,
      fit_id: fitId,
      account_id: accountId,
      account_type: mappedAccountType,
      bank_code: bankId || null,
      branch_code: branchId || null,
      transaction_date: parseOfxDate(dtPosted),
      post_date: parseOfxDate(dtPosted),
      amount: Math.abs(amount),
      type: type,
      balance: null, // OFX may not always include balance per transaction
      description: memo || name || trnType,
      memo: memo || null,
      payee: name || null,
      check_number: checkNum || null,
      reconciled: false,
    });
  }

  return transactions;
}

