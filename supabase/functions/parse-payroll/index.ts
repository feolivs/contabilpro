import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseCSV } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayrollParsePayload {
  documentId: string;
  clientId: string;
  fileContent: string; // Base64 encoded
  fileName: string;
  referenceMonth: number;
  referenceYear: number;
  config?: {
    inssEmployerEnabled?: boolean;
    fgtsEnabled?: boolean;
  };
}

interface PayrollSummary {
  totalEmployees: number;
  totalGrossSalary: number;
  totalInssEmployee: number;
  totalInssEmployer: number;
  totalFgts: number;
  totalIrrf: number;
  totalOtherDiscounts: number;
  totalNetSalary: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================================================
    // AUTENTICAÇÃO E VALIDAÇÃO
    // ============================================================================

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ✅ Client pass-through com JWT do usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // ✅ Extrair userId do JWT
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    // Parse payload
    const payload: PayrollParsePayload = await req.json();

    console.log("Payroll parse request", {
      documentId: payload.documentId,
      clientId: payload.clientId,
      userId: userId,
      fileName: payload.fileName,
      reference: `${payload.referenceMonth}/${payload.referenceYear}`,
      timestamp: new Date().toISOString(),
    });

    // ============================================================================
    // VALIDAR ACESSO AO CLIENTE
    // ============================================================================

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("client_id", payload.clientId)
      .single();

    if (membershipError || !membership) {
      throw new Error("Unauthorized: User does not have access to this client");
    }

    // ============================================================================
    // DECODIFICAR E PARSEAR ARQUIVO
    // ============================================================================

    const fileContent = atob(payload.fileContent);
    const fileName = payload.fileName.toLowerCase();

    let summary: PayrollSummary;

    if (fileName.endsWith(".csv")) {
      summary = await parseCSVPayroll(fileContent, payload.config);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // TODO: Implementar parser Excel
      throw new Error("Excel parsing not yet implemented. Please use CSV format.");
    } else {
      throw new Error("Unsupported file format. Please use CSV or Excel.");
    }

    // ============================================================================
    // PERSISTIR NO BANCO
    // ============================================================================

    const { data: payrollSummary, error: insertError } = await supabase
      .from("payroll_summaries")
      .insert({
        document_id: payload.documentId,
        client_id: payload.clientId,
        user_id: userId,
        reference_month: payload.referenceMonth,
        reference_year: payload.referenceYear,
        total_employees: summary.totalEmployees,
        total_gross_salary: summary.totalGrossSalary,
        total_inss_employee: summary.totalInssEmployee,
        total_inss_employer: summary.totalInssEmployer,
        total_fgts: summary.totalFgts,
        total_irrf: summary.totalIrrf,
        total_other_discounts: summary.totalOtherDiscounts,
        total_net_salary: summary.totalNetSalary,
        inss_employer_enabled: payload.config?.inssEmployerEnabled ?? true,
        fgts_enabled: payload.config?.fgtsEnabled ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payroll summary", insertError);
      throw new Error(`Failed to save payroll data: ${insertError.message}`);
    }

    console.log("Payroll parsed successfully", {
      payrollSummaryId: payrollSummary.id,
      totalEmployees: summary.totalEmployees,
      totalGrossSalary: summary.totalGrossSalary,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payrollSummary: payrollSummary,
        summary: summary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Payroll parse error", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.constructor.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================================================
// PARSER CSV
// ============================================================================

async function parseCSVPayroll(
  content: string,
  config?: { inssEmployerEnabled?: boolean; fgtsEnabled?: boolean }
): Promise<PayrollSummary> {
  const records = parseCSV(content, {
    skipFirstRow: true, // Assume primeira linha é cabeçalho
    columns: [
      "employee_code",
      "employee_name",
      "gross_salary",
      "inss_employee",
      "irrf",
      "other_discounts",
      "net_salary",
    ],
  });

  if (!records || records.length === 0) {
    throw new Error("CSV file is empty or invalid");
  }

  let totalEmployees = 0;
  let totalGrossSalary = 0;
  let totalInssEmployee = 0;
  let totalInssEmployer = 0;
  let totalFgts = 0;
  let totalIrrf = 0;
  let totalOtherDiscounts = 0;
  let totalNetSalary = 0;

  for (const record of records) {
    const grossSalary = parseFloat(record.gross_salary) || 0;
    const inssEmployee = parseFloat(record.inss_employee) || 0;
    const irrf = parseFloat(record.irrf) || 0;
    const otherDiscounts = parseFloat(record.other_discounts) || 0;
    const netSalary = parseFloat(record.net_salary) || 0;

    // Calcular INSS Patronal (20% do salário bruto, se habilitado)
    const inssEmployer = config?.inssEmployerEnabled !== false
      ? grossSalary * 0.20
      : 0;

    // Calcular FGTS (8% do salário bruto, se habilitado)
    const fgts = config?.fgtsEnabled !== false ? grossSalary * 0.08 : 0;

    totalEmployees++;
    totalGrossSalary += grossSalary;
    totalInssEmployee += inssEmployee;
    totalInssEmployer += inssEmployer;
    totalFgts += fgts;
    totalIrrf += irrf;
    totalOtherDiscounts += otherDiscounts;
    totalNetSalary += netSalary;
  }

  return {
    totalEmployees,
    totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
    totalInssEmployee: Math.round(totalInssEmployee * 100) / 100,
    totalInssEmployer: Math.round(totalInssEmployer * 100) / 100,
    totalFgts: Math.round(totalFgts * 100) / 100,
    totalIrrf: Math.round(totalIrrf * 100) / 100,
    totalOtherDiscounts: Math.round(totalOtherDiscounts * 100) / 100,
    totalNetSalary: Math.round(totalNetSalary * 100) / 100,
  };
}

/**
 * FORMATO CSV ESPERADO:
 * 
 * employee_code,employee_name,gross_salary,inss_employee,irrf,other_discounts,net_salary
 * 001,João Silva,3000.00,330.00,0.00,0.00,2670.00
 * 002,Maria Santos,4500.00,495.00,112.50,0.00,3892.50
 * 003,Pedro Oliveira,2500.00,275.00,0.00,50.00,2175.00
 * 
 * NOTAS:
 * - INSS Patronal (20%) e FGTS (8%) são calculados automaticamente
 * - Valores devem usar ponto (.) como separador decimal
 * - Primeira linha é o cabeçalho (será ignorada)
 */

