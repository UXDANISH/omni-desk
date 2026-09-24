import type { ReceptionistSettings } from '../types';

export const VOICES = [
  { name: 'Ava', description: 'Warm, unhurried' },
  { name: 'Noah', description: 'Calm, low' },
  { name: 'Mia', description: 'Bright, friendly' },
  { name: 'Leo', description: 'Steady, clear' },
];

export const ESCALATION_OPTIONS = ['Transfer to front desk', 'Transfer to office manager', 'Text on-call dentist', 'Flag for callback', 'Take a message'];

export const RECEPTIONIST_DEFAULTS: ReceptionistSettings = {
  greeting:
    "Thanks for calling Smile Dental in Austin. I'm the practice's virtual receptionist. I can book, move, or cancel appointments, or pass a message to the team. How can I help?",
  afterGreeting:
    "Thanks for calling Smile Dental. The office is closed right now, but I'm the virtual receptionist and can still book appointments or take a message. If this is a dental emergency, tell me and I'll alert the on-call dentist.",
  voice: 'Ava',
  pace: 'Normal',
  spanish: true,
  afterMode: 'book',
  transferTimeout: 30,
  hours: [
    { day: 'Mon', open: true, from: '8:00 AM', to: '5:00 PM' },
    { day: 'Tue', open: true, from: '8:00 AM', to: '5:00 PM' },
    { day: 'Wed', open: true, from: '8:00 AM', to: '5:00 PM' },
    { day: 'Thu', open: true, from: '8:00 AM', to: '6:00 PM' },
    { day: 'Fri', open: true, from: '8:00 AM', to: '3:00 PM' },
    { day: 'Sat', open: true, from: '8:00 AM', to: '12:00 PM' },
    { day: 'Sun', open: false, from: '', to: '' },
  ],
  services: [
    { name: 'Cleaning', duration: 60, provider: 'Hygienist', deposit: null, newPatients: true, aiMayBook: true },
    { name: 'New patient exam', duration: 60, provider: 'Hygienist + dentist', deposit: 50, newPatients: true, aiMayBook: true },
    { name: 'Filling', duration: 45, provider: 'Dentist', deposit: null, newPatients: false, aiMayBook: true },
    { name: 'Crown prep', duration: 60, provider: 'Dentist', deposit: 100, newPatients: false, aiMayBook: true },
    { name: 'Crown seat', duration: 45, provider: 'Dentist', deposit: null, newPatients: false, aiMayBook: true },
    { name: 'Whitening consult', duration: 30, provider: 'Dentist', deposit: 50, newPatients: true, aiMayBook: true },
    { name: 'Implant consult', duration: 60, provider: 'Dr. Sample only', deposit: 75, newPatients: true, aiMayBook: true },
    { name: 'Root canal', duration: 60, provider: 'Dentist', deposit: null, newPatients: false, aiMayBook: false, note: 'Front desk books after exam' },
    { name: 'Extraction', duration: 60, provider: 'Dentist', deposit: null, newPatients: false, aiMayBook: false, note: 'Front desk books after exam' },
    { name: 'Emergency exam', duration: 30, provider: 'Dentist', deposit: null, newPatients: true, aiMayBook: false, note: 'Follows emergency escalation' },
  ],
  guardrails: [
    { text: 'Give medical advice or say what a symptom means', locked: true, on: true },
    { text: 'Recommend or prescribe medication', locked: true, on: true },
    { text: 'Share appointment or health details before confirming name and date of birth', locked: true, on: true },
    { text: 'Book outside provider hours or double-book a chair', locked: true, on: true },
    { text: 'Confirm insurance coverage or estimate what a plan will pay', locked: false, on: true },
    { text: 'Discuss balances, bills, or payment disputes', locked: false, on: true },
    { text: 'Quote prices that are not on the fee list', locked: false, on: true },
    { text: 'Book a minor without a parent or guardian on the call', locked: false, on: true },
  ],
  escalation: [
    { name: 'Describes a dental emergency', description: 'Swelling, heavy bleeding, knocked-out tooth, severe pain', during: 'Transfer to front desk', after: 'Text on-call dentist' },
    { name: 'Is angry or upset', description: 'Raised voice, complaint, asks for a manager', during: 'Transfer to office manager', after: 'Flag for callback' },
    { name: 'Asks about insurance', description: 'Coverage, benefits, estimates, pre-authorization', during: 'Transfer to front desk', after: 'Flag for callback' },
    { name: 'Asks about a bill', description: 'Balances, statements, refunds', during: 'Transfer to office manager', after: 'Flag for callback' },
    { name: 'Asks for a person', description: 'Any time the caller asks for a human', during: 'Transfer to front desk', after: 'Take a message' },
  ],
};
