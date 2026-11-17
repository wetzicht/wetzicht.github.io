/*
  Wetzicht settings. Everything works with the values as they are.
  Nothing personal is in here on purpose: fill in the company details when the business is registered.
*/
window.WZ_CONFIG = {
  brand: 'Wetzicht',

  // Early access for the paid version. Leave both empty and the site says "opent binnenkort".
  signupEndpoint: '',   // e.g. 'https://formspree.io/f/abcdwxyz' -> the sign-up form posts here
  contactEmail: '',     // e.g. 'hallo@wetzicht.nl' -> shown in the footer and used as fallback for sign-ups

  // Shown in the footer once filled in. A Dutch business site has to show these before it sells anything.
  company: { name: '', kvk: '', btw: '', address: '' },

  // Monthly prices in euro, excluding btw. The pricing cards follow these.
  prices: { kantoor: 79, plus: 199 },

  // The free local version of the firm app holds this many clients. 0 = no limit.
  freeClients: 10,

  // Licence codes lift that limit. These are PUBLIC keys: the app can check a code with them but not make one.
  // The matching private key is on the owner's computer (see tools/license.mjs in the playbook).
  // To change keys, add the new one here and keep the old one until its codes have expired.
  licenseKeys: [
    { kty: 'EC', crv: 'P-256', x: 'DejAmMJPzRQH8ZEp9UkI8B4tTzbDafAvPgyZohD9dN4', y: 'ObPoIfcZMuyEan39Nr9lhHRpRBfWGQM3OJC2yP2CP4k' },
  ],
  // Ids of codes that must stop working, for example after a refund. The id is printed when a code is made.
  revoked: [],
};

/* Design tokens for Tailwind (loaded after the Tailwind script in both pages). */
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          paper: '#F4F5F0', ink: '#0F1B17', mute: '#55625C', line: '#DCE1D8',
          brand: { DEFAULT: '#0C5A45', dark: '#08402F', soft: '#E3F1EA' },
          amber: { DEFAULT: '#A8530A', soft: '#FCEFD9' },
          red: { DEFAULT: '#A32118', soft: '#FBE7E4' },
          slate: { DEFAULT: '#46536A', soft: '#E8ECF3' },
        },
        fontFamily: {
          sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
          serif: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', 'serif'],
        },
        maxWidth: { page: '72rem' },
      },
    },
  };
}
