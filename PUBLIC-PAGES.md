# Public pages and footer

Published routes: #guide, #cafes, #restaurants, #contact, #privacy, #terms. The shared footer appears on the landing page and every public content page. Account creation links to the terms, privacy and contact pages. Existing shop/admin navigation stays unchanged.

The support number +905535132920 was supplied explicitly for public publication. Contact form fields stay in component memory. The button opens a WhatsApp draft containing the supplied name, shop, subject and message; sending remains the visitor's action in WhatsApp. No email, ticket backend, automatic message or fake delivery confirmation is used.

Public content reflects implemented functionality. It does not advertise POS, WhatsApp order alerts, clinic queues or payment processing as active. Privacy describes account/order/push data, local storage, service providers, retained reports and the difference between ticket-link expiry and deletion. Terms do not import another provider's jurisdiction, prices or entitlement to use merchant logos for advertising.

Implementation: PublicPages.jsx, publicContent.js, PublicFooter.jsx and public-pages.css; contactDetails.js is the single support-number source. Routes use the existing hash router. Landing anchors now scroll correctly when entered from another public page. No database/auth/notification settings changed.

Verification: production build and 23 tests passed. All six footer routes were followed in browser; every page has one main heading. The how anchor returned to the correct section. Mobile viewport checks showed no horizontal overflow across all six pages. Guide, solutions, contact, legal and footer layouts reviewed visually. WhatsApp destination and Unicode/query encoding checked without sending a message.
