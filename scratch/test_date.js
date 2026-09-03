const userTz = 'America/New_York';
const date = new Date();

const options = {
  timeZone: userTz,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23'
};

const formatter = new Intl.DateTimeFormat('en-CA', options);
const parts = formatter.formatToParts(date);

let year, month, day, hour;
for (const part of parts) {
  if (part.type === 'year') year = part.value;
  if (part.type === 'month') month = part.value;
  if (part.type === 'day') day = part.value;
  if (part.type === 'hour') hour = parseInt(part.value, 10);
}

const localDateStr = `${year}-${month}-${day}`;
console.log('Local Date:', localDateStr);
console.log('Local Hour:', hour);
