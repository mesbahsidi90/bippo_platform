import { t as bippoT } from "./i18n.js";
import React from 'react';
// Shared platform identity. Merchant logos are independent of this mark.
export default function Brand({
  linked = true
}) {
  const content = <><span className="brand-mark" aria-hidden="true">{Array.from({
        length: 9
      }, (_, i) => <span key={i} />)}</span><b>bippo</b></>;
  return linked ? <a href="#" className="brand" aria-label={bippoT("bippo — الرئيسية")}>{content}</a> : <span className="brand" aria-label="bippo">{content}</span>;
}
