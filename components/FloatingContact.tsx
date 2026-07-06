'use client';
import { useState } from 'react';

const phone = '917389642874';

export default function FloatingContact(){
  const [open,setOpen]=useState(false);
  const text = encodeURIComponent('Hello Talmech Trading, I need help with a metal requirement / supply listing.');
  return <>
    <div className="floatingContact">
      <button className="chatMain" onClick={()=>setOpen(!open)}>💬 Live support</button>
      <a className="whatsappFab" href={`https://wa.me/${phone}?text=${text}`} target="_blank">WhatsApp</a>
      <a className="callFab" href="tel:+917389642874">Call</a>
    </div>
    {open && <div className="chatPanel">
      <div className="chatHead"><b>Talmech support</b><button onClick={()=>setOpen(false)}>×</button></div>
      <p>Share your metal, grade, quantity, city and whether you want to buy, sell, scrap or arrange logistics.</p>
      <div className="quickReplies">
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent('I want to buy metal. Please help me source locally.')}`} target="_blank">I want to buy</a>
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent('I want to sell ready stock / scrap. Please verify and list it.')}`} target="_blank">I want to sell</a>
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent('I need logistics support for a metal consignment.')}`} target="_blank">Need logistics</a>
      </div>
      <small>Support: +91 7389642874</small>
    </div>}
  </>
}
