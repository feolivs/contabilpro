import { cn } from '@/lib/utils'

import { IconCheck } from '@tabler/icons-react'

export interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

/**
 * Componente Stepper - Indicador visual de progresso multi-step
 *
 * Features:
 * - Mostra steps com números
 * - Destaca step atual
 * - Marca steps completos com check
 * - Responsivo (vertical em mobile)
 * - Acessível (ARIA labels)
 */
export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label='Progresso do formulário' className={cn('w-full', className)}>
      <ol className='flex items-center justify-between gap-2 md:gap-4'>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <li
              key={step.id}
              className='flex flex-1 items-center'
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className='flex flex-col items-center gap-2 flex-1'>
                {/* Step indicator */}
                <div className='flex items-center gap-2 w-full'>
                  {/* Circle with number or check */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                      {
                        'border-primary bg-primary text-primary-foreground':
                          isComplete || isCurrent,
                        'border-muted bg-muted text-muted-foreground': isUpcoming,
                      }
                    )}
                    aria-label={`Step ${stepNumber}: ${step.title}`}
                  >
                    {isComplete ? (
                      <IconCheck className='h-5 w-5' aria-hidden='true' />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </div>

                  {/* Connector line (except for last step) */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn('h-0.5 flex-1 transition-colors', {
                        'bg-primary': isComplete,
                        'bg-muted': !isComplete,
                      })}
                      aria-hidden='true'
                    />
                  )}
                </div>

                {/* Step title and description */}
                <div className='flex flex-col items-center text-center'>
                  <span
                    className={cn('text-sm font-medium transition-colors', {
                      'text-foreground': isCurrent || isComplete,
                      'text-muted-foreground': isUpcoming,
                    })}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className='text-xs text-muted-foreground hidden md:block'>
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Versão compacta do Stepper (apenas círculos, sem texto)
 */
export function StepperCompact({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label='Progresso do formulário' className={cn('w-full', className)}>
      <ol className='flex items-center justify-center gap-2'>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <li key={step.id} aria-current={isCurrent ? 'step' : undefined}>
              <div
                className={cn('flex h-2 w-2 rounded-full transition-all', {
                  'bg-primary w-8': isCurrent,
                  'bg-primary': isComplete,
                  'bg-muted': isUpcoming,
                })}
                aria-label={`Step ${stepNumber}: ${step.title}`}
                title={step.title}
              />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
