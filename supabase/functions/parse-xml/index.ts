import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseXmlPayload {
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

  let payload: ParseXmlPayload;

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

  console.log("Starting XML parse", { documentId, clientId });

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

    // 4. Read XML content
    const xmlContent = await fileData.text();

    // 5. Parse XML with DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    if (!xmlDoc) {
      throw new Error("Failed to parse XML");
    }

    // 6. Extract invoice data from XML
    const invoiceData = extractInvoiceData(xmlDoc, document, clientId);
    const items = extractInvoiceItems(xmlDoc);

    // 7. Insert invoice into database
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to insert invoice: ${invoiceError.message}`);
    }

    // 8. Insert invoice items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map((item) => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        throw new Error(`Failed to insert items: ${itemsError.message}`);
      }
    }

    // 9. Update document status to completed
    await supabase
      .from("documents")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        metadata: {
          invoice_id: invoice.id,
          items_count: items.length,
        },
      })
      .eq("id", documentId);

    console.log("XML parse completed", {
      documentId,
      invoiceId: invoice.id,
      itemsCount: items.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice.id,
        items_count: items.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("XML parse error:", error);

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

// Helper function to safely get text content from XML element
function getTextContent(element: Element | null, selector: string): string {
  const el = element?.querySelector(selector);
  return el?.textContent?.trim() || "";
}

// Helper function to safely parse float from XML
function parseAmount(element: Element | null, selector: string): number {
  const text = getTextContent(element, selector);
  return text ? parseFloat(text) : 0;
}

// Extract invoice data from NF-e XML
function extractInvoiceData(xmlDoc: Document, document: any, clientId: string) {
  const nfeProc = xmlDoc.querySelector("nfeProc");
  const nfe = nfeProc?.querySelector("NFe");
  const infNFe = nfe?.querySelector("infNFe");
  const ide = infNFe?.querySelector("ide");
  const emit = infNFe?.querySelector("emit");
  const dest = infNFe?.querySelector("dest");
  const total = infNFe?.querySelector("total");
  const ICMSTot = total?.querySelector("ICMSTot");

  return {
    document_id: document.id,
    client_id: clientId,
    user_id: document.user_id,

    // Identification
    invoice_number: getTextContent(ide, "nNF"),
    series: getTextContent(ide, "serie"),
    xml_key: infNFe?.getAttribute("Id")?.replace("NFe", "") || "",

    // Type and dates
    type: "incoming" as const, // TODO: Determine based on CNPJ comparison
    issue_date: getTextContent(ide, "dhEmi").split("T")[0] || new Date().toISOString().split("T")[0],
    operation_date: getTextContent(ide, "dhSaiEnt")?.split("T")[0] || null,

    // Supplier (Emitente)
    supplier_cnpj: getTextContent(emit, "CNPJ") || null,
    supplier_cpf: getTextContent(emit, "CPF") || null,
    supplier_name: getTextContent(emit, "xNome"),
    supplier_state: getTextContent(emit, "enderEmit UF") || null,
    supplier_city: getTextContent(emit, "enderEmit xMun") || null,

    // Customer (Destinatário)
    customer_cnpj: getTextContent(dest, "CNPJ") || null,
    customer_cpf: getTextContent(dest, "CPF") || null,
    customer_name: getTextContent(dest, "xNome") || null,
    customer_state: getTextContent(dest, "enderDest UF") || null,
    customer_city: getTextContent(dest, "enderDest xMun") || null,

    // Amounts
    total_amount: parseAmount(ICMSTot, "vNF"),
    discount_amount: parseAmount(ICMSTot, "vDesc"),
    freight_amount: parseAmount(ICMSTot, "vFrete"),
    insurance_amount: parseAmount(ICMSTot, "vSeg"),
    other_expenses: parseAmount(ICMSTot, "vOutro"),
    net_amount: parseAmount(ICMSTot, "vNF"),

    // Taxes
    icms_base: parseAmount(ICMSTot, "vBC"),
    icms_amount: parseAmount(ICMSTot, "vICMS"),
    icms_st_amount: parseAmount(ICMSTot, "vST"),
    ipi_amount: parseAmount(ICMSTot, "vIPI"),
    pis_amount: parseAmount(ICMSTot, "vPIS"),
    cofins_amount: parseAmount(ICMSTot, "vCOFINS"),
    iss_amount: 0, // NFSe only

    // Operation nature
    operation_nature: getTextContent(ide, "natOp") || null,
    cfop: getTextContent(ide, "CFOP") || null,

    // Status
    status: "draft" as const,
    notes: null,
  };
}

// Extract invoice items from NF-e XML
function extractInvoiceItems(xmlDoc: Document) {
  const items: any[] = [];
  const dets = xmlDoc.querySelectorAll("det");

  dets.forEach((det, index) => {
    const prod = det.querySelector("prod");
    const imposto = det.querySelector("imposto");
    const ICMS = imposto?.querySelector("ICMS");
    const IPI = imposto?.querySelector("IPI");
    const PIS = imposto?.querySelector("PIS");
    const COFINS = imposto?.querySelector("COFINS");

    // Get ICMS values from any CST variant (ICMS00, ICMS10, ICMS20, etc.)
    const icmsVariant = ICMS?.querySelector("[vICMS]");
    const icmsBase = ICMS?.querySelector("[vBC]");

    items.push({
      item_number: index + 1,
      product_code: getTextContent(prod, "cProd") || null,
      product_description: getTextContent(prod, "xProd"),
      ncm: getTextContent(prod, "NCM") || null,
      cest: getTextContent(prod, "CEST") || null,
      cfop: getTextContent(prod, "CFOP") || null,
      quantity: parseAmount(prod, "qCom"),
      unit: getTextContent(prod, "uCom") || null,
      unit_price: parseAmount(prod, "vUnCom"),
      total_price: parseAmount(prod, "vProd"),
      discount: parseAmount(prod, "vDesc"),

      // Taxes (simplified - may need adjustment for different CSTs)
      icms_base: icmsBase ? parseFloat(icmsBase.textContent || "0") : 0,
      icms_rate: 0, // Would need to extract from specific CST
      icms_amount: icmsVariant ? parseFloat(icmsVariant.textContent || "0") : 0,
      ipi_rate: parseAmount(IPI, "pIPI"),
      ipi_amount: parseAmount(IPI, "vIPI"),
      pis_rate: parseAmount(PIS, "pPIS"),
      pis_amount: parseAmount(PIS, "vPIS"),
      cofins_rate: parseAmount(COFINS, "pCOFINS"),
      cofins_amount: parseAmount(COFINS, "vCOFINS"),
    });
  });

  return items;
}
