export const customerThemes = {
  classic: { label: 'كلاسيك', paper: '#fafbf6', ticket: '#191b20', display: '#090d0d', digits: '#f8fff8' },
  lagoon: { label: 'بحري', paper: '#eaf7f4', ticket: '#0b3e37', display: '#062922', digits: '#c4f5e5' },
  sand: { label: 'رملي', paper: '#faf1df', ticket: '#47311e', display: '#28190e', digits: '#ffebba' },
  plum: { label: 'توتي', paper: '#f6eef7', ticket: '#3b2546', display: '#25152b', digits: '#f4d9ff' }
};

export const themeKey = key => Object.hasOwn(customerThemes, key) ? key : 'classic';
