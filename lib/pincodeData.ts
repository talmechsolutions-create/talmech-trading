export type PinInfo = { pincode: string; state: string; city: string; area: string; region: string };
export const pincodeSamples: PinInfo[] = [
  {pincode:'411026', state:'Maharashtra', city:'Pune', area:'Bhosari MIDC', region:'Pune industrial belt'},
  {pincode:'410501', state:'Maharashtra', city:'Chakan MIDC', area:'Chakan MIDC', region:'Pune-Chakan auto belt'},
  {pincode:'400072', state:'Maharashtra', city:'Mumbai', area:'Andheri East / Sakinaka', region:'Mumbai trading belt'},
  {pincode:'410208', state:'Maharashtra', city:'Taloja MIDC', area:'Taloja MIDC', region:'Navi Mumbai industrial belt'},
  {pincode:'422010', state:'Maharashtra', city:'Nashik', area:'Ambad MIDC', region:'Nashik industrial belt'},
  {pincode:'382415', state:'Gujarat', city:'Ahmedabad', area:'Odhav / Naroda', region:'Ahmedabad industrial belt'},
  {pincode:'361004', state:'Gujarat', city:'Jamnagar', area:'GIDC Jamnagar', region:'Brass component cluster'},
  {pincode:'360004', state:'Gujarat', city:'Rajkot', area:'Aji GIDC', region:'Rajkot engineering cluster'},
  {pincode:'390010', state:'Gujarat', city:'Vadodara', area:'Makarpura GIDC', region:'Vadodara industrial belt'},
  {pincode:'396195', state:'Gujarat', city:'Vapi', area:'Vapi GIDC', region:'Vapi industrial belt'},
  {pincode:'110064', state:'Delhi NCR', city:'Delhi', area:'Mayapuri', region:'Delhi metal/scrap market'},
  {pincode:'110028', state:'Delhi NCR', city:'Delhi', area:'Naraina Industrial Area', region:'Delhi industrial belt'},
  {pincode:'201301', state:'Uttar Pradesh', city:'Noida', area:'Noida Industrial Area', region:'Noida-Greater Noida belt'},
  {pincode:'201306', state:'Uttar Pradesh', city:'Greater Noida', area:'Ecotech', region:'Greater Noida industrial belt'},
  {pincode:'121001', state:'Haryana', city:'Faridabad', area:'Faridabad Industrial Area', region:'NCR engineering belt'},
  {pincode:'122050', state:'Haryana', city:'Manesar', area:'IMT Manesar', region:'Automotive belt'},
  {pincode:'141003', state:'Punjab', city:'Ludhiana', area:'Focal Point', region:'Ludhiana steel/engineering belt'},
  {pincode:'147301', state:'Punjab', city:'Mandi Gobindgarh', area:'Mandi Gobindgarh', region:'Steel rerolling cluster'},
  {pincode:'560058', state:'Karnataka', city:'Bengaluru', area:'Peenya Industrial Area', region:'Bengaluru manufacturing belt'},
  {pincode:'635126', state:'Tamil Nadu', city:'Hosur', area:'SIPCOT Hosur', region:'Hosur auto/component belt'},
  {pincode:'600098', state:'Tamil Nadu', city:'Chennai', area:'Ambattur Industrial Estate', region:'Chennai industrial belt'},
  {pincode:'641006', state:'Tamil Nadu', city:'Coimbatore', area:'Ganapathy / SIDCO', region:'Coimbatore engineering belt'},
  {pincode:'500037', state:'Telangana', city:'Hyderabad', area:'Balanagar Industrial Area', region:'Hyderabad industrial belt'},
  {pincode:'452010', state:'Madhya Pradesh', city:'Indore', area:'Sanwer Road Industrial Area', region:'Indore industrial belt'},
  {pincode:'454775', state:'Madhya Pradesh', city:'Pithampur', area:'Pithampur Industrial Area', region:'Pithampur auto belt'},
  {pincode:'301019', state:'Rajasthan', city:'Bhiwadi', area:'Bhiwadi Industrial Area', region:'Bhiwadi-Neemrana belt'},
  {pincode:'302013', state:'Rajasthan', city:'Jaipur', area:'Vishwakarma Industrial Area', region:'Jaipur engineering belt'},
  {pincode:'711302', state:'West Bengal', city:'Howrah', area:'Foundry belt', region:'Howrah casting cluster'},
  {pincode:'492001', state:'Chhattisgarh', city:'Raipur', area:'Raipur industrial area', region:'Central India steel belt'},
  {pincode:'490001', state:'Chhattisgarh', city:'Bhilai', area:'Bhilai', region:'Steel plant ecosystem'},
  {pincode:'831001', state:'Jharkhand', city:'Jamshedpur', area:'Adityapur / Jamshedpur', region:'Steel and auto component belt'},
  {pincode:'769001', state:'Odisha', city:'Rourkela', area:'Rourkela', region:'Steel belt'}
];
export function lookupPincode(pin: string) {
  const clean = (pin || '').replace(/\D/g, '').slice(0,6);
  if (clean.length !== 6) return null;
  return pincodeSamples.find((p) => p.pincode === clean) || null;
}
