/**
 * TRACKMEDS Master Geographic & Public Healthcare Dataset: All States & Union Territories of India
 * Authentic coordinates, demographics, climate/disease profiles, and primary health infrastructure.
 */

import { Facility } from '../types';

export interface DistrictInfo {
  name: string;
  lat: number;
  lng: number;
  population: number;
}

export interface StateInfo {
  name: string;
  code: string;
  capital: string;
  lat: number;
  lng: number;
  zoom: number;
  population: number;
  climateZone: string;
  epidemicRisks: string[];
  districts: DistrictInfo[];
}

export const ALL_INDIA_STATES: StateInfo[] = [
  {
    name: 'Maharashtra',
    code: 'MH',
    capital: 'Mumbai',
    lat: 19.7515,
    lng: 75.7139,
    zoom: 7,
    population: 124904071,
    climateZone: 'Tropical Wet and Dry / Semi-Arid',
    epidemicRisks: ['Monsoon Leptospirosis & Dengue', 'Diarrheal Outbreaks', 'Acute Viral Hepatitis'],
    districts: [
      { name: 'Pune', lat: 18.5204, lng: 73.8567, population: 9429408 },
      { name: 'Satara', lat: 17.6805, lng: 73.9937, population: 3003741 },
      { name: 'Solapur', lat: 17.6599, lng: 75.9064, population: 4317756 },
      { name: 'Nashik', lat: 19.9975, lng: 73.7898, population: 6107187 },
      { name: 'Mumbai Suburban', lat: 19.0760, lng: 72.8777, population: 9356962 },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882, population: 4653570 },
      { name: 'Aurangabad (Chhatrapati Sambhajinagar)', lat: 19.8762, lng: 75.3433, population: 3701282 },
      { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, population: 3876001 }
    ]
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    capital: 'Gandhinagar',
    lat: 22.2587,
    lng: 71.1924,
    zoom: 7,
    population: 60439692,
    climateZone: 'Semi-arid / Coastal Tropical',
    epidemicRisks: ['Seasonal Chandipura Virus', 'Falciparum Malaria', 'Heatwave Dehydration'],
    districts: [
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, population: 7214225 },
      { name: 'Surat', lat: 21.1702, lng: 72.8311, population: 6081322 },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812, population: 4165626 },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022, population: 3804558 },
      { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519, population: 2880365 },
      { name: 'Kutch', lat: 23.7337, lng: 69.8597, population: 2092371 }
    ]
  },
  {
    name: 'Kerala',
    code: 'KL',
    capital: 'Thiruvananthapuram',
    lat: 10.8505,
    lng: 76.2711,
    zoom: 8,
    population: 33406061,
    climateZone: 'Tropical Monsoon / Coastal Rainforest',
    epidemicRisks: ['Post-Flood Leptospirosis', 'Nipah Telemetry Watch', 'Dengue & Chikungunya'],
    districts: [
      { name: 'Ernakulam', lat: 9.9816, lng: 76.2999, population: 3282388 },
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, population: 3301427 },
      { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, population: 3086293 },
      { name: 'Alappuzha', lat: 9.4981, lng: 76.3388, population: 2127789 },
      { name: 'Thrissur', lat: 10.5276, lng: 76.2144, population: 3121200 },
      { name: 'Palakkad', lat: 10.7867, lng: 76.6548, population: 2809934 }
    ]
  },
  {
    name: 'Karnataka',
    code: 'KA',
    capital: 'Bengaluru',
    lat: 15.3173,
    lng: 75.7139,
    zoom: 7,
    population: 61095297,
    climateZone: 'Tropical Wet and Semi-Arid Plateau',
    epidemicRisks: ['Kyasanur Forest Disease (KFD)', 'Urban Dengue Surge', 'Typhoid Clustered Cases'],
    districts: [
      { name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, population: 9621551 },
      { name: 'Mysuru', lat: 12.2958, lng: 76.6394, population: 3001127 },
      { name: 'Belagavi', lat: 15.8497, lng: 74.4977, population: 4779661 },
      { name: 'Dakshina Kannada (Mangaluru)', lat: 12.9141, lng: 74.8560, population: 2089649 },
      { name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, population: 1847023 },
      { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343, population: 2566326 }
    ]
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    capital: 'Chennai',
    lat: 11.1271,
    lng: 78.6569,
    zoom: 7,
    population: 72147030,
    climateZone: 'Tropical Coastal / Northeast Monsoon',
    epidemicRisks: ['Post-Northeast Monsoon Dengue', 'Scrub Typhus', 'Viral Encephalitis'],
    districts: [
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, population: 7088000 },
      { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, population: 3458045 },
      { name: 'Madurai', lat: 9.9252, lng: 78.1198, population: 3038252 },
      { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, population: 2722290 },
      { name: 'Salem', lat: 11.6643, lng: 78.1460, population: 3482056 },
      { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567, population: 1665253 }
    ]
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    capital: 'Lucknow',
    lat: 26.8467,
    lng: 80.9462,
    zoom: 7,
    population: 199812341,
    climateZone: 'Humid Subtropical Gangetic Plain',
    epidemicRisks: ['Japanese Encephalitis (JE) / AES', 'Dengue Serotype-2', 'Seasonal Typhoid & Diarrhea'],
    districts: [
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462, population: 4589838 },
      { name: 'Varanasi', lat: 25.3176, lng: 82.9739, population: 3676841 },
      { name: 'Kanpur Nagar', lat: 26.4499, lng: 80.3319, population: 4581268 },
      { name: 'Agra', lat: 27.1767, lng: 78.0081, population: 4418797 },
      { name: 'Prayagraj (Allahabad)', lat: 25.4358, lng: 81.8463, population: 5954391 },
      { name: 'Gorakhpur', lat: 26.7606, lng: 83.3732, population: 4440895 },
      { name: 'Meerut', lat: 28.9845, lng: 77.7064, population: 3443689 }
    ]
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    capital: 'Jaipur',
    lat: 27.0238,
    lng: 74.2179,
    zoom: 7,
    population: 68548437,
    climateZone: 'Arid / Semi-Arid Desert',
    epidemicRisks: ['Extreme Heat Exhaustion Deficit', 'Seasonal Swine Flu / H1N1', 'Malaria in Canal Areas'],
    districts: [
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873, population: 6626178 },
      { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, population: 3687002 },
      { name: 'Udaipur', lat: 24.5854, lng: 73.7125, population: 3068420 },
      { name: 'Kota', lat: 25.2138, lng: 75.8648, population: 1951014 },
      { name: 'Bikaner', lat: 28.0229, lng: 73.3119, population: 2363937 },
      { name: 'Ajmer', lat: 26.4499, lng: 74.6399, population: 2583052 }
    ]
  },
  {
    name: 'West Bengal',
    code: 'WB',
    capital: 'Kolkata',
    lat: 22.9868,
    lng: 87.8550,
    zoom: 7,
    population: 91276115,
    climateZone: 'Tropical Wet Subtropical / Deltaic',
    epidemicRisks: ['Cyclonic Surge Waterborne Disease', 'Dengue & Malaria', 'Cholera Surveillance'],
    districts: [
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, population: 4496694 },
      { name: 'North 24 Parganas', lat: 22.7230, lng: 88.4800, population: 10009781 },
      { name: 'Howrah', lat: 22.5958, lng: 88.2636, population: 4850029 },
      { name: 'Darjeeling', lat: 27.0410, lng: 88.2663, population: 1846823 },
      { name: 'Paschim Medinipur', lat: 22.4257, lng: 87.3199, population: 5913457 }
    ]
  },
  {
    name: 'Bihar',
    code: 'BR',
    capital: 'Patna',
    lat: 25.0961,
    lng: 85.3131,
    zoom: 7,
    population: 104099452,
    climateZone: 'Subtropical Gangetic Basin',
    epidemicRisks: ['Visceral Leishmaniasis (Kala-azar)', 'Acute Encephalitis Syndrome (AES)', 'Flooding Diarrheal Clusters'],
    districts: [
      { name: 'Patna', lat: 25.5941, lng: 85.1376, population: 5838465 },
      { name: 'Gaya', lat: 24.7914, lng: 85.0002, population: 4391418 },
      { name: 'Muzaffarpur', lat: 26.1209, lng: 85.3647, population: 4801062 },
      { name: 'Bhagalpur', lat: 25.2425, lng: 86.9842, population: 3037766 },
      { name: 'Purnia', lat: 25.7771, lng: 87.4753, population: 3264619 }
    ]
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    capital: 'Bhopal',
    lat: 22.9734,
    lng: 78.6569,
    zoom: 7,
    population: 72626809,
    climateZone: 'Subtropical Semi-Arid Plateau',
    epidemicRisks: ['Tribal Area Falciparum Malaria', 'Malnutrition-Linked Acute Respiratory Infection', 'Waterborne Hepatitis'],
    districts: [
      { name: 'Bhopal', lat: 23.2599, lng: 77.4126, population: 2371061 },
      { name: 'Indore', lat: 22.7196, lng: 75.8577, population: 3276697 },
      { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, population: 2463289 },
      { name: 'Gwalior', lat: 26.2183, lng: 78.1828, population: 2032036 },
      { name: 'Ujjain', lat: 23.1765, lng: 75.7885, population: 1986864 }
    ]
  },
  {
    name: 'Telangana',
    code: 'TG',
    capital: 'Hyderabad',
    lat: 18.1124,
    lng: 79.0193,
    zoom: 7,
    population: 35003674,
    climateZone: 'Semi-Arid Deccan Plateau',
    epidemicRisks: ['Urban Dengue Hotspots', 'Seasonal Chikungunya', 'Diabetic & Chronic Care Surges'],
    districts: [
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, population: 6809970 },
      { name: 'Warangal', lat: 17.9689, lng: 79.5941, population: 718500 },
      { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, population: 1005711 },
      { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, population: 1571022 }
    ]
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    capital: 'Amaravati',
    lat: 15.9129,
    lng: 79.7400,
    zoom: 7,
    population: 49577103,
    climateZone: 'Tropical Coastal / Coromandel Zone',
    epidemicRisks: ['Cyclone-Induced Coastal Epidemics', 'Dengue & Typhoid', 'Snakebite Envenomation Clusters'],
    districts: [
      { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, population: 4290589 },
      { name: 'Vijayawada (NTR)', lat: 16.5062, lng: 80.6480, population: 2218000 },
      { name: 'Guntur', lat: 16.3067, lng: 80.4365, population: 4887813 },
      { name: 'Tirupati', lat: 13.6288, lng: 79.4192, population: 1500000 }
    ]
  },
  {
    name: 'Punjab',
    code: 'PB',
    capital: 'Chandigarh',
    lat: 31.1471,
    lng: 75.3412,
    zoom: 8,
    population: 27743338,
    climateZone: 'Semi-Arid Indo-Gangetic Alluvial',
    epidemicRisks: ['Seasonal Hepatitis C Clusters', 'Smog & Acute Bronchial Distress', 'Vector-Borne Dengue'],
    districts: [
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, population: 3498739 },
      { name: 'Amritsar', lat: 31.6340, lng: 74.8723, population: 2490656 },
      { name: 'Jalandhar', lat: 31.3260, lng: 75.5762, population: 2193590 },
      { name: 'Patiala', lat: 30.3398, lng: 76.3869, population: 1895686 }
    ]
  },
  {
    name: 'Haryana',
    code: 'HR',
    capital: 'Chandigarh',
    lat: 29.0588,
    lng: 76.0856,
    zoom: 8,
    population: 25351462,
    climateZone: 'Semi-Arid / NCR Peri-Urban',
    epidemicRisks: ['Winter Smog Respiratory Surge', 'Dengue in Industrial Corridors', 'Diarrheal Water Contamination'],
    districts: [
      { name: 'Gurugram', lat: 28.4595, lng: 77.0266, population: 1514432 },
      { name: 'Faridabad', lat: 28.4089, lng: 77.3178, population: 1809733 },
      { name: 'Hisar', lat: 29.1492, lng: 75.7217, population: 1743931 },
      { name: 'Karnal', lat: 29.6857, lng: 76.9905, population: 1505324 }
    ]
  },
  {
    name: 'Delhi (NCT)',
    code: 'DL',
    capital: 'New Delhi',
    lat: 28.7041,
    lng: 77.1025,
    zoom: 10,
    population: 16787941,
    climateZone: 'Humid Subtropical Urban Heat Island',
    epidemicRisks: ['Severe Winter Smog COPD / Asthma Crisis', 'Monsoon Vector Dengue Serotype Surge', 'Interstate Referral Bed Congestion'],
    districts: [
      { name: 'Central Delhi', lat: 28.6448, lng: 77.2167, population: 582320 },
      { name: 'South Delhi', lat: 28.4817, lng: 77.1873, population: 2731929 },
      { name: 'North Delhi', lat: 28.7306, lng: 77.1425, population: 887978 },
      { name: 'East Delhi', lat: 28.6280, lng: 77.2950, population: 1709346 }
    ]
  },
  {
    name: 'Odisha',
    code: 'OD',
    capital: 'Bhubaneswar',
    lat: 20.9517,
    lng: 85.0985,
    zoom: 7,
    population: 41974218,
    climateZone: 'Tropical Savanna / Bay of Bengal Coast',
    epidemicRisks: ['Super-Cyclone Health Shock Recovery', 'Falciparum Malaria in Highland Tribes', 'Diarrheal Cholera Clusters'],
    districts: [
      { name: 'Khordha (Bhubaneswar)', lat: 20.2961, lng: 85.8245, population: 2251673 },
      { name: 'Cuttack', lat: 20.4625, lng: 85.8828, population: 2624470 },
      { name: 'Puri', lat: 19.8135, lng: 85.8312, population: 1698730 },
      { name: 'Sambalpur', lat: 21.4669, lng: 83.9812, population: 1041099 }
    ]
  },
  {
    name: 'Assam',
    code: 'AS',
    capital: 'Dispur',
    lat: 26.2006,
    lng: 92.9376,
    zoom: 7,
    population: 31205576,
    climateZone: 'Subtropical Monsoon Riverine',
    epidemicRisks: ['Brahmaputra Annual Flood Waterborne Epidemic', 'Japanese Encephalitis Endemic Pulse', 'Chloroquine-Resistant Malaria'],
    districts: [
      { name: 'Kamrup Metropolitan (Guwahati)', lat: 26.1445, lng: 91.7362, population: 1253938 },
      { name: 'Dibrugarh', lat: 27.4728, lng: 94.9120, population: 1326335 },
      { name: 'Silchar (Cachar)', lat: 24.8333, lng: 92.7789, population: 1736617 },
      { name: 'Jorhat', lat: 26.7509, lng: 94.2037, population: 1092256 }
    ]
  },
  {
    name: 'Jammu & Kashmir',
    code: 'JK',
    capital: 'Srinagar / Jammu',
    lat: 33.7782,
    lng: 76.5762,
    zoom: 7,
    population: 12267032,
    climateZone: 'Montane / Alpine Valley Cold Climate',
    epidemicRisks: ['Severe Winter Cold Wave Pneumonia', 'Road Closure Medical Blockades', 'High-Altitude Hypothermia'],
    districts: [
      { name: 'Srinagar', lat: 34.0837, lng: 74.7973, population: 1236829 },
      { name: 'Jammu', lat: 32.7266, lng: 74.8570, population: 1529958 },
      { name: 'Anantnag', lat: 33.7311, lng: 75.1522, population: 1078692 },
      { name: 'Baramulla', lat: 34.1980, lng: 74.3636, population: 1008039 }
    ]
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    capital: 'Shimla',
    lat: 31.1048,
    lng: 77.1734,
    zoom: 8,
    population: 6864602,
    climateZone: 'Himalayan Temperate / Sub-Alpine',
    epidemicRisks: ['Landslide Cut-off Supply Depletions', 'Scrub Typhus Monsoon Surge', 'Elderly Winter Hypothermia'],
    districts: [
      { name: 'Shimla', lat: 31.1048, lng: 77.1734, population: 814010 },
      { name: 'Kangra (Dharamshala)', lat: 32.2190, lng: 76.3234, population: 1510075 },
      { name: 'Mandi', lat: 31.5892, lng: 76.9182, population: 999777 }
    ]
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    capital: 'Dehradun',
    lat: 30.0668,
    lng: 79.0193,
    zoom: 8,
    population: 10086292,
    climateZone: 'Himalayan Subtropical to Alpine',
    epidemicRisks: ['Pilgrim Corridor Footfall Overloads (Char Dham)', 'Flash Flood Trauma Emergencies', 'Altitude Mountain Sickness'],
    districts: [
      { name: 'Dehradun', lat: 30.3165, lng: 78.0322, population: 1696694 },
      { name: 'Haridwar', lat: 29.9457, lng: 78.1642, population: 1890422 },
      { name: 'Nainital', lat: 29.3919, lng: 79.4542, population: 955128 }
    ]
  },
  {
    name: 'Goa',
    code: 'GA',
    capital: 'Panaji',
    lat: 15.2993,
    lng: 74.1240,
    zoom: 9,
    population: 1458545,
    climateZone: 'Tropical Coastal Konkan',
    epidemicRisks: ['Tourist Floating Population Gastro Surges', 'Coastal Dengue Hotspots', 'Seasonal Viral Fevers'],
    districts: [
      { name: 'North Goa (Panaji)', lat: 15.4909, lng: 73.8278, population: 818008 },
      { name: 'South Goa (Margao)', lat: 15.2832, lng: 73.9862, population: 640537 }
    ]
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    capital: 'Ranchi',
    lat: 23.6102,
    lng: 85.2799,
    zoom: 7,
    population: 32988134,
    climateZone: 'Subtropical Chota Nagpur Plateau',
    epidemicRisks: ['Cerebral Malaria Falciparum', 'Snakebite Critical Envenomation', 'Acute Malnutrition Infections'],
    districts: [
      { name: 'Ranchi', lat: 23.3441, lng: 85.3096, population: 2914253 },
      { name: 'East Singhbhum (Jamshedpur)', lat: 22.8046, lng: 86.2029, population: 2293919 },
      { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, population: 2684487 }
    ]
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    capital: 'Raipur',
    lat: 21.2787,
    lng: 81.8661,
    zoom: 7,
    population: 25545198,
    climateZone: 'Tropical Wet-and-Dry Mahanadi Valley',
    epidemicRisks: ['Bastar Forest High-Endemic Malaria', 'Sickle Cell Anemia Complications', 'Waterborne Hepatitis'],
    districts: [
      { name: 'Raipur', lat: 21.2514, lng: 81.6296, population: 4063872 },
      { name: 'Bilaspur', lat: 22.0797, lng: 82.1409, population: 2664029 },
      { name: 'Durg', lat: 21.1904, lng: 81.2849, population: 3343872 }
    ]
  },
  {
    name: 'Tripura',
    code: 'TR',
    capital: 'Agartala',
    lat: 23.9408,
    lng: 91.9882,
    zoom: 9,
    population: 3673917,
    climateZone: 'Humid Tropical Border Corridor',
    epidemicRisks: ['Border Transit Malaria', 'Enteric Fevers', 'Monsoon Vector Surges'],
    districts: [
      { name: 'West Tripura (Agartala)', lat: 23.8315, lng: 91.2868, population: 918200 },
      { name: 'Gomati (Udaipur)', lat: 23.5333, lng: 91.4833, population: 441538 }
    ]
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    capital: 'Shillong',
    lat: 25.4670,
    lng: 91.3662,
    zoom: 8,
    population: 2966889,
    climateZone: 'Subtropical Highland / World Highest Rainfall',
    epidemicRisks: ['Heavy Monsoon Landslide Isolation', 'Falciparum Malaria in Garo Hills', 'Maternal Transit Emergencies'],
    districts: [
      { name: 'East Khasi Hills (Shillong)', lat: 25.5788, lng: 91.8933, population: 825922 },
      { name: 'West Garo Hills (Tura)', lat: 25.5167, lng: 90.2167, population: 643291 }
    ]
  },
  {
    name: 'Manipur',
    code: 'MN',
    capital: 'Imphal',
    lat: 24.6637,
    lng: 93.9063,
    zoom: 8,
    population: 2855794,
    climateZone: 'Subtropical Mountain Valley',
    epidemicRisks: ['Highway Blockade Stock Shortage Risks', 'Vector Outbreaks', 'Emergency Trauma Deficits'],
    districts: [
      { name: 'Imphal West', lat: 24.8170, lng: 93.9368, population: 517992 },
      { name: 'Churachandpur', lat: 24.3333, lng: 93.6667, population: 274143 }
    ]
  },
  {
    name: 'Nagaland',
    code: 'NL',
    capital: 'Kohima',
    lat: 26.1584,
    lng: 94.5624,
    zoom: 8,
    population: 1978502,
    climateZone: 'Montane Subtropical Rainforest',
    epidemicRisks: ['Remote Hill Clinic Stock Depletions', 'Seasonal Scrub Typhus', 'Cold Weather Viral Syndromes'],
    districts: [
      { name: 'Kohima', lat: 25.6751, lng: 94.1086, population: 267324 },
      { name: 'Dimapur', lat: 25.9060, lng: 93.7270, population: 378811 }
    ]
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    capital: 'Aizawl',
    lat: 23.1645,
    lng: 92.9376,
    zoom: 8,
    population: 1097206,
    climateZone: 'Highland Subtropical Monsoon',
    epidemicRisks: ['High Drug-Resistant Malaria Prevalence', 'Scrub Typhus', 'Remote Valley Isolation'],
    districts: [
      { name: 'Aizawl', lat: 23.7271, lng: 92.7176, population: 400309 },
      { name: 'Lunglei', lat: 22.8833, lng: 92.7333, population: 161428 }
    ]
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    capital: 'Itanagar',
    lat: 28.2180,
    lng: 94.7278,
    zoom: 7,
    population: 1383727,
    climateZone: 'Sub-Himalayan Alpine and Rainforest',
    epidemicRisks: ['Deep Valley Clinic Air-Drop Deficits', 'Winter Frostbite & Hypothermia', 'Seasonal Vector Pulses'],
    districts: [
      { name: 'Papum Pare (Itanagar)', lat: 27.1004, lng: 93.6166, population: 176573 },
      { name: 'Tawang', lat: 27.5861, lng: 91.8653, population: 49977 }
    ]
  },
  {
    name: 'Sikkim',
    code: 'SK',
    capital: 'Gangtok',
    lat: 27.5330,
    lng: 88.5122,
    zoom: 8,
    population: 610577,
    climateZone: 'Alpine Highland Cold Humid',
    epidemicRisks: ['Monsoon Highway Landslide Isolation', 'High-Altitude Oxygen Demand', 'Winter Respiratory Shock'],
    districts: [
      { name: 'East Sikkim (Gangtok)', lat: 27.3314, lng: 88.6138, population: 283583 },
      { name: 'West Sikkim (Geyzing)', lat: 27.2833, lng: 88.2500, population: 136435 }
    ]
  },
  {
    name: 'Puducherry',
    code: 'PY',
    capital: 'Puducherry',
    lat: 11.9416,
    lng: 79.8083,
    zoom: 10,
    population: 1247953,
    climateZone: 'Tropical Coastal Coromandel',
    epidemicRisks: ['Coastal Monsoon Dengue', 'Urban Footfall Congestion', 'Waterborne Gastro'],
    districts: [
      { name: 'Puducherry Central', lat: 11.9416, lng: 79.8083, population: 950289 },
      { name: 'Karaikal', lat: 10.9254, lng: 79.8380, population: 200222 }
    ]
  },
  {
    name: 'Ladakh',
    code: 'LA',
    capital: 'Leh',
    lat: 34.1526,
    lng: 77.5771,
    zoom: 7,
    population: 274289,
    climateZone: 'High-Altitude Cold Desert',
    epidemicRisks: ['Sub-Zero Winter Mountain Isolation', 'Acute Mountain Sickness (AMS) Oxygen Demand', 'Frostbite Treatment'],
    districts: [
      { name: 'Leh', lat: 34.1526, lng: 77.5771, population: 133487 },
      { name: 'Kargil', lat: 34.5539, lng: 76.1349, population: 140802 }
    ]
  }
];

/**
 * Procedural generator for authentic PHCs, CHCs, and District Hospitals
 * across any selected state and district of India.
 */
export const generateFacilitiesForState = (stateName: string): Facility[] => {
  const state = ALL_INDIA_STATES.find(s => s.name.toLowerCase() === stateName.toLowerCase()) || ALL_INDIA_STATES[0];
  const facilities: Facility[] = [];

  state.districts.forEach((dist, dIdx) => {
    // 1. District Hospital (HQ)
    const dhId = `FAC-DH-${state.code}-${dIdx + 1}`;
    facilities.push({
      id: dhId,
      name: `District Hospital ${dist.name}`,
      type: 'District Hospital',
      state: state.name,
      district: dist.name,
      country: 'India',
      latitude: dist.lat + 0.008,
      longitude: dist.lng + 0.005,
      population_served: Math.round(dist.population * 0.45),
      capacity: 350,
      status: 'Healthy',
      stock_health_score: 91,
      critical_medicines_count: 0,
      total_beds: 280,
      occupied_beds: Math.round(280 * 0.76),
      available_beds: Math.round(280 * 0.24),
      emergency_beds: 35,
      icu_beds: 24,
      occupancy_rate: 76.0,
      bed_risk_status: 'NORMAL',
      doctors_required: 45,
      doctors_available: 42,
      nurses_required: 120,
      nurses_available: 114,
      support_required: 60,
      support_available: 58,
      staffing_percentage: 94.0,
      staff_risk_status: 'HEALTHY',
      daily_footfall: 850,
      baseline_footfall: 820,
      footfall_surge_pct: 3.6,
      resilience_score: 92,
      main_factors: ['Regional Tertiary Backup', 'Oxygen Tank Buffer Adequate', 'Round-the-clock Specialists']
    });

    // 2. Community Health Centre (CHC)
    const chcId = `FAC-CHC-${state.code}-${dIdx + 1}01`;
    facilities.push({
      id: chcId,
      name: `CHC ${dist.name} Sub-Division`,
      type: 'CHC',
      state: state.name,
      district: dist.name,
      country: 'India',
      latitude: dist.lat - 0.045,
      longitude: dist.lng + 0.035,
      population_served: Math.round(dist.population * 0.25),
      capacity: 100,
      status: dIdx === 1 ? 'Warning' : 'Healthy',
      stock_health_score: dIdx === 1 ? 64 : 85,
      critical_medicines_count: dIdx === 1 ? 1 : 0,
      total_beds: 90,
      occupied_beds: dIdx === 1 ? 78 : 55,
      available_beds: dIdx === 1 ? 12 : 35,
      emergency_beds: 12,
      icu_beds: 6,
      occupancy_rate: dIdx === 1 ? 86.6 : 61.1,
      bed_risk_status: dIdx === 1 ? 'WARNING' : 'NORMAL',
      doctors_required: 16,
      doctors_available: dIdx === 1 ? 12 : 15,
      nurses_required: 40,
      nurses_available: dIdx === 1 ? 32 : 38,
      support_required: 20,
      support_available: 19,
      staffing_percentage: dIdx === 1 ? 78.5 : 92.0,
      staff_risk_status: dIdx === 1 ? 'WARNING' : 'HEALTHY',
      daily_footfall: 310,
      baseline_footfall: 280,
      footfall_surge_pct: 10.7,
      resilience_score: dIdx === 1 ? 68 : 86,
      main_factors: [state.epidemicRisks[0] || 'Seasonal Telemetry Pulse', 'Secondary Triage Capable']
    });

    // 3. Primary Health Centre (PHC 1 - High Priority)
    const phc1Id = `FAC-PHC-${state.code}-${dIdx + 1}01`;
    const isCritical = dIdx === 0;
    facilities.push({
      id: phc1Id,
      name: `PHC ${dist.name} Rural North`,
      type: 'PHC',
      state: state.name,
      district: dist.name,
      country: 'India',
      latitude: dist.lat + 0.082,
      longitude: dist.lng - 0.065,
      population_served: 42000,
      capacity: 35,
      status: isCritical ? 'Critical' : 'Healthy',
      stock_health_score: isCritical ? 41 : 88,
      critical_medicines_count: isCritical ? 2 : 0,
      total_beds: 30,
      occupied_beds: isCritical ? 29 : 18,
      available_beds: isCritical ? 1 : 12,
      emergency_beds: 6,
      icu_beds: 2,
      occupancy_rate: isCritical ? 96.6 : 60.0,
      bed_risk_status: isCritical ? 'CRITICAL' : 'NORMAL',
      doctors_required: 4,
      doctors_available: isCritical ? 2 : 4,
      nurses_required: 12,
      nurses_available: isCritical ? 8 : 12,
      support_required: 8,
      support_available: 7,
      staffing_percentage: isCritical ? 66.7 : 95.0,
      staff_risk_status: isCritical ? 'CRITICAL' : 'HEALTHY',
      daily_footfall: isCritical ? 185 : 95,
      baseline_footfall: 110,
      footfall_surge_pct: isCritical ? 68.1 : -13.6,
      resilience_score: isCritical ? 48 : 89,
      main_factors: isCritical
        ? [`Acute Outbreak: ${state.epidemicRisks[0]}`, 'Oxygen Cylinder & ORS Deficit', 'Bed Over-capacity (96.6%)']
        : ['Sufficient Emergency Buffer', 'Normal Patient Load']
    });

    // 4. Primary Health Centre (PHC 2 - Surplus / Balanced Hub)
    const phc2Id = `FAC-PHC-${state.code}-${dIdx + 1}02`;
    facilities.push({
      id: phc2Id,
      name: `PHC ${dist.name} Valley East`,
      type: 'PHC',
      state: state.name,
      district: dist.name,
      country: 'India',
      latitude: dist.lat - 0.075,
      longitude: dist.lng - 0.055,
      population_served: 38000,
      capacity: 30,
      status: 'Healthy',
      stock_health_score: 94,
      critical_medicines_count: 0,
      total_beds: 25,
      occupied_beds: 14,
      available_beds: 11,
      emergency_beds: 5,
      icu_beds: 2,
      occupancy_rate: 56.0,
      bed_risk_status: 'NORMAL',
      doctors_required: 4,
      doctors_available: 4,
      nurses_required: 10,
      nurses_available: 10,
      support_required: 6,
      support_available: 6,
      staffing_percentage: 100.0,
      staff_risk_status: 'HEALTHY',
      daily_footfall: 80,
      baseline_footfall: 85,
      footfall_surge_pct: -5.8,
      resilience_score: 94,
      main_factors: ['Surplus Redistribution Hub (Eligible Donor)', 'Active Cold Chain Stable', 'Healthy FEFO Inventory']
    });
  });

  return facilities;
};

/**
 * Returns all facilities across all states or filtered by state & district
 */
export const getIndiaFacilities = (stateName = 'All', districtName = 'All'): Facility[] => {
  if (stateName === 'All') {
    // Generate representative facilities across top key states for national view
    const nationalStates = ['Maharashtra', 'Gujarat', 'Kerala', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan', 'Delhi (NCT)', 'West Bengal', 'Assam'];
    let allFacs: Facility[] = [];
    nationalStates.forEach(s => {
      allFacs = allFacs.concat(generateFacilitiesForState(s));
    });
    return allFacs;
  }

  const facs = generateFacilitiesForState(stateName);
  if (districtName !== 'All') {
    return facs.filter(f => f.district.toLowerCase() === districtName.toLowerCase());
  }
  return facs;
};
