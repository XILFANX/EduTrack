export function getClientCountryDetails(code?: string | null) {
  const defaultDetails = { flag: '🌐', countryName: 'Unknown', currency: 'USD' }
  if (!code) return defaultDetails

  const codeUpper = code.trim().toUpperCase()
  
  // Specific overrides for known currencies that aren't USD
  const knownCurrencies: Record<string, { name: string, curr: string }> = {
    'KE': { name: 'Kenya', curr: 'KES' },
    'TZ': { name: 'Tanzania', curr: 'TZS' },
    'UG': { name: 'Uganda', curr: 'UGX' },
    'ZA': { name: 'South Africa', curr: 'ZAR' },
    'NG': { name: 'Nigeria', curr: 'NGN' },
    'GB': { name: 'United Kingdom', curr: 'GBP' },
    'EU': { name: 'European Union', curr: 'EUR' },
    'CA': { name: 'Canada', curr: 'CAD' },
    'AU': { name: 'Australia', curr: 'AUD' },
    'US': { name: 'United States', curr: 'USD' }
  }

  const match = knownCurrencies[codeUpper]
  
  let flag = '🌐'
  if (codeUpper.length === 2) {
    flag = codeUpper.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  }

  if (match) {
    return { flag, countryName: match.name, currency: match.curr }
  }
  
  // Default fallback for any other country code is USD (as per requirements)
  return { flag, countryName: codeUpper, currency: 'USD' }
}
