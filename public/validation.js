export function validateEvent(e) {
 if (!e || typeof e.name !== 'string' || !e.name.trim() || e.name.length > 120) throw Error('Enter an event name (up to 120 characters).');
 if (!['Wedding','Birthday','Community'].includes(e.type)) throw Error('Choose a supported event type.');
 if (!Number.isFinite(e.budget) || e.budget < 100 || e.budget > 1e9) throw Error('Budget must be between 100 and 1 billion.');
 if (!Number.isInteger(e.guests) || e.guests < 1 || e.guests > 100000) throw Error('Enter a valid guest count.');
 if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || Number.isNaN(Date.parse(e.date)) || new Date(e.date).toISOString().slice(0,10)!==e.date) throw Error('Enter a valid event date.');
 if (!['INR','USD','EUR','GBP'].includes(e.currency)) throw Error('Choose a supported currency.');
 for(const field of ['location','theme']) if(e[field] !== undefined && (typeof e[field] !== 'string' || e[field].length > 1000)) throw Error('Location and theme must be text up to 1000 characters.');
 return e;
}
