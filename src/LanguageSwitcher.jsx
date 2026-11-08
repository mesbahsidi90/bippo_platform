import React from 'react';
import {Languages} from 'lucide-react';
import {language,switchLanguage} from './i18n';
import './languages.css';
export default function LanguageSwitcher(){return <button type="button" className="language-switcher" lang={language==='ar'?'fr':'ar'} dir="ltr" onClick={()=>switchLanguage(language==='ar'?'fr':'ar')} aria-label={language==='ar'?'Passer en français':'التبديل إلى العربية'} title={language==='ar'?'Passer en français':'التبديل إلى العربية'}><Languages size={17}/>{language==='ar'?'Français':'العربية'}</button>;}
