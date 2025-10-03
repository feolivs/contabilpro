'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Step, Stepper } from '@/components/ui/stepper'
import { applyDocumentMask, getTipoPessoa, validateDocument } from '@/lib/validation'

import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react'

const STEPS: Step[] = [
  { id: 'fiscal', title: 'Dados Fiscais', description: 'Informações básicas' },
  { id: 'contato', title: 'Contato', description: 'Endereço e comunicação' },
  { id: 'financeiro', title: 'Financeiro', description: 'Plano e cobrança' },
]

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  // Step 1: Dados Fiscais
  tipo_pessoa?: 'PF' | 'PJ'
  document?: string
  name?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  regime_tributario?: 'MEI' | 'Simples' | 'Presumido' | 'Real'

  // Step 2: Contato
  email?: string
  phone?: string
  responsavel_nome?: string
  responsavel_telefone?: string
  cep?: string
  address?: string
  city?: string
  state?: string

  // Step 3: Financeiro
  dia_vencimento?: number
  valor_plano?: number
  forma_cobranca?: 'boleto' | 'pix' | 'cartao' | 'transferencia'
  tags?: string[]
}

/**
 * Modal Multi-Step para cadastro de cliente
 *
 * Features:
 * - 3 steps: Dados Fiscais, Contato, Financeiro
 * - Validação em tempo real
 * - Máscara de CPF/CNPJ
 * - Autopreenchimento de endereço via ViaCEP
 * - Navegação entre steps
 * - Responsivo
 */
export function ClientModal({ open, onOpenChange, onSuccess }: ClientModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  // Atualizar campo do formulário
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validar step atual
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      // Step 1: Dados Fiscais
      if (!formData.tipo_pessoa) {
        newErrors.tipo_pessoa = 'Selecione o tipo de pessoa'
      }
      if (!formData.document) {
        newErrors.document = 'Documento é obrigatório'
      } else if (!validateDocument(formData.document)) {
        newErrors.document = 'CPF ou CNPJ inválido'
      }
      if (!formData.name || formData.name.trim().length === 0) {
        newErrors.name = 'Nome é obrigatório'
      }
    } else if (currentStep === 2) {
      // Step 2: Contato (todos opcionais, mas validar formato se preenchido)
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido'
      }
      if (formData.cep && !/^\d{5}-?\d{3}$/.test(formData.cep)) {
        newErrors.cep = 'CEP deve estar no formato 12345-678'
      }
      if (formData.state && formData.state.length !== 2) {
        newErrors.state = 'Estado deve ter 2 caracteres (UF)'
      }
    } else if (currentStep === 3) {
      // Step 3: Financeiro (todos opcionais, mas validar range se preenchido)
      if (
        formData.dia_vencimento &&
        (formData.dia_vencimento < 1 || formData.dia_vencimento > 31)
      ) {
        newErrors.dia_vencimento = 'Dia de vencimento deve ser entre 1 e 31'
      }
      if (formData.valor_plano && formData.valor_plano <= 0) {
        newErrors.valor_plano = 'Valor do plano deve ser positivo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navegar para próximo step
  const handleNext = () => {
    if (validateCurrentStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Navegar para step anterior
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Buscar endereço por CEP
  const handleCepBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '')
    if (!cep || cep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        updateField('address', data.logradouro || '')
        updateField('city', data.localidade || '')
        updateField('state', data.uf || '')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Detectar tipo de pessoa ao digitar documento
  const handleDocumentChange = (value: string) => {
    const masked = applyDocumentMask(value)
    updateField('document', masked)

    // Auto-detectar tipo de pessoa
    const tipoPessoa = getTipoPessoa(masked)
    if (tipoPessoa) {
      updateField('tipo_pessoa', tipoPessoa)
    }
  }

  // Submeter formulário
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    try {
      // TODO: Implementar Server Action createClientMultiStep
      console.log('Submitting:', formData)

      // Fechar modal e chamar callback de sucesso
      onOpenChange(false)
      onSuccess?.()

      // Resetar formulário
      setCurrentStep(1)
      setFormData({})
      setErrors({})
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    }
  }

  // Resetar ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentStep(1)
      setFormData({})
      setErrors({})
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <Stepper steps={STEPS} currentStep={currentStep} className='mb-6' />

        <div className='space-y-4'>
          {/* Step 1: Dados Fiscais */}
          {currentStep === 1 && (
            <>
              <div className='grid gap-2'>
                <Label htmlFor='tipo_pessoa'>Tipo de Pessoa *</Label>
                <Select
                  value={formData.tipo_pessoa}
                  onValueChange={value => updateField('tipo_pessoa', value as 'PF' | 'PJ')}
                >
                  <SelectTrigger id='tipo_pessoa'>
                    <SelectValue placeholder='Selecione...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PF'>Pessoa Física (CPF)</SelectItem>
                    <SelectItem value='PJ'>Pessoa Jurídica (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo_pessoa && (
                  <p className='text-sm text-destructive'>{errors.tipo_pessoa}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='document'>CPF/CNPJ *</Label>
                <Input
                  id='document'
                  value={formData.document || ''}
                  onChange={e => handleDocumentChange(e.target.value)}
                  placeholder={
                    formData.tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'
                  }
                />
                {errors.document && <p className='text-sm text-destructive'>{errors.document}</p>}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='name'>
                  {formData.tipo_pessoa === 'PF' ? 'Nome Completo' : 'Razão Social'} *
                </Label>
                <Input
                  id='name'
                  value={formData.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder={formData.tipo_pessoa === 'PF' ? 'João Silva' : 'Empresa LTDA'}
                />
                {errors.name && <p className='text-sm text-destructive'>{errors.name}</p>}
              </div>

              <div className='grid gap-2 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='inscricao_estadual'>Inscrição Estadual</Label>
                  <Input
                    id='inscricao_estadual'
                    value={formData.inscricao_estadual || ''}
                    onChange={e => updateField('inscricao_estadual', e.target.value)}
                    placeholder='123456789'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='inscricao_municipal'>Inscrição Municipal</Label>
                  <Input
                    id='inscricao_municipal'
                    value={formData.inscricao_municipal || ''}
                    onChange={e => updateField('inscricao_municipal', e.target.value)}
                    placeholder='123456789'
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='regime_tributario'>Regime Tributário</Label>
                <Select
                  value={formData.regime_tributario}
                  onValueChange={value => updateField('regime_tributario', value)}
                >
                  <SelectTrigger id='regime_tributario'>
                    <SelectValue placeholder='Selecione...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MEI'>MEI</SelectItem>
                    <SelectItem value='Simples'>Simples Nacional</SelectItem>
                    <SelectItem value='Presumido'>Lucro Presumido</SelectItem>
                    <SelectItem value='Real'>Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 2: Contato */}
          {currentStep === 2 && (
            <>
              <div className='grid gap-2 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.email || ''}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder='contato@empresa.com'
                  />
                  {errors.email && <p className='text-sm text-destructive'>{errors.email}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>Telefone</Label>
                  <Input
                    id='phone'
                    value={formData.phone || ''}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder='(11) 99999-9999'
                  />
                </div>
              </div>

              <div className='grid gap-2 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='responsavel_nome'>Responsável</Label>
                  <Input
                    id='responsavel_nome'
                    value={formData.responsavel_nome || ''}
                    onChange={e => updateField('responsavel_nome', e.target.value)}
                    placeholder='Nome do responsável'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='responsavel_telefone'>Telefone do Responsável</Label>
                  <Input
                    id='responsavel_telefone'
                    value={formData.responsavel_telefone || ''}
                    onChange={e => updateField('responsavel_telefone', e.target.value)}
                    placeholder='(11) 99999-9999'
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='cep'>CEP</Label>
                <div className='flex gap-2'>
                  <Input
                    id='cep'
                    value={formData.cep || ''}
                    onChange={e => updateField('cep', e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder='12345-678'
                    className='flex-1'
                  />
                  {isLoadingCep && (
                    <span className='text-sm text-muted-foreground'>Buscando...</span>
                  )}
                </div>
                {errors.cep && <p className='text-sm text-destructive'>{errors.cep}</p>}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='address'>Endereço</Label>
                <Input
                  id='address'
                  value={formData.address || ''}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder='Rua Exemplo, 123'
                />
              </div>

              <div className='grid gap-2 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='city'>Cidade</Label>
                  <Input
                    id='city'
                    value={formData.city || ''}
                    onChange={e => updateField('city', e.target.value)}
                    placeholder='São Paulo'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='state'>Estado (UF)</Label>
                  <Input
                    id='state'
                    value={formData.state || ''}
                    onChange={e => updateField('state', e.target.value.toUpperCase())}
                    placeholder='SP'
                    maxLength={2}
                  />
                  {errors.state && <p className='text-sm text-destructive'>{errors.state}</p>}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Financeiro */}
          {currentStep === 3 && (
            <>
              <div className='grid gap-2 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='dia_vencimento'>Dia de Vencimento</Label>
                  <Input
                    id='dia_vencimento'
                    type='number'
                    min='1'
                    max='31'
                    value={formData.dia_vencimento || ''}
                    onChange={e =>
                      updateField('dia_vencimento', parseInt(e.target.value) || undefined)
                    }
                    placeholder='10'
                  />
                  {errors.dia_vencimento && (
                    <p className='text-sm text-destructive'>{errors.dia_vencimento}</p>
                  )}
                  <p className='text-xs text-muted-foreground'>
                    Dia do mês para vencimento da cobrança
                  </p>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='valor_plano'>Valor do Plano (R$)</Label>
                  <Input
                    id='valor_plano'
                    type='number'
                    step='0.01'
                    min='0'
                    value={formData.valor_plano || ''}
                    onChange={e =>
                      updateField('valor_plano', parseFloat(e.target.value) || undefined)
                    }
                    placeholder='500.00'
                  />
                  {errors.valor_plano && (
                    <p className='text-sm text-destructive'>{errors.valor_plano}</p>
                  )}
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='forma_cobranca'>Forma de Cobrança</Label>
                <Select
                  value={formData.forma_cobranca}
                  onValueChange={value => updateField('forma_cobranca', value)}
                >
                  <SelectTrigger id='forma_cobranca'>
                    <SelectValue placeholder='Selecione...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='boleto'>Boleto</SelectItem>
                    <SelectItem value='pix'>PIX</SelectItem>
                    <SelectItem value='cartao'>Cartão de Crédito</SelectItem>
                    <SelectItem value='transferencia'>Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='tags'>Tags (separadas por vírgula)</Label>
                <Input
                  id='tags'
                  value={formData.tags?.join(', ') || ''}
                  onChange={e =>
                    updateField(
                      'tags',
                      e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder='VIP, Prioritário, Novo'
                />
                <p className='text-xs text-muted-foreground'>
                  Use tags para organizar e filtrar clientes
                </p>
              </div>

              <div className='rounded-lg border bg-muted/50 p-4'>
                <h4 className='font-medium mb-2'>Resumo do Cadastro</h4>
                <dl className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Nome:</dt>
                    <dd className='font-medium'>{formData.name || '-'}</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Documento:</dt>
                    <dd className='font-medium'>{formData.document || '-'}</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Email:</dt>
                    <dd className='font-medium'>{formData.email || '-'}</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>Valor do Plano:</dt>
                    <dd className='font-medium'>
                      {formData.valor_plano ? `R$ ${formData.valor_plano.toFixed(2)}` : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>

        <DialogFooter className='flex justify-between'>
          <Button type='button' variant='outline' onClick={handleBack} disabled={currentStep === 1}>
            <IconArrowLeft className='h-4 w-4 mr-2' />
            Voltar
          </Button>

          {currentStep < STEPS.length ? (
            <Button type='button' onClick={handleNext}>
              Próximo
              <IconArrowRight className='h-4 w-4 ml-2' />
            </Button>
          ) : (
            <Button type='button' onClick={handleSubmit}>
              <IconCheck className='h-4 w-4 mr-2' />
              Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
