export function getStatusColorClass(status) {
  const normalizedStatus = status?.toLowerCase() || '';

  if (normalizedStatus.includes('rechaz')) {
    return 'bg-[#dc2626]';
  }

  if (
    normalizedStatus.includes('aprob') ||
    normalizedStatus.includes('autoriz') ||
    normalizedStatus === 'revisado'
  ) {
    return 'bg-[#16a34a]';
  }

  if (
    normalizedStatus.includes('revisión') ||
    normalizedStatus.includes('revision') ||
    normalizedStatus.includes('pendiente')
  ) {
    return 'bg-[#eab308]';
  }

  return 'bg-[#52525b]';
}
