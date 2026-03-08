// 54 countries with ISO 3166-1 alpha-2 codes for flagcdn.com
export const COUNTRIES = [
  { name: "Argentina",       code: "ar" },
  { name: "Australia",       code: "au" },
  { name: "Austria",         code: "at" },
  { name: "Belgium",         code: "be" },
  { name: "Bolivia",         code: "bo" },
  { name: "Brazil",          code: "br" },
  { name: "Canada",          code: "ca" },
  { name: "Chile",           code: "cl" },
  { name: "China",           code: "cn" },
  { name: "Colombia",        code: "co" },
  { name: "Croatia",         code: "hr" },
  { name: "Czech Republic",  code: "cz" },
  { name: "Denmark",         code: "dk" },
  { name: "Ecuador",         code: "ec" },
  { name: "Egypt",           code: "eg" },
  { name: "Finland",         code: "fi" },
  { name: "France",          code: "fr" },
  { name: "Germany",         code: "de" },
  { name: "Ghana",           code: "gh" },
  { name: "Greece",          code: "gr" },
  { name: "Hungary",         code: "hu" },
  { name: "India",           code: "in" },
  { name: "Indonesia",       code: "id" },
  { name: "Ireland",         code: "ie" },
  { name: "Israel",          code: "il" },
  { name: "Italy",           code: "it" },
  { name: "Japan",           code: "jp" },
  { name: "Kenya",           code: "ke" },
  { name: "South Korea",     code: "kr" },
  { name: "Mexico",          code: "mx" },
  { name: "Morocco",         code: "ma" },
  { name: "Netherlands",     code: "nl" },
  { name: "New Zealand",     code: "nz" },
  { name: "Nigeria",         code: "ng" },
  { name: "Norway",          code: "no" },
  { name: "Pakistan",        code: "pk" },
  { name: "Peru",            code: "pe" },
  { name: "Philippines",     code: "ph" },
  { name: "Poland",          code: "pl" },
  { name: "Portugal",        code: "pt" },
  { name: "Romania",         code: "ro" },
  { name: "Russia",          code: "ru" },
  { name: "Saudi Arabia",    code: "sa" },
  { name: "South Africa",    code: "za" },
  { name: "Spain",           code: "es" },
  { name: "Sweden",          code: "se" },
  { name: "Switzerland",     code: "ch" },
  { name: "Thailand",        code: "th" },
  { name: "Turkey",          code: "tr" },
  { name: "Ukraine",         code: "ua" },
  { name: "United Kingdom",  code: "gb" },
  { name: "United States",   code: "us" },
  { name: "Venezuela",       code: "ve" },
  { name: "Vietnam",         code: "vn" },
];

export function flagUrl(code) {
  return `https://flagcdn.com/w320/${code}.png`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
