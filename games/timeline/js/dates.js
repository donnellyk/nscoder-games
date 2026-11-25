const parseParts = (date) => date.split('-').map(Number);

export const dateRange = (date) => {
  const [year, month, day] = parseParts(date);

  if (day !== undefined) {
    return [
      Date.UTC(year, month - 1, day, 0, 0, 0, 0),
      Date.UTC(year, month - 1, day, 23, 59, 59, 999),
    ];
  }

  if (month !== undefined) {
    return [
      Date.UTC(year, month - 1, 1, 0, 0, 0, 0),
      Date.UTC(year, month, 0, 23, 59, 59, 999), // day 0 of next month = last day of this month
    ];
  }

  return [
    Date.UTC(year, 0, 1, 0, 0, 0, 0),
    Date.UTC(year, 11, 31, 23, 59, 59, 999),
  ];
};

export const formatDate = (date) => {
  const [year, month, day] = parseParts(date);

  if (day !== undefined) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  }

  if (month !== undefined) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, 1)));
  }

  return String(year);
};

export const yearOf = (date) => parseParts(date)[0];
