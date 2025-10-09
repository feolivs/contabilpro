import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PayrollUploadParams {
  clientId: string;
  file: File;
  referenceMonth: number;
  referenceYear: number;
  config?: {
    inssEmployerEnabled?: boolean;
    fgtsEnabled?: boolean;
  };
}

interface PayrollUploadResult {
  success: boolean;
  payrollSummary: {
    id: string;
    total_employees: number;
    total_gross_salary: number;
    total_net_salary: number;
  };
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalInssEmployee: number;
    totalInssEmployer: number;
    totalFgts: number;
    totalIrrf: number;
    totalOtherDiscounts: number;
    totalNetSalary: number;
  };
}

export function usePayrollUpload() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (params: PayrollUploadParams): Promise<PayrollUploadResult> => {
      const { clientId, file, referenceMonth, referenceYear, config } = params;

      // 1. Validar arquivo
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        throw new Error('Formato de arquivo inválido. Use CSV ou Excel (.xlsx, .xls)');
      }

      // 2. Validar competência
      if (referenceMonth < 1 || referenceMonth > 13) {
        throw new Error('Mês de referência inválido (deve ser entre 1 e 13)');
      }

      if (referenceYear < 2020 || referenceYear > 2030) {
        throw new Error('Ano de referência inválido');
      }

      // 3. Upload do arquivo para Supabase Storage
      const fileName = `${clientId}/${referenceYear}/${referenceMonth}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      // 4. Criar registro do documento
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          type: 'payroll',
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          status: 'processing',
        })
        .select()
        .single();

      if (documentError) {
        console.error('Document creation error:', documentError);
        throw new Error(`Erro ao criar documento: ${documentError.message}`);
      }

      // 5. Ler arquivo como base64
      const fileContent = await readFileAsBase64(file);

      // 6. Obter JWT do usuário
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // 7. Chamar Edge Function para processar
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parse-payroll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            documentId: document.id,
            clientId: clientId,
            fileContent: fileContent,
            fileName: file.name,
            referenceMonth: referenceMonth,
            referenceYear: referenceYear,
            config: config,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar folha de pagamento');
      }

      const result: PayrollUploadResult = await response.json();

      // 8. Atualizar status do documento
      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', document.id);

      return result;
    },
    onSuccess: (data, variables) => {
      toast.success('Folha de pagamento processada com sucesso!', {
        description: `${data.summary.totalEmployees} funcionários processados`,
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.clientId] });
    },
    onError: (error: Error) => {
      console.error('Payroll upload error:', error);
      toast.error('Erro ao processar folha de pagamento', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// HELPER: Ler arquivo como Base64
// ============================================================================

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remover prefixo "data:*/*;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

