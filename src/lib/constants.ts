// Constantes do projeto ContabilPRO

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const MONTH_OPTIONS = [
  ...MONTHS.map((month, index) => ({
    value: (index + 1).toString(),
    label: month,
  })),
  { value: '13', label: '13º Salário' },
]

export const YEARS = Array.from(
  { length: 11 },
  (_, i) => new Date().getFullYear() - 5 + i
)

export const YEAR_OPTIONS = YEARS.map((year) => ({
  value: year.toString(),
  label: year.toString(),
}))

