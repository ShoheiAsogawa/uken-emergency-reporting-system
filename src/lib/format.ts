export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone
  return '****' + phone.slice(-4)
}

