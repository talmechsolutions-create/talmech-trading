export type IndiaLocation = { state: string; cities: string[] };

export const indiaLocations: IndiaLocation[] = [
  {state:'Andhra Pradesh',cities:['Visakhapatnam','Vijayawada','Guntur','Tirupati','Kurnool','Nellore','Rajahmundry','Kakinada','Anantapur']},
  {state:'Arunachal Pradesh',cities:['Itanagar','Naharlagun','Tawang','Pasighat']},
  {state:'Assam',cities:['Guwahati','Dibrugarh','Silchar','Jorhat','Tinsukia','Tezpur']},
  {state:'Bihar',cities:['Patna','Gaya','Muzaffarpur','Bhagalpur','Darbhanga','Purnia']},
  {state:'Chhattisgarh',cities:['Raipur','Bhilai','Durg','Bilaspur','Korba','Raigarh']},
  {state:'Goa',cities:['Panaji','Vasco da Gama','Margao','Mapusa']},
  {state:'Gujarat',cities:['Ahmedabad','Surat','Vadodara','Rajkot','Jamnagar','Bhavnagar','Gandhidham','Vapi','Ankleshwar','Morbi','Mehsana']},
  {state:'Haryana',cities:['Faridabad','Gurugram','Manesar','Panipat','Sonipat','Ambala','Hisar','Rohtak','Yamunanagar']},
  {state:'Himachal Pradesh',cities:['Baddi','Solan','Shimla','Parwanoo','Una','Mandi']},
  {state:'Jharkhand',cities:['Jamshedpur','Ranchi','Dhanbad','Bokaro','Adityapur','Hazaribagh']},
  {state:'Karnataka',cities:['Bengaluru','Mysuru','Hubballi','Belagavi','Mangaluru','Ballari','Tumakuru','Dharwad','Peenya Industrial Area']},
  {state:'Kerala',cities:['Kochi','Thiruvananthapuram','Kozhikode','Thrissur','Kollam','Palakkad']},
  {state:'Madhya Pradesh',cities:['Indore','Bhopal','Pithampur','Jabalpur','Gwalior','Ujjain','Dewas']},
  {state:'Maharashtra',cities:['Mumbai','Pune','Chakan MIDC','Bhosari MIDC','Nashik','Aurangabad','Nagpur','Kolhapur','Sangli','Satara','Solapur','Thane','Navi Mumbai','Taloja MIDC','Raigad','Jalgaon']},
  {state:'Manipur',cities:['Imphal']},
  {state:'Meghalaya',cities:['Shillong']},
  {state:'Mizoram',cities:['Aizawl']},
  {state:'Nagaland',cities:['Kohima','Dimapur']},
  {state:'Odisha',cities:['Bhubaneswar','Cuttack','Rourkela','Jharsuguda','Angul','Sambalpur']},
  {state:'Punjab',cities:['Ludhiana','Mandi Gobindgarh','Jalandhar','Amritsar','Mohali','Patiala','Bathinda']},
  {state:'Rajasthan',cities:['Jaipur','Jodhpur','Udaipur','Bhiwadi','Neemrana','Kota','Alwar','Ajmer']},
  {state:'Sikkim',cities:['Gangtok']},
  {state:'Tamil Nadu',cities:['Chennai','Coimbatore','Hosur','Tiruppur','Madurai','Salem','Trichy','Sriperumbudur','Ambattur','Erode']},
  {state:'Telangana',cities:['Hyderabad','Secunderabad','Warangal','Karimnagar','Patancheru']},
  {state:'Tripura',cities:['Agartala']},
  {state:'Uttar Pradesh',cities:['Noida','Ghaziabad','Kanpur','Lucknow','Agra','Meerut','Aligarh','Moradabad','Varanasi','Greater Noida']},
  {state:'Uttarakhand',cities:['Haridwar','Rudrapur','Dehradun','Pantnagar','Roorkee']},
  {state:'West Bengal',cities:['Kolkata','Howrah','Durgapur','Asansol','Haldia','Siliguri']},
  {state:'Delhi NCR',cities:['Delhi','New Delhi','Okhla','Wazirpur','Mayapuri','Naraina','Bawana','Gurugram','Noida','Faridabad','Ghaziabad']},
  {state:'Jammu & Kashmir',cities:['Jammu','Srinagar']},
  {state:'Ladakh',cities:['Leh']},
  {state:'Puducherry',cities:['Puducherry']},
  {state:'Chandigarh',cities:['Chandigarh']},
  {state:'Dadra & Nagar Haveli and Daman & Diu',cities:['Silvassa','Daman']}
];

export const getCitiesForState = (state: string) => indiaLocations.find((x) => x.state === state)?.cities || [];
export const allStates = indiaLocations.map((x) => x.state);
export const allCities = indiaLocations.flatMap((x) => x.cities.map((city) => ({state:x.state, city})));

// Backward-compatible exports used by older admin finder components.
export const indiaStates: Record<string, string[]> = Object.fromEntries(indiaLocations.map((x) => [x.state, x.cities]));
export const allIndiaStates: string[] = ['All India', ...indiaLocations.map((x) => x.state)];
