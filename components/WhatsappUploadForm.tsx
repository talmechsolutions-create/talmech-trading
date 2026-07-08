'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  CUSTOM_OPTION,
  TALMECH_HELP_OPTION,
  finalDropdownLabel,
  getGradeOptions,
  getProductFormOptions,
  getProductOptions,
  metalMaterialCategories,
} from '@/data/whatsappUploadOptions';
import {
  WHATSAPP_CERTIFICATE_OPTIONS,
  WHATSAPP_LANGUAGE_OPTIONS,
  WHATSAPP_PHOTOS_AVAILABLE_OPTIONS,
  WHATSAPP_PRICE_UNITS,
  WHATSAPP_QUANTITY_UNITS,
  WHATSAPP_ROLE_OPTIONS,
  WHATSAPP_STATUS_OPTIONS,
  WHATSAPP_STOCK_STATUS_OPTIONS,
  WHATSAPP_SUBMISSION_TYPE_OPTIONS,
  WHATSAPP_TAX_STATUS_OPTIONS,
  WhatsappUploadInput,
  WhatsappUploadLanguageCode,
} from '@/lib/whatsappUploadTypes';

const TALMECH_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TALMECH_WHATSAPP_NUMBER || '917389642874';

type FormState = WhatsappUploadInput;

const emptyForm: FormState = {
  role: '',
  submissionType: '',
  language: 'en',
  fullName: '',
  firmName: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  gstNumber: '',
  city: '',
  state: '',
  dispatchLocation: '',
  deliveryLocation: '',
  selectedMetal: '',
  customMetal: '',
  selectedProduct: '',
  customProduct: '',
  selectedGrade: TALMECH_HELP_OPTION,
  customGrade: '',
  selectedProductForm: TALMECH_HELP_OPTION,
  customProductForm: '',
  finalMetalLabel: '',
  finalProductLabel: '',
  finalGradeLabel: TALMECH_HELP_OPTION,
  finalProductFormLabel: TALMECH_HELP_OPTION,
  sizeOrSpecification: '',
  quantity: '',
  quantityUnit: 'kg',
  price: '',
  priceUnit: 'per kg',
  targetPrice: '',
  taxStatus: 'not sure',
  stockStatus: 'Ready stock',
  minimumOrderQuantity: '',
  deliveryTimeline: '',
  certificateAvailable: 'not sure',
  certificateRequired: 'not sure',
  photosAvailable: 'yes',
  applicationOrUse: '',
  remarks: '',
};

const copy: Record<WhatsappUploadLanguageCode, Record<string, string>> = {
  en: {
    role: 'Select your role',
    submitType: 'What do you want to submit?',
    material: 'Select metal, product, grade and form',
    details: 'Fill simple details',
    send: 'Send on WhatsApp',
    save: 'Submit for Admin Review',
    attach: 'Attach photos, MTC, invoice, drawings or certificates directly in WhatsApp chat.',
    success: 'Saved for Talmech admin review. Status: Pending Review.',
  },
  hi: {
    role: 'अपनी भूमिका चुनें',
    submitType: 'आप क्या भेजना चाहते हैं?',
    material: 'मेटल, प्रोडक्ट, ग्रेड और फॉर्म चुनें',
    details: 'सरल जानकारी भरें',
    send: 'WhatsApp पर भेजें',
    save: 'Admin Review के लिए जमा करें',
    attach: 'फोटो, MTC, invoice, drawings या certificates WhatsApp chat में attach करें.',
    success: 'Talmech admin review के लिए save हो गया. Status: Pending Review.',
  },
  mr: {
    role: 'तुमची भूमिका निवडा',
    submitType: 'तुम्हाला काय पाठवायचे आहे?',
    material: 'मेटल, प्रोडक्ट, ग्रेड आणि फॉर्म निवडा',
    details: 'सोपे तपशील भरा',
    send: 'WhatsApp वर पाठवा',
    save: 'Admin Review साठी जमा करा',
    attach: 'फोटो, MTC, invoice, drawings किंवा certificates WhatsApp chat मध्ये attach करा.',
    success: 'Talmech admin review साठी save झाले. Status: Pending Review.',
  },
  gu: {
    role: 'તમારી ભૂમિકા પસંદ કરો',
    submitType: 'તમે શું મોકલવા માંગો છો?',
    material: 'મેટલ, પ્રોડક્ટ, ગ્રેડ અને ફોર્મ પસંદ કરો',
    details: 'સરળ વિગતો भरो',
    send: 'WhatsApp પર મોકલો',
    save: 'Admin Review માટે submit કરો',
    attach: 'ફોટા, MTC, invoice, drawings અથવા certificates WhatsApp chat માં attach કરો.',
    success: 'Talmech admin review માટે save થયું. Status: Pending Review.',
  },
  te: {
    role: 'మీ పాత్రను ఎంచుకోండి',
    submitType: 'మీరు ఏమి పంపాలనుకుంటున్నారు?',
    material: 'మెటల్, ప్రోడక్ట్, గ్రేడ్ మరియు ఫారం ఎంచుకోండి',
    details: 'సులభమైన వివరాలు పూరించండి',
    send: 'WhatsApp లో పంపండి',
    save: 'Admin Review కోసం submit చేయండి',
    attach: 'ఫోటోలు, MTC, invoice, drawings లేదా certificates WhatsApp chat లో attach చేయండి.',
    success: 'Talmech admin review కోసం save అయ్యింది. Status: Pending Review.',
  },
  kn: {
    role: 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    submitType: 'ನೀವು ಏನು ಕಳುಹಿಸಲು ಬಯಸುತ್ತೀರಿ?',
    material: 'ಮೆಟಲ್, ಪ್ರಾಡಕ್ಟ್, ಗ್ರೇಡ್ ಮತ್ತು ಫಾರ್ಮ್ ಆಯ್ಕೆಮಾಡಿ',
    details: 'ಸರಳ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ',
    send: 'WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಿ',
    save: 'Admin Review ಗೆ submit ಮಾಡಿ',
    attach: 'ಫೋಟೋಗಳು, MTC, invoice, drawings ಅಥವಾ certificates WhatsApp chat ನಲ್ಲಿ attach ಮಾಡಿ.',
    success: 'Talmech admin review ಗೆ save ಆಯಿತು. Status: Pending Review.',
  },
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function line(label: string, value: unknown) {
  return `${label}: ${clean(value) || '-'}`;
}

function isBuyerFlow(form: FormState) {
  return form.role === 'Buyer' || form.submissionType === 'Buy requirement / RFQ';
}

function buildFinalLabels(form: FormState) {
  return {
    finalMetalLabel: finalDropdownLabel(form.selectedMetal, form.customMetal),
    finalProductLabel: finalDropdownLabel(form.selectedProduct, form.customProduct),
    finalGradeLabel: finalDropdownLabel(form.selectedGrade, form.customGrade) || TALMECH_HELP_OPTION,
    finalProductFormLabel: finalDropdownLabel(form.selectedProductForm, form.customProductForm) || TALMECH_HELP_OPTION,
  };
}

function buildWhatsappMessage(form: FormState) {
  const labels = buildFinalLabels(form);
  const buyerFlow = isBuyerFlow(form);
  const header = buyerFlow
    ? 'Hello Talmech Team,\nI want to post a buying requirement.'
    : 'Hello Talmech Team,\nI want to upload my product / stock.';

  const common = [
    line('Role', form.role),
    line('Submission Type', form.submissionType),
    line('Firm Name', form.firmName),
    line('Contact Person', form.fullName),
    line('Mobile', form.mobile),
    line('Alternate Mobile', form.alternateMobile),
    line('Email', form.email),
  ];

  if (buyerFlow) {
    return [
      header,
      ...common,
      line('City/State', [form.city, form.state].filter(Boolean).join(', ')),
      line('Delivery Location', form.deliveryLocation),
      line('Metal / Material', labels.finalMetalLabel),
      line('Product Required', labels.finalProductLabel),
      line('Grade', labels.finalGradeLabel),
      line('Product Form', labels.finalProductFormLabel),
      line('Size / Specification', form.sizeOrSpecification),
      line('Quantity', form.quantity),
      line('Unit', form.quantityUnit),
      line('Target Price', form.targetPrice),
      line('Certificate Required', form.certificateRequired),
      line('Delivery Timeline', form.deliveryTimeline),
      line('Application / Use', form.applicationOrUse),
      line('Remarks', form.remarks),
      '',
      'I will attach reference photos/drawings if available.',
      'Please review and help me get suitable sellers.',
    ].join('\n');
  }

  return [
    header,
    ...common,
    line('GST', form.gstNumber),
    line('City/State', [form.city, form.state].filter(Boolean).join(', ')),
    line('Dispatch Location', form.dispatchLocation),
    line('Metal / Material', labels.finalMetalLabel),
    line('Product', labels.finalProductLabel),
    line('Grade', labels.finalGradeLabel),
    line('Product Form', labels.finalProductFormLabel),
    line('Size / Specification', form.sizeOrSpecification),
    line('Quantity', form.quantity),
    line('Unit', form.quantityUnit),
    line('Price', form.price),
    line('Price Unit', form.priceUnit),
    line('GST', form.taxStatus),
    line('Stock Status', form.stockStatus),
    line('MOQ', form.minimumOrderQuantity),
    line('Delivery Timeline', form.deliveryTimeline),
    line('Certificate Available', form.certificateAvailable),
    line('Photos Available', form.photosAvailable),
    line('Remarks', form.remarks),
    '',
    'I will attach product photos/documents in this WhatsApp chat.',
    'Please review and help upload this product.',
  ].join('\n');
}

function validateClient(form: FormState) {
  const labels = buildFinalLabels(form);
  const issues: string[] = [];
  if (!form.role) issues.push('Select your role.');
  if (!form.submissionType) issues.push('Select what you want to submit.');
  if (!form.mobile) issues.push('Enter mobile number.');
  if (!labels.finalMetalLabel) issues.push('Select metal/material or enter custom material.');
  if (!labels.finalProductLabel) issues.push('Select product/type or enter custom product.');
  if (form.selectedMetal === CUSTOM_OPTION && !form.customMetal) issues.push('Enter custom metal/material name.');
  if (form.selectedProduct === CUSTOM_OPTION && !form.customProduct) issues.push('Enter custom product name.');
  if (form.selectedGrade === CUSTOM_OPTION && !form.customGrade) issues.push('Enter custom grade/specification.');
  if (form.selectedProductForm === CUSTOM_OPTION && !form.customProductForm) issues.push('Enter custom product form.');
  if (['Sell product / stock available', 'Buy requirement / RFQ', 'Trader deal', 'Price update'].includes(form.submissionType) && !form.quantity) {
    issues.push('Enter quantity.');
  }
  if (isBuyerFlow(form) && !form.deliveryLocation && (!form.city || !form.state)) issues.push('Enter delivery location.');
  if (!isBuyerFlow(form) && !form.dispatchLocation && (!form.city || !form.state)) issues.push('Enter dispatch location.');
  return issues;
}

export default function WhatsappUploadForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const productOptions = useMemo(() => getProductOptions(form.selectedMetal), [form.selectedMetal]);
  const gradeOptions = useMemo(() => getGradeOptions(form.selectedMetal), [form.selectedMetal]);
  const formOptions = useMemo(() => getProductFormOptions(form.selectedMetal), [form.selectedMetal]);
  const buyerFlow = isBuyerFlow(form);
  const t = copy[form.language] || copy.en;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeMetal(value: string) {
    const nextGradeOptions = getGradeOptions(value);
    const nextFormOptions = getProductFormOptions(value);
    setForm((current) => ({
      ...current,
      selectedMetal: value,
      customMetal: value === CUSTOM_OPTION ? current.customMetal : '',
      selectedProduct: '',
      customProduct: '',
      selectedGrade: nextGradeOptions.includes(TALMECH_HELP_OPTION) ? TALMECH_HELP_OPTION : nextGradeOptions[0] || '',
      customGrade: '',
      selectedProductForm: nextFormOptions.includes(TALMECH_HELP_OPTION) ? TALMECH_HELP_OPTION : nextFormOptions[0] || '',
      customProductForm: '',
    }));
  }

  function payload() {
    const labels = buildFinalLabels(form);
    return { ...form, ...labels };
  }

  function guard() {
    const issues = validateClient(form);
    if (issues.length) {
      setError(issues[0]);
      setMessage('');
      return false;
    }
    setError('');
    return true;
  }

  function sendWhatsapp() {
    if (!guard()) return;
    const text = encodeURIComponent(buildWhatsappMessage(payload()));
    window.open(`https://wa.me/${TALMECH_WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  async function submitForReview(event: FormEvent) {
    event.preventDefault();
    if (!guard()) return;
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/whatsapp-uploads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload()),
    }).then((response) => response.json()).catch(() => ({ ok: false, error: 'Unable to save submission.' }));
    setSaving(false);
    if (res.ok) {
      setMessage(`${t.success} Reference: ${res.submission?.submissionId || ''}`);
    } else {
      setError(res.error || 'Unable to save submission.');
    }
  }

  return (
    <form className="waUploadForm" onSubmit={submitForReview}>
      <section className="waStepBlock">
        <div className="waStepHead">
          <span>Step 1</span>
          <h2>{t.role}</h2>
        </div>
        <div className="waChoiceGrid">
          {WHATSAPP_ROLE_OPTIONS.map((role) => (
            <button type="button" key={role} className={form.role === role ? 'active' : ''} onClick={() => set('role', role)}>
              {role}
            </button>
          ))}
        </div>
      </section>

      <section className="waStepBlock">
        <div className="waStepHead">
          <span>Step 2</span>
          <h2>{t.submitType}</h2>
        </div>
        <div className="waFormGrid two">
          <label>
            Submission type
            <select value={form.submissionType} onChange={(event) => set('submissionType', event.target.value)}>
              <option value="">Select</option>
              {WHATSAPP_SUBMISSION_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Language
            <select value={form.language} onChange={(event) => set('language', event.target.value as WhatsappUploadLanguageCode)}>
              {WHATSAPP_LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="waStepBlock">
        <div className="waStepHead">
          <span>Step 3</span>
          <h2>{t.material}</h2>
        </div>
        <div className="waFormGrid four">
          <label>
            Metal / Material Category
            <select data-testid="whatsapp-metal-select" value={form.selectedMetal} onChange={(event) => changeMetal(event.target.value)}>
              <option value="">Select metal</option>
              {metalMaterialCategories.map((metal) => <option key={metal}>{metal}</option>)}
            </select>
          </label>
          {form.selectedMetal === CUSTOM_OPTION && (
            <label>
              Custom metal / material name
              <input className="input" value={form.customMetal} onChange={(event) => set('customMetal', event.target.value)} placeholder="Example: Inconel, industrial item" />
            </label>
          )}
          <label>
            Product Name / Product Type
            <select data-testid="whatsapp-product-select" value={form.selectedProduct} onChange={(event) => set('selectedProduct', event.target.value)}>
              <option value="">Select product</option>
              {productOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {form.selectedProduct === CUSTOM_OPTION && (
            <label>
              Custom product name
              <input className="input" value={form.customProduct} onChange={(event) => set('customProduct', event.target.value)} placeholder="Example: punched copper strip" />
            </label>
          )}
          <label>
            Grade / Specification
            <select data-testid="whatsapp-grade-select" value={form.selectedGrade} onChange={(event) => set('selectedGrade', event.target.value)}>
              {gradeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {form.selectedGrade === CUSTOM_OPTION && (
            <label>
              Custom grade/specification
              <input className="input" value={form.customGrade} onChange={(event) => set('customGrade', event.target.value)} placeholder="Example: EN24T, 99.9%" />
            </label>
          )}
          <label>
            Product Form
            <select data-testid="whatsapp-form-select" value={form.selectedProductForm} onChange={(event) => set('selectedProductForm', event.target.value)}>
              {formOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {form.selectedProductForm === CUSTOM_OPTION && (
            <label>
              Custom product form
              <input className="input" value={form.customProductForm} onChange={(event) => set('customProductForm', event.target.value)} placeholder="Example: laser cut blank" />
            </label>
          )}
        </div>
      </section>

      <section className="waStepBlock">
        <div className="waStepHead">
          <span>Step 4</span>
          <h2>{t.details}</h2>
        </div>
        <div className="waFormGrid three">
          <label>Contact person<input className="input" value={form.fullName} onChange={(event) => set('fullName', event.target.value)} placeholder="Your name" /></label>
          <label>Firm name<input className="input" value={form.firmName} onChange={(event) => set('firmName', event.target.value)} placeholder="Company / shop / unit" /></label>
          <label>Mobile / WhatsApp<input className="input" value={form.mobile} onChange={(event) => set('mobile', event.target.value)} placeholder="10 digit mobile" /></label>
          <label>Alternate mobile<input className="input" value={form.alternateMobile} onChange={(event) => set('alternateMobile', event.target.value)} placeholder="Optional" /></label>
          <label>Email<input className="input" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="Optional" /></label>
          {!buyerFlow && <label>GST number<input className="input" value={form.gstNumber} onChange={(event) => set('gstNumber', event.target.value.toUpperCase())} placeholder="Optional, recommended" /></label>}
          <label>City<input className="input" value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Pune" /></label>
          <label>State<input className="input" value={form.state} onChange={(event) => set('state', event.target.value)} placeholder="Maharashtra" /></label>
          {buyerFlow ? (
            <label className="span2">Delivery location<input className="input" value={form.deliveryLocation} onChange={(event) => set('deliveryLocation', event.target.value)} placeholder="Factory gate, MIDC, city, state" /></label>
          ) : (
            <label className="span2">Dispatch location<input className="input" value={form.dispatchLocation} onChange={(event) => set('dispatchLocation', event.target.value)} placeholder="Warehouse, yard, factory, city" /></label>
          )}
          <label className="span2">Size / Specification<input className="input" value={form.sizeOrSpecification} onChange={(event) => set('sizeOrSpecification', event.target.value)} placeholder="Thickness, dia, length, drawing reference, lot details" /></label>
          <label>Quantity<input className="input" value={form.quantity} onChange={(event) => set('quantity', event.target.value)} placeholder="Example: 500" /></label>
          <label>Quantity unit<select value={form.quantityUnit} onChange={(event) => set('quantityUnit', event.target.value)}>{WHATSAPP_QUANTITY_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
          {buyerFlow ? (
            <>
              <label>Target price<input className="input" value={form.targetPrice} onChange={(event) => set('targetPrice', event.target.value)} placeholder="Optional" /></label>
              <label>Certificate required<select value={form.certificateRequired} onChange={(event) => set('certificateRequired', event.target.value)}>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className="span2">Application / Use<input className="input" value={form.applicationOrUse} onChange={(event) => set('applicationOrUse', event.target.value)} placeholder="Fabrication, machining, resale, project, maintenance" /></label>
            </>
          ) : (
            <>
              <label>Price<input className="input" value={form.price} onChange={(event) => set('price', event.target.value)} placeholder="Optional" /></label>
              <label>Price unit<select value={form.priceUnit} onChange={(event) => set('priceUnit', event.target.value)}>{WHATSAPP_PRICE_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
              <label>Tax status<select value={form.taxStatus} onChange={(event) => set('taxStatus', event.target.value)}>{WHATSAPP_TAX_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Stock status<select value={form.stockStatus} onChange={(event) => set('stockStatus', event.target.value)}>{WHATSAPP_STOCK_STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Minimum order quantity<input className="input" value={form.minimumOrderQuantity} onChange={(event) => set('minimumOrderQuantity', event.target.value)} placeholder="Optional" /></label>
              <label>Certificate available<select value={form.certificateAvailable} onChange={(event) => set('certificateAvailable', event.target.value)}>{WHATSAPP_CERTIFICATE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Photos available<select value={form.photosAvailable} onChange={(event) => set('photosAvailable', event.target.value)}>{WHATSAPP_PHOTOS_AVAILABLE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            </>
          )}
          <label>Delivery timeline<input className="input" value={form.deliveryTimeline} onChange={(event) => set('deliveryTimeline', event.target.value)} placeholder="Ready, 2 days, 1 week" /></label>
          <label className="span3">Remarks<textarea value={form.remarks} onChange={(event) => set('remarks', event.target.value)} placeholder="Commercial terms, inspection notes, photo/documents available, urgency" /></label>
        </div>
      </section>

      <section className="waStepBlock">
        <div className="waStepHead">
          <span>Step 5</span>
          <h2>Send on WhatsApp or submit for admin review</h2>
        </div>
        <p className="waAttachNote">{t.attach}</p>
        {error && <p className="warn">{error}</p>}
        {message && <p className="success">{message}</p>}
        <div className="waActionRow">
          <button type="button" className="btn waPrimary" onClick={sendWhatsapp}>{t.send}</button>
          <button type="submit" className="btn secondary" disabled={saving}>{saving ? 'Saving...' : t.save}</button>
          <a className="btn dark" href={`https://wa.me/${TALMECH_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Open WhatsApp Chat</a>
        </div>
        <p className="muted">Status after submit: {WHATSAPP_STATUS_OPTIONS[0]}. Final listing, price, and availability depend on verification and admin approval.</p>
      </section>
    </form>
  );
}
